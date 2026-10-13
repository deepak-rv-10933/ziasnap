import type { WaterDay, WaterEntry } from "@/types";

export const GLASS_ML = 250;

/** ~35 ml per kg, rounded to whole glasses and kept in a sensible range. Not medical advice. */
export function waterGoalMl(weightKg: number): number {
  const raw = (weightKg > 0 ? weightKg : 65) * 35;
  return Math.min(4000, Math.max(1500, Math.round(raw / GLASS_ML) * GLASS_ML));
}

export function buildWaterDay(dateKey: string, entries: WaterEntry[], goalMl: number): WaterDay {
  const sorted = [...entries].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  return { dateKey, totalMl: sorted.reduce((sum, entry) => sum + entry.amountMl, 0), goalMl, entries: sorted };
}
