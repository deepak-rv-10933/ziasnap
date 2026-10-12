import type { FoodItem } from "./food";
import type { NutritionValues } from "./nutrition";

export type MealType = "breakfast" | "lunch" | "snack" | "dinner";

export type MealSource = "photo" | "manual";

export interface Meal {
  id: string;
  userId: string;
  type: MealType;
  source: MealSource;
  photoUrl?: string;
  items: FoodItem[];
  totalNutrition: NutritionValues;
  notes?: string;
  loggedAt: string;
  /** The user's local calendar day (YYYY-MM-DD), stored by the real backend. When absent it is
   * derived from `loggedAt` in the current timezone — see `mealDateKey`. */
  dateKey?: string;
  /** Set once the user has reviewed and confirmed the AI estimate. */
  confirmedAt?: string;
  analysisId?: string;
}

/** Which calendar day a meal belongs to — the stored day when known, else derived locally. */
export function mealDateKey(meal: Pick<Meal, "dateKey" | "loggedAt">): string {
  if (meal.dateKey) return meal.dateKey;
  const date = new Date(meal.loggedAt);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
