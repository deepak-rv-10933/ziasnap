import { findCatalogFood, type CatalogFood } from "@/data/food-catalog";
import { scaleNutrition } from "@/types/nutrition";
import type { ConfidenceLevel, FoodItem, Portion } from "@/types";
import { generateId } from "./id";

interface BuildFoodItemOptions {
  quantity?: number;
  portionLabel?: string;
  confidence?: ConfidenceLevel;
  preparationNote?: string;
  isUserAdded?: boolean;
}

/** Builds a full `FoodItem` from a catalog entry, scaling nutrition by quantity. */
export function buildFoodItem(catalogId: string, options: BuildFoodItemOptions = {}): FoodItem {
  const catalogFood = findCatalogFood(catalogId);
  if (!catalogFood) {
    throw new Error(`Unknown catalog food: ${catalogId}`);
  }
  return buildFoodItemFromCatalog(catalogFood, options);
}

export function buildFoodItemFromCatalog(
  catalogFood: CatalogFood,
  options: BuildFoodItemOptions = {},
): FoodItem {
  const quantity = options.quantity ?? catalogFood.defaultPortion.quantity;
  const portion: Portion = {
    quantity,
    unit: catalogFood.defaultPortion.unit,
    label: options.portionLabel ?? scalePortionLabel(catalogFood.defaultPortion, quantity),
  };

  // Normalized to nutrition-per-1-`portion.unit` (e.g. per 1 tbsp, per 1
  // piece) so the editor can recompute totals as `nutrition x quantity`
  // without needing to know the catalog's default portion size.
  const perUnitNutrition = scaleNutrition(catalogFood.perUnitNutrition, 1 / catalogFood.defaultPortion.quantity);

  return {
    id: generateId("food"),
    name: catalogFood.name,
    imageQuery: catalogFood.imageQuery,
    portion,
    perUnitNutrition,
    nutrition: scaleNutrition(perUnitNutrition, quantity),
    confidence: options.confidence ?? "high",
    preparationNote: options.preparationNote,
    isUserAdded: options.isUserAdded ?? false,
    isEdited: false,
  };
}

function scalePortionLabel(defaultPortion: Portion, quantity: number): string {
  if (defaultPortion.unit === "serving") return defaultPortion.label;
  const unitLabel = quantity === 1 ? singularUnit(defaultPortion.unit) : pluralUnit(defaultPortion.unit);
  return `${formatQuantity(quantity)} ${unitLabel}`;
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
}

function singularUnit(unit: string): string {
  const map: Record<string, string> = {
    piece: "piece",
    bowl: "bowl",
    cup: "cup",
    plate: "plate",
    tbsp: "tbsp",
    tsp: "tsp",
    gram: "g",
    serving: "serving",
    glass: "glass",
  };
  return map[unit] ?? unit;
}

function pluralUnit(unit: string): string {
  const map: Record<string, string> = {
    piece: "pieces",
    bowl: "bowls",
    cup: "cups",
    plate: "plates",
    tbsp: "tbsp",
    tsp: "tsp",
    gram: "g",
    serving: "servings",
    glass: "glasses",
  };
  return map[unit] ?? `${unit}s`;
}
