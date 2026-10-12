import type {
  AccountInfo,
  DailySummary,
  GoalTargets,
  Meal,
  MealRecommendation,
  MealType,
  UserProfile,
  WeeklyInsightSummary,
} from "@/types";
import type { ZiaMealAnalysisResult } from "@/types/zia";
import type {
  ConfirmMealInput,
  ProfileUpdateInput,
  UpdateMealInput,
  UserDataExport,
} from "@/services/nutrition/NutritionRepository";
import {
  API_BASE_URL,
  clearAuthToken,
  getAuthToken,
  isDemoMode,
  isRealBackendActive,
  redirectToLogin,
} from "@/lib/catalyst/web-sdk";
import { daysAgoKey, toDateKey } from "@/lib/utils/date";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Every call is written against the mock route path (`/api/mock/...`). With
 * the real backend configured, the same path is sent to the `ziasnap-api`
 * function instead, with the signed-in user's token attached.
 */
async function request<T>(
  path: string,
  init?: RequestInit,
  options: { auth?: boolean; forceRealBackend?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const useRealBackend = options.forceRealBackend || isRealBackendActive();
  let url = path;
  if (useRealBackend) {
    url = `${API_BASE_URL}${path.replace(/^\/api\/mock/, "")}`;
    if (options.auth !== false) headers.Authorization = await getAuthToken();
  }

  const response = await fetch(url, { ...init, headers: { ...headers, ...init?.headers } });
  if (response.status === 401 && useRealBackend && options.auth !== false) {
    clearAuthToken();
    redirectToLogin();
    throw new ApiError("Your session ended — please sign in again.", 401);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request to ${path} failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}

const today = () => toDateKey(new Date());

const ANALYSIS_POLL_MS = 2000;
const ANALYSIS_TIMEOUT_MS = 100_000;

export const api = {
  getMe: () => request<AccountInfo>("/api/mock/me"),

  getProfile: () => request<UserProfile>("/api/mock/profile"),
  updateProfile: (input: ProfileUpdateInput) =>
    request<UserProfile>("/api/mock/profile", { method: "PATCH", body: JSON.stringify(input) }),

  submitOnboarding: (input: ProfileUpdateInput) =>
    request<{ profile: UserProfile; targets: GoalTargets }>("/api/mock/onboarding", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  getGoalTargets: () => request<GoalTargets>("/api/mock/goals"),
  recalculateGoalTargets: () => request<GoalTargets>("/api/mock/goals", { method: "POST" }),

  getToday: (dateKey?: string) => request<DailySummary>(`/api/mock/today?date=${dateKey ?? today()}`),

  getHistory: (startDateKey?: string, endDateKey?: string) => {
    const end = endDateKey ?? today();
    const start = startDateKey ?? daysAgoKey(13, new Date(`${end}T12:00:00`));
    return request<DailySummary[]>(`/api/mock/history?start=${start}&end=${end}`);
  },

  getInsights: (weekStartDateKey?: string) =>
    request<WeeklyInsightSummary>(`/api/mock/insights?weekStart=${weekStartDateKey ?? daysAgoKey(6)}`),

  getRecommendations: () => request<MealRecommendation[]>(`/api/mock/recommendations?date=${today()}`),

  /**
   * Starts Zia's analysis and resolves with the finished result. A photo
   * takes ~20–25s, longer than one backend request may run, so the real
   * backend answers "analyzing" straight away and this polls until done.
   * `guest` uses the public, nothing-stored analyzer (real backend only).
   */
  analyzeMeal: async ({
    guest,
    ...input
  }: {
    imageDataUrl: string;
    mealType?: MealType;
    notes?: string;
    guest?: boolean;
  }): Promise<ZiaMealAnalysisResult> => {
    // The public demo has no account but still gets a real Zia analysis.
    const asGuest = isDemoMode() || Boolean(guest && isRealBackendActive());
    const basePath = asGuest ? "/api/mock/guest/analyze" : "/api/mock/meal/analyze";
    const auth = asGuest ? { auth: false, forceRealBackend: true } : {};

    const started = await request<ZiaMealAnalysisResult>(
      basePath,
      { method: "POST", body: JSON.stringify(asGuest ? { imageDataUrl: input.imageDataUrl } : input) },
      auth,
    );
    if (started.status === "completed") return started;

    const deadline = Date.now() + ANALYSIS_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, ANALYSIS_POLL_MS));
      const current = await request<ZiaMealAnalysisResult>(
        `${basePath}/${encodeURIComponent(started.analysisId)}`,
        undefined,
        auth,
      );
      if (current.status === "completed") return current;
    }
    throw new ApiError("Zia is taking longer than usual — please try again.", 504);
  },

  confirmMeal: (input: Omit<ConfirmMealInput, "userId">) => {
    const loggedAt = input.loggedAt ?? new Date().toISOString();
    return request<Meal>("/api/mock/meal/confirm", {
      method: "POST",
      body: JSON.stringify({ ...input, loggedAt, dateKey: input.dateKey ?? toDateKey(new Date(loggedAt)) }),
    });
  },

  getMeal: (id: string) => request<Meal>(`/api/mock/meal/${id}`),

  updateMeal: (id: string, input: UpdateMealInput) =>
    request<Meal>(`/api/mock/meal/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deleteMeal: (id: string) => request<{ success: boolean }>(`/api/mock/meal/${id}`, { method: "DELETE" }),

  exportData: () => request<UserDataExport>("/api/mock/export"),

  deleteAccount: () => request<{ success: boolean }>("/api/mock/account", { method: "DELETE" }),
};
