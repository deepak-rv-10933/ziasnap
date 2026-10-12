"use client";

import { useState } from "react";
import type { MealRecommendation } from "@/types";
import { TodayHeroCard } from "@/components/nutrition/TodayHeroCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { MealTimeline } from "@/components/meals/MealTimeline";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { RecommendationDetailSheet } from "@/features/recommendations/RecommendationDetailSheet";
import { HeroCardSkeleton, MealCardSkeleton, RecommendationCardSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useProfileQuery } from "@/hooks/useProfile";
import { useTodayQuery } from "@/hooks/useToday";
import { useRecommendationsQuery } from "@/hooks/useRecommendations";
import { useHistoryQuery } from "@/hooks/useHistory";
import { greetingForHour } from "@/lib/utils/greeting";
import { FirstSnapGuide } from "@/features/first-run/FirstSnapGuide";

export default function HomePage() {
  const [selectedRecommendation, setSelectedRecommendation] = useState<MealRecommendation | null>(null);

  const profileQuery = useProfileQuery();
  const todayQuery = useTodayQuery();
  const recommendationsQuery = useRecommendationsQuery();
  // "First run" = nothing logged in the History window (the default 14 days).
  // Only worth asking once today turns out empty — most visits skip the call.
  const todayIsEmpty = todayQuery.isSuccess && todayQuery.data.meals.length === 0;
  const historyQuery = useHistoryQuery(undefined, undefined, { enabled: todayIsEmpty });
  const isFirstRun =
    todayIsEmpty && historyQuery.isSuccess && historyQuery.data.every((day) => day.meals.length === 0);

  const firstName = profileQuery.data?.personalDetails.name.split(" ")[0];

  return (
    <div className="flex flex-col gap-7">
      <div>
        <p className="text-sm text-muted-foreground">{greetingForHour(new Date().getHours())}{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">Today</h1>
      </div>

      {todayQuery.isPending || profileQuery.isPending ? (
        <HeroCardSkeleton />
      ) : todayQuery.isError || !profileQuery.data ? (
        <ErrorState onRetry={() => todayQuery.refetch()} />
      ) : (
        <TodayHeroCard summary={todayQuery.data} goal={profileQuery.data.goal} />
      )}

      {isFirstRun ? <FirstSnapGuide /> : null}

      <section className={isFirstRun ? "hidden" : undefined}>
        <SectionHeader title="Today's meals" />
        {todayQuery.isPending ? (
          <div className="flex flex-col gap-2">
            <MealCardSkeleton />
            <MealCardSkeleton />
          </div>
        ) : todayQuery.isError ? (
          <ErrorState onRetry={() => todayQuery.refetch()} />
        ) : (
          <MealTimeline meals={todayQuery.data.meals} emptyMessage="Snap your first meal of the day to get started." />
        )}
      </section>

      <section>
        <SectionHeader title="What should you eat next?" actionHref="/recommendations" />
        {recommendationsQuery.isPending ? (
          <div className="flex gap-3 overflow-x-auto pb-1">
            <RecommendationCardSkeleton />
            <RecommendationCardSkeleton />
          </div>
        ) : recommendationsQuery.isError ? (
          <ErrorState onRetry={() => recommendationsQuery.refetch()} />
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {recommendationsQuery.data.map((recommendation) => (
              <AIRecommendationCard
                key={recommendation.id}
                recommendation={recommendation}
                onSelect={setSelectedRecommendation}
                className="w-60 shrink-0"
              />
            ))}
          </div>
        )}
      </section>

      <RecommendationDetailSheet
        recommendation={selectedRecommendation}
        onOpenChange={(open) => !open && setSelectedRecommendation(null)}
      />
    </div>
  );
}
