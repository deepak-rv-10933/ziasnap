import type { ConfidenceLevel, MealType } from "@/types";

export interface MealTemplateItem {
  catalogId: string;
  quantity?: number;
  confidence: ConfidenceLevel;
  preparationNote?: string;
}

export interface MealTemplate {
  id: string;
  mealType: MealType;
  photoKey: string;
  isVegetarian: boolean;
  items: MealTemplateItem[];
}

/**
 * Realistic, recurring Indian/South Indian plate combinations. These back
 * both the mock Zia analysis (what gets "detected" from a photo) and the
 * seeded meal history, so a photo of "idli + sambar + chutney + eggs" always
 * resolves to the same believable set of items.
 */
export const MEAL_TEMPLATES: MealTemplate[] = [
  {
    id: "idli-sambar-egg",
    mealType: "breakfast",
    photoKey: "idli",
    isVegetarian: false,
    items: [
      { catalogId: "idli", quantity: 3, confidence: "high" },
      { catalogId: "sambar", quantity: 1, confidence: "high" },
      { catalogId: "coconut-chutney", quantity: 2, confidence: "medium" },
      { catalogId: "egg-boiled", quantity: 2, confidence: "high" },
    ],
  },
  {
    id: "masala-dosa-chutney",
    mealType: "breakfast",
    photoKey: "masalaDosa",
    isVegetarian: true,
    items: [
      { catalogId: "masala-dosa", quantity: 1, confidence: "high" },
      { catalogId: "sambar", quantity: 1, confidence: "medium" },
      { catalogId: "coconut-chutney", quantity: 2, confidence: "medium" },
      {
        catalogId: "cooking-oil",
        quantity: 1,
        confidence: "low",
        preparationNote: "Dosa looks pan-roasted with a moderate amount of oil",
      },
    ],
  },
  {
    id: "pongal-vada",
    mealType: "breakfast",
    photoKey: "pongal",
    isVegetarian: true,
    items: [
      { catalogId: "pongal", quantity: 1, confidence: "high" },
      { catalogId: "vada", quantity: 2, confidence: "high" },
      { catalogId: "coconut-chutney", quantity: 2, confidence: "medium" },
    ],
  },
  {
    id: "upma-coffee",
    mealType: "breakfast",
    photoKey: "upma",
    isVegetarian: true,
    items: [
      { catalogId: "upma", quantity: 1, confidence: "high" },
      { catalogId: "filter-coffee", quantity: 1, confidence: "high" },
    ],
  },
  {
    id: "egg-omelette-roti",
    mealType: "breakfast",
    photoKey: "eggOmelette",
    isVegetarian: false,
    items: [
      { catalogId: "egg-omelette", quantity: 1, confidence: "high" },
      { catalogId: "roti", quantity: 2, confidence: "high" },
    ],
  },
  {
    id: "sambar-rice-thali",
    mealType: "lunch",
    photoKey: "southIndianThali",
    isVegetarian: false,
    items: [
      { catalogId: "steamed-rice", quantity: 1, confidence: "high" },
      { catalogId: "sambar", quantity: 1, confidence: "high" },
      { catalogId: "poriyal", quantity: 1, confidence: "medium" },
      { catalogId: "rasam", quantity: 1, confidence: "medium" },
      { catalogId: "curd", quantity: 1, confidence: "high" },
      { catalogId: "chicken-curry", quantity: 1, confidence: "high" },
    ],
  },
  {
    id: "curd-rice-lunch",
    mealType: "lunch",
    photoKey: "curdRice",
    isVegetarian: true,
    items: [
      { catalogId: "curd-rice", quantity: 1, confidence: "high" },
      { catalogId: "poriyal", quantity: 1, confidence: "medium" },
      {
        catalogId: "cooking-oil",
        quantity: 1,
        confidence: "low",
        preparationNote: "Tempering oil estimated from the tadka",
      },
    ],
  },
  {
    id: "biryani-lunch",
    mealType: "lunch",
    photoKey: "biryani",
    isVegetarian: false,
    items: [
      { catalogId: "biryani", quantity: 1, confidence: "medium" },
      { catalogId: "curd", quantity: 1, confidence: "high" },
    ],
  },
  {
    id: "roti-dal-sabzi",
    mealType: "dinner",
    photoKey: "dal",
    isVegetarian: true,
    items: [
      { catalogId: "roti", quantity: 3, confidence: "high" },
      { catalogId: "dal", quantity: 1, confidence: "high" },
      { catalogId: "sabzi", quantity: 1, confidence: "medium" },
    ],
  },
  {
    id: "dosa-veg-sambar-paneer",
    mealType: "dinner",
    photoKey: "vegetableDosa",
    isVegetarian: true,
    items: [
      { catalogId: "vegetable-dosa", quantity: 1, confidence: "high" },
      { catalogId: "sambar", quantity: 1, confidence: "medium" },
      { catalogId: "paneer-curry", quantity: 1, confidence: "medium" },
    ],
  },
  {
    id: "fish-fry-rice",
    mealType: "dinner",
    photoKey: "fishFry",
    isVegetarian: false,
    items: [
      { catalogId: "steamed-rice", quantity: 1, confidence: "high" },
      { catalogId: "fish-fry", quantity: 1, confidence: "high" },
      { catalogId: "rasam", quantity: 1, confidence: "medium" },
    ],
  },
  {
    id: "banana-yogurt-snack",
    mealType: "snack",
    photoKey: "greekYogurt",
    isVegetarian: true,
    items: [
      { catalogId: "banana", quantity: 1, confidence: "high" },
      { catalogId: "greek-yogurt", quantity: 1, confidence: "high" },
    ],
  },
  {
    id: "lemon-rice-snack",
    mealType: "snack",
    photoKey: "lemonRice",
    isVegetarian: true,
    items: [{ catalogId: "lemon-rice", quantity: 1, confidence: "medium" }],
  },
];

export function templatesFor(mealType: MealType, isVegetarianOnly: boolean): MealTemplate[] {
  return MEAL_TEMPLATES.filter(
    (template) => template.mealType === mealType && (!isVegetarianOnly || template.isVegetarian),
  );
}
