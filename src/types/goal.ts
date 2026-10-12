import type { NutritionValues } from "./nutrition";

/**
 * Personalized daily targets, derived from the user's profile by the mock
 * goal-calculation layer (BMR/TDEE style estimate — see lib/utils/goal-calculator.ts).
 */
export interface GoalTargets {
  calorieTarget: number;
  proteinTargetG: number;
  carbsTargetG: number;
  fatTargetG: number;
  /** Positive for a surplus (weight gain), negative for a deficit (weight loss), 0 for maintenance. */
  dailyEnergyBalance: number;
  maintenanceCalories: number;
  calculatedAt: string;
}

export interface GoalProgress {
  target: GoalTargets;
  consumed: NutritionValues;
  remaining: NutritionValues;
  /** Percentage of calorie target consumed, can exceed 100. */
  caloriePercent: number;
  proteinPercent: number;
}
