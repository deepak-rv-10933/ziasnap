import type { NutritionValues } from "./nutrition";
import type { NutrientPriority } from "./user";
import type { FoodItem } from "./food";

export type RecommendationReasonTag =
  | "fits_remaining_calories"
  | "high_protein"
  | "goal_aligned"
  | "nutrient_gap"
  | "cuisine_match"
  | "recently_enjoyed";

export interface MealRecommendation {
  id: string;
  name: string;
  description: string;
  imageQuery: string;
  nutrition: NutritionValues;
  items: FoodItem[];
  reasonTags: RecommendationReasonTag[];
  /** Short human explanation, e.g. "Fits your remaining 540 kcal and 32g protein." */
  whyItFits: string;
  addressesNutrientPriorities?: NutrientPriority[];
  cuisine: "south_indian" | "north_indian" | "indo_chinese" | "global";
}
