import type { ActivityLevel, Goal, PersonalDetails } from "@/types";
import type { GoalTargets } from "@/types";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9,
};

/** Fractional calorie adjustment applied to maintenance calories per goal. */
const GOAL_ENERGY_ADJUSTMENT: Record<Goal, number> = {
  lose: -0.2,
  gain: 0.15,
  maintain: 0,
};

/** Protein target in grams per kg of current body weight. Higher during a
 * deficit to protect lean mass and support satiety. */
const PROTEIN_G_PER_KG: Record<Goal, number> = {
  lose: 1.8,
  gain: 1.6,
  maintain: 1.4,
};

const FAT_CALORIE_SHARE = 0.28;
const MIN_SAFE_CALORIES = 1200;

/**
 * Mifflin-St Jeor BMR estimate, scaled by activity level to approximate TDEE.
 * This is a mock/preview calculation — it is intentionally simple and should
 * be replaced by a clinically reviewed model before any real health use.
 */
export function calculateGoalTargets(
  personalDetails: PersonalDetails,
  goal: Goal,
  activityLevel: ActivityLevel,
): GoalTargets {
  const { age, sex, heightCm, currentWeightKg } = personalDetails;

  const sexOffset = sex === "male" ? 5 : sex === "female" ? -161 : -78;
  const bmr = 10 * currentWeightKg + 6.25 * heightCm - 5 * age + sexOffset;
  const maintenanceCalories = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);

  const adjustment = GOAL_ENERGY_ADJUSTMENT[goal];
  const rawTarget = Math.round(maintenanceCalories * (1 + adjustment));
  const calorieTarget = Math.max(rawTarget, MIN_SAFE_CALORIES);

  const proteinTargetG = Math.round(currentWeightKg * PROTEIN_G_PER_KG[goal]);
  const fatTargetG = Math.round((calorieTarget * FAT_CALORIE_SHARE) / 9);
  const proteinCalories = proteinTargetG * 4;
  const fatCalories = fatTargetG * 9;
  const carbsTargetG = Math.max(
    Math.round((calorieTarget - proteinCalories - fatCalories) / 4),
    0,
  );

  return {
    calorieTarget,
    proteinTargetG,
    carbsTargetG,
    fatTargetG,
    dailyEnergyBalance: calorieTarget - maintenanceCalories,
    maintenanceCalories,
    calculatedAt: new Date().toISOString(),
  };
}
