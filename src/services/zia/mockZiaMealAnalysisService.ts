import type {
  ZiaMealAnalysisRequest,
  ZiaMealAnalysisResult,
  ZiaMealAnalysisService,
} from "@/types/zia";
import type { ConfidenceLevel } from "@/types";
import { MEAL_TEMPLATES, templatesFor } from "@/data/meal-templates";
import { buildFoodItem } from "@/lib/utils/food-item";
import { generateId } from "@/lib/utils/id";
import { mealTypeFromHour } from "@/lib/utils/date";

const ANALYSIS_LATENCY_MS = { min: 1600, max: 2600 };

const resultStore = new Map<string, ZiaMealAnalysisResult>();

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

function pickTemplate(request: ZiaMealAnalysisRequest) {
  const mealType = request.mealContext?.mealType ?? mealTypeFromHour(new Date().getHours());
  const isVegetarianOnly = request.userContext.dietaryPreference === "vegetarian";
  const candidates = templatesFor(mealType, isVegetarianOnly);
  const pool = candidates.length > 0 ? candidates : MEAL_TEMPLATES;
  return pool[Math.floor(Math.random() * pool.length)];
}

function jitterQuantity(quantity: number): number {
  if (quantity <= 1) return quantity;
  const delta = Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0;
  return Math.max(1, quantity + delta);
}

function overallConfidenceFrom(levels: ConfidenceLevel[]): ConfidenceLevel {
  const lowCount = levels.filter((level) => level === "low").length;
  const highCount = levels.filter((level) => level === "high").length;
  if (lowCount >= levels.length / 2) return "low";
  if (highCount === levels.length) return "high";
  return "medium";
}

/**
 * Mock stand-in for the future Zia Agent vision + nutrition-estimation API.
 * Consumers should depend on `ZiaMealAnalysisService`, not this class, so the
 * real implementation can be swapped in without touching call sites.
 */
class MockZiaMealAnalysisService implements ZiaMealAnalysisService {
  async analyze(request: ZiaMealAnalysisRequest): Promise<ZiaMealAnalysisResult> {
    await wait(randomBetween(ANALYSIS_LATENCY_MS.min, ANALYSIS_LATENCY_MS.max));

    const template = pickTemplate(request);
    const detectedItems = template.items.map((item) =>
      buildFoodItem(item.catalogId, {
        quantity: jitterQuantity(item.quantity ?? 1),
        confidence: item.confidence,
        preparationNote: item.preparationNote,
      }),
    );

    const result: ZiaMealAnalysisResult = {
      analysisId: generateId("analysis"),
      status: "completed",
      detectedItems,
      overallConfidence: overallConfidenceFrom(detectedItems.map((item) => item.confidence)),
      notes:
        template.items.some((item) => item.preparationNote !== undefined)
          ? "Oil/ghee quantity is estimated. Adjust it if this looks off."
          : undefined,
      analyzedAt: new Date().toISOString(),
    };

    resultStore.set(result.analysisId, result);
    return result;
  }

  async getResult(analysisId: string): Promise<ZiaMealAnalysisResult | undefined> {
    return resultStore.get(analysisId);
  }
}

export const ziaMealAnalysisService: ZiaMealAnalysisService = new MockZiaMealAnalysisService();
