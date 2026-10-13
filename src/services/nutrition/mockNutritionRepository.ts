import type {
  DailySummary,
  FavoriteMeal,
  LoggingStreak,
  WaterDay,
  WeightEntry,
  WeightTrend,
  Meal,
  MealRecommendation,
  UserProfile,
  WeeklyInsightSummary,
} from "@/types";
import { buildDailySummary, dateKeysBetween } from "./daily-summary";
import { sumNutrition } from "@/types/nutrition";
import { calculateGoalTargets } from "@/lib/utils/goal-calculator";
import { generateId } from "@/lib/utils/id";
import { mealDateKey } from "@/types/meal";
import { MOCK_GOAL_TARGETS, MOCK_USER_PROFILE } from "@/data/mock-user";
import { MOCK_MEALS } from "@/data/mock-meals";
import { buildMockFavorites, buildMockWater, buildMockWeights, type MockWaterEntry } from "@/data/mock-tracking";
import { buildWaterDay, waterGoalMl } from "@/services/tracking/water";
import { buildWeightTrend } from "@/services/tracking/weight-trend";
import { computeStreak } from "@/services/tracking/streak";
import { buildRecommendations } from "@/services/recommendations/mockRecommendationService";
import { buildWeeklyInsights } from "@/services/insights/mockInsightsService";
import type {
  ConfirmMealInput,
  HistoryRange,
  NutritionRepository,
  ProfileUpdateInput,
  UpdateMealInput,
  UserDataExport,
  FavoriteInput,
  WaterInput,
  WeightInput,
} from "./NutritionRepository";

/** Was 250ms in Phase 1 to show off loading skeletons; the public demo runs on these routes now. */
const LATENCY_MS = 0;

function wait(ms: number) {
  return ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve();
}

interface Store {
  profile: UserProfile;
  goalTargets: ReturnType<typeof calculateGoalTargets>;
  meals: Meal[];
  water: MockWaterEntry[];
  weights: WeightEntry[];
  favorites: FavoriteMeal[];
}

const globalForStore = globalThis as unknown as { __ziaSnapStore?: Store };

function createStore(): Store {
  return {
    profile: structuredClone(MOCK_USER_PROFILE),
    goalTargets: structuredClone(MOCK_GOAL_TARGETS),
    meals: structuredClone(MOCK_MEALS),
    water: buildMockWater(),
    weights: buildMockWeights(),
    favorites: buildMockFavorites(),
  };
}

/** Module-level singleton so mock data survives across route handler calls
 * within the same dev/server process. Resets on server restart by design —
 * this is a Phase 1 mock, not a real datastore. */
const store: Store = globalForStore.__ziaSnapStore ?? createStore();
globalForStore.__ziaSnapStore = store;

function buildDayFromStore(dateKey: string): DailySummary {
  const dayMeals = store.meals.filter((meal) => mealDateKey(meal) === dateKey);
  return buildDailySummary(dayMeals, dateKey, store.goalTargets);
}

class MockNutritionRepository implements NutritionRepository {
  async getProfile(userId: string): Promise<UserProfile> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return structuredClone(store.profile);
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<UserProfile> {
    await wait(LATENCY_MS);
    assertUser(userId);
    store.profile = {
      ...store.profile,
      personalDetails: { ...store.profile.personalDetails, ...input.personalDetails },
      goal: input.goal ?? store.profile.goal,
      activityLevel: input.activityLevel ?? store.profile.activityLevel,
      nutritionPreferences: {
        ...store.profile.nutritionPreferences,
        ...input.nutritionPreferences,
      },
      onboardingCompletedAt: input.completeOnboarding
        ? new Date().toISOString()
        : store.profile.onboardingCompletedAt,
      updatedAt: new Date().toISOString(),
    };
    return structuredClone(store.profile);
  }

