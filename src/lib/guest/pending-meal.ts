import type { FoodItem, MealType, ZiaMealAnalysisResult } from "@/types";

/**
 * A meal a guest analyzed before having an account. It waits in this
 * browser's localStorage through sign-up and onboarding, then the Snap page
 * restores it so the user only has to press Confirm.
 */
export interface PendingMeal {
  mealType: MealType;
  items: FoodItem[];
  notes: string;
  analysisId?: string;
  overallConfidence?: ZiaMealAnalysisResult["overallConfidence"];
  analysisNotes?: string;
  /** Downscaled photo, only to show again while reviewing — never uploaded. Dropped if storage is full. */
  imageDataUrl?: string;
  savedAt: number;
}

const KEY = "ziasnap.pendingMeal";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function savePendingMeal(meal: Omit<PendingMeal, "savedAt">) {
  const record: PendingMeal = { ...meal, savedAt: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Quota exceeded (large photo) — keep the meal, lose the picture.
    try {
      localStorage.setItem(KEY, JSON.stringify({ ...record, imageDataUrl: undefined }));
    } catch {
      /* storage unavailable (private mode) — the guest will just re-snap */
    }
  }
}

export function loadPendingMeal(): PendingMeal | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const meal = JSON.parse(raw) as PendingMeal;
    if (!Array.isArray(meal.items) || Date.now() - meal.savedAt > MAX_AGE_MS) {
      clearPendingMeal();
      return null;
    }
    return meal;
  } catch {
    return null;
  }
}

export function hasPendingMeal(): boolean {
  return loadPendingMeal() !== null;
}

export function clearPendingMeal() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
}
