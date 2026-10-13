"use client";

import { Flame } from "@phosphor-icons/react";
import { useStreakQuery } from "@/hooks/useTracking";

/**
 * A quiet acknowledgement, never a nag: shows only once there's a streak,
 * and an unlogged today reads as "keep it going", not "you're about to lose it".
 */
export function StreakChip() {
  const streakQuery = useStreakQuery();
  const streak = streakQuery.data;
  if (!streak || streak.currentDays < 2) return null;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-turmeric-soft px-2.5 py-1 text-xs font-semibold text-brand-tamarind dark:text-brand-turmeric">
      <Flame weight="fill" className="size-3.5" aria-hidden="true" />
      {streak.currentDays}-day streak
      {streak.loggedToday ? null : <span className="font-normal text-muted-foreground"> · log today to keep it going</span>}
    </span>
  );
}
