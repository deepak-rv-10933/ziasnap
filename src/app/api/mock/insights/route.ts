import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import { daysAgoKey } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const weekStart = request.nextUrl.searchParams.get("weekStart") ?? daysAgoKey(6);
  const insights = await nutritionRepository.getInsights(getCurrentUserId(), weekStart);
  return NextResponse.json(insights);
}
