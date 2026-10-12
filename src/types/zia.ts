import type { MealType } from "./meal";
import type { FoodItem } from "./food";
import type { DietaryPreference } from "./user";

/**
 * Typed boundary for the future Zia Agent integration. Phase 1 ships only a
 * mock implementation (see services/zia/mockZiaMealAnalysisService.ts) but
 * every consumer in the app talks to this interface, so swapping in the real
 * Zia Agent API later requires no UI changes.
 */
export interface ZiaMealAnalysisRequest {
  imageDataUrl: string;
  userContext: {
    dietaryPreference: DietaryPreference;
    cuisinePreference: string;
  };
  mealContext?: {
    mealType?: MealType;
    notes?: string;
  };
}

export type ZiaAnalysisStatus = "queued" | "analyzing" | "completed" | "failed";

export interface ZiaMealAnalysisResult {
  analysisId: string;
  status: ZiaAnalysisStatus;
  detectedItems: FoodItem[];
  /** Overall confidence across the whole plate, not just individual items. */
  overallConfidence: "high" | "medium" | "low";
  notes?: string;
  analyzedAt: string;
}

export interface ZiaMealAnalysisService {
  analyze(request: ZiaMealAnalysisRequest): Promise<ZiaMealAnalysisResult>;
  getResult(analysisId: string): Promise<ZiaMealAnalysisResult | undefined>;
}
