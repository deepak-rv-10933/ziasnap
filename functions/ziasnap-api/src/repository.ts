import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type {
  AccountInfo,
  DailySummary,
  FoodItem,
  GoalTargets,
  Meal,
  MealRecommendation,
  MealType,
  NutritionPreferences,
  UserProfile,
  WeeklyInsightSummary,
} from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { calculateGoalTargets } from "@/lib/utils/goal-calculator";
import { buildDailySummary, dateKeysBetween } from "@/services/nutrition/daily-summary";
import { buildRecommendations } from "@/services/recommendations/mockRecommendationService";
import { buildWeeklyInsights } from "@/services/insights/mockInsightsService";
import type {
  ConfirmMealInput,
  HistoryRange,
  NutritionRepository,
  ProfileUpdateInput,
  UpdateMealInput,
  UserDataExport,
} from "@/services/nutrition/NutritionRepository";
import {
  TABLES,
  USER_TABLES,
  assertDateKey,
  bool,
  catalystTimeToIso,
  deleteAllForUser,
  deleteRowIds,
  insertRows,
  num,
  optionalString,
  parseJson,
  selectAll,
  sqlString,
  type Row,
} from "./db";

const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
const MAX_ITEMS_PER_MEAL = 40;

const DEFAULT_PREFERENCES: NutritionPreferences = {
  dietaryPreference: "vegetarian",
  cuisinePreference: "mixed",
  favoriteFoods: [],
  avoidFoods: [],
  nutrientPriorities: [],
};

/** Data Store does not support 4-byte UTF-8 (emoji); it would silently store "?". */
function clean(value: string | undefined, maxLength: number): string {
  return (value ?? "").replace(/[\u{10000}-\u{10FFFF}]/gu, "").slice(0, maxLength);
}

function sanitizeItem(item: FoodItem): FoodItem {
  return {
    ...item,
    name: clean(item.name, 200) || "Unnamed item",
    preparationNote: item.preparationNote ? clean(item.preparationNote, 300) : undefined,
    portion: { ...item.portion, label: clean(item.portion?.label, 60) },
  };
}

/**
 * Catalyst Data Store implementation of NutritionRepository. Every query is
 * filtered by the UserId column — the function runs with admin scope, so this
 * filter (not table permissions) is what keeps users apart.
 */
export class CatalystNutritionRepository implements NutritionRepository {
  constructor(
    private readonly app: CatalystApp,
    private readonly account: AccountInfo,
  ) {}

  private assertSelf(userId: string) {
    if (userId !== this.account.userId) throw new Error("Cross-user access refused");
  }

  // ---------------------------------------------------------------- profile

  private async profileRow(userId: string): Promise<Row | undefined> {
    const rows = await selectAll(
      this.app,
      TABLES.profile,
      `SELECT * FROM ${TABLES.profile} WHERE UserId = ${sqlString(userId)}`,
    );
    return rows[0];
  }

  /** New accounts get a neutral starter profile; onboarding replaces it. */
  private async ensureProfileRow(userId: string): Promise<Row> {
    const existing = await this.profileRow(userId);
    if (existing) return existing;

    const personalDetails = {
      name: clean([this.account.firstName, this.account.lastName].filter(Boolean).join(" "), 120) || "Friend",
      age: 30,
      sex: "other" as const,
      heightCm: 165,
      currentWeightKg: 65,
      targetWeightKg: 65,
    };
    const targets = calculateGoalTargets(personalDetails, "maintain", "moderately_active");
    return this.app
      .datastore()
      .table(TABLES.profile)
      .insertRow({
        UserId: userId,
        Name: personalDetails.name,
        Age: personalDetails.age,
        Sex: personalDetails.sex,
        HeightCm: personalDetails.heightCm,
        CurrentWeightKg: personalDetails.currentWeightKg,
        TargetWeightKg: personalDetails.targetWeightKg,
        Goal: "maintain",
        ActivityLevel: "moderately_active",
        PreferencesJson: JSON.stringify(DEFAULT_PREFERENCES),
        TargetsJson: JSON.stringify(targets),
      }) as unknown as Promise<Row>;
  }

