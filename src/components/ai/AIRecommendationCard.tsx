"use client";

import type { MealRecommendation } from "@/types";
import { MealPhoto } from "@/components/meals/MealPhoto";
import { resolveFoodImage } from "@/lib/utils/food-image";
import { REASON_TAG_LABEL } from "@/lib/utils/recommendation";
import { cn } from "@/lib/utils";

interface AIRecommendationCardProps {
  recommendation: MealRecommendation;
  onSelect: (recommendation: MealRecommendation) => void;
  className?: string;
}

export function AIRecommendationCard({ recommendation, onSelect, className }: AIRecommendationCardProps) {
  const primaryTag = recommendation.reasonTags[0];

  return (
    <button
      type="button"
      onClick={() => onSelect(recommendation)}
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card text-left transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
        className,
      )}
    >
      <MealPhoto src={resolveFoodImage(recommendation.imageQuery)} alt={recommendation.name} aspect="video" className="rounded-b-none" />
      <div className="flex flex-1 flex-col p-3.5">
        {primaryTag ? (
          <span className="mb-1.5 inline-flex w-fit items-center rounded-full bg-brand-leaf-soft px-2 py-0.5 text-[0.6875rem] font-semibold text-brand-leaf">
            {REASON_TAG_LABEL[primaryTag]}
          </span>
        ) : null}
        <p className="text-sm font-semibold leading-snug text-foreground">{recommendation.name}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{recommendation.whyItFits}</p>
        <div className="mt-auto flex items-center gap-3 pt-3 text-xs font-medium text-foreground">
          <span className="tabular-nums">{Math.round(recommendation.nutrition.calories)} kcal</span>
          <span className="tabular-nums text-brand-leaf">{Math.round(recommendation.nutrition.proteinG)}g protein</span>
        </div>
      </div>
    </button>
  );
}
