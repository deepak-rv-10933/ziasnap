import type { IncomingMessage, ServerResponse } from "http";
import catalyst from "zcatalyst-sdk-node";
import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type { MealType } from "@/types";
import type { ConfirmMealInput, ProfileUpdateInput, UpdateMealInput } from "@/services/nutrition/NutritionRepository";
import { requireAccount } from "./auth";
import { assertDateKey } from "./db";
import { HttpError, handleLocalCors, readJsonBody, sendJson } from "./http";
import { decodeImageDataUrl } from "./image";
import { CatalystNutritionRepository } from "./repository";
import { getMealAnalysis, startMealAnalysis } from "./zia";
import { issueAnalysisToken, readAnalysisToken } from "./analysis-token";
import { guestRetryAfterSeconds } from "./rate-limit";

const GUEST_OWNER = "guest";

/** Shape returned while Zia is still working — the client keeps polling. */
function analyzingResponse(analysisId: string) {
  return {
    analysisId,
    status: "analyzing",
    detectedItems: [],
    overallConfidence: "medium",
    analyzedAt: new Date().toISOString(),
  };
}

async function pollAnalysis(res: ServerResponse, app: CatalystApp, token: string, owner: string) {
  const executionId = readAnalysisToken(token, owner);
  if (!executionId) return sendJson(res, 404, { error: "Analysis not found" });
  const state = await getMealAnalysis(app, executionId);
  if (state.state === "running") return sendJson(res, 200, analyzingResponse(token));
  if (state.state === "failed") return sendJson(res, 502, { error: state.error });
  return sendJson(res, 200, { ...state.result, analysisId: token });
}

/**
 * ZiaSnap's login-required API (Advanced I/O). Every route resolves the
 * signed-in Catalyst app user first, then works only on that user's rows.
 * Routes mirror the Next.js mock routes under /api/mock so the frontend
 * client only swaps its base URL.
 */
