import type { RecommendationReasonTag } from "@/types";

export const REASON_TAG_LABEL: Record<RecommendationReasonTag, string> = {
  fits_remaining_calories: "Fits your remaining calories",
  high_protein: "High protein",
  goal_aligned: "Aligned with your goal",
  nutrient_gap: "Covers a nutrient gap",
  cuisine_match: "Matches your cuisine",
  recently_enjoyed: "You've enjoyed this before",
  fasting_friendly: "Fasting-friendly",
};