  private rowToProfile(row: Row): UserProfile {
    return {
      id: String(row.UserId),
      personalDetails: {
        name: String(row.Name ?? ""),
        age: num(row.Age),
        sex: (row.Sex as UserProfile["personalDetails"]["sex"]) ?? "other",
        heightCm: num(row.HeightCm),
        currentWeightKg: num(row.CurrentWeightKg),
        targetWeightKg: num(row.TargetWeightKg),
      },
      goal: (row.Goal as UserProfile["goal"]) ?? "maintain",
      activityLevel: (row.ActivityLevel as UserProfile["activityLevel"]) ?? "moderately_active",
      nutritionPreferences: { ...DEFAULT_PREFERENCES, ...parseJson(row.PreferencesJson, {}) },
      onboardingCompletedAt: optionalString(row.OnboardingCompletedAt),
      createdAt: catalystTimeToIso(row.CREATEDTIME),
      updatedAt: catalystTimeToIso(row.MODIFIEDTIME),
    };
  }

  private rowToTargets(row: Row, profile: UserProfile): GoalTargets {
    const stored = parseJson<GoalTargets | null>(row.TargetsJson, null);
    return stored ?? calculateGoalTargets(profile.personalDetails, profile.goal, profile.activityLevel);
  }

  async getProfile(userId: string): Promise<UserProfile> {
    this.assertSelf(userId);
    return this.rowToProfile(await this.ensureProfileRow(userId));
  }

  async updateProfile(userId: string, input: ProfileUpdateInput): Promise<UserProfile> {
    this.assertSelf(userId);
    const row = await this.ensureProfileRow(userId);
    const current = this.rowToProfile(row);
    const personalDetails = { ...current.personalDetails, ...input.personalDetails };
    const preferences = { ...current.nutritionPreferences, ...input.nutritionPreferences };

    const updated = await this.app
      .datastore()
      .table(TABLES.profile)
      .updateRow({
        ROWID: String(row.ROWID),
        Name: clean(personalDetails.name, 120),
        Age: Math.round(num(personalDetails.age)),
        Sex: personalDetails.sex,
        HeightCm: num(personalDetails.heightCm),
        CurrentWeightKg: num(personalDetails.currentWeightKg),
        TargetWeightKg: num(personalDetails.targetWeightKg),
        Goal: input.goal ?? current.goal,
        ActivityLevel: input.activityLevel ?? current.activityLevel,
        PreferencesJson: JSON.stringify({
          ...preferences,
          healthContext: preferences.healthContext ? clean(preferences.healthContext, 1000) : undefined,
        }),
        OnboardingCompletedAt: input.completeOnboarding
          ? new Date().toISOString()
          : (current.onboardingCompletedAt ?? ""),
      });
    return this.rowToProfile({ ...row, ...(updated as unknown as Row) });
  }

  async getGoalTargets(userId: string): Promise<GoalTargets> {
    this.assertSelf(userId);
    const row = await this.ensureProfileRow(userId);
    return this.rowToTargets(row, this.rowToProfile(row));
  }

  async recalculateGoalTargets(userId: string): Promise<GoalTargets> {
    this.assertSelf(userId);
    const row = await this.ensureProfileRow(userId);
    const profile = this.rowToProfile(row);
    const targets = calculateGoalTargets(profile.personalDetails, profile.goal, profile.activityLevel);
    await this.app
      .datastore()
      .table(TABLES.profile)
      .updateRow({ ROWID: String(row.ROWID), TargetsJson: JSON.stringify(targets) });
    return targets;
  }

  // ------------------------------------------------------------------ meals

