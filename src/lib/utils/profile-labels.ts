import type { ActivityLevel, CuisinePreference, DietaryPreference } from "@/types";

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentary: "Sedentary",
  lightly_active: "Lightly active",
  moderately_active: "Moderately active",
  very_active: "Very active",
  extremely_active: "Extremely active",
};

export const DIETARY_LABEL: Record<DietaryPreference, string> = {
  vegetarian: "Vegetarian",
  eggitarian: "Eggitarian",
  non_vegetarian: "Non-vegetarian",
};

export const CUISINE_LABEL: Record<CuisinePreference, string> = {
  south_indian: "South Indian",
  north_indian: "North Indian",
  indo_chinese: "Indo-Chinese",
  global: "Global",
  mixed: "A mix of everything",
};
