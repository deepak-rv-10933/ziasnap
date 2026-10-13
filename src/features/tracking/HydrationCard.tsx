"use client";

import { Drop, ArrowCounterClockwise } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { GLASS_ML } from "@/services/tracking/water";
import { useAddWaterMutation, useRemoveWaterMutation, useWaterQuery } from "@/hooks/useTracking";
import { cn } from "@/lib/utils";
import { useProfileQuery } from "@/hooks/useProfile";
import { FASTING_MODES, activeFastingMode } from "@/services/modes/fasting-modes";
import { toDateKey } from "@/lib/utils/date";

function litres(ml: number): string {
  return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : ml % 100 === 0 ? 1 : 2)} L`;
}

/** Copy stays encouraging at every level: there is no "behind" state. */
function message(totalMl: number, goalMl: number): string {
  if (totalMl === 0) return "A glass with your next meal is a good start.";
  if (totalMl >= goalMl) return "You've reached today's goal. Nice.";
  const glassesLeft = Math.ceil((goalMl - totalMl) / GLASS_ML);
  return `${glassesLeft} more glass${glassesLeft === 1 ? "" : "es"} to today's goal.`;
}

export function HydrationCard() {
  const waterQuery = useWaterQuery();
  const addWater = useAddWaterMutation();
  const removeWater = useRemoveWaterMutation();
  const profileQuery = useProfileQuery();
  const mode = profileQuery.data ? activeFastingMode(profileQuery.data.nutritionPreferences, toDateKey(new Date())) : undefined;
  const modeHint = mode ? FASTING_MODES[mode.type].waterHint : undefined;

  if (waterQuery.isPending) return <Skeleton className="h-36 w-full rounded-2xl" />;
  if (waterQuery.isError) return null;

  const { totalMl, goalMl, entries } = waterQuery.data;
  const goalGlasses = Math.round(goalMl / GLASS_ML);
  const filledGlasses = Math.min(goalGlasses, Math.floor(totalMl / GLASS_ML));
  const lastEntry = entries.at(-1);

  const add = (amountMl: number) =>
    addWater.mutate(amountMl, { onError: () => toast.error("Couldn't log that. Please try again.") });

  return (
    <section aria-labelledby="hydration-title" className="rounded-2xl border border-border/70 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="hydration-title" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Drop weight="fill" className="size-4 text-sky-600 dark:text-sky-400" aria-hidden="true" />
            Water
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">{modeHint ?? message(totalMl, goalMl)}</p>
        </div>
        <p className="shrink-0 text-right">
          <span className="font-display text-xl font-semibold tabular-nums text-foreground">{litres(totalMl)}</span>
          <span className="block text-xs text-muted-foreground">of {litres(goalMl)}</span>
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" role="img" aria-label={`${filledGlasses} of ${goalGlasses} glasses`}>
        {Array.from({ length: goalGlasses }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-6 w-4 rounded-b-md rounded-t-sm border transition-colors",
              index < filledGlasses
                ? "border-sky-600 bg-sky-500/80 dark:border-sky-400 dark:bg-sky-400/70"
                : "border-border bg-muted/50",
            )}
          />
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => add(GLASS_ML)}>
          + Glass
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={() => add(500)}>
          + Bottle (500 ml)
        </Button>
        {lastEntry && !lastEntry.id.startsWith("pending-") ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-muted-foreground"
            onClick={() => removeWater.mutate(lastEntry.id)}
            aria-label={`Undo the last ${lastEntry.amountMl} ml`}
          >
            <ArrowCounterClockwise className="size-4" />
            Undo
          </Button>
        ) : null}
      </div>
    </section>
  );
}
