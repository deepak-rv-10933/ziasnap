import type { CatalystApp } from "zcatalyst-sdk-node/lib/catalyst-app";
import type {
  AccountInfo,
  DailySummary,
  FavoriteMeal,
  LoggingStreak,
  WaterDay,
  WeightTrend,
  FoodItem,
  GoalTargets,
  Meal,
  MealRecommendation,
  MealType,
  NutritionPreferences,
  UserProfile,
  WeeklyInsightSummary,
  WeeklyRecap,
  ZiaMealAnalysisResult,
} from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { calculateGoalTargets } from "@/lib/utils/goal-calculator";
import { buildDailySummary, dateKeysBetween } from "@/services/nutrition/daily-summary";
import { buildRecommendations } from "@/services/recommendations/mockRecommendationService";
import { buildWeeklyInsights } from "@/services/insights/mockInsightsService";
import { buildWaterDay, waterGoalMl } from "@/services/tracking/water";
import { buildWeightTrend } from "@/services/tracking/weight-trend";
import { computeStreak } from "@/services/tracking/streak";
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

  /** One repository per request: read (or create) the profile once, not once per caller. */
  private profileRowCache?: Promise<Row>;

  private ensureProfileRow(userId: string): Promise<Row> {
    this.profileRowCache ??= this.loadOrCreateProfileRow(userId).catch((error) => {
      this.profileRowCache = undefined;
      throw error;
    });
    return this.profileRowCache;
  }

  /** New accounts get a neutral starter profile; onboarding replaces it. */
  private async loadOrCreateProfileRow(userId: string): Promise<Row> {
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
    const merged = { ...row, ...(updated as unknown as Row) };
    this.profileRowCache = Promise.resolve(merged);
    return this.rowToProfile(merged);
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
    this.profileRowCache = Promise.resolve({ ...row, TargetsJson: JSON.stringify(targets) });
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
   * Personal food memory, write side. Remembers only corrections that change
   * *what* a dish is: its name, unit or calories per unit (e.g. "Dosa" →
   * "Ghee Roast Dosa"). A count change ("3 idlis, not 2") isn't remembered,
   * because tomorrow's plate may differ. Latest correction per dish wins.
   */
  private async recordCorrections(userId: string, items: FoodItem[]) {
    const meaningful = items.filter((item) => {
      if (!item.detected || item.isUserAdded || !item.isEdited) return false;
      const before = item.detected.perUnitNutrition.calories;
      const after = item.perUnitNutrition.calories;
      return (
        item.name.trim().toLowerCase() !== item.detected.name.trim().toLowerCase() ||
        item.portion.unit !== item.detected.unit ||
        (before > 0 && Math.abs(after - before) / before > 0.08)
      );
    });
    if (meaningful.length === 0) return;
    try {
      const keys = meaningful.map((item) => sqlString(item.detected!.name.toLowerCase())).join(", ");
      const stale = await selectAll(
        this.app,
        TABLES.foodCorrections,
        `SELECT ROWID FROM ${TABLES.foodCorrections} WHERE UserId = ${sqlString(userId)} AND DetectedName IN (${keys})`,
      );
      await deleteRowIds(this.app, TABLES.foodCorrections, stale.map((row) => String(row.ROWID)));
      await insertRows(
        this.app,
        TABLES.foodCorrections,
        meaningful.map((item) => ({
          UserId: userId,
          DetectedName: item.detected!.name.toLowerCase(),
          CorrectedName: item.name,
          CorrectionJson: JSON.stringify({
            name: item.name,
            unit: item.portion.unit,
            perUnitNutrition: item.perUnitNutrition,
            preparationNote: item.preparationNote,
          }),
        })),
      );
    } catch (error) {
      console.error("Could not record food corrections", error);
    }
  }

  /**
   * Personal food memory, read side: when Zia detects a dish the user has
   * corrected before, use their version (keeping Zia's count when the unit
   * matches) and drop any question about it, since it's already answered.
   */
  async applyFoodMemory(userId: string, result: Omit<ZiaMealAnalysisResult, "analysisId">) {
    this.assertSelf(userId);
    if (result.detectedItems.length === 0) return result;
    const rows = await selectAll(
      this.app,
      TABLES.foodCorrections,
      `SELECT DetectedName, CorrectionJson FROM ${TABLES.foodCorrections} WHERE UserId = ${sqlString(userId)}`,
    );
    const memory = new Map(
      rows.map((row) => [
        String(row.DetectedName),
        parseJson<{ name: string; unit: FoodItem["portion"]["unit"]; perUnitNutrition: FoodItem["perUnitNutrition"]; preparationNote?: string } | null>(row.CorrectionJson, null),
      ]),
    );
    const remembered = new Set<string>();
    const detectedItems = result.detectedItems.map((item) => {
      const correction = memory.get(item.name.toLowerCase());
      if (!correction?.perUnitNutrition) return item;
      remembered.add(item.id);
      const quantity = correction.unit === item.portion.unit ? item.portion.quantity : 1;
      const nutrition = {
        calories: Math.round(correction.perUnitNutrition.calories * quantity),
        proteinG: Math.round(correction.perUnitNutrition.proteinG * quantity * 10) / 10,
        carbsG: Math.round(correction.perUnitNutrition.carbsG * quantity * 10) / 10,
        fatG: Math.round(correction.perUnitNutrition.fatG * quantity * 10) / 10,
        fiberG: Math.round((correction.perUnitNutrition.fiberG ?? 0) * quantity * 10) / 10,
      };
      return {
        ...item,
        name: correction.name,
        portion: {
          quantity,
          unit: correction.unit,
          label: correction.unit === item.portion.unit ? item.portion.label : `1 ${correction.unit}`,
        },
        perUnitNutrition: correction.perUnitNutrition,
        nutrition,
        preparationNote: correction.preparationNote ?? item.preparationNote,
        confidence: "high" as const,
        fromMemory: true,
      };
    });
    return {
      ...result,
      detectedItems,
      questions: (result.questions ?? []).filter((question) => !remembered.has(question.itemId)),
    };
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

  // --------------------------------------------------------------- trackers

  private async ownedRowId(table: string, rowId: string): Promise<string | undefined> {
    if (!/^\d+$/.test(rowId)) return undefined;
    const rows = await selectAll(
      this.app,
      table,
      `SELECT ROWID FROM ${table} WHERE ROWID = ${rowId} AND UserId = ${sqlString(this.account.userId)}`,
    );
    return rows[0] ? String(rows[0].ROWID) : undefined;
  }

  async getWaterDay(userId: string, dateKey: string): Promise<WaterDay> {
    this.assertSelf(userId);
    const [profile, rows] = await Promise.all([
      this.getProfile(userId),
      selectAll(
        this.app,
        TABLES.waterLogs,
        `SELECT * FROM ${TABLES.waterLogs} WHERE UserId = ${sqlString(userId)} AND DateKey = ${sqlString(assertDateKey(dateKey))}`,
      ),
    ]);
    const entries = rows.map((row) => ({
      id: String(row.ROWID),
      amountMl: num(row.AmountMl),
      loggedAt: catalystTimeToIso(row.CREATEDTIME),
    }));
    return buildWaterDay(dateKey, entries, waterGoalMl(profile.personalDetails.currentWeightKg));
  }

  async addWater(userId: string, input: WaterInput): Promise<WaterDay> {
    this.assertSelf(userId);
    const amountMl = Math.round(num(input.amountMl));
    if (amountMl <= 0 || amountMl > 2000) throw new Error("amountMl must be between 1 and 2000");
    await this.app
      .datastore()
      .table(TABLES.waterLogs)
      .insertRow({ UserId: userId, DateKey: assertDateKey(input.dateKey, "dateKey"), AmountMl: amountMl });
    return this.getWaterDay(userId, input.dateKey);
  }

  async removeWater(userId: string, entryId: string): Promise<void> {
    this.assertSelf(userId);
    const id = await this.ownedRowId(TABLES.waterLogs, entryId);
    if (id) await this.app.datastore().table(TABLES.waterLogs).deleteRow(id);
  }

  private async weightEntries(userId: string) {
    const rows = await selectAll(
      this.app,
      TABLES.weightLogs,
      `SELECT * FROM ${TABLES.weightLogs} WHERE UserId = ${sqlString(userId)} ORDER BY DateKey`,
    );
    return rows.map((row) => ({ id: String(row.ROWID), dateKey: String(row.DateKey), weightKg: num(row.WeightKg) }));
  }

  async getWeightTrend(userId: string, todayDateKey: string): Promise<WeightTrend> {
    this.assertSelf(userId);
    const [profile, entries] = await Promise.all([this.getProfile(userId), this.weightEntries(userId)]);
    return buildWeightTrend(entries, profile.personalDetails.targetWeightKg, assertDateKey(todayDateKey));
  }

  async logWeight(userId: string, input: WeightInput, todayDateKey: string): Promise<WeightTrend> {
    this.assertSelf(userId);
    const weightKg = Math.round(num(input.weightKg) * 10) / 10;
    if (weightKg < 25 || weightKg > 300) throw new Error("weightKg must be between 25 and 300");
    const dateKey = assertDateKey(input.dateKey, "dateKey");

    const entries = await this.weightEntries(userId);
    const sameDay = entries.filter((entry) => entry.dateKey === dateKey).map((entry) => entry.id);
    await deleteRowIds(this.app, TABLES.weightLogs, sameDay);
    await this.app.datastore().table(TABLES.weightLogs).insertRow({ UserId: userId, DateKey: dateKey, WeightKg: weightKg });

    const isLatest = entries.every((entry) => entry.dateKey <= dateKey);
    if (isLatest) await this.updateProfile(userId, { personalDetails: { currentWeightKg: weightKg } });
    return this.getWeightTrend(userId, todayDateKey);
  }

  async deleteWeight(userId: string, entryId: string): Promise<void> {
    this.assertSelf(userId);
    const id = await this.ownedRowId(TABLES.weightLogs, entryId);
    if (id) await this.app.datastore().table(TABLES.weightLogs).deleteRow(id);
  }

  private rowToFavorite(row: Row): FavoriteMeal {
    const items = parseJson<FoodItem[]>(row.ItemsJson, []);
    return {
      id: String(row.ROWID),
      name: String(row.Name ?? ""),
      mealType: optionalString(row.MealType) as MealType | undefined,
      items,
      totalNutrition: sumNutrition(items.map((item) => item.nutrition)),
    };
  }

  async listFavorites(userId: string): Promise<FavoriteMeal[]> {
    this.assertSelf(userId);
    const rows = await selectAll(
      this.app,
      TABLES.favorites,
      `SELECT * FROM ${TABLES.favorites} WHERE UserId = ${sqlString(userId)} ORDER BY CREATEDTIME`,
    );
    return rows.map((row) => this.rowToFavorite(row));
  }

  async saveFavorite(userId: string, input: FavoriteInput): Promise<FavoriteMeal> {
    this.assertSelf(userId);
    const items = this.validateItems(input.items);
    if (input.mealType && !MEAL_TYPES.includes(input.mealType)) throw new Error("Unknown meal type");
    const existing = await this.listFavorites(userId);
    if (existing.length >= 30) throw new Error("You can keep at most 30 favorites");
    const row = (await this.app
      .datastore()
      .table(TABLES.favorites)
      .insertRow({
        UserId: userId,
        Name: clean(input.name, 120) || "Favorite meal",
        MealType: input.mealType ?? "",
        ItemsJson: JSON.stringify(items),
      })) as unknown as Row;
    return this.rowToFavorite(row);
  }

  async deleteFavorite(userId: string, favoriteId: string): Promise<void> {
    this.assertSelf(userId);
    const id = await this.ownedRowId(TABLES.favorites, favoriteId);
    if (id) await this.app.datastore().table(TABLES.favorites).deleteRow(id);
  }

  async getStreak(userId: string, todayDateKey: string): Promise<LoggingStreak> {
    this.assertSelf(userId);
    const since = new Date(`${assertDateKey(todayDateKey)}T00:00:00Z`);
    since.setUTCDate(since.getUTCDate() - 180);
    const rows = await selectAll(
      this.app,
      TABLES.meals,
      `SELECT DISTINCT DateKey FROM ${TABLES.meals} WHERE UserId = ${sqlString(userId)} AND DateKey >= ${sqlString(
        since.toISOString().slice(0, 10),
      )}`,
    );
    return computeStreak(
      rows.map((row) => String(row.DateKey)),
      todayDateKey,
    );
  }

  // ----------------------------------------------------------------- coach

  /** One recap per week: regenerating replaces it. */
  async saveWeeklyRecap(userId: string, recap: WeeklyRecap): Promise<void> {
    this.assertSelf(userId);
    const existing = await selectAll(
      this.app,
      TABLES.coachReports,
      `SELECT ROWID FROM ${TABLES.coachReports} WHERE UserId = ${sqlString(userId)} AND WeekStart = ${sqlString(assertDateKey(recap.weekStartDate))}`,
    );
    await deleteRowIds(this.app, TABLES.coachReports, existing.map((row) => String(row.ROWID)));
    await this.app
      .datastore()
      .table(TABLES.coachReports)
      .insertRow({ UserId: userId, WeekStart: recap.weekStartDate, ReportJson: JSON.stringify(recap) });
  }

  async latestWeeklyRecap(userId: string): Promise<WeeklyRecap | null> {
    this.assertSelf(userId);
    const rows = await selectAll(
      this.app,
      TABLES.coachReports,
      `SELECT ReportJson FROM ${TABLES.coachReports} WHERE UserId = ${sqlString(userId)} ORDER BY WeekStart DESC`,
    );
    return rows[0] ? parseJson<WeeklyRecap | null>(rows[0].ReportJson, null) : null;
  }

  /** Average daily water over the days that have any, for the weekly recap. */
  async averageWaterMl(userId: string, startDateKey: string, endDateKey: string): Promise<number | undefined> {
    const rows = await selectAll(
      this.app,
      TABLES.waterLogs,
      `SELECT DateKey, AmountMl FROM ${TABLES.waterLogs} WHERE UserId = ${sqlString(userId)} AND DateKey >= ${sqlString(
        assertDateKey(startDateKey),
      )} AND DateKey <= ${sqlString(assertDateKey(endDateKey))}`,
    );
    const byDay = new Map<string, number>();
    rows.forEach((row) => byDay.set(String(row.DateKey), (byDay.get(String(row.DateKey)) ?? 0) + num(row.AmountMl)));
    if (byDay.size === 0) return undefined;
    return Math.round([...byDay.values()].reduce((a, b) => a + b, 0) / byDay.size);
  }

  /** Recent dish names, to steer the planner toward food this user actually eats. */
  async recentFoodNames(userId: string, todayDateKey: string): Promise<string[]> {
    const start = new Date(`${assertDateKey(todayDateKey)}T00:00:00Z`);
    start.setUTCDate(start.getUTCDate() - 7);
    const meals = await this.mealsBetween(userId, start.toISOString().slice(0, 10), todayDateKey);
    return meals.flatMap((meal) => meal.items.map((item) => item.name));
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
      waterLogs: waterRows.map((row) => ({
        dateKey: String(row.DateKey),
        amountMl: num(row.AmountMl),
        loggedAt: catalystTimeToIso(row.CREATEDTIME),
      })),
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
