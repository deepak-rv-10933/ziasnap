"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile } from "@/types";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { GoalSelector } from "@/components/forms/GoalSelector";
import { ActivitySelector } from "@/components/forms/ActivitySelector";
import { WeightInput } from "@/components/forms/WeightInput";
import { DietaryPreferenceSelector } from "@/components/forms/DietaryPreferenceSelector";
import { NutritionPreferenceSelector } from "@/components/forms/NutritionPreferenceSelector";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useUpdateProfileMutation } from "@/hooks/useProfile";
import { useRecalculateGoalsMutation } from "@/hooks/useGoals";

interface EditProfileSheetProps {
  profile: UserProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileSheet({ profile, open, onOpenChange }: EditProfileSheetProps) {
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Edit profile" className="sm:max-w-lg">
      {/* Keyed so the form remounts with fresh state from `profile` every time it opens,
          instead of resyncing local state from props in an effect. */}
      {open ? <EditProfileForm key={profile.updatedAt} profile={profile} onOpenChange={onOpenChange} /> : null}
    </BottomSheet>
  );
}

interface EditProfileFormProps {
  profile: UserProfile;
  onOpenChange: (open: boolean) => void;
}

function EditProfileForm({ profile, onOpenChange }: EditProfileFormProps) {
  const [personalDetails, setPersonalDetails] = useState(profile.personalDetails);
  const [goal, setGoal] = useState(profile.goal);
  const [activityLevel, setActivityLevel] = useState(profile.activityLevel);
  const [preferences, setPreferences] = useState(profile.nutritionPreferences);

  const updateProfile = useUpdateProfileMutation();
  const recalculateGoals = useRecalculateGoalsMutation();

  const handleSave = () => {
    updateProfile.mutate(
      { personalDetails, goal, activityLevel, nutritionPreferences: preferences },
      {
        onSuccess: () => {
          recalculateGoals.mutate();
          toast.success("Profile updated");
          onOpenChange(false);
        },
        onError: () => toast.error("Couldn't save your changes — please try again."),
      },
    );
  };

  return (
    <>
      <div className="flex max-h-[65vh] flex-col gap-6 overflow-y-auto pb-1">
        <div className="grid grid-cols-2 gap-3">
          <WeightInput
            label="Current weight"
            value={personalDetails.currentWeightKg}
            onChange={(v) => setPersonalDetails((p) => ({ ...p, currentWeightKg: v }))}
          />
          <WeightInput
            label="Target weight"
            value={personalDetails.targetWeightKg}
            onChange={(v) => setPersonalDetails((p) => ({ ...p, targetWeightKg: v }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="edit-age" className="mb-1.5">
              Age
            </Label>
            <Input
              id="edit-age"
              type="number"
              value={personalDetails.age}
              onChange={(event) => setPersonalDetails((p) => ({ ...p, age: Number(event.target.value) || 0 }))}
            />
          </div>
          <div>
            <Label htmlFor="edit-height" className="mb-1.5">
              Height (cm)
            </Label>
            <Input
              id="edit-height"
              type="number"
              value={personalDetails.heightCm}
              onChange={(event) => setPersonalDetails((p) => ({ ...p, heightCm: Number(event.target.value) || 0 }))}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Goal</p>
          <GoalSelector value={goal} onChange={setGoal} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Activity level</p>
          <ActivitySelector value={activityLevel} onChange={setActivityLevel} />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">Dietary preference</p>
          <DietaryPreferenceSelector
            value={preferences.dietaryPreference}
            onChange={(dietaryPreference) => setPreferences((p) => ({ ...p, dietaryPreference }))}
          />
        </div>

        <NutritionPreferenceSelector
          cuisinePreference={preferences.cuisinePreference}
          onCuisineChange={(cuisinePreference) => setPreferences((p) => ({ ...p, cuisinePreference }))}
          nutrientPriorities={preferences.nutrientPriorities}
          onToggleNutrientPriority={(priority) =>
            setPreferences((p) => ({
              ...p,
              nutrientPriorities: p.nutrientPriorities.includes(priority)
                ? p.nutrientPriorities.filter((item) => item !== priority)
                : [...p.nutrientPriorities, priority],
            }))
          }
        />

        <div>
          <Label htmlFor="edit-health-context" className="mb-1.5">
            Nutrition or health context
          </Label>
          <Textarea
            id="edit-health-context"
            value={preferences.healthContext ?? ""}
            onChange={(event) => setPreferences((p) => ({ ...p, healthContext: event.target.value }))}
            rows={3}
          />
        </div>
      </div>

      <Button type="button" className="mt-4 w-full" onClick={handleSave} disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Saving…" : "Save changes"}
      </Button>
    </>
  );
}
