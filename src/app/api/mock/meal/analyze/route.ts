import { NextRequest, NextResponse } from "next/server";
import { ziaMealAnalysisService } from "@/services/zia";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import type { MealType } from "@/types";

interface AnalyzeRequestBody {
  imageDataUrl: string;
  mealType?: MealType;
  notes?: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as AnalyzeRequestBody;
  const profile = await nutritionRepository.getProfile(getCurrentUserId());

  const result = await ziaMealAnalysisService.analyze({
    imageDataUrl: body.imageDataUrl,
    userContext: {
      dietaryPreference: profile.nutritionPreferences.dietaryPreference,
      cuisinePreference: profile.nutritionPreferences.cuisinePreference,
    },
    mealContext: {
      mealType: body.mealType,
      notes: body.notes,
    },
  });

  return NextResponse.json(result);
}
