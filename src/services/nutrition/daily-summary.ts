import type { DailySummary, GoalTargets, Meal } from "@/types";
import { sumNutrition } from "@/types/nutrition";

/**
 * Builds one day's summary from that day's meals. Shared by the mock
 * repository and the Catalyst one in the `ziasnap-api` function — each
 * decides for itself which meals belong to `dateKey`.
 */
export function buildDailySummary(dayMeals: Meal[], dateKey: string, target: GoalTargets): DailySummary {
  const meals = dayMeals
    .filter((meal) => meal.confirmedAt)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const totalNutrition = sumNutrition(meals.map((meal) => meal.totalNutrition));
  return {
    date: dateKey,
    meals,
    totalNutrition,
    target,
    remaining: {
      calories: target.calorieTarget - totalNutrition.calories,
      proteinG: target.proteinTargetG - totalNutrition.proteinG,
      carbsG: target.carbsTargetG - totalNutrition.carbsG,
      fatG: target.fatTargetG - totalNutrition.fatG,
    },
    caloriePercent: target.calorieTarget > 0 ? (totalNutrition.calories / target.calorieTarget) * 100 : 0,
    proteinPercent: target.proteinTargetG > 0 ? (totalNutrition.proteinG / target.proteinTargetG) * 100 : 0,
  };
}

/** Inclusive list of YYYY-MM-DD keys from start to end, newest first. */
export function dateKeysBetween(startDateKey: string, endDateKey: string): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${startDateKey}T00:00:00Z`);
  const end = new Date(`${endDateKey}T00:00:00Z`);
  while (cursor <= end && keys.length < 366) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys.reverse();
}
