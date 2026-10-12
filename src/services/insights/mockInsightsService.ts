import type { GoalTargets, Meal, NutritionInsight, WeeklyInsightSummary } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { mealDateKey } from "@/types/meal";

function dateKeysInRange(startDateKey: string, days: number): string[] {
  const keys: string[] = [];
  const cursor = new Date(`${startDateKey}T00:00:00Z`);
  for (let i = 0; i < days; i += 1) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function buildWeeklyInsights(
  meals: Meal[],
  goalTargets: GoalTargets,
  weekStartDateKey: string,
): WeeklyInsightSummary {
  const dateKeys = dateKeysInRange(weekStartDateKey, 7);
  const weekEndDate = dateKeys[dateKeys.length - 1];

  const confirmedMeals = meals.filter((meal) => meal.confirmedAt);

  const dailyTotals = dateKeys.map((dateKey) => {
    const dayMeals = confirmedMeals.filter((meal) => mealDateKey(meal) === dateKey);
    return { dateKey, meals: dayMeals, totals: sumNutrition(dayMeals.map((meal) => meal.totalNutrition)) };
  });

  const loggedDays = dailyTotals.filter((day) => day.meals.length > 0);
  const daysLoggedCount = loggedDays.length;
  const mealsLoggedCount = loggedDays.reduce((sum, day) => sum + day.meals.length, 0);

  const averageCalories = daysLoggedCount
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.totals.calories, 0) / daysLoggedCount)
    : 0;
  const averageProteinG = daysLoggedCount
    ? Math.round(loggedDays.reduce((sum, day) => sum + day.totals.proteinG, 0) / daysLoggedCount)
    : 0;

  const calorieOnTargetDays = loggedDays.filter(
    (day) => Math.abs(day.totals.calories - goalTargets.calorieTarget) <= goalTargets.calorieTarget * 0.15,
  ).length;
  const proteinOnTargetDays = loggedDays.filter(
    (day) => day.totals.proteinG >= goalTargets.proteinTargetG * 0.9,
  ).length;

  const calorieConsistencyPercent = daysLoggedCount
    ? Math.round((calorieOnTargetDays / daysLoggedCount) * 100)
    : 0;
  const proteinConsistencyPercent = daysLoggedCount
    ? Math.round((proteinOnTargetDays / daysLoggedCount) * 100)
    : 0;
  const goalAdherencePercent = Math.round((calorieConsistencyPercent + proteinConsistencyPercent) / 2);

  const foodCounts = new Map<string, number>();
  for (const day of loggedDays) {
    for (const meal of day.meals) {
      for (const item of meal.items) {
        foodCounts.set(item.name, (foodCounts.get(item.name) ?? 0) + 1);
      }
    }
  }
  const mostFrequentFoods = Array.from(foodCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  const insights: NutritionInsight[] = [];

  if (proteinConsistencyPercent < 60 && daysLoggedCount > 0) {
    insights.push({
      id: "insight-protein-consistency",
      title: "Protein has been inconsistent",
      observation: `You hit your protein target on ${proteinOnTargetDays} of ${daysLoggedCount} logged days.`,
      suggestion: "Add a protein-rich side — eggs, curd, paneer or a lentil dish — to one more meal a day.",
      severity: "attention",
    });
  } else if (proteinConsistencyPercent >= 80) {
    insights.push({
      id: "insight-protein-strong",
      title: "Protein intake has been strong",
      observation: `You reached your protein target on ${proteinOnTargetDays} of ${daysLoggedCount} logged days.`,
      suggestion: "Keep pairing meals with a protein source like eggs, curd or dal.",
      severity: "positive",
    });
  }

  if (calorieConsistencyPercent >= 70 && daysLoggedCount > 0) {
    insights.push({
      id: "insight-calorie-consistency",
      title: "Calories have stayed close to target",
      observation: `${calorieOnTargetDays} of ${daysLoggedCount} logged days landed within 15% of your calorie target.`,
      suggestion: "This pace is working — keep logging meals as you have been.",
      severity: "positive",
    });
  } else if (daysLoggedCount > 0 && calorieConsistencyPercent < 40) {
    insights.push({
      id: "insight-calorie-variance",
      title: "Calories have varied a lot day to day",
      observation: `Only ${calorieOnTargetDays} of ${daysLoggedCount} logged days were within 15% of your target.`,
      suggestion: "Try logging snacks too — small unlogged bites often explain the swings.",
      severity: "attention",
    });
  }

  const averageMealsPerLoggedDay = daysLoggedCount ? mealsLoggedCount / daysLoggedCount : 0;
  if (daysLoggedCount > 0 && averageMealsPerLoggedDay < 2.5) {
    insights.push({
      id: "insight-meal-frequency",
      title: "Fewer meals logged than usual",
      observation: `You logged about ${averageMealsPerLoggedDay.toFixed(1)} meals per day this week.`,
      suggestion: "Snap snacks and smaller meals too for a fuller picture of your day.",
      severity: "neutral",
    });
  }

  if (daysLoggedCount === 0) {
    insights.push({
      id: "insight-no-data",
      title: "No meals logged this week yet",
      observation: "There isn't enough data to spot a pattern yet.",
      suggestion: "Snap your next meal to start building this week's picture.",
      severity: "neutral",
    });
  }

  return {
    weekStartDate: weekStartDateKey,
    weekEndDate,
    averageCalories,
    averageProteinG,
    calorieConsistencyPercent,
    proteinConsistencyPercent,
    goalAdherencePercent,
    mealsLoggedCount,
    daysLoggedCount,
    mostFrequentFoods,
    insights,
  };
}
