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
import { ZiaPlanSection } from "@/features/coach/ZiaPlanSection";
import Link from "next/link";
import { ForkKnife } from "@phosphor-icons/react";

export default function RecommendationsPage() {
  const [selected, setSelected] = useState<MealRecommendation | null>(null);
  const recommendationsQuery = useRecommendationsQuery();

  return (
    <div>
      <PageHeader title="What should you eat next?" subtitle="Personalized for your remaining calories and protein today." backHref="/home" />

      <ZiaPlanSection onSelect={setSelected} />

      <Link
        href="/eating-out"
        className="mb-7 flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-4 py-3.5 transition-colors hover:bg-muted/60"
      >
        <ForkKnife className="size-5 shrink-0 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
        <span>
          <span className="block text-sm font-semibold text-foreground">Eating out?</span>
          <span className="block text-xs text-muted-foreground">Snap the menu and Zia picks what fits your day.</span>
        </span>
      </Link>

      <h2 className="mb-3 font-display text-lg font-semibold text-foreground">Quick picks</h2>

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