  private async itemsForMeals(userId: string, mealIds: string[]): Promise<Map<string, FoodItem[]>> {
    const byMeal = new Map<string, FoodItem[]>();
    for (let i = 0; i < mealIds.length; i += 50) {
      const ids = mealIds.slice(i, i + 50).join(", ");
      const rows = await selectAll(
        this.app,
        TABLES.mealItems,
        `SELECT * FROM ${TABLES.mealItems} WHERE UserId = ${sqlString(userId)} AND MealId IN (${ids}) ORDER BY Position`,
      );
      for (const row of rows) {
        const mealId = String(row.MealId);
        const item = parseJson<FoodItem | null>(row.ItemJson, null);
        if (!item) continue;
        item.isEdited = bool(row.IsEdited);
        item.isUserAdded = bool(row.IsUserAdded);
        byMeal.set(mealId, [...(byMeal.get(mealId) ?? []), item]);
      }
    }
    return byMeal;
  }

  private async rowsToMeals(userId: string, rows: Row[]): Promise<Meal[]> {
    const ids = rows.map((row) => String(row.ROWID));
    const items = ids.length > 0 ? await this.itemsForMeals(userId, ids) : new Map<string, FoodItem[]>();

    return rows.map((row) => {
      return {
        id: String(row.ROWID),
        userId,
        type: (row.MealType as MealType) ?? "snack",
        source: (row.Source as Meal["source"]) ?? "manual",
        items: items.get(String(row.ROWID)) ?? [],
        totalNutrition: {
          calories: num(row.Calories),
          proteinG: num(row.ProteinG),
          carbsG: num(row.CarbsG),
          fatG: num(row.FatG),
          fiberG: num(row.FiberG),
        },
        notes: optionalString(row.Notes),
        loggedAt: optionalString(row.LoggedAt) ?? catalystTimeToIso(row.CREATEDTIME),
        dateKey: String(row.DateKey),
        confirmedAt: optionalString(row.ConfirmedAt),
        analysisId: optionalString(row.AnalysisId),
      };
    });
  }

  private async mealsBetween(userId: string, startDateKey: string, endDateKey: string): Promise<Meal[]> {
    const rows = await selectAll(
      this.app,
      TABLES.meals,
      `SELECT * FROM ${TABLES.meals} WHERE UserId = ${sqlString(userId)} AND DateKey >= ${sqlString(
        assertDateKey(startDateKey, "start"),
      )} AND DateKey <= ${sqlString(assertDateKey(endDateKey, "end"))} ORDER BY LoggedAt`,
    );
    return this.rowsToMeals(userId, rows);
  }

  private async mealRow(userId: string, mealId: string): Promise<Row | undefined> {
    if (!/^\d+$/.test(mealId)) return undefined;
    const rows = await selectAll(
      this.app,
      TABLES.meals,
      `SELECT * FROM ${TABLES.meals} WHERE ROWID = ${mealId} AND UserId = ${sqlString(userId)}`,
    );
    return rows[0];
  }

  async getDailySummary(userId: string, dateKey: string): Promise<DailySummary> {
    this.assertSelf(userId);
    const [targets, meals] = await Promise.all([
      this.getGoalTargets(userId),
      this.mealsBetween(userId, dateKey, dateKey),
    ]);
    return buildDailySummary(meals, dateKey, targets);
  }

  async getHistory(userId: string, range: HistoryRange): Promise<DailySummary[]> {
    this.assertSelf(userId);
    const [targets, meals] = await Promise.all([
      this.getGoalTargets(userId),
      this.mealsBetween(userId, range.startDateKey, range.endDateKey),
    ]);
    return dateKeysBetween(range.startDateKey, range.endDateKey).map((dateKey) =>
      buildDailySummary(
        meals.filter((meal) => meal.dateKey === dateKey),
        dateKey,
        targets,
      ),
    );
  }

  async getMeal(userId: string, mealId: string): Promise<Meal | undefined> {
    this.assertSelf(userId);
    const row = await this.mealRow(userId, mealId);
    if (!row) return undefined;
    const [meal] = await this.rowsToMeals(userId, [row]);
    return meal;
  }

  private itemRows(userId: string, mealId: string, items: FoodItem[]): Row[] {
    return items.map((item, position) => ({
      UserId: userId,
      MealId: mealId,
      Position: position,
      Name: item.name,
      Confidence: item.confidence,
      IsEdited: item.isEdited ? "true" : "false",
      IsUserAdded: item.isUserAdded ? "true" : "false",
      Calories: num(item.nutrition?.calories),
      ItemJson: JSON.stringify(item),
    }));
  }

