import { randomUUID } from "crypto";
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { ConfidenceLevel, FoodItem, PortionUnit, ZiaClarifyQuestion, ZiaMealAnalysisResult } from "@/types";

/**
 * Client for the deployed "ZiaSnap Meal Analyzer" Zia Agent. Same flow as the
 * standalone `ziasnap-meal-analyze` function: auth comes from the Catalyst
 * Connection "agents", so no OAuth secrets live in code. Non-secret config is
 * in env vars (catalyst-config.json): ZIA_DC, ZIA_ORG_ID, ZIA_AGENT_ID.
 */

const CONNECTION_LINK_NAME = "agents";

const AGENTS_HOST: Record<string, string> = {
  com: "agents.zoho.com",
  in: "agents.zoho.in",
  eu: "agents.zoho.eu",
  au: "agents.zoho.com.au",
  ca: "agents.zohocloud.ca",
  jp: "agents.zoho.jp",
  sa: "agents.zoho.sa",
};

export type AgentKind = "analyzer" | "coach";

function config(kind: AgentKind = "analyzer") {
  const orgId = process.env.ZIA_ORG_ID;
  const agentId = kind === "coach" ? process.env.ZIA_COACH_AGENT_ID : process.env.ZIA_AGENT_ID;
  if (!orgId || !agentId) throw new Error(`ZIA_ORG_ID and the ${kind} agent id must be configured`);
  return { orgId, agentId, host: AGENTS_HOST[process.env.ZIA_DC ?? "com"] ?? AGENTS_HOST.com };
}

async function connectionHeaders(app: CatalystApp): Promise<Record<string, string>> {
  const { headers } = (await app.connections().getConnectionCredentials(CONNECTION_LINK_NAME)) as {
    headers?: Record<string, string>;
  };
  if (!headers?.Authorization) {
    throw new Error('Catalyst Connection "agents" returned no Authorization header. Check it is connected.');
  }
  return headers;
}

