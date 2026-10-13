import type { NutritionValues } from "./nutrition";

export type ConfidenceLevel = "high" | "medium" | "low";

export type PortionUnit =
  | "piece"
  | "bowl"
  | "cup"
  | "plate"
  | "tbsp"
  | "tsp"
  | "gram"
  | "serving"
  | "glass";

export interface Portion {
  quantity: number;
  unit: PortionUnit;
  /** Human label shown in the UI, e.g. "2 pieces" or "1 bowl". */
  label: string;
}

/**
 * A single detected (or manually added) food item within a meal, before or
 * after user confirmation. `perUnitNutrition` lets the UI recalculate totals
 * live as the user edits quantity/portion.
 */
export interface FoodItem {
  id: string;
  name: string;
  imageQuery?: string;
  portion: Portion;
  nutrition: NutritionValues;
  perUnitNutrition: NutritionValues;
  confidence: ConfidenceLevel;
  /** e.g. "Looks pan-fried with a moderate amount of oil" */
  preparationNote?: string;
  isUserAdded: boolean;
  isEdited: boolean;
  /**
   * What Zia originally saw, kept through edits. Lets the backend tell a real
   * correction ("Dosa" → "Ghee Roast Dosa") from a count change, for food memory.
   */
  detected?: { name: string; unit: PortionUnit; perUnitNutrition: NutritionValues };
  /** Filled in from the user's own past correction of this dish (personal food memory). */
  fromMemory?: boolean;
}
