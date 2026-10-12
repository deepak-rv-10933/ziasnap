"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress } from "@/components/forms/OnboardingProgress";
import { GoalSelector } from "@/components/forms/GoalSelector";
import { ActivitySelector } from "@/components/forms/ActivitySelector";
import { WeightInput } from "@/components/forms/WeightInput";
import { ChipSelect } from "@/components/forms/ChipSelect";
import { GoalCard } from "@/components/nutrition/GoalCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/useUserStore";
import { calculateGoalTargets } from "@/lib/utils/goal-calculator";
import type { Sex } from "@/types";

const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

export default function GoalSetupPage() {
  const router = useRouter();
  const draft = useUserStore((state) => state.draft);
  const setPersonalDetails = useUserStore((state) => state.setPersonalDetails);
  const setGoal = useUserStore((state) => state.setGoal);
  const setActivityLevel = useUserStore((state) => state.setActivityLevel);

  const age = draft.personalDetails.age ?? 28;
  const heightCm = draft.personalDetails.heightCm ?? 170;
  const currentWeightKg = draft.personalDetails.currentWeightKg ?? 70;
  const targetWeightKg = draft.personalDetails.targetWeightKg ?? 65;

  const preview = useMemo(
    () =>
      calculateGoalTargets(
        { name: "", age, sex: draft.personalDetails.sex, heightCm, currentWeightKg, targetWeightKg },
        draft.goal,
        draft.activityLevel,
      ),
    [age, draft.personalDetails.sex, heightCm, currentWeightKg, targetWeightKg, draft.goal, draft.activityLevel],
  );

  const canContinue = age >= 13 && heightCm >= 100 && currentWeightKg >= 30 && targetWeightKg >= 30;

  return (
    <div className="flex flex-1 flex-col">
      <OnboardingProgress step={1} totalSteps={2} label="Your goal" />

      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">What&apos;s your goal?</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Zia uses this to set a personalized calorie and protein target.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        <GoalSelector value={draft.goal} onChange={setGoal} />

        <div className="grid grid-cols-2 gap-3">
          <WeightInput label="Current weight" value={currentWeightKg} onChange={(v) => setPersonalDetails({ currentWeightKg: v })} />
          <WeightInput label="Target weight" value={targetWeightKg} onChange={(v) => setPersonalDetails({ targetWeightKg: v })} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="age" className="mb-1.5">
              Age
            </Label>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              value={age}
              onChange={(event) => setPersonalDetails({ age: Number(event.target.value) || 0 })}
            />
          </div>
          <div>
            <Label htmlFor="height" className="mb-1.5">
              Height (cm)
            </Label>
            <Input
              id="height"
              type="number"
              inputMode="numeric"
              value={heightCm}
              onChange={(event) => setPersonalDetails({ heightCm: Number(event.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Sex</p>
          <ChipSelect
            options={SEX_OPTIONS}
            value={draft.personalDetails.sex}
            onChange={(sex) => setPersonalDetails({ sex })}
            aria-label="Sex"
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Activity level</p>
          <ActivitySelector value={draft.activityLevel} onChange={setActivityLevel} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Your preview</p>
          <GoalCard goal={draft.goal} targets={preview} />
        </div>
      </div>

      <div className="mt-8">
        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!canContinue}
          onClick={() => router.push("/onboarding/nutrition")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
