import { create } from "zustand";
import type { DailySummary } from "@/types";
import { toDateKey } from "@/lib/utils/date";

/**
 * Lightweight cross-cutting UI state for nutrition — which day is selected,
 * plus a mirror of today's summary so the app shell header can render a
 * persistent progress chip without re-subscribing to the Home query. The
 * TanStack Query cache stays the source of truth; this store is only ever
 * written to by `syncTodaySummary`, never fetched independently.
 */
interface NutritionStoreState {
  selectedDateKey: string;
  todaySummary: DailySummary | null;
  setSelectedDateKey: (dateKey: string) => void;
  syncTodaySummary: (summary: DailySummary) => void;
}

export const useNutritionStore = create<NutritionStoreState>((set) => ({
  selectedDateKey: toDateKey(new Date()),
  todaySummary: null,
  setSelectedDateKey: (selectedDateKey) => set({ selectedDateKey }),
  syncTodaySummary: (todaySummary) => set({ todaySummary }),
}));
