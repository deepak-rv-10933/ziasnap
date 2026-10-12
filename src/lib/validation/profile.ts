import { z } from "zod";

export const personalDetailsSchema = z.object({
  age: z.coerce.number().int().min(13, "Must be at least 13").max(100, "Enter a valid age"),
  sex: z.enum(["male", "female", "other"]),
  heightCm: z.coerce.number().min(100, "Enter a valid height").max(230, "Enter a valid height"),
  currentWeightKg: z.coerce.number().min(30, "Enter a valid weight").max(250, "Enter a valid weight"),
  targetWeightKg: z.coerce.number().min(30, "Enter a valid weight").max(250, "Enter a valid weight"),
});

export const goalSetupSchema = z.object({
  goal: z.enum(["lose", "gain", "maintain"]),
  activityLevel: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extremely_active",
  ]),
});

export const nutritionPreferencesSchema = z.object({
  dietaryPreference: z.enum(["vegetarian", "eggitarian", "non_vegetarian"]),
  cuisinePreference: z.enum(["south_indian", "north_indian", "indo_chinese", "global", "mixed"]),
  favoriteFoods: z.array(z.string()).default([]),
  avoidFoods: z.array(z.string()).default([]),
  healthContext: z.string().max(500, "Keep this under 500 characters").optional(),
  nutrientPriorities: z
    .array(z.enum(["protein", "fiber", "iron", "calcium", "low_sodium", "low_sugar", "low_gi"]))
    .default([]),
});

export type PersonalDetailsFormValues = z.infer<typeof personalDetailsSchema>;
export type GoalSetupFormValues = z.infer<typeof goalSetupSchema>;
export type NutritionPreferencesFormValues = z.infer<typeof nutritionPreferencesSchema>;
