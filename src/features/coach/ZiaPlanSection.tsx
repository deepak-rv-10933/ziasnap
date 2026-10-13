"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkle } from "@phosphor-icons/react";
import type { MealRecommendation, MealType } from "@/types";
import { Button } from "@/components/ui/button";
import { AIRecommendationCard } from "@/components/ai/AIRecommendationCard";
import { ErrorState } from "@/components/feedback/ErrorState";
import { runCoach } from "@/lib/api/coach";
import { mealTypeFromHour } from "@/lib/utils/date";
import { MEAL_TYPE_LABEL } from "@/lib/utils/meal";
import { ZiaWorking } from "./ZiaWorking";

/**
 * AI next-meal planner: the ZiaSnap Coach agent suggests meals from what the
 * user has left today and what they actually eat, instead of fixed templates.
 */
export function ZiaPlanSection({ onSelect }: { onSelect: (recommendation: MealRecommendation) => void }) {
  const mealType: MealType = mealTypeFromHour(new Date().getHours());
  const plan = useMutation({ mutationFn: () => runCoach("plan", { mealType }) });

  return (
    <section aria-labelledby="zia-plan-title" className="mb-7">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 id="zia-plan-title" className="font-display text-lg font-semibold text-foreground">
          Ideas from Zia
        </h2>
        {plan.isSuccess ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => plan.mutate()}>
            New ideas
          </Button>
        ) : null}
      </div>

      {plan.isIdle ? (
        <div className="rounded-2xl border border-border/70 bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Zia looks at what&apos;s left today, what you usually eat and any fasting mode, then plans your {MEAL_TYPE_LABEL[mealType].toLowerCase()}.
          </p>
          <Button type="button" className="mt-3" onClick={() => plan.mutate()}>
            <Sparkle weight="fill" className="size-4" />
            Plan my {MEAL_TYPE_LABEL[mealType].toLowerCase()}
          </Button>
        </div>
      ) : plan.isPending ? (
        <ZiaWorking label={`Zia is planning your ${MEAL_TYPE_LABEL[mealType].toLowerCase()}…`} />
      ) : plan.isError ? (
        <ErrorState title="Zia couldn't plan right now" description={plan.error.message} onRetry={() => plan.mutate()} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {plan.data.map((recommendation) => (
            <AIRecommendationCard key={recommendation.id} recommendation={recommendation} onSelect={onSelect} className="w-full" />
          ))}
        </div>
      )}
    </section>
  );
}
