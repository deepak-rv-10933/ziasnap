import type { NutritionValues, Portion, PortionUnit } from "@/types";

export type FoodCategory =
  | "south_indian"
  | "north_indian"
  | "indo_chinese"
  | "global"
  | "protein"
  | "side"
  | "condiment"
  | "beverage"
  | "fruit";

export interface CatalogFood {
  id: string;
  name: string;
  category: FoodCategory;
  /** Key into FOOD_IMAGES (see lib/utils/food-image.ts) — not a free-text search query. */
  imageQuery: string;
  defaultPortion: Portion;
  perUnitNutrition: NutritionValues;
  isVegetarian: boolean;
  isEgg: boolean;
  tags: string[];
}

function portion(quantity: number, unit: PortionUnit, label: string): Portion {
  return { quantity, unit, label };
}

function nutrition(
  calories: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG = 0,
): NutritionValues {
  return { calories, proteinG, carbsG, fatG, fiberG };
}

/**
 * Realistic mock nutrition catalog centered on South Indian and Indian home
 * cooking, with a smaller global set. Values are per the `defaultPortion`
 * unit (e.g. per 1 piece, per 1 bowl) and per-unit values used to recalculate
 * totals as the user edits quantity. These are illustrative estimates, not
 * lab-verified nutrition facts.
 */
