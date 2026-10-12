import { NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";

export async function GET() {
  const targets = await nutritionRepository.getGoalTargets(getCurrentUserId());
  return NextResponse.json(targets);
}

/** Recalculates targets from the user's current profile — the "Recalculate targets" action. */
export async function POST() {
  const targets = await nutritionRepository.recalculateGoalTargets(getCurrentUserId());
  return NextResponse.json(targets);
}
