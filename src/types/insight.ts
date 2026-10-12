export type InsightSeverity = "positive" | "neutral" | "attention";

export interface NutritionInsight {
  id: string;
  title: string;
  observation: string;
  suggestion: string;
  severity: InsightSeverity;
}

export interface WeeklyInsightSummary {
  weekStartDate: string;
  weekEndDate: string;
  averageCalories: number;
  averageProteinG: number;
  calorieConsistencyPercent: number;
  proteinConsistencyPercent: number;
  goalAdherencePercent: number;
  mealsLoggedCount: number;
  daysLoggedCount: number;
  mostFrequentFoods: { name: string; count: number }[];
  insights: NutritionInsight[];
}
