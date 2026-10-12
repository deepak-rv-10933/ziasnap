import type { UserProfile } from "@/types";
import { calculateGoalTargets } from "@/lib/utils/goal-calculator";

export const MOCK_USER_ID = "user_arjun_kumar";

export const MOCK_USER_PROFILE: UserProfile = {
  id: MOCK_USER_ID,
  personalDetails: {
    name: "Arjun Kumar",
    age: 29,
    sex: "male",
    heightCm: 172,
    currentWeightKg: 72,
    targetWeightKg: 66,
  },
  goal: "lose",
  activityLevel: "moderately_active",
  nutritionPreferences: {
    dietaryPreference: "non_vegetarian",
    cuisinePreference: "south_indian",
    favoriteFoods: ["Dosa", "Chicken Curry", "Curd Rice", "Filter Coffee"],
    avoidFoods: ["Excess deep-fried snacks"],
    healthContext:
      "Family history of high cholesterol. Prefers meals with less oil and ghee where possible.",
    nutrientPriorities: ["protein", "fiber"],
  },
  onboardingCompletedAt: "2026-08-02T07:40:00.000+05:30",
  createdAt: "2026-08-02T07:40:00.000+05:30",
  updatedAt: "2026-09-10T19:05:00.000+05:30",
};

/** Derived from the mock profile using the same calculator the onboarding flow uses. */
export const MOCK_GOAL_TARGETS = calculateGoalTargets(
  MOCK_USER_PROFILE.personalDetails,
  MOCK_USER_PROFILE.goal,
  MOCK_USER_PROFILE.activityLevel,
);
