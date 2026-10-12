"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { MealTimeline } from "@/components/meals/MealTimeline";
import { NutritionSummary } from "@/components/meals/NutritionSummary";
import { MealCardSkeleton } from "@/components/feedback/Skeletons";
import { ErrorState } from "@/components/feedback/ErrorState";
import { EmptyState } from "@/components/feedback/EmptyState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHistoryQuery } from "@/hooks/useHistory";
import { formatDayLabel, toDateKey } from "@/lib/utils/date";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CalendarBlank } from "@phosphor-icons/react/dist/ssr";

function NoHistoryYet() {
  return (
    <EmptyState
      icon={CalendarBlank}
      title="No meals logged yet"
      description="Each meal you confirm lands here, grouped by day, so you can look back at what you ate and how it added up."
      action={
        <Button render={<Link href="/snap" />} nativeButton={false}>
          Snap a meal
        </Button>
      }
    />
  );
}

export default function HistoryPage() {
  const historyQuery = useHistoryQuery();
  const [selectedDateKey, setSelectedDateKey] = useState<string>(toDateKey(new Date()));

  const days = historyQuery.data ?? [];
  const hasAnyMeals = days.some((day) => day.meals.length > 0);
  const selectedDay = days.find((day) => day.date === selectedDateKey) ?? days[0];

  return (
    <div>
      <PageHeader title="History" subtitle="Everything you've logged, day by day." />

      <Tabs defaultValue="day">
        <TabsList className="mb-5">
          <TabsTrigger value="day">Day</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
        </TabsList>

        <TabsContent value="day" className="flex flex-col gap-5">
          {historyQuery.isPending ? (
            <>
              <MealCardSkeleton />
              <MealCardSkeleton />
            </>
          ) : historyQuery.isError ? (
            <ErrorState onRetry={() => historyQuery.refetch()} />
          ) : !hasAnyMeals ? (
            <NoHistoryYet />
          ) : (
            <>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
                {days.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => setSelectedDateKey(day.date)}
                    className={cn(
                      "flex shrink-0 flex-col items-center rounded-2xl border px-3.5 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
                      day.date === selectedDay?.date
                        ? "border-brand-turmeric bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric"
                        : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <span>{formatDayLabel(day.date)}</span>
                    <span className="mt-0.5 tabular-nums">{Math.round(day.totalNutrition.calories)} kcal</span>
                  </button>
                ))}
              </div>

              {selectedDay ? (
                <>
                  <NutritionSummary nutrition={selectedDay.totalNutrition} label={formatDayLabel(selectedDay.date)} />
                  <MealTimeline meals={selectedDay.meals} emptyMessage="No meals logged this day." />
                </>
              ) : (
                <EmptyState title="No history yet" description="Once you log meals, they'll show up here." />
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="week" className="flex flex-col gap-2">
          {historyQuery.isPending ? (
            <>
              <MealCardSkeleton />
              <MealCardSkeleton />
            </>
          ) : historyQuery.isError ? (
            <ErrorState onRetry={() => historyQuery.refetch()} />
          ) : !hasAnyMeals ? (
            <NoHistoryYet />
          ) : (
            days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelectedDateKey(day.date)}
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-card px-4 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">{formatDayLabel(day.date)}</p>
                  <p className="text-xs text-muted-foreground">{day.meals.length} meal{day.meals.length === 1 ? "" : "s"} logged</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular-nums text-foreground">
                    {Math.round(day.totalNutrition.calories)} kcal
                  </p>
                  <p
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      day.caloriePercent >= 85 && day.caloriePercent <= 115 ? "text-brand-leaf" : "text-muted-foreground",
                    )}
                  >
                    {Math.round(day.caloriePercent)}% of target
                  </p>
                </div>
              </button>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
