"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Sparkle, Trophy } from "@phosphor-icons/react";
import type { WeeklyRecap } from "@/types";
import { Button } from "@/components/ui/button";
import { latestWeeklyRecap, runCoach } from "@/lib/api/coach";
import { ZiaWorking } from "./ZiaWorking";

const RECAP_KEY = ["coach", "weekly"] as const;

/**
 * Zia's weekly recap: one real win and one concrete thing to change. A
 * scheduled job writes it every Sunday for signed-in users; anyone can ask
 * for this week's version on demand.
 */
export function WeeklyRecapCard() {
  const queryClient = useQueryClient();
  const stored = useQuery({ queryKey: RECAP_KEY, queryFn: latestWeeklyRecap, staleTime: 5 * 60_000 });
  const generate = useMutation({
    mutationFn: () => runCoach("weekly"),
    onSuccess: (recap) => queryClient.setQueryData<WeeklyRecap | null>(RECAP_KEY, recap),
  });
  const recap = stored.data ?? null;

  if (generate.isPending) return <ZiaWorking label="Zia is writing your weekly recap…" />;

  if (!recap) {
    return (
      <section className="rounded-2xl border border-border/70 bg-card p-4" aria-labelledby="recap-title">
        <h2 id="recap-title" className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Sparkle weight="fill" className="size-4 text-brand-turmeric" aria-hidden="true" />
          Your weekly recap
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every Sunday Zia writes a short recap of your week with one thing worth changing. Want this week&apos;s now?
        </p>
        {generate.isError ? <p className="mt-2 text-sm text-destructive">{generate.error.message}</p> : null}
        <Button type="button" size="sm" className="mt-3" onClick={() => generate.mutate()}>
          Write my recap
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-brand-turmeric/40 bg-card p-4" aria-labelledby="recap-title">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-tamarind dark:text-brand-turmeric">Zia&apos;s weekly recap</p>
      <h2 id="recap-title" className="mt-1 font-display text-lg font-semibold text-foreground">
        {recap.headline}
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{recap.summary}</p>
      <div className="mt-3 flex flex-col gap-2">
        <p className="flex gap-2 rounded-xl bg-brand-leaf-soft px-3 py-2 text-sm text-foreground">
          <Trophy weight="fill" className="mt-0.5 size-4 shrink-0 text-brand-leaf" aria-hidden="true" />
          <span>{recap.win}</span>
        </p>
        <p className="flex gap-2 rounded-xl bg-brand-turmeric-soft px-3 py-2 text-sm text-foreground">
          <ArrowRight weight="bold" className="mt-0.5 size-4 shrink-0 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
          <span>
            <span className="font-semibold">This week, try:</span> {recap.oneChange}
          </span>
        </p>
      </div>
      <Button type="button" variant="ghost" size="sm" className="mt-2 text-muted-foreground" onClick={() => generate.mutate()}>
        Refresh
      </Button>
    </section>
  );
}