  private validateItems(items: unknown): FoodItem[] {
    if (!Array.isArray(items)) throw new Error("items must be an array");
    if (items.length === 0) throw new Error("A meal needs at least one item");
    if (items.length > MAX_ITEMS_PER_MEAL) throw new Error(`A meal can have at most ${MAX_ITEMS_PER_MEAL} items`);
    return (items as FoodItem[]).map(sanitizeItem);
  }

  private totalsColumns(items: FoodItem[]) {
    const total = sumNutrition(items.map((item) => item.nutrition));
    return {
      Calories: total.calories,
      ProteinG: total.proteinG,
      CarbsG: total.carbsG,
      FatG: total.fatG,
      FiberG: total.fiberG ?? 0,
    };
  }

  async confirmMeal(input: ConfirmMealInput): Promise<Meal> {
    this.assertSelf(input.userId);
    const userId = input.userId;
    const items = this.validateItems(input.items);
    if (!MEAL_TYPES.includes(input.type)) throw new Error("Unknown meal type");
    const loggedAt = input.loggedAt && !Number.isNaN(Date.parse(input.loggedAt)) ? input.loggedAt : new Date().toISOString();
    const dateKey = assertDateKey(input.dateKey ?? loggedAt.slice(0, 10), "dateKey");

    const mealRow = (await this.app
      .datastore()
      .table(TABLES.meals)
      .insertRow({
        UserId: userId,
        DateKey: dateKey,
        MealType: input.type,
        Source: input.source === "photo" ? "photo" : "manual",
        Notes: clean(input.notes, 2000),
        LoggedAt: loggedAt,
        ConfirmedAt: new Date().toISOString(),
        AnalysisId: clean(input.analysisId, 64),
        ...this.totalsColumns(items),
      })) as unknown as Row;
    const mealId = String(mealRow.ROWID);

    await insertRows(this.app, TABLES.mealItems, this.itemRows(userId, mealId, items));
    await this.recordCorrections(userId, items);

    const [meal] = await this.rowsToMeals(userId, [mealRow]);
    return { ...meal, items };
  }

  /**
   * Keeps what the user changed about Zia's estimate. Phase C's "personal
   * food memory" reads these back; for now they are stored and exported.
   */
  private async recordCorrections(userId: string, items: FoodItem[]) {
    const corrected = items.filter((item) => item.isEdited && !item.isUserAdded);
    if (corrected.length === 0) return;
    try {
      await insertRows(
        this.app,
        TABLES.foodCorrections,
        corrected.map((item) => ({
          UserId: userId,
          DetectedName: item.name,
          CorrectedName: item.name,
          CorrectionJson: JSON.stringify(item),
        })),
      );
    } catch (error) {
      console.error("Could not record food corrections", error);
    }
  }

  private async itemRowIds(userId: string, mealId: string): Promise<string[]> {
    const rows = await selectAll(
      this.app,
      TABLES.mealItems,
      `SELECT ROWID FROM ${TABLES.mealItems} WHERE UserId = ${sqlString(userId)} AND MealId = ${mealId}`,
    );
    return rows.map((row) => String(row.ROWID));
  }

  async updateMeal(userId: string, mealId: string, input: UpdateMealInput): Promise<Meal> {
    this.assertSelf(userId);
    const row = await this.mealRow(userId, mealId);
    if (!row) throw new Error(`Meal not found: ${mealId}`);
    if (input.type && !MEAL_TYPES.includes(input.type)) throw new Error("Unknown meal type");

    const patch: Row = { ROWID: mealId };
    if (input.type) patch.MealType = input.type;
    if (input.notes !== undefined) patch.Notes = clean(input.notes, 2000);

    if (input.items) {
      const items = this.validateItems(input.items);
      const oldIds = await this.itemRowIds(userId, mealId);
      await insertRows(this.app, TABLES.mealItems, this.itemRows(userId, mealId, items));
      await deleteRowIds(this.app, TABLES.mealItems, oldIds);
      Object.assign(patch, this.totalsColumns(items));
      await this.recordCorrections(userId, items);
    }

    await this.app.datastore().table(TABLES.meals).updateRow(patch as never);
    const meal = await this.getMeal(userId, mealId);
    if (!meal) throw new Error(`Meal not found: ${mealId}`);
    return meal;
  }

