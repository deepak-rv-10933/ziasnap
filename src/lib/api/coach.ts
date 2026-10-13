import type { CoachPoll, CoachResults, CoachTask, MealType, MenuAdvice, WeeklyRecap } from "@/types";
import { API_BASE_URL, getAuthToken, hasRealApi, isDemoMode } from "@/lib/catalyst/web-sdk";
import { daysAgoKey, toDateKey } from "@/lib/utils/date";
import { menuContext, planContext, weeklyContext } from "@/services/coach/context";
import { api, ApiError } from "./client";

const POLL_MS = 2000;
const TIMEOUT_MS = 100_000;

export interface CoachInput {
  mealType?: MealType;
  imageDataUrl?: string;
}

function week() {
  return { start: daysAgoKey(6), end: toDateKey(new Date()) };
}

async function call<T>(path: string, init: RequestInit, signedIn: boolean): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (signedIn) headers.Authorization = await getAuthToken();
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.error ?? `Zia couldn't do that (${response.status})`, response.status);
  return body as T;
}

/** The demo has no account, so its context comes from the sample data shown on screen. */
async function demoContext(task: CoachTask, input: CoachInput) {
  const [profile, today] = await Promise.all([api.getProfile(), api.getToday()]);
  if (task === "plan") {
    const history = await api.getHistory(daysAgoKey(6));
    return planContext({
      profile,
      today,
      mealType: input.mealType ?? "lunch",
      recentFoods: history.flatMap((day) => day.meals.flatMap((meal) => meal.items.map((item) => item.name))),
      localHour: new Date().getHours(),
    });
  }
  if (task === "menu") return menuContext({ profile, today });
  const [insights, weight, water, goals] = await Promise.all([api.getInsights(), api.getWeightTrend(), api.getWater(), api.getGoalTargets()]);
  return weeklyContext({
    profile,
    insights,
    weight,
    averageWaterMl: water.totalMl || undefined,
    waterGoalMl: water.goalMl,
    calorieTarget: goals.calorieTarget,
    proteinTargetG: goals.proteinTargetG,
  });
}

/** Local mock builds have no Coach agent: deterministic stand-ins so every screen still works. */
async function mockResult<T extends CoachTask>(task: T): Promise<CoachResults[T]> {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (task === "plan") return (await api.getRecommendations()) as CoachResults[T];
  if (task === "menu") {
    const sample: MenuAdvice = {
      picks: [
        { dish: "Idli (2 pcs) with sambar", why: "Light and steamed, with lentil protein from the sambar.", tip: "Ask for extra sambar instead of more chutney.", nutrition: { calories: 230, proteinG: 9, carbsG: 42, fatG: 3 } },
        { dish: "Curd Rice", why: "Gentle on the stomach and adds some protein from the curd.", tip: "Skip the fried papad on the side.", nutrition: { calories: 320, proteinG: 9, carbsG: 52, fatG: 8 } },
      ],
      goEasy: [{ dish: "Ghee Roast Dosa", why: "Delicious, but the ghee roughly doubles a plain dosa's calories." }],
      notes: "Sample answer: in the live app Zia reads your actual menu photo.",
    };
    return sample as CoachResults[T];
  }
  const insights = await api.getInsights();
  const recap: WeeklyRecap = {
    weekStartDate: insights.weekStartDate,
    weekEndDate: insights.weekEndDate,
    headline: "A steady week of logging",
    summary: `You logged ${insights.mealsLoggedCount} meals across ${insights.daysLoggedCount} days, averaging ${insights.averageCalories} kcal and ${insights.averageProteinG}g protein a day.`,
    win: "You kept logging most days, which is what makes every other number trustworthy.",
    oneChange: "Add a bowl of curd or a boiled egg to lunch to close the protein gap.",
    generatedAt: new Date().toISOString(),
  };
  return recap as CoachResults[T];
}

/**
 * Runs a ZiaSnap Coach task to completion. Answers take 13 to 20 seconds, so
 * the backend starts the agent and this polls. Signed-in users get context
 * built server-side from their own data; the public demo sends the sample
 * account's context to the rate-limited guest endpoint.
 */
export async function runCoach<T extends CoachTask>(task: T, input: CoachInput = {}): Promise<CoachResults[T]> {
  if (!hasRealApi) return mockResult(task);

  const demo = isDemoMode();
  const { start, end } = week();
  const base = demo ? `/guest/coach/${task}` : `/coach/${task}`;
  const started = demo
    ? await call<CoachPoll<T>>(base, { method: "POST", body: JSON.stringify({ context: await demoContext(task, input), imageDataUrl: input.imageDataUrl }) }, false)
    : await call<CoachPoll<T>>(
        `${base}?date=${end}`,
        { method: "POST", body: JSON.stringify({ mealType: input.mealType, imageDataUrl: input.imageDataUrl, localHour: new Date().getHours() }) },
        true,
      );

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
    const poll = await call<CoachPoll<T>>(`${base}/${encodeURIComponent(started.token)}?weekStart=${start}&weekEnd=${end}`, { method: "GET" }, !demo);
    if (poll.status === "done") return poll.result;
  }
  throw new ApiError("Zia is taking longer than usual. Please try again.", 504);
}

/** The stored recap for signed-in users; the demo and mock builds generate on demand. */
export async function latestWeeklyRecap(): Promise<WeeklyRecap | null> {
  if (!hasRealApi || isDemoMode()) return null;
  const body = await call<{ recap: WeeklyRecap | null }>("/coach/weekly/latest", { method: "GET" }, true);
  return body.recap;
}
