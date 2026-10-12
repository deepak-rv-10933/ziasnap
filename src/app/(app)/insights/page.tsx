"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { AIInsightCard } from "@/components/ai/AIInsightCard";
import { StatBlockSkeleton, TextLineSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { useInsightsQuery } from "@/hooks/useInsights";
import { formatDayLabel } from "@/lib/utils/date";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChartLineUp } from "@phosphor-icons/react/dist/ssr";

/** Patterns need a few days of data — below this, Insights explains itself instead of showing thin stats. */
const MIN_DAYS_FOR_INSIGHTS = 3;

function InsightsWarmingUp({ daysLogged }: { daysLogged: number }) {
  const remaining = MIN_DAYS_FOR_INSIGHTS - daysLogged;
  return (
    <EmptyState
      icon={ChartLineUp}
      title={daysLogged === 0 ? "Insights start with your first meals" : `${remaining} more day${remaining === 1 ? "" : "s"} to your first insights`}
      description={`Log meals on ${MIN_DAYS_FOR_INSIGHTS} days this week and Zia will show your calorie and protein consistency, your go-to foods, and one thing worth changing.`}
      action={
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-1.5" aria-label={`${daysLogged} of ${MIN_DAYS_FOR_INSIGHTS} days logged`}>
            {Array.from({ length: MIN_DAYS_FOR_INSIGHTS }, (_, index) => (
              <span
                key={index}
                className={index < daysLogged ? "h-1.5 w-8 rounded-full bg-brand-turmeric" : "h-1.5 w-8 rounded-full bg-muted"}
              />
            ))}
          </div>
          <Button render={<Link href="/snap" />} nativeButton={false}>
            Snap a meal
          </Button>
        </div>
      }
    />
  );
}

export default function InsightsPage() {
  const insightsQuery = useInsightsQuery();

  return (
    <div>
      <PageHeader title="Insights" subtitle="Patterns from the last 7 days — and what to do about them." />

      {insightsQuery.isPending ? (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-2.5">
            <StatBlockSkeleton />
            <StatBlockSkeleton />
            <StatBlockSkeleton />
          </div>
          <TextLineSkeleton className="h-24 w-full" />
          <TextLineSkeleton className="h-24 w-full" />
        </div>
      ) : insightsQuery.isError ? (
        <ErrorState onRetry={() => insightsQuery.refetch()} />
      ) : insightsQuery.data.daysLoggedCount < MIN_DAYS_FOR_INSIGHTS ? (
        <InsightsWarmingUp daysLogged={insightsQuery.data.daysLoggedCount} />
      ) : (
        <div className="flex flex-col gap-7">
          <div>
            <p className="mb-2 text-xs text-muted-foreground">
              {formatDayLabel(insightsQuery.data.weekStartDate)} – {formatDayLabel(insightsQuery.data.weekEndDate)}
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-border/70 bg-card px-3 py-3 text-center">
                <p className="font-display text-xl font-semibold tabular-nums text-foreground">
                  {insightsQuery.data.averageCalories.toLocaleString("en-IN")}
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">Avg kcal/day</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-3 py-3 text-center">
                <p className="font-display text-xl font-semibold tabular-nums text-foreground">
                  {insightsQuery.data.averageProteinG}g
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">Avg protein/day</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-card px-3 py-3 text-center">
                <p className="font-display text-xl font-semibold tabular-nums text-foreground">
                  {insightsQuery.data.goalAdherencePercent}%
                </p>
                <p className="mt-0.5 text-xs font-medium text-muted-foreground">Goal adherence</p>
              </div>
            </div>
          </div>

          <section>
            <SectionHeader title="What to focus on" />
            {insightsQuery.data.insights.length === 0 ? (
              <EmptyState title="Nothing to flag yet" description="Keep logging meals and patterns will show up here." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {insightsQuery.data.insights.map((insight) => (
                  <AIInsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            )}
          </section>

          {insightsQuery.data.mostFrequentFoods.length > 0 ? (
            <section>
              <SectionHeader title="Frequently logged" />
              <div className="flex flex-wrap gap-2">
                {insightsQuery.data.mostFrequentFoods.map((food) => (
                  <span
                    key={food.name}
                    className="rounded-full border border-border/70 bg-card px-3.5 py-1.5 text-sm font-medium text-foreground"
                  >
                    {food.name} <span className="text-muted-foreground">× {food.count}</span>
                  </span>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
