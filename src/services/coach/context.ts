import type { DailySummary, MealType, UserProfile, WeeklyInsightSummary, WeightTrend } from "@/types";
import { activeFastingMode } from "@/services/modes/fasting-modes";

/**
 * Builds the CONTEXT objects the ZiaSnap Coach agent expects (see its spec).
 * Shared: the backend builds them from a signed-in user's own rows; the
 * public demo builds them in the browser from the sample account.
 */

function preferences(profile: UserProfile, dateKey: string) {
  const prefs = profile.nutritionPreferences;
  return {
    dietaryPreference: prefs.dietaryPreference,
    cuisinePreference: prefs.cuisinePreference,
    avoidFoods: prefs.avoidFoods,
    favoriteFoods: prefs.favoriteFoods,
    nutrientPriorities: prefs.nutrientPriorities,
    fastingMode: activeFastingMode(prefs, dateKey)?.type,
  };
}

function remaining(today: DailySummary) {
  return {
    calories: Math.max(0, Math.round(today.remaining.calories)),
    proteinG: Math.max(0, Math.round(today.remaining.proteinG)),
    carbsG: Math.max(0, Math.round(today.remaining.carbsG)),
    fatG: Math.max(0, Math.round(today.remaining.fatG)),
  };
}

export function planContext(input: {
  profile: UserProfile;
  today: DailySummary;
  mealType: MealType;
  recentFoods: string[];
  localHour: number;
}) {
  return {
    ...preferences(input.profile, input.today.date),
    remaining: remaining(input.today),
    mealType: input.mealType,
    recentFoods: [...new Set(input.recentFoods)].slice(0, 12),
    // Lets the agent pick suhoor vs iftar in Ramadan mode.
    timeHint: input.localHour < 5 ? "before dawn (suhoor)" : input.localHour >= 17 ? "evening (iftar or dinner)" : "daytime",
  };
}

export function menuContext(input: { profile: UserProfile; today: DailySummary }) {
  const prefs = preferences(input.profile, input.today.date);
  return {
    dietaryPreference: prefs.dietaryPreference,
    avoidFoods: prefs.avoidFoods,
    nutrientPriorities: prefs.nutrientPriorities,
    fastingMode: prefs.fastingMode,
    remaining: remaining(input.today),
  };
}

export function weeklyContext(input: {
  profile: UserProfile;
  insights: WeeklyInsightSummary;
  weight?: WeightTrend;
  averageWaterMl?: number;
  waterGoalMl?: number;
  calorieTarget: number;
  proteinTargetG: number;
}) {
  const { insights, weight } = input;
  const weekStartTrend = weight?.trend.find((point) => point.dateKey >= insights.weekStartDate);
  const weightChangeKg =
    weekStartTrend && weight?.latestTrendKg !== undefined
      ? Math.round((weight.latestTrendKg - weekStartTrend.trendKg) * 10) / 10
      : undefined;
  return {
    firstName: input.profile.personalDetails.name.split(" ")[0],
    goal: input.profile.goal,
    daysLogged: insights.daysLoggedCount,
    mealsLogged: insights.mealsLoggedCount,
    averageCalories: insights.averageCalories,
    averageProteinG: insights.averageProteinG,
    calorieTarget: input.calorieTarget,
    proteinTargetG: input.proteinTargetG,
    calorieConsistencyPercent: insights.calorieConsistencyPercent,
    proteinConsistencyPercent: insights.proteinConsistencyPercent,
    topFoods: insights.mostFrequentFoods.map((food) => food.name),
    weightChangeKg,
    averageWaterMl: input.averageWaterMl,
    waterGoalMl: input.waterGoalMl,
  };
}
