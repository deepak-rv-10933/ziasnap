"use client";

import { useState } from "react";
import { Trash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteWeightMutation, useLogWeightMutation, useWeightTrendQuery } from "@/hooks/useTracking";
import { toDateKey } from "@/lib/utils/date";
import type { WeightTrend } from "@/types";
import { WeightChart } from "./WeightChart";

function longDate(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Plain-language read of the trend. Encouraging, never alarmed. */
function summary(trend: WeightTrend): string {
  const weekly = Math.abs(trend.weeklyChangeKg ?? 0).toFixed(1);
  switch (trend.status) {
    case "no_data":
      return "Log your weight once or twice a week to see your trend.";
    case "too_few":
      return "A few more weigh-ins and your trend line will appear.";
    case "reached":
      return `You're at your ${trend.targetWeightKg} kg target. The goal now is to hold it steady.`;
    case "steady":
      return `Holding steady around ${trend.latestTrendKg} kg.`;
    case "off_track":
      return `Your trend is moving about ${weekly} kg a week away from ${trend.targetWeightKg} kg. A small change this week can turn it.`;
    case "on_track":
      return `${(trend.weeklyChangeKg ?? 0) < 0 ? "Losing" : "Gaining"} about ${weekly} kg a week. At this pace you'd reach ${trend.targetWeightKg} kg around ${longDate(trend.projectedDateKey!)}.`;
  }
}

export function WeightTrendCard() {
  const trendQuery = useWeightTrendQuery();
  const logWeight = useLogWeightMutation();
  const deleteWeight = useDeleteWeightMutation();
  const [value, setValue] = useState("");
  const [showTable, setShowTable] = useState(false);
  const todayDateKey = toDateKey(new Date());

  if (trendQuery.isPending) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (trendQuery.isError) return null;
  const trend = trendQuery.data;

  const weightKg = Number(value);
  const valid = value !== "" && weightKg >= 25 && weightKg <= 300;
  const loggedToday = trend.entries.some((entry) => entry.dateKey === todayDateKey);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;
    logWeight.mutate(weightKg, {
      onSuccess: () => {
        setValue("");
        toast.success("Weight logged");
      },
      onError: () => toast.error("Couldn't log your weight. Please try again."),
    });
  };

  return (
    <section aria-labelledby="weight-title" className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="weight-title" className="text-sm font-semibold text-foreground">
          Weight trend
        </h2>
        {trend.latestTrendKg !== undefined ? (
          <p className="text-xs text-muted-foreground">
            Target <span className="font-semibold tabular-nums text-foreground">{trend.targetWeightKg} kg</span>
          </p>
        ) : null}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{summary(trend)}</p>

      {trend.entries.length >= 2 ? (
        <div className="mt-3">
          <WeightChart trend={trend} todayDateKey={todayDateKey} />
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-3 flex items-center gap-2">
        <label htmlFor="weight-input" className="sr-only">
          Today&apos;s weight in kilograms
        </label>
        <div className="relative w-28">
          <Input
            id="weight-input"
            inputMode="decimal"
            type="number"
            step="0.1"
            min={25}
            max={300}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={trend.entries.at(-1) ? String(trend.entries.at(-1)!.weightKg) : "70.0"}
            className="pr-8"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kg</span>
        </div>
        <Button type="submit" size="sm" disabled={!valid || logWeight.isPending}>
          {loggedToday ? "Update today" : "Log today"}
        </Button>
        {trend.entries.length > 0 ? (
          <button
            type="button"
            onClick={() => setShowTable((current) => !current)}
            className="ml-auto text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            aria-expanded={showTable}
          >
            {showTable ? "Hide readings" : "All readings"}
          </button>
        ) : null}
      </form>

      {showTable ? (
        <table className="mt-3 w-full text-sm">
          <caption className="sr-only">Every weigh-in, newest first</caption>
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1.5 font-medium">Date</th>
              <th className="py-1.5 text-right font-medium">Weighed</th>
              <th className="py-1.5 text-right font-medium">Trend</th>
              <th className="w-10" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {[...trend.entries].reverse().map((entry) => (
              <tr key={entry.id} className="border-t border-border/60">
                <td className="py-1.5 text-foreground">{longDate(entry.dateKey)}</td>
                <td className="py-1.5 text-right tabular-nums text-foreground">{entry.weightKg} kg</td>
                <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                  {trend.trend.find((point) => point.dateKey === entry.dateKey)?.trendKg} kg
                </td>
                <td className="py-1.5 text-right">
                  <button
                    type="button"
                    onClick={() => deleteWeight.mutate(entry.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete the ${longDate(entry.dateKey)} reading`}
                  >
                    <Trash className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}
