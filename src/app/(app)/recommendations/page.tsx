"use client";

import { useState } from "react";
import type { MealRecommendation } from "@/types";
import { PageHeader } from "@/components/layout/PageHeader";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { RecommendationDetailSheet } from "@/features/recommendations/RecommendationDetailSheet";
import { RecommendationCardSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useRecommendationsQuery } from "@/hooks/useRecommendations";

export default function RecommendationsPage() {
  const [selected, setSelected] = useState<MealRecommendation | null>(null);
  const recommendationsQuery = useRecommendationsQuery();

  return (
    <div>
      <PageHeader title="What should you eat next?" subtitle="Personalized for your remaining calories and protein today." backHref="/home" />

      {recommendationsQuery.isPending ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <RecommendationCardSkeleton />
          <RecommendationCardSkeleton />
          <RecommendationCardSkeleton />
        </div>
      ) : recommendationsQuery.isError ? (
        <ErrorState onRetry={() => recommendationsQuery.refetch()} />
      ) : recommendationsQuery.data.length === 0 ? (
        <EmptyState title="No recommendations yet" description="Log a meal or two so Zia can tailor suggestions to your day." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {recommendationsQuery.data.map((recommendation) => (
            <AIRecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onSelect={setSelected}
              className="w-full"
            />
          ))}
        </div>
      )}

      <RecommendationDetailSheet recommendation={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