async function handler(req: IncomingMessage, res: ServerResponse) {
  if (handleLocalCors(req, res)) return;

  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname.replace(/^\/execute(?=\/|$)/, "").replace(/\/+$/, "") || "/";
    const method = req.method ?? "GET";
    const query = url.searchParams;

    if (path === "/health") return sendJson(res, 200, { ok: true });

    // Try-before-signup: analyze a photo with no account. Nothing is stored —
    // the photo is only forwarded to Zia, and saving the meal requires sign-in.
    const guestPoll = /^\/guest\/analyze\/([\w.]+)$/.exec(path);
    if (path === "/guest/analyze" || guestPoll) {
      const guestApp = catalyst.initialize(req as unknown as Record<string, unknown>, { scope: "admin" });
      if (method === "GET" && guestPoll) return pollAnalysis(res, guestApp, guestPoll[1], GUEST_OWNER);
      if (method !== "POST" || guestPoll) return sendJson(res, 405, { error: "Method not allowed" });

      const retryAfter = guestRetryAfterSeconds(req);
      if (retryAfter > 0) {
        res.setHeader("Retry-After", String(retryAfter));
        return sendJson(res, 429, { error: "You've tried a few snaps already. Sign up free to keep going." });
      }
      const body = await readJsonBody<{ imageDataUrl?: string }>(req);
      const { buffer, mimeType } = decodeImageDataUrl(body.imageDataUrl);
      const executionId = await startMealAnalysis(guestApp, buffer, mimeType);
      return sendJson(res, 202, analyzingResponse(issueAnalysisToken(executionId, GUEST_OWNER)));
    }

    const account = await requireAccount(req);
    const adminApp = catalyst.initialize(req as unknown as Record<string, unknown>, { scope: "admin" });
    const repo = new CatalystNutritionRepository(adminApp, account);
    const userId = account.userId;

    const route = `${method} ${path}`;
    const mealMatch = /^\/meal\/(\d+)$/.exec(path);
    const analysisPoll = /^\/meal\/analyze\/([\w.]+)$/.exec(path);
    if (method === "GET" && analysisPoll) return pollAnalysis(res, adminApp, analysisPoll[1], userId);

    switch (route) {
      case "GET /me":
        return sendJson(res, 200, account);

      case "GET /profile":
        return sendJson(res, 200, await repo.getProfile(userId));
      case "PATCH /profile":
        return sendJson(res, 200, await repo.updateProfile(userId, await readJsonBody<ProfileUpdateInput>(req)));

      case "POST /onboarding": {
        const body = await readJsonBody<ProfileUpdateInput>(req);
        const profile = await repo.updateProfile(userId, { ...body, completeOnboarding: true });
        const targets = await repo.recalculateGoalTargets(userId);
        return sendJson(res, 200, { profile, targets });
      }

      case "GET /goals":
        return sendJson(res, 200, await repo.getGoalTargets(userId));
      case "POST /goals":
        return sendJson(res, 200, await repo.recalculateGoalTargets(userId));

      case "GET /today":
        return sendJson(res, 200, await repo.getDailySummary(userId, assertDateKey(query.get("date") ?? undefined)));

      case "GET /history":
        return sendJson(
          res,
          200,
          await repo.getHistory(userId, {
            startDateKey: assertDateKey(query.get("start") ?? undefined, "start"),
            endDateKey: assertDateKey(query.get("end") ?? undefined, "end"),
          }),
        );

      case "GET /insights":
        return sendJson(
          res,
          200,
          await repo.getInsights(userId, assertDateKey(query.get("weekStart") ?? undefined, "weekStart")),
        );

      case "GET /recommendations":
        return sendJson(res, 200, await repo.getRecommendations(userId, assertDateKey(query.get("date") ?? undefined)));

      case "POST /meal/analyze": {
        const body = await readJsonBody<{ imageDataUrl?: string; mealType?: MealType }>(req);
        const { buffer, mimeType } = decodeImageDataUrl(body.imageDataUrl);
        const executionId = await startMealAnalysis(adminApp, buffer, mimeType);
        return sendJson(res, 202, analyzingResponse(issueAnalysisToken(executionId, userId)));
      }

      case "POST /meal/confirm": {
        const body = await readJsonBody<Omit<ConfirmMealInput, "userId">>(req);
        // Photos are never stored — drop any inline image data.
        return sendJson(res, 200, await repo.confirmMeal({ ...body, photoUrl: undefined, userId }));
      }

      case "GET /export":
        return sendJson(res, 200, await repo.exportUserData(userId));

      case "DELETE /account": {
        await repo.deleteUserData(userId);
        await adminApp.userManagement().deleteUser(userId);
        return sendJson(res, 200, { success: true });
      }
    }

    if (mealMatch) {
      const mealId = mealMatch[1];
      if (method === "GET") {
        const meal = await repo.getMeal(userId, mealId);
        return meal ? sendJson(res, 200, meal) : sendJson(res, 404, { error: "Meal not found" });
      }
      if (method === "PATCH") {
        return sendJson(res, 200, await repo.updateMeal(userId, mealId, await readJsonBody<UpdateMealInput>(req)));
      }
      if (method === "DELETE") {
        await repo.deleteMeal(userId, mealId);
        return sendJson(res, 200, { success: true });
      }
    }

    return sendJson(res, 404, { error: `No route for ${route}` });
  } catch (error) {
    if (error instanceof HttpError) return sendJson(res, error.status, { error: error.message });
    const message = error instanceof Error ? error.message : "Unexpected error";
    console.error("ziasnap-api error:", error);
    const isValidation = /must be|at least|at most|Unknown meal type|does not belong|not found/i.test(message);
    return sendJson(res, isValidation ? (/not found/i.test(message) ? 404 : 400) : 500, { error: message });
  }
}

// Catalyst loads Advanced I/O handlers as a CommonJS default export.
module.exports = handler;