export const FOOD_CATALOG: CatalogFood[] = [
  {
    id: "idli",
    name: "Idli",
    category: "south_indian",
    imageQuery: "idli",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(39, 1.4, 8, 0.2, 0.4),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "steamed", "light"],
  },
  {
    id: "dosa",
    name: "Dosa",
    category: "south_indian",
    imageQuery: "dosa",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(140, 4, 21, 4.5, 0.9),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "dinner", "fermented"],
  },
  {
    id: "masala-dosa",
    name: "Masala Dosa",
    category: "south_indian",
    imageQuery: "masalaDosa",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(230, 5, 32, 9, 2.2),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "dinner", "fermented"],
  },
  {
    id: "vegetable-dosa",
    name: "Vegetable Dosa",
    category: "south_indian",
    imageQuery: "vegetableDosa",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(190, 5, 27, 6.5, 2.4),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "dinner", "fermented", "vegetables"],
  },
  {
    id: "sambar",
    name: "Sambar",
    category: "south_indian",
    imageQuery: "sambar",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(120, 6, 18, 3, 4.5),
    isVegetarian: true,
    isEgg: false,
    tags: ["lentil", "curry", "protein-light"],
  },
  {
    id: "coconut-chutney",
    name: "Coconut Chutney",
    category: "condiment",
    imageQuery: "coconutChutney",
    defaultPortion: portion(2, "tbsp", "2 tbsp"),
    perUnitNutrition: nutrition(60, 1, 3, 5, 1.2),
    isVegetarian: true,
    isEgg: false,
    tags: ["condiment", "coconut"],
  },
  {
    id: "tomato-chutney",
    name: "Tomato Chutney",
    category: "condiment",
    imageQuery: "tomatoChutney",
    defaultPortion: portion(2, "tbsp", "2 tbsp"),
    perUnitNutrition: nutrition(45, 0.8, 4, 3, 0.6),
    isVegetarian: true,
    isEgg: false,
    tags: ["condiment"],
  },
  {
    id: "pongal",
    name: "Ven Pongal",
    category: "south_indian",
    imageQuery: "pongal",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(320, 8, 46, 11, 2),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "ghee"],
  },
  {
    id: "vada",
    name: "Medu Vada",
    category: "south_indian",
    imageQuery: "vada",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(97, 3, 10, 5, 1.1),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast", "fried"],
  },
  {
    id: "upma",
    name: "Upma",
    category: "south_indian",
    imageQuery: "upma",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(250, 6, 38, 8, 2.5),
    isVegetarian: true,
    isEgg: false,
    tags: ["breakfast"],
  },
  {
    id: "curd-rice",
    name: "Curd Rice",
    category: "south_indian",
    imageQuery: "curdRice",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(240, 7, 38, 6, 1),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "dinner", "cooling", "calcium"],
  },
  {
    id: "lemon-rice",
    name: "Lemon Rice",
    category: "south_indian",
    imageQuery: "lemonRice",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(280, 5, 45, 9, 1.2),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "snack"],
  },
  {
    id: "biryani",
    name: "Chicken Biryani",
    category: "south_indian",
    imageQuery: "biryani",
    defaultPortion: portion(1, "plate", "1 plate"),
    perUnitNutrition: nutrition(620, 28, 68, 22, 3),
    isVegetarian: false,
    isEgg: false,
    tags: ["lunch", "dinner", "rice", "high-protein"],
  },
  {
    id: "steamed-rice",
    name: "Steamed Rice",
    category: "south_indian",
    imageQuery: "steamedRice",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(200, 4, 44, 0.5, 0.6),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "dinner", "staple"],
  },
  {
    id: "rasam",
    name: "Rasam",
    category: "south_indian",
    imageQuery: "rasam",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(60, 2, 9, 1.5, 1),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "light"],
  },
  {
    id: "poriyal",
    name: "Vegetable Poriyal",
    category: "south_indian",
    imageQuery: "poriyal",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(90, 3, 10, 4.5, 3),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "vegetables", "fiber"],
  },
  {
    id: "curd",
    name: "Curd",
    category: "side",
    imageQuery: "curd",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(98, 5.5, 7, 5, 0),
    isVegetarian: true,
    isEgg: false,
    tags: ["calcium", "cooling"],
  },
  {
    id: "chicken-curry",
    name: "Chicken Curry",
    category: "protein",
    imageQuery: "chickenCurry",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(280, 26, 8, 17, 1.5),
    isVegetarian: false,
    isEgg: false,
    tags: ["lunch", "dinner", "high-protein"],
  },
  {
    id: "fish-fry",
    name: "Fish Fry",
    category: "protein",
    imageQuery: "fishFry",
    defaultPortion: portion(2, "piece", "2 pieces"),
    perUnitNutrition: nutrition(220, 24, 6, 11, 0.5),
    isVegetarian: false,
    isEgg: false,
    tags: ["high-protein", "omega-3"],
  },
  {
    id: "egg-boiled",
    name: "Boiled Egg",
    category: "protein",
    imageQuery: "boiledEgg",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(78, 6.3, 0.6, 5.3, 0),
    isVegetarian: false,
    isEgg: true,
    tags: ["breakfast", "high-protein"],
  },
  {
    id: "egg-omelette",
    name: "Egg Omelette",
    category: "protein",
    imageQuery: "eggOmelette",
    defaultPortion: portion(1, "piece", "2-egg omelette"),
    perUnitNutrition: nutrition(180, 13, 3, 13, 0.5),
    isVegetarian: false,
    isEgg: true,
    tags: ["breakfast", "high-protein"],
  },
  {
    id: "paneer-curry",
    name: "Paneer Curry",
    category: "protein",
    imageQuery: "paneerCurry",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(320, 16, 12, 24, 2),
    isVegetarian: true,
    isEgg: false,
    tags: ["high-protein", "vegetarian-protein"],
  },
  {
    id: "roti",
    name: "Roti",
    category: "north_indian",
    imageQuery: "roti",
    defaultPortion: portion(1, "piece", "1 piece"),
    perUnitNutrition: nutrition(104, 3, 18, 2.5, 2.2),
    isVegetarian: true,
    isEgg: false,
    tags: ["lunch", "dinner", "staple", "whole-grain"],
  },
  {
    id: "dal",
    name: "Dal Tadka",
    category: "north_indian",
    imageQuery: "dal",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(180, 9, 24, 6, 5),
    isVegetarian: true,
    isEgg: false,
    tags: ["protein-light", "lentil"],
  },
  {
    id: "sabzi",
    name: "Mixed Vegetable Sabzi",
    category: "north_indian",
    imageQuery: "sabzi",
    defaultPortion: portion(1, "bowl", "1 bowl"),
    perUnitNutrition: nutrition(130, 3.5, 15, 6, 3.5),
    isVegetarian: true,
    isEgg: false,
    tags: ["vegetables", "fiber"],
  },
  {
    id: "greek-yogurt",
    name: "Greek Yogurt",
    category: "side",
    imageQuery: "greekYogurt",
    defaultPortion: portion(1, "cup", "1 cup"),
    perUnitNutrition: nutrition(130, 18, 8, 3, 0),
    isVegetarian: true,
    isEgg: false,
    tags: ["high-protein", "snack"],
  },
  {
    id: "banana",
    name: "Banana",
    category: "fruit",
    imageQuery: "banana",
    defaultPortion: portion(1, "piece", "1 medium"),
    perUnitNutrition: nutrition(105, 1.3, 27, 0.4, 3.1),
    isVegetarian: true,
    isEgg: false,
    tags: ["snack", "potassium"],
  },
  {
    id: "cooking-oil",
    name: "Cooking Oil / Ghee",
    category: "condiment",
    imageQuery: "emptyStatePhoto",
    defaultPortion: portion(1, "serving", "estimated amount"),
    perUnitNutrition: nutrition(40, 0, 0, 4.5, 0),
    isVegetarian: true,
    isEgg: false,
    tags: ["cooking-fat", "estimate"],
  },
  {
    id: "filter-coffee",
    name: "Filter Coffee",
    category: "beverage",
    imageQuery: "filterCoffee",
    defaultPortion: portion(1, "glass", "1 glass"),
    perUnitNutrition: nutrition(70, 2, 9, 2.5, 0),
    isVegetarian: true,
    isEgg: false,
    tags: ["beverage"],
  },
];

export function findCatalogFood(id: string): CatalogFood | undefined {
  return FOOD_CATALOG.find((food) => food.id === id);
}

export function findCatalogFoodByName(name: string): CatalogFood | undefined {
  return FOOD_CATALOG.find((food) => food.name.toLowerCase() === name.toLowerCase());
}
