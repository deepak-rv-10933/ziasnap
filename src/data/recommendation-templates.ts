import type { NutrientPriority, RecommendationReasonTag } from "@/types";

export interface RecommendationTemplateItem {
  catalogId: string;
  quantity?: number;
}

export interface RecommendationTemplate {
  id: string;
  name: string;
  description: string;
  photoKey: string;
  cuisine: "south_indian" | "north_indian" | "indo_chinese" | "global";
  isVegetarian: boolean;
  containsEgg: boolean;
  items: RecommendationTemplateItem[];
  addressesNutrientPriorities: NutrientPriority[];
  baseReasonTags: RecommendationReasonTag[];
}

export const RECOMMENDATION_TEMPLATES: RecommendationTemplate[] = [
  {
    id: "idli-sambar-eggs",
    name: "2 Idlis + Sambar + Curd + 2 Eggs",
    description: "A light, protein-forward plate that's easy on digestion and quick to put together.",
    photoKey: "idli",
    cuisine: "south_indian",
    isVegetarian: false,
    containsEgg: true,
    items: [
      { catalogId: "idli", quantity: 2 },
      { catalogId: "sambar", quantity: 1 },
      { catalogId: "curd", quantity: 1 },
      { catalogId: "egg-boiled", quantity: 2 },
    ],
    addressesNutrientPriorities: ["protein", "calcium"],
    baseReasonTags: ["high_protein", "cuisine_match"],
  },
  {
    id: "vegetable-dosa-sambar",
    name: "Vegetable Dosa + Sambar",
    description: "A filling, fibre-rich option built around vegetables and lentils.",
    photoKey: "vegetableDosa",
    cuisine: "south_indian",
    isVegetarian: true,
    containsEgg: false,
    items: [
      { catalogId: "vegetable-dosa", quantity: 1 },
      { catalogId: "sambar", quantity: 1 },
    ],
    addressesNutrientPriorities: ["fiber"],
    baseReasonTags: ["cuisine_match"],
  },
  {
    id: "paneer-roti-vegetable",
    name: "Paneer + Roti + Vegetable Sabzi",
    description: "A vegetarian-protein plate with whole-wheat roti and a fibre-rich side.",
    photoKey: "paneerCurry",
    cuisine: "north_indian",
    isVegetarian: true,
    containsEgg: false,
    items: [
      { catalogId: "paneer-curry", quantity: 1 },
      { catalogId: "roti", quantity: 2 },
      { catalogId: "sabzi", quantity: 1 },
    ],
    addressesNutrientPriorities: ["protein", "fiber"],
    baseReasonTags: ["high_protein"],
  },
  {
    id: "curd-rice-protein-side",
    name: "Curd Rice + Grilled Fish",
    description: "A cooling, calcium-rich base paired with a lean protein side.",
    photoKey: "curdRice",
    cuisine: "south_indian",
    isVegetarian: false,
    containsEgg: false,
    items: [
      { catalogId: "curd-rice", quantity: 1 },
      { catalogId: "fish-fry", quantity: 1 },
    ],
    addressesNutrientPriorities: ["protein", "calcium"],
    baseReasonTags: ["high_protein", "cuisine_match"],
  },
  {
    id: "greek-yogurt-banana-bowl",
    name: "Greek Yogurt + Banana Bowl",
    description: "A quick, high-protein snack that also tops up potassium.",
    photoKey: "greekYogurt",
    cuisine: "global",
    isVegetarian: true,
    containsEgg: false,
    items: [
      { catalogId: "greek-yogurt", quantity: 1 },
      { catalogId: "banana", quantity: 1 },
    ],
    addressesNutrientPriorities: ["protein"],
    baseReasonTags: ["high_protein"],
  },
  {
    id: "chicken-curry-rice-rasam",
    name: "Chicken Curry + Rice + Rasam",
    description: "A satisfying, high-protein South Indian plate for a bigger remaining budget.",
    photoKey: "chickenCurry",
    cuisine: "south_indian",
    isVegetarian: false,
    containsEgg: false,
    items: [
      { catalogId: "chicken-curry", quantity: 1 },
      { catalogId: "steamed-rice", quantity: 1 },
      { catalogId: "rasam", quantity: 1 },
    ],
    addressesNutrientPriorities: ["protein"],
    baseReasonTags: ["high_protein", "cuisine_match"],
  },
  {
    id: "egg-omelette-roti-light",
    name: "2-Egg Omelette + Roti",
    description: "A fast, protein-dense option that works any time of day.",
    photoKey: "eggOmelette",
    cuisine: "north_indian",
    isVegetarian: false,
    containsEgg: true,
    items: [
      { catalogId: "egg-omelette", quantity: 1 },
      { catalogId: "roti", quantity: 2 },
    ],
    addressesNutrientPriorities: ["protein"],
    baseReasonTags: ["high_protein"],
  },
  {
    id: "dal-roti-light",
    name: "Dal Tadka + 2 Roti",
    description: "A simple, fibre- and plant-protein-rich vegetarian option.",
    photoKey: "dal",
    cuisine: "north_indian",
    isVegetarian: true,
    containsEgg: false,
    items: [
      { catalogId: "dal", quantity: 1 },
      { catalogId: "roti", quantity: 2 },
    ],
    addressesNutrientPriorities: ["fiber", "protein"],
    baseReasonTags: ["cuisine_match"],
  },
];