  async getGoalTargets(userId: string): Promise<Store["goalTargets"]> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return structuredClone(store.goalTargets);
  }

  async recalculateGoalTargets(userId: string): Promise<Store["goalTargets"]> {
    await wait(LATENCY_MS);
    assertUser(userId);
    store.goalTargets = calculateGoalTargets(
      store.profile.personalDetails,
      store.profile.goal,
      store.profile.activityLevel,
    );
    return structuredClone(store.goalTargets);
  }

  async getDailySummary(userId: string, dateKey: string): Promise<DailySummary> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return buildDayFromStore(dateKey);
  }

  async getHistory(userId: string, range: HistoryRange): Promise<DailySummary[]> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return dateKeysBetween(range.startDateKey, range.endDateKey).map(buildDayFromStore);
  }

  async getMeal(userId: string, mealId: string): Promise<Meal | undefined> {
    await wait(LATENCY_MS);
    assertUser(userId);
    const meal = store.meals.find((item) => item.id === mealId);
    return meal ? structuredClone(meal) : undefined;
  }

  async confirmMeal(input: ConfirmMealInput): Promise<Meal> {
    await wait(LATENCY_MS);
    assertUser(input.userId);
    const meal: Meal = {
      id: generateId("meal"),
      userId: input.userId,
      type: input.type,
      source: input.source,
      photoUrl: input.photoUrl,
      items: input.items,
      totalNutrition: sumNutrition(input.items.map((item) => item.nutrition)),
      notes: input.notes,
      loggedAt: input.loggedAt ?? new Date().toISOString(),
      dateKey: input.dateKey,
      confirmedAt: new Date().toISOString(),
      analysisId: input.analysisId,
    };
    store.meals.push(meal);
    return structuredClone(meal);
  }

  async updateMeal(userId: string, mealId: string, input: UpdateMealInput): Promise<Meal> {
    await wait(LATENCY_MS);
    assertUser(userId);
    const index = store.meals.findIndex((meal) => meal.id === mealId);
    if (index === -1) throw new Error(`Meal not found: ${mealId}`);
    const existing = store.meals[index];
    const items = input.items ?? existing.items;
    const updated: Meal = {
      ...existing,
      type: input.type ?? existing.type,
      items,
      notes: input.notes ?? existing.notes,
      totalNutrition: sumNutrition(items.map((item) => item.nutrition)),
    };
    store.meals[index] = updated;
    return structuredClone(updated);
  }

  async deleteMeal(userId: string, mealId: string): Promise<void> {
    await wait(LATENCY_MS);
    assertUser(userId);
    store.meals = store.meals.filter((meal) => meal.id !== mealId);
  }

  async getRecommendations(userId: string, todayDateKey: string): Promise<MealRecommendation[]> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return buildRecommendations(store.profile, buildDayFromStore(todayDateKey));
  }

  async getInsights(userId: string, weekStartDateKey: string): Promise<WeeklyInsightSummary> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return buildWeeklyInsights(store.meals, store.goalTargets, weekStartDateKey);
  }

  async exportUserData(userId: string): Promise<UserDataExport> {
    await wait(LATENCY_MS);
    assertUser(userId);
    return structuredClone({
      exportedAt: new Date().toISOString(),
      profile: store.profile,
      goalTargets: store.goalTargets,
      meals: store.meals,
      weightLogs: store.weights.map(({ dateKey, weightKg }) => ({ dateKey, weightKg })),
      waterLogs: store.water.map(({ dateKey, amountMl, loggedAt }) => ({ dateKey, amountMl, loggedAt })),
      favorites: store.favorites.map(({ name, mealType, items }) => ({ name, mealType, items })),
      foodCorrections: [],
    });
  }

  // ------------------------------------------------------------ trackers

  private waterDay(dateKey: string): WaterDay {
    const entries = store.water.filter((entry) => entry.dateKey === dateKey).map(({ id, amountMl, loggedAt }) => ({ id, amountMl, loggedAt }));
    return buildWaterDay(dateKey, entries, waterGoalMl(store.profile.personalDetails.currentWeightKg));
  }

  async getWaterDay(userId: string, dateKey: string): Promise<WaterDay> {
    assertUser(userId);
    return this.waterDay(dateKey);
  }

  async addWater(userId: string, input: WaterInput): Promise<WaterDay> {
    assertUser(userId);
    store.water.push({ id: generateId("water"), dateKey: input.dateKey, amountMl: input.amountMl, loggedAt: new Date().toISOString() });
    return this.waterDay(input.dateKey);
  }

  async removeWater(userId: string, entryId: string): Promise<void> {
    assertUser(userId);
    store.water = store.water.filter((entry) => entry.id !== entryId);
  }

  async getWeightTrend(userId: string, todayDateKey: string): Promise<WeightTrend> {
    assertUser(userId);
    return buildWeightTrend(store.weights, store.profile.personalDetails.targetWeightKg, todayDateKey);
  }

  async logWeight(userId: string, input: WeightInput, todayDateKey: string): Promise<WeightTrend> {
    assertUser(userId);
    store.weights = store.weights.filter((entry) => entry.dateKey !== input.dateKey);
    store.weights.push({ id: generateId("weight"), dateKey: input.dateKey, weightKg: input.weightKg });
    const latest = [...store.weights].sort((a, b) => b.dateKey.localeCompare(a.dateKey))[0];
    store.profile.personalDetails.currentWeightKg = latest.weightKg;
    return this.getWeightTrend(userId, todayDateKey);
  }

  async deleteWeight(userId: string, entryId: string): Promise<void> {
    assertUser(userId);
    store.weights = store.weights.filter((entry) => entry.id !== entryId);
  }

  async listFavorites(userId: string): Promise<FavoriteMeal[]> {
    assertUser(userId);
    return structuredClone(store.favorites);
  }

  async saveFavorite(userId: string, input: FavoriteInput): Promise<FavoriteMeal> {
    assertUser(userId);
    const favorite: FavoriteMeal = {
      id: generateId("fav"),
      name: input.name,
      mealType: input.mealType,
      items: input.items,
      totalNutrition: sumNutrition(input.items.map((item) => item.nutrition)),
    };
    store.favorites.push(favorite);
    return structuredClone(favorite);
  }

  async deleteFavorite(userId: string, favoriteId: string): Promise<void> {
    assertUser(userId);
    store.favorites = store.favorites.filter((favorite) => favorite.id !== favoriteId);
  }

  async getStreak(userId: string, todayDateKey: string): Promise<LoggingStreak> {
    assertUser(userId);
    return computeStreak(store.meals.filter((meal) => meal.confirmedAt).map(mealDateKey), todayDateKey);
  }

  /** Mock "deletion" restores the seeded demo data so the preview keeps working. */
  async deleteUserData(userId: string): Promise<void> {
    await wait(LATENCY_MS);
    assertUser(userId);
    Object.assign(store, createStore());
  }
}

function assertUser(userId: string) {
  if (userId !== store.profile.id) {
    throw new Error(`Unknown user: ${userId}`);
  }
}

export const nutritionRepository: NutritionRepository = new MockNutritionRepository();

/** Snapshot / restore for the in-browser demo backend, which keeps the store in localStorage. */
export function snapshotMockStore(): string {
  return JSON.stringify(store);
}

export function restoreMockStore(serialized: string) {
  Object.assign(store, JSON.parse(serialized) as Store);
}
