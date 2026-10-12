import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import type { ProfileUpdateInput } from "@/services/nutrition/NutritionRepository";

export async function GET() {
  const profile = await nutritionRepository.getProfile(getCurrentUserId());
  return NextResponse.json(profile);
}

export async function PATCH(request: NextRequest) {
  const input = (await request.json()) as ProfileUpdateInput;
  const profile = await nutritionRepository.updateProfile(getCurrentUserId(), input);
  return NextResponse.json(profile);
}
