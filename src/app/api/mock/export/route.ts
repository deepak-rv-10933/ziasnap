import { NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";

export async function GET() {
  const data = await nutritionRepository.exportUserData(getCurrentUserId());
  return NextResponse.json(data);
}
