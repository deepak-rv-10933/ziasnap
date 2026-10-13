import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { CoachResults, CoachTask, MealRecommendation, MenuAdvice, WeeklyRecap } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { imageKeyForName } from "@/lib/utils/food-image";
import { extractJson, getAgentState, plainText, startAgent, toFoodItem, uploadAttachment, type RawAgentItem } from "./zia";

/** ZiaSnap Coach agent tasks (see the agent's spec): name on the wire per task. */
const TASK_NAME: Record<CoachTask, string> = { plan: "plan_next_meal", menu: "menu_picks", weekly: "weekly_recap" };

const MAX_CONTEXT_CHARS = 4000;

export async function startCoach(
  app: CatalystApp,
  task: CoachTask,
  context: unknown,
  image?: { buffer: Buffer; mimeType: string },
): Promise<string> {
  const json = JSON.stringify(context ?? {});
  if (json.length > MAX_CONTEXT_CHARS) throw new Error("context is too large");
  const attachments = image ? [await uploadAttachment(app, image.buffer, image.mimeType)] : [];
  return startAgent(app, "coach", `TASK: ${TASK_NAME[task]}\nCONTEXT: ${json}`, attachments);
}

const num = (value: unknown) => (Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);

function parsePlan(raw: { suggestions?: { name?: string; description?: string; whyItFits?: string; cuisine?: string; items?: RawAgentItem[] }[] }): MealRecommendation[] {
  return (raw.suggestions ?? []).slice(0, 3).flatMap((suggestion, index) => {
    const items = (suggestion.items ?? []).slice(0, 8).map((item) => ({ ...toFoodItem({ ...item, confidence: "medium" }), isUserAdded: false }));
    if (!suggestion.name || items.length === 0) return [];
    const cuisine = (["south_indian", "north_indian", "indo_chinese", "global"] as const).find((value) => value === suggestion.cuisine) ?? "global";
    return [
      {
        id: `ai-plan-${Date.now()}-${index}`,
        name: plainText(suggestion.name)!,
        description: plainText(suggestion.description) ?? "",
        imageQuery: items.map((item) => imageKeyForName(item.name)).find(Boolean) ?? "emptyStatePhoto",
        nutrition: sumNutrition(items.map((item) => item.nutrition)),
        items,
        reasonTags: ["goal_aligned"],
        whyItFits: plainText(suggestion.whyItFits) ?? "",
        cuisine,
      },
    ];
  });
}

function parseMenu(raw: {
  picks?: { dish?: string; why?: string; tip?: string; estimatedCalories?: number; estimatedProteinG?: number; estimatedCarbsG?: number; estimatedFatG?: number }[];
  goEasy?: { dish?: string; why?: string }[];
  notes?: string;
}): MenuAdvice {
  return {
    picks: (raw.picks ?? []).slice(0, 3).flatMap((pick) =>
      pick.dish
        ? [
            {
              dish: plainText(pick.dish)!,
              why: plainText(pick.why) ?? "",
              tip: plainText(pick.tip),
              nutrition: {
                calories: Math.round(num(pick.estimatedCalories)),
                proteinG: Math.round(num(pick.estimatedProteinG)),
                carbsG: Math.round(num(pick.estimatedCarbsG)),
                fatG: Math.round(num(pick.estimatedFatG)),
              },
            },
          ]
        : [],
    ),
    goEasy: (raw.goEasy ?? []).slice(0, 2).flatMap((item) => (item.dish ? [{ dish: plainText(item.dish)!, why: plainText(item.why) ?? "" }] : [])),
    notes: plainText(raw.notes),
  };
}

function parseWeekly(raw: { headline?: string; summary?: string; win?: string; oneChange?: string }, week: { start: string; end: string }): WeeklyRecap {
  if (!raw.headline || !raw.oneChange) throw new Error("Zia's recap was incomplete. Please try again.");
  return {
    weekStartDate: week.start,
    weekEndDate: week.end,
    headline: plainText(raw.headline)!,
    summary: plainText(raw.summary) ?? "",
    win: plainText(raw.win) ?? "",
    oneChange: plainText(raw.oneChange)!,
    generatedAt: new Date().toISOString(),
  };
}

export type CoachState<T extends CoachTask> = { state: "running" } | { state: "failed"; error: string } | { state: "done"; result: CoachResults[T] };

export async function pollCoach<T extends CoachTask>(
  app: CatalystApp,
  task: T,
  executionId: string,
  week?: { start: string; end: string },
): Promise<CoachState<T>> {
  const agentState = await getAgentState(app, "coach", executionId);
  if (agentState.state !== "done") return agentState;
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(extractJson(agentState.response));
  } catch {
    return { state: "failed", error: "Zia's answer wasn't readable. Please try again." };
  }
  try {
    const result =
      task === "plan" ? parsePlan(raw) : task === "menu" ? parseMenu(raw) : parseWeekly(raw, week ?? { start: "", end: "" });
    return { state: "done", result: result as CoachResults[T] };
  } catch (error) {
    return { state: "failed", error: error instanceof Error ? error.message : "Zia couldn't finish that." };
  }
}
