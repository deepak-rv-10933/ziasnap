import { create } from "zustand";

interface RecommendationStoreState {
  selectedRecommendationId: string | null;
  selectRecommendation: (id: string | null) => void;
}

export const useRecommendationStore = create<RecommendationStoreState>((set) => ({
  selectedRecommendationId: null,
  selectRecommendation: (selectedRecommendationId) => set({ selectedRecommendationId }),
}));
