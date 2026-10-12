export type Sex = "male" | "female" | "other";

export type Goal = "lose" | "gain" | "maintain";

export type ActivityLevel =
  | "sedentary"
  | "lightly_active"
  | "moderately_active"
  | "very_active"
  | "extremely_active";

export type DietaryPreference = "vegetarian" | "eggitarian" | "non_vegetarian";

export type CuisinePreference =
  | "south_indian"
  | "north_indian"
  | "indo_chinese"
  | "global"
  | "mixed";

/**
 * Optional nutrient a user wants ZiaSnap to pay closer attention to.
 * This is dietary context only — never a medical diagnosis input.
 */
export type NutrientPriority =
  | "protein"
  | "fiber"
  | "iron"
  | "calcium"
  | "low_sodium"
  | "low_sugar"
  | "low_gi";

export interface PersonalDetails {
  name: string;
  age: number;
  sex: Sex;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
}

export interface NutritionPreferences {
  dietaryPreference: DietaryPreference;
  cuisinePreference: CuisinePreference;
  favoriteFoods: string[];
  avoidFoods: string[];
  /** Free-text dietary/health context supplied by the user — never diagnostic. */
  healthContext?: string;
  nutrientPriorities: NutrientPriority[];
}

export interface UserProfile {
  id: string;
  personalDetails: PersonalDetails;
  goal: Goal;
  activityLevel: ActivityLevel;
  nutritionPreferences: NutritionPreferences;
  onboardingCompletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/** The signed-in account (from Catalyst Authentication), separate from the nutrition profile. */
export interface AccountInfo {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}
