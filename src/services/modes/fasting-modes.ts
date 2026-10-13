import type { FastingMode, FastingModeType, NutritionPreferences } from "@/types";

export interface FastingModeInfo {
  label: string;
  /** How long the mode usually lasts, used to prefill its end date. */
  defaultDays: number;
  /** What changes, in one line, for the Today banner. */
  summary: string;
  /** Hydration line while the mode is on (Ramadan shifts drinking to the night). */
  waterHint?: string;
}

export const FASTING_MODES: Record<FastingModeType, FastingModeInfo> = {
  navratri: {
    label: "Navratri",
    defaultDays: 9,
    summary: "Suggestions are vrat-friendly: no grains, onion or garlic. Kuttu, samak, sabudana and fruit instead.",
  },
  ekadashi: {
    label: "Ekadashi",
    defaultDays: 1,
    summary: "Suggestions skip grains and beans for today: sabudana, makhana, fruit and buttermilk.",
  },
  ramadan: {
    label: "Ramadan",
    defaultDays: 30,
    summary: "Suggestions are for suhoor and iftar: slow-release food before dawn, dates and a balanced plate after sunset.",
    waterHint: "Spread your water between iftar and suhoor.",
  },
};

export function addDays(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function newFastingMode(type: FastingModeType, startDateKey: string): FastingMode {
  return { type, startDateKey, endDateKey: addDays(startDateKey, FASTING_MODES[type].defaultDays - 1) };
}

/** The mode in effect on `dateKey`, if any. An expired mode simply stops applying. */
export function activeFastingMode(preferences: NutritionPreferences, dateKey: string): FastingMode | undefined {
  const mode = preferences.fastingMode;
  if (!mode) return undefined;
  return dateKey >= mode.startDateKey && dateKey <= mode.endDateKey ? mode : undefined;
}
