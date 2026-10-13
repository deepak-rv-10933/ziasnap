import type { FoodItem } from "./food";
import type { MealType } from "./meal";
import type { NutritionValues } from "./nutrition";

export interface WaterEntry {
  id: string;
  amountMl: number;
  loggedAt: string;
}

export interface WaterDay {
  dateKey: string;
  totalMl: number;
  goalMl: number;
  entries: WaterEntry[];
}

export interface WeightEntry {
  id: string;
  dateKey: string;
  weightKg: number;
}

export type WeightTrendStatus = "no_data" | "too_few" | "on_track" | "off_track" | "steady" | "reached";

export interface WeightTrend {
  entries: WeightEntry[];
  /** Exponentially smoothed weight per logged day — what the chart draws. */
  trend: { dateKey: string; trendKg: number }[];
  latestTrendKg?: number;
  /** Trend change per week over the recent window; negative = losing. */
  weeklyChangeKg?: number;
  targetWeightKg: number;
  /** Day the target is reached at the current pace, when it is heading the right way. */
  projectedDateKey?: string;
  status: WeightTrendStatus;
}

export interface FavoriteMeal {
  id: string;
  name: string;
  mealType?: MealType;
  items: FoodItem[];
  totalNutrition: NutritionValues;
}

export interface LoggingStreak {
  /** Consecutive days with a logged meal, ending today (or yesterday if today is still empty). */
  currentDays: number;
  longestDays: number;
  loggedToday: boolean;
}
