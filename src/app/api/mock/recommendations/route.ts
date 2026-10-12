import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import { toDateKey } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const dateKey = request.nextUrl.searchParams.get("date") ?? toDateKey(new Date());
  const recommendations = await nutritionRepository.getRecommendations(getCurrentUserId(), dateKey);
  return NextResponse.json(recommendations);
}