export async function uploadAttachment(app: CatalystApp, buffer: Buffer, mimeType: string): Promise<string> {
  const cfg = config();
  const fileName = `meal.${mimeType.split("/")[1] || "jpg"}`;
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buffer)], { type: mimeType }), fileName);
  form.append("fileName", fileName);

  const response = await fetch(`https://${cfg.host}/ziaagents/api/v1/files`, {
    method: "POST",
    headers: { ...(await connectionHeaders(app)), "X-ZIAAGENTS-ORG": cfg.orgId },
    body: form,
  });
  const body = (await response.json().catch(() => ({}))) as { data?: { fileId?: string } };
  if (!response.ok || !body.data?.fileId) {
    throw new Error(`Zia file upload failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body.data.fileId;
}

/**
 * Starts the agent asynchronously. A vision run takes ~20–25s, too close to
 * Advanced I/O's 30s limit to wait for, so callers poll getMealAnalysis().
 */
export async function startAgent(app: CatalystApp, kind: AgentKind, query: string, attachmentIds: string[] = []): Promise<string> {
  const cfg = config(kind);
  const response = await fetch(`https://${cfg.host}/ziaagents/api/v1/agents/${cfg.agentId}/trigger`, {
    method: "POST",
    headers: {
      ...(await connectionHeaders(app)),
      "X-ZIAAGENTS-ORG": cfg.orgId,
      "X-ZIAAGENTS-ASYNC": "true",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, reasoning: false, systemArgs: {}, attachments: attachmentIds }),
  });
  const body = (await response.json().catch(() => ({}))) as { data?: { executionId?: string } };
  if (!response.ok || !body.data?.executionId) {
    throw new Error(`Zia agent trigger failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return String(body.data.executionId);
}

export interface RawAgentItem {
  name?: string;
  portion?: { quantity?: number; unit?: string; label?: string };
  nutrition?: { calories?: number; proteinG?: number; carbsG?: number; fatG?: number; fiberG?: number };
  confidence?: string;
  preparationNote?: string;
}

const CONFIDENCE: ConfidenceLevel[] = ["high", "medium", "low"];

/** House style: no em dashes in anything the app shows, including the agent's own words. */
export function plainText(value: string | undefined): string | undefined {
  if (!value) return value;
  return value.replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ",").trim();
}
const UNITS: PortionUnit[] = ["piece", "bowl", "cup", "plate", "tbsp", "tsp", "gram", "serving", "glass"];

function asConfidence(value: unknown): ConfidenceLevel {
  return CONFIDENCE.includes(value as ConfidenceLevel) ? (value as ConfidenceLevel) : "medium";
}

interface RawQuestion {
  itemIndex?: number;
  question?: string;
  options?: (RawAgentItem & { label?: string; isCurrent?: boolean })[];
}

/** Maps the agent's item shape onto ZiaSnap's FoodItem (src/types/food.ts). */
export function toFoodItem(raw: RawAgentItem, id: string = randomUUID()): FoodItem {
  const quantity = Number(raw.portion?.quantity) || 1;
  const nutrition = {
    calories: Number(raw.nutrition?.calories) || 0,
    proteinG: Number(raw.nutrition?.proteinG) || 0,
    carbsG: Number(raw.nutrition?.carbsG) || 0,
    fatG: Number(raw.nutrition?.fatG) || 0,
    fiberG: Number(raw.nutrition?.fiberG) || 0,
  };
  const unit = UNITS.includes(raw.portion?.unit as PortionUnit) ? (raw.portion?.unit as PortionUnit) : "serving";
  const perUnitNutrition = {
    calories: nutrition.calories / quantity,
    proteinG: nutrition.proteinG / quantity,
    carbsG: nutrition.carbsG / quantity,
    fatG: nutrition.fatG / quantity,
    fiberG: nutrition.fiberG / quantity,
  };
  const name = plainText(raw.name) || "Unknown item";
  return {
    id,
    name,
    portion: { quantity, unit, label: plainText(raw.portion?.label) || `${quantity} ${unit}` },
    nutrition,
    perUnitNutrition,
    confidence: asConfidence(raw.confidence),
    preparationNote: plainText(raw.preparationNote) || undefined,
    isUserAdded: false,
    isEdited: false,
    detected: { name, unit, perUnitNutrition },
  };
}

/**
 * Smart-confirmation questions → app shape. Each option becomes a full
 * replacement item that keeps the original item's id (so picking it swaps
 * in place) and its `detected` snapshot (so food memory sees the change).
 * Malformed questions are dropped rather than shown half-broken.
 */
function toQuestions(raw: unknown, items: FoodItem[]): ZiaClarifyQuestion[] {
  if (!Array.isArray(raw)) return [];
  return (raw as RawQuestion[])
    .slice(0, 2)
    .flatMap((question, index) => {
      const target = typeof question.itemIndex === "number" ? items[question.itemIndex] : undefined;
      const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
      if (!target || !question.question || options.length < 2) return [];
      const mapped = options.map((option) => ({
        label: plainText(option.label) || plainText(option.name) || "Option",
        isCurrent: option.isCurrent === true,
        item: { ...toFoodItem({ ...option, confidence: "high" }, target.id), detected: target.detected },
      }));
      if (!mapped.some((option) => option.isCurrent)) mapped[0].isCurrent = true;
      return [{ id: `q${index}`, itemId: target.id, question: plainText(question.question)!, options: mapped }];
    });
}

/** Uploads the photo and starts analysis; returns the agent execution id to poll. */
export async function startMealAnalysis(app: CatalystApp, buffer: Buffer, mimeType: string): Promise<string> {
  const fileId = await uploadAttachment(app, buffer, mimeType);
  return startAgent(app, "analyzer", "Analyze this meal photo.", [fileId]);
}

export type MealAnalysisState =
  | { state: "running" }
  | { state: "failed"; error: string }
  | { state: "done"; result: Omit<ZiaMealAnalysisResult, "analysisId"> };

/** The agent sometimes pads its JSON with blank lines or a ```json fence. */
export function extractJson(raw: string): string {
  const unfenced = raw.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  return start >= 0 && end > start ? unfenced.slice(start, end + 1) : unfenced;
}

export type AgentState = { state: "running" } | { state: "failed"; error: string } | { state: "done"; response: string };

export async function getAgentState(app: CatalystApp, kind: AgentKind, executionId: string): Promise<AgentState> {
  const cfg = config(kind);
  const response = await fetch(
    `https://${cfg.host}/ziaagents/api/v1/agents/${cfg.agentId}/executions/${executionId}/status`,
    { headers: { ...(await connectionHeaders(app)), "X-ZIAAGENTS-ORG": cfg.orgId } },
  );
  const body = (await response.json().catch(() => ({}))) as { data?: { status?: string; response?: string } };
  if (!response.ok) throw new Error(`Zia execution status failed: ${response.status} ${JSON.stringify(body)}`);
  const status = body.data?.status ?? "";
  if (/^(failed|failure|error|cancel)/i.test(status)) return { state: "failed", error: `Agent execution ${status}` };
  if (status !== "success") return { state: "running" };
  return { state: "done", response: body.data?.response ?? "" };
}

export async function getMealAnalysis(app: CatalystApp, executionId: string): Promise<MealAnalysisState> {
  const agentState = await getAgentState(app, "analyzer", executionId);
  if (agentState.state !== "done") return agentState;

  let parsed: { detectedItems?: RawAgentItem[]; overallConfidence?: string; notes?: string; questions?: unknown };
  try {
    parsed = JSON.parse(extractJson(agentState.response));
  } catch {
    return { state: "failed", error: "Zia's answer wasn't readable. Please try again." };
  }
  const detectedItems = Array.isArray(parsed.detectedItems) ? parsed.detectedItems.map((item) => toFoodItem(item)) : [];
  return {
    state: "done",
    result: {
      status: "completed",
      detectedItems,
      overallConfidence: asConfidence(parsed.overallConfidence),
      notes: plainText(parsed.notes) || undefined,
      analyzedAt: new Date().toISOString(),
      questions: toQuestions(parsed.questions, detectedItems),
    },
  };
}
