import type { ZiaMealAnalysisService } from "@/types/zia";
import { ziaMealAnalysisService as mockService } from "./mockZiaMealAnalysisService";
import { realZiaMealAnalysisService } from "./realZiaMealAnalysisService";

/**
 * Single import point for the app: swaps between the mock analyzer and the
 * real deployed Zia Agent (see ziasnap-zia-agent memory for the agent/org
 * IDs) based on ZIA_MEAL_ANALYZE_FUNCTION_URL. No other file should import
 * mockZiaMealAnalysisService or realZiaMealAnalysisService directly.
 */
export const ziaMealAnalysisService: ZiaMealAnalysisService = process.env
  .ZIA_MEAL_ANALYZE_FUNCTION_URL
  ? realZiaMealAnalysisService
  : mockService;
