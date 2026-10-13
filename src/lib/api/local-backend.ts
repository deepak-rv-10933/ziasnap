import { nutritionRepository as repo, restoreMockStore, snapshotMockStore } from "@/services/nutrition/mockNutritionRepository";
import { ziaMealAnalysisService } from "@/services/zia/mockZiaMealAnalysisService";
import { MOCK_USER_ID } from "@/data/mock-user";
import { daysAgoKey, toDateKey } from "@/lib/utils/date";
import type {
  ConfirmMealInput,
  FavoriteInput,
  ProfileUpdateInput,
  UpdateMealInput,
  WaterInput,
  WeightInput,
} from "@/services/nutrition/NutritionRepository";
import type { MealType } from "@/types";

/**
 * The demo account's backend, running in the visitor's own browser. The app
 * is a static site, so there's no server to hold sample data: requests that
 * would go to `/api/mock/*` are answered here, instantly and offline, and the
 * store is kept in localStorage so a visitor's changes survive a reload.
 * Each visitor gets a private copy, re-seeded fresh on a new day so "today"
 * always has sample meals.
 */

const STORAGE_KEY = "ziasnap.demoStore.v2";
const userId = MOCK_USER_ID;
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as { day: string; store: string } | null;
    if (saved?.day === toDateKey(new Date())) restoreMockStore(saved.store);
  } catch {
    /* corrupt or blocked storage: start from the fresh seed */
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ day: toDateKey(new Date()), store: snapshotMockStore() }));
  } catch {
    /* storage full (large photos in a local mock build) or blocked: keep it in memory */
  }
}

export function resetLocalBackend() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to clear */
  }
}

export class LocalBackendError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function localBackend<T>(path: string, init?: RequestInit): Promise<T> {
  load();
  const url = new URL(path.replace(/^\/api\/mock/, ""), "http://local");
  const method = (init?.method ?? "GET").toUpperCase();
  const route = url.pathname.replace(/\/+$/, "") || "/";
  const q = url.searchParams;
  const body = <B>() => (init?.body ? (JSON.parse(String(init.body)) as B) : ({} as B));
  const today = q.get("date") ?? toDateKey(new Date());

  const result = await (async (): Promise<unknown> => {
    const key = `${method} ${route}`;
    switch (key) {
      case "GET /me":
        return { userId, email: "arjun@example.com", firstName: "Arjun", lastName: "Kumar" };
      case "GET /profile":
        return repo.getProfile(userId);
      case "PATCH /profile":
        return repo.updateProfile(userId, body<ProfileUpdateInput>());
      case "POST /onboarding": {
        const profile = await repo.updateProfile(userId, { ...body<ProfileUpdateInput>(), completeOnboarding: true });
        return { profile, targets: await repo.recalculateGoalTargets(userId) };
      }
      case "GET /goals":
        return repo.getGoalTargets(userId);
      case "POST /goals":
        return repo.recalculateGoalTargets(userId);
      case "GET /today":
        return repo.getDailySummary(userId, today);
      case "GET /history":
        return repo.getHistory(userId, { startDateKey: q.get("start") ?? daysAgoKey(13), endDateKey: q.get("end") ?? today });
      case "GET /insights":
        return repo.getInsights(userId, q.get("weekStart") ?? daysAgoKey(6));
      case "GET /recommendations":
        return repo.getRecommendations(userId, today);
      case "POST /meal/analyze": {
        const input = body<{ imageDataUrl: string; mealType?: MealType; notes?: string }>();
        const profile = await repo.getProfile(userId);
        return ziaMealAnalysisService.analyze({
          imageDataUrl: input.imageDataUrl,
          userContext: {
            dietaryPreference: profile.nutritionPreferences.dietaryPreference,
            cuisinePreference: profile.nutritionPreferences.cuisinePreference,
          },
          mealContext: { mealType: input.mealType, notes: input.notes },
        });
      }
      case "POST /meal/confirm":
        return repo.confirmMeal({ ...body<Omit<ConfirmMealInput, "userId">>(), userId });
      case "GET /water":
        return repo.getWaterDay(userId, today);
      case "POST /water":
        return repo.addWater(userId, body<WaterInput>());
      case "GET /weight":
        return repo.getWeightTrend(userId, today);
      case "POST /weight":
        return repo.logWeight(userId, body<WeightInput>(), today);
      case "GET /favorites":
        return repo.listFavorites(userId);
      case "POST /favorites":
        return repo.saveFavorite(userId, body<FavoriteInput>());
      case "GET /streak":
        return repo.getStreak(userId, today);
      case "GET /export":
        return repo.exportUserData(userId);
      case "DELETE /account":
        await repo.deleteUserData(userId);
        resetLocalBackend();
        return { success: true };
    }

    const meal = /^\/meal\/([\w-]+)$/.exec(route);
    if (meal) {
      if (method === "GET") {
        const found = await repo.getMeal(userId, meal[1]);
        if (!found) throw new LocalBackendError("Meal not found", 404);
        return found;
      }
      if (method === "PATCH") return repo.updateMeal(userId, meal[1], body<UpdateMealInput>());
      if (method === "DELETE") {
        await repo.deleteMeal(userId, meal[1]);
        return { success: true };
      }
    }
    const tracker = /^\/(water|weight|favorites)\/([\w-]+)$/.exec(route);
    if (tracker && method === "DELETE") {
      const [, kind, id] = tracker;
      if (kind === "water") await repo.removeWater(userId, id);
      else if (kind === "weight") await repo.deleteWeight(userId, id);
      else await repo.deleteFavorite(userId, id);
      return { success: true };
    }
    throw new LocalBackendError(`No demo route for ${key}`, 404);
  })();

  if (method !== "GET") save();
  // Hand back a copy, like a network response would, so callers can't mutate the store.
  return structuredClone(result) as T;
}
