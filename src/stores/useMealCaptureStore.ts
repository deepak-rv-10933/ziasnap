import { create } from "zustand";
import type { FoodItem, MealType, ZiaClarifyQuestion, ZiaMealAnalysisResult } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { mealTypeFromHour } from "@/lib/utils/date";
import { generateId } from "@/lib/utils/id";

export type CaptureStatus = "idle" | "captured" | "analyzing" | "analyzed" | "error";

interface MealCaptureState {
  status: CaptureStatus;
  capturedImage: string | null;
  mealType: MealType;
  analysisId: string | null;
  overallConfidence: ZiaMealAnalysisResult["overallConfidence"] | null;
  analysisNotes: string | null;
  items: FoodItem[];
  questions: ZiaClarifyQuestion[];
  /** questionId → chosen option label. */
  answers: Record<string, string>;
  notes: string;
  error: string | null;

  totalNutrition: () => ReturnType<typeof sumNutrition>;

  setCapturedImage: (dataUrl: string) => void;
  setMealType: (mealType: MealType) => void;
  startAnalyzing: () => void;
  analysisSucceeded: (result: ZiaMealAnalysisResult) => void;
  analysisFailed: (error: string) => void;
  updateItem: (id: string, patch: Partial<FoodItem>) => void;
  /** Smart confirmation: swap in the option's item. Choosing Zia's current guess just confirms it. */
  answerQuestion: (questionId: string, optionLabel: string) => void;
  removeItem: (id: string) => void;
  addItem: (item: FoodItem) => void;
  setNotes: (notes: string) => void;
  /** Re-opens a meal analyzed earlier (as a guest) straight at the review step. */
  restore: (meal: {
    imageDataUrl?: string;
    mealType: MealType;
    items: FoodItem[];
    notes: string;
    analysisId?: string;
    overallConfidence?: ZiaMealAnalysisResult["overallConfidence"];
    analysisNotes?: string;
  }) => void;
  retake: () => void;
  reset: () => void;
}

const initialState = {
  status: "idle" as CaptureStatus,
  capturedImage: null as string | null,
  mealType: mealTypeFromHour(new Date().getHours()),
  analysisId: null as string | null,
  overallConfidence: null as ZiaMealAnalysisResult["overallConfidence"] | null,
  analysisNotes: null as string | null,
  items: [] as FoodItem[],
  questions: [] as ZiaClarifyQuestion[],
  answers: {} as Record<string, string>,
  notes: "",
  error: null as string | null,
};

export const useMealCaptureStore = create<MealCaptureState>((set, get) => ({
  ...initialState,

  totalNutrition: () => sumNutrition(get().items.map((item) => item.nutrition)),

  setCapturedImage: (dataUrl) =>
    set({ capturedImage: dataUrl, status: "captured", items: [], error: null }),

  setMealType: (mealType) => set({ mealType }),

  startAnalyzing: () => set({ status: "analyzing", error: null }),

  analysisSucceeded: (result) =>
    set({
      status: "analyzed",
      analysisId: result.analysisId,
      overallConfidence: result.overallConfidence,
      analysisNotes: result.notes ?? null,
      items: result.detectedItems,
      questions: result.questions ?? [],
      answers: {},
    }),

  analysisFailed: (error) => set({ status: "error", error }),

  updateItem: (id, patch) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, ...patch, isEdited: true } : item)),
    })),

  answerQuestion: (questionId, optionLabel) =>
    set((state) => {
      const question = state.questions.find((candidate) => candidate.id === questionId);
      const option = question?.options.find((candidate) => candidate.label === optionLabel);
      if (!question || !option) return {};
      return {
        answers: { ...state.answers, [questionId]: optionLabel },
        items: state.items.map((item) =>
          item.id === question.itemId
            ? { ...option.item, id: item.id, detected: item.detected, isEdited: !option.isCurrent }
            : item,
        ),
      };
    }),

  removeItem: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  addItem: (item) => set((state) => ({ items: [...state.items, { ...item, isUserAdded: true, id: item.id || generateId("food") }] })),

  setNotes: (notes) => set({ notes }),

  restore: (meal) =>
    set({
      status: "analyzed",
      capturedImage: meal.imageDataUrl ?? null,
      mealType: meal.mealType,
      items: meal.items,
      notes: meal.notes,
      analysisId: meal.analysisId ?? null,
      overallConfidence: meal.overallConfidence ?? null,
      analysisNotes: meal.analysisNotes ?? null,
      questions: [],
      answers: {},
      error: null,
    }),

  retake: () => set({ status: "idle", capturedImage: null, items: [], questions: [], answers: {}, error: null }),

  reset: () => set({ ...initialState, mealType: mealTypeFromHour(new Date().getHours()) }),
}));