  async deleteMeal(userId: string, mealId: string): Promise<void> {
    this.assertSelf(userId);
    const row = await this.mealRow(userId, mealId);
    if (!row) return;
    await deleteRowIds(this.app, TABLES.mealItems, await this.itemRowIds(userId, mealId));
    await this.app.datastore().table(TABLES.meals).deleteRow(mealId);
  }

  // ------------------------------------------------- derived (shared logic)

  async getRecommendations(userId: string, todayDateKey: string): Promise<MealRecommendation[]> {
    const [profile, today] = await Promise.all([this.getProfile(userId), this.getDailySummary(userId, todayDateKey)]);
    return buildRecommendations(profile, today);
  }

  async getInsights(userId: string, weekStartDateKey: string): Promise<WeeklyInsightSummary> {
    this.assertSelf(userId);
    const start = new Date(`${assertDateKey(weekStartDateKey, "weekStart")}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() + 6);
    const [targets, meals] = await Promise.all([
      this.getGoalTargets(userId),
      this.mealsBetween(userId, weekStartDateKey, start.toISOString().slice(0, 10)),
    ]);
    return buildWeeklyInsights(meals, targets, weekStartDateKey);
  }

  // ---------------------------------------------------------------- privacy

  async exportUserData(userId: string): Promise<UserDataExport> {
    this.assertSelf(userId);
    const uid = sqlString(userId);
    const [profile, goalTargets, mealRows, weightRows, waterRows, favoriteRows, correctionRows] = await Promise.all([
      this.getProfile(userId),
      this.getGoalTargets(userId),
      selectAll(this.app, TABLES.meals, `SELECT * FROM ${TABLES.meals} WHERE UserId = ${uid} ORDER BY LoggedAt`),
      selectAll(this.app, TABLES.weightLogs, `SELECT * FROM ${TABLES.weightLogs} WHERE UserId = ${uid} ORDER BY DateKey`),
      selectAll(this.app, TABLES.waterLogs, `SELECT * FROM ${TABLES.waterLogs} WHERE UserId = ${uid} ORDER BY DateKey`),
      selectAll(this.app, TABLES.favorites, `SELECT * FROM ${TABLES.favorites} WHERE UserId = ${uid}`),
      selectAll(this.app, TABLES.foodCorrections, `SELECT * FROM ${TABLES.foodCorrections} WHERE UserId = ${uid}`),
    ]);
    const meals = await this.rowsToMeals(userId, mealRows);

    return {
      exportedAt: new Date().toISOString(),
      profile,
      goalTargets,
      meals,
      weightLogs: weightRows.map((row) => ({ dateKey: String(row.DateKey), weightKg: num(row.WeightKg) })),
      waterLogs: waterRows.map((row) => ({ dateKey: String(row.DateKey), amountMl: num(row.AmountMl) })),
      favorites: favoriteRows.map((row) => ({
        name: String(row.Name),
        mealType: optionalString(row.MealType) as MealType | undefined,
        items: parseJson<FoodItem[]>(row.ItemsJson, []),
      })),
      foodCorrections: correctionRows.map((row) => ({
        detectedName: String(row.DetectedName ?? ""),
        correctedName: String(row.CorrectedName ?? ""),
        item: parseJson<FoodItem>(row.CorrectionJson, {} as FoodItem),
      })),
    };
  }

  async deleteUserData(userId: string): Promise<void> {
    this.assertSelf(userId);
    // Children first, the profile last — a partial failure leaves the
    // account usable and the request can simply be retried.
    const order = [...USER_TABLES.filter((table) => table !== TABLES.profile), TABLES.profile];
    for (const table of order) {
      await deleteAllForUser(this.app, table, userId);
    }
  }
}
