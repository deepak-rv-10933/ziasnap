import { create } from "zustand";
import type {
  ActivityLevel,
  DietaryPreference,
  CuisinePreference,
  Goal,
  NutrientPriority,
  PersonalDetails,
  Sex,
} from "@/types";

/**
 * Client-only draft state for the onboarding wizard. This data does not exist
 * as a persisted record until the final step submits it through
 * `POST /api/mock/onboarding` — TanStack Query owns the confirmed profile
 * from that point on, so it is intentionally not mirrored here.
 */
interface OnboardingDraft {
  personalDetails: Partial<PersonalDetails> & { sex: Sex };
  goal: Goal;
  activityLevel: ActivityLevel;
  dietaryPreference: DietaryPreference;
  cuisinePreference: CuisinePreference;
  favoriteFoods: string[];
  avoidFoods: string[];
  healthContext: string;
  nutrientPriorities: NutrientPriority[];
}

interface UserStoreState {
  draft: OnboardingDraft;
  setPersonalDetails: (details: Partial<PersonalDetails>) => void;
  setGoal: (goal: Goal) => void;
  setActivityLevel: (activityLevel: ActivityLevel) => void;
  setDietaryPreference: (preference: DietaryPreference) => void;
  setCuisinePreference: (preference: CuisinePreference) => void;
  toggleFavoriteFood: (food: string) => void;
  toggleAvoidFood: (food: string) => void;
  setHealthContext: (value: string) => void;
  toggleNutrientPriority: (priority: NutrientPriority) => void;
  resetDraft: () => void;
}

const initialDraft: OnboardingDraft = {
  personalDetails: { sex: "male" },
  goal: "lose",
  activityLevel: "moderately_active",
  dietaryPreference: "non_vegetarian",
  cuisinePreference: "south_indian",
  favoriteFoods: [],
  avoidFoods: [],
  healthContext: "",
  nutrientPriorities: [],
};

function toggleInArray<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const useUserStore = create<UserStoreState>((set) => ({
  draft: initialDraft,
  setPersonalDetails: (details) =>
    set((state) => ({ draft: { ...state.draft, personalDetails: { ...state.draft.personalDetails, ...details } } })),
  setGoal: (goal) => set((state) => ({ draft: { ...state.draft, goal } })),
  setActivityLevel: (activityLevel) => set((state) => ({ draft: { ...state.draft, activityLevel } })),
  setDietaryPreference: (dietaryPreference) =>
    set((state) => ({ draft: { ...state.draft, dietaryPreference } })),
  setCuisinePreference: (cuisinePreference) =>
    set((state) => ({ draft: { ...state.draft, cuisinePreference } })),
  toggleFavoriteFood: (food) =>
    set((state) => ({ draft: { ...state.draft, favoriteFoods: toggleInArray(state.draft.favoriteFoods, food) } })),
  toggleAvoidFood: (food) =>
    set((state) => ({ draft: { ...state.draft, avoidFoods: toggleInArray(state.draft.avoidFoods, food) } })),
  setHealthContext: (healthContext) => set((state) => ({ draft: { ...state.draft, healthContext } })),
  toggleNutrientPriority: (priority) =>
    set((state) => ({
      draft: { ...state.draft, nutrientPriorities: toggleInArray(state.draft.nutrientPriorities, priority) },
    })),
  resetDraft: () => set({ draft: initialDraft }),
}));
