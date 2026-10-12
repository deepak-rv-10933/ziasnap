import { NextRequest, NextResponse } from "next/server";
import { nutritionRepository } from "@/services/nutrition/mockNutritionRepository";
import { getCurrentUserId } from "@/lib/api/server-context";
import type { ProfileUpdateInput } from "@/services/nutrition/NutritionRepository";

type OnboardingRequestBody = ProfileUpdateInput;

/**
 * Completes onboarding: writes the collected profile/preferences, then
 * recalculates and returns the resulting goal targets in one round trip so
 * the final onboarding step can show a target preview immediately.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as OnboardingRequestBody;
  const userId = getCurrentUserId();

  const profile = await nutritionRepository.updateProfile(userId, { ...body, completeOnboarding: true });
  const targets = await nutritionRepository.recalculateGoalTargets(userId);

  return NextResponse.json({ profile, targets });
}
