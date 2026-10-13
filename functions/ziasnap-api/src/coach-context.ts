import { weeklyContext } from "@/services/coach/context";
import { waterGoalMl } from "@/services/tracking/water";
import type { CatalystNutritionRepository } from "./repository";

export function weekEnding(dateKey: string) {
  const start = new Date(`${dateKey}T00:00:00Z`);
  start.setUTCDate(start.getUTCDate() - 6);
  return { start: start.toISOString().slice(0, 10), end: dateKey };
}

/** The weekly_recap CONTEXT for one user, from their own rows. Shared by the API and the Sunday job. */
export async function buildWeeklyContext(repo: CatalystNutritionRepository, userId: string, todayDateKey: string) {
  const week = weekEnding(todayDateKey);
  const [profile, insights, weight, averageWaterMl, targets] = await Promise.all([
    repo.getProfile(userId),
    repo.getInsights(userId, week.start),
    repo.getWeightTrend(userId, todayDateKey),
    repo.averageWaterMl(userId, week.start, week.end),
    repo.getGoalTargets(userId),
  ]);
  return {
    week,
    context: weeklyContext({
      profile,
      insights,
      weight,
      averageWaterMl,
      waterGoalMl: waterGoalMl(profile.personalDetails.currentWeightKg),
      calorieTarget: targets.calorieTarget,
      proteinTargetG: targets.proteinTargetG,
    }),
  };
}
