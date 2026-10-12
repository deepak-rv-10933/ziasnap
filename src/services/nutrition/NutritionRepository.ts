import type {
  DailySummary,
  GoalTargets,
  Meal,
  MealRecommendation,
  MealType,
  NutritionPreferences,
  UserProfile,
  WeeklyInsightSummary,
} from "@/types";
import type { FoodItem } from "@/types";

export interface ProfileUpdateInput {
  personalDetails?: Partial<UserProfile["personalDetails"]>;
  goal?: UserProfile["goal"];
  activityLevel?: UserProfile["activityLevel"];
  nutritionPreferences?: Partial<NutritionPreferences>;
  completeOnboarding?: boolean;
}

export interface ConfirmMealInput {
  userId: string;
  type: MealType;
  source: Meal["source"];
  /** Inline photo (data URL) — kept by the mock repository only. The real backend never stores photos. */
  photoUrl?: string;
  /** The user's local calendar day for this meal (YYYY-MM-DD). The backend runs in UTC, so the
   * client — which knows the user's timezone — decides which day a meal belongs to. */
  dateKey?: string;
  items: FoodItem[];
  notes?: string;
  analysisId?: string;
  loggedAt?: string;
}

export interface UpdateMealInput {
  type?: MealType;
  items?: FoodItem[];
  notes?: string;
}

export interface HistoryRange {
  startDateKey: string;
  endDateKey: string;
}

/** Everything ZiaSnap stores for one user — the payload behind "Export my data". */
export interface UserDataExport {
  exportedAt: string;
  profile: UserProfile;
  goalTargets: GoalTargets;
  meals: Meal[];
  weightLogs: { dateKey: string; weightKg: number }[];
  waterLogs: { dateKey: string; amountMl: number }[];
  favorites: { name: string; mealType?: MealType; items: FoodItem[] }[];
  foodCorrections: { detectedName: string; correctedName: string; item: FoodItem }[];
}

/**
 * Typed boundary between the API surface and storage. Two implementations:
 * the in-memory mock (mockNutritionRepository.ts, used by the Next.js mock
 * routes for local UI work) and the Catalyst Data Store one that runs inside
 * the `ziasnap-api` function. Meal reads/writes take the owner's userId so a
 * meal id alone can never reach another user's data.
 */
export interface NutritionRepository {
  getProfile(userId: string): Promise<UserProfile>;
  updateProfile(userId: string, input: ProfileUpdateInput): Promise<UserProfile>;

  getGoalTargets(userId: string): Promise<GoalTargets>;
  recalculateGoalTargets(userId: string): Promise<GoalTargets>;

  getDailySummary(userId: string, dateKey: string): Promise<DailySummary>;
  getHistory(userId: string, range: HistoryRange): Promise<DailySummary[]>;

  getMeal(userId: string, mealId: string): Promise<Meal | undefined>;
  confirmMeal(input: ConfirmMealInput): Promise<Meal>;
  updateMeal(userId: string, mealId: string, input: UpdateMealInput): Promise<Meal>;
  deleteMeal(userId: string, mealId: string): Promise<void>;

  getRecommendations(userId: string, todayDateKey: string): Promise<MealRecommendation[]>;
  getInsights(userId: string, weekStartDateKey: string): Promise<WeeklyInsightSummary>;

  exportUserData(userId: string): Promise<UserDataExport>;
  /** Removes every row the user owns. Photo and account removal are the caller's job. */
  deleteUserData(userId: string): Promise<void>;
}
