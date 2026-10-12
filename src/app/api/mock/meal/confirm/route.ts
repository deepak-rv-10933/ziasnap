import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import type { ConfirmMealInput } from "@/services/nutrition/NutritionRepository";

type ConfirmMealRequestBody = Omit<ConfirmMealInput, "userId">;

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ConfirmMealRequestBody;
  const meal = await nutritionRepository.confirmMeal({ ...body, userId: getCurrentUserId() });
  return NextResponse.json(meal);
}
