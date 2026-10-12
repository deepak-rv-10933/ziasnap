import type {
  ZiaMealAnalysisRequest,
  ZiaMealAnalysisResult,
  ZiaMealAnalysisService,
} from "@/types/zia";

/**
 * Real implementation backed by the deployed Catalyst function
 * `ziasnap-meal-analyze`, which in turn calls the deployed Zia Agent
 * "ZiaSnap Meal Analyzer". Selected instead of the mock when
 * ZIA_MEAL_ANALYZE_FUNCTION_URL is set — see services/zia/index.ts.
 */

const resultStore = new Map<string, ZiaMealAnalysisResult>();

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = /^data:(.+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("imageDataUrl must be a base64 data URL");
  return { mimeType: match[1], buffer: Buffer.from(match[2], "base64") };
}

class RealZiaMealAnalysisService implements ZiaMealAnalysisService {
  async analyze(request: ZiaMealAnalysisRequest): Promise<ZiaMealAnalysisResult> {
    const functionUrl = process.env.ZIA_MEAL_ANALYZE_FUNCTION_URL;
    if (!functionUrl) {
      throw new Error("ZIA_MEAL_ANALYZE_FUNCTION_URL is not configured");
    }

    const { buffer, mimeType } = dataUrlToBuffer(request.imageDataUrl);
    const extension = mimeType.split("/")[1] || "jpg";

    const form = new FormData();
    form.append("photo", new Blob([new Uint8Array(buffer)], { type: mimeType }), `meal.${extension}`);
    if (request.mealContext?.mealType) {
      form.append("mealType", request.mealContext.mealType);
    }

    const response = await fetch(functionUrl, { method: "POST", body: form });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`Meal analysis function failed: ${response.status} ${JSON.stringify(body)}`);
    }

    const result = body as ZiaMealAnalysisResult;
    resultStore.set(result.analysisId, result);
    return result;
  }

  async getResult(analysisId: string): Promise<ZiaMealAnalysisResult | undefined> {
    return resultStore.get(analysisId);
  }
}

export const realZiaMealAnalysisService: ZiaMealAnalysisService = new RealZiaMealAnalysisService();
