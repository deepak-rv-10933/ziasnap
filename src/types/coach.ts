import type { NutritionValues } from "./nutrition";
import type { MealRecommendation } from "./recommendation";

export type CoachTask = "plan" | "menu" | "weekly";

export interface MenuPick {
  dish: string;
  why: string;
  tip?: string;
  nutrition: NutritionValues;
}

export interface MenuAdvice {
  picks: MenuPick[];
  goEasy: { dish: string; why: string }[];
  notes?: string;
}

export interface WeeklyRecap {
  weekStartDate: string;
  weekEndDate: string;
  headline: string;
  summary: string;
  win: string;
  oneChange: string;
  generatedAt: string;
}

export interface CoachResults {
  plan: MealRecommendation[];
  menu: MenuAdvice;
  weekly: WeeklyRecap;
}

/** Coach answers take 13–20s, so every task is started, then polled. */
export type CoachPoll<T extends CoachTask> =
  | { status: "working"; token: string }
  | { status: "done"; token: string; result: CoachResults[T] };
