"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { GoalCard } from "@/components/nutrition/GoalCard";
import { Button } from "@/components/ui/button";
import { HeroCardSkeleton, TextLineSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EditProfileSheet } from "@/features/profile/EditProfileSheet";
import { WeightTrendCard } from "@/features/tracking/WeightTrendCard";
import { FastingModeCard } from "@/features/modes/FastingModeCard";
import { useProfileQuery } from "@/hooks/useProfile";
import { useGoalTargetsQuery, useRecalculateGoalsMutation } from "@/hooks/useGoals";
import { ACTIVITY_LABEL, CUISINE_LABEL, DIETARY_LABEL } from "@/lib/utils/profile-labels";

export default function ProfilePage() {
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useProfileQuery();
  const goalsQuery = useGoalTargetsQuery();
  const recalculateGoals = useRecalculateGoalsMutation();

  const handleRecalculate = () => {
    recalculateGoals.mutate(undefined, {
      onSuccess: () => toast.success("Targets recalculated"),
      onError: () => toast.error("Couldn't recalculate targets"),
    });
  };

  if (profileQuery.isPending || goalsQuery.isPending) {
    return (
      <div className="flex flex-col gap-5">
        <TextLineSkeleton className="h-8 w-40" />
        <HeroCardSkeleton />
      </div>
    );
  }

  if (profileQuery.isError || goalsQuery.isError || !profileQuery.data || !goalsQuery.data) {
    return <ErrorState onRetry={() => profileQuery.refetch()} />;
  }

  const profile = profileQuery.data;
  const { personalDetails, nutritionPreferences } = profile;

  return (
    <div className="flex flex-col gap-7 pb-6">
      <PageHeader
        title={personalDetails.name}
        subtitle={`${personalDetails.age} yrs · ${personalDetails.heightCm} cm`}
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        }
      />

      <section>
        <SectionHeader title="Goal" />
        <GoalCard goal={profile.goal} targets={goalsQuery.data} />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={handleRecalculate}
          disabled={recalculateGoals.isPending}
        >
          {recalculateGoals.isPending ? "Recalculating…" : "Recalculate targets"}
        </Button>
      </section>

      <WeightTrendCard />

      <FastingModeCard />

      <section>
        <SectionHeader title="Preferences" />
        <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card p-4 text-sm">
          <Row label="Activity level" value={ACTIVITY_LABEL[profile.activityLevel]} />
          <Row label="Dietary preference" value={DIETARY_LABEL[nutritionPreferences.dietaryPreference]} />
          <Row label="Cuisine" value={CUISINE_LABEL[nutritionPreferences.cuisinePreference]} />
          {nutritionPreferences.nutrientPriorities.length > 0 ? (
            <Row label="Nutrient priorities" value={nutritionPreferences.nutrientPriorities.join(", ")} />
          ) : null}
        </div>
        {nutritionPreferences.healthContext ? (
          <p className="mt-2 text-sm text-muted-foreground">{nutritionPreferences.healthContext}</p>
        ) : null}
      </section>

      <EditProfileSheet profile={profile} open={editOpen} onOpenChange={setEditOpen} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}
