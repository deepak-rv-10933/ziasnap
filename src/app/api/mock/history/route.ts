import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import { daysAgoKey, toDateKey } from "@/lib/utils/date";

export async function GET(request: NextRequest) {
  const endDateKey = request.nextUrl.searchParams.get("end") ?? toDateKey(new Date());
  const startDateKey = request.nextUrl.searchParams.get("start") ?? daysAgoKey(13, new Date(endDateKey));
  const history = await nutritionRepository.getHistory(getCurrentUserId(), { startDateKey, endDateKey });
  return NextResponse.json(history);
}
