import type { Meal } from "./meal";
import type { NutritionValues } from "./nutrition";
import type { GoalTargets } from "./goal";

export interface DailySummary {
  date: string;
  meals: Meal[];
  totalNutrition: NutritionValues;
  target: GoalTargets;
  remaining: NutritionValues;
  caloriePercent: number;
  proteinPercent: number;
}
