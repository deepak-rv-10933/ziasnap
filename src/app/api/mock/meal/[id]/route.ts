import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import type { UpdateMealInput } from "@/services/nutrition/NutritionRepository";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const meal = await nutritionRepository.getMeal(getCurrentUserId(), id);
  if (!meal) {
    return NextResponse.json({ error: "Meal not found" }, { status: 404 });
  }
  return NextResponse.json(meal);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const input = (await request.json()) as UpdateMealInput;
  const meal = await nutritionRepository.updateMeal(getCurrentUserId(), id, input);
  return NextResponse.json(meal);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await nutritionRepository.deleteMeal(getCurrentUserId(), id);
  return NextResponse.json({ success: true });
}
