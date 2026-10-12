import { NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";

/** Mock account deletion: resets the demo store (there is no real account to remove). */
export async function DELETE() {
  await nutritionRepository.deleteUserData(getCurrentUserId());
  return NextResponse.json({ success: true });
}
