import type { LoggingStreak } from "@/types";

function previousDay(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Days in a row with at least one logged meal. A streak isn't "broken" just
 * because today has no meal yet — it counts back from yesterday until the
 * day is over. Deliberately no penalty or guilt state.
 */
export function computeStreak(loggedDateKeys: Iterable<string>, todayDateKey: string): LoggingStreak {
  const days = new Set(loggedDateKeys);
  const loggedToday = days.has(todayDateKey);

  let currentDays = 0;
  for (let cursor = loggedToday ? todayDateKey : previousDay(todayDateKey); days.has(cursor); cursor = previousDay(cursor)) {
    currentDays += 1;
  }

  let longestDays = 0;
  for (const day of days) {
    if (days.has(previousDay(day))) continue; // only start counting at the first day of a run
    let length = 0;
    for (let cursor = day; days.has(cursor); ) {
      length += 1;
      const next = new Date(`${cursor}T00:00:00Z`);
      next.setUTCDate(next.getUTCDate() + 1);
      cursor = next.toISOString().slice(0, 10);
    }
    longestDays = Math.max(longestDays, length);
  }

  return { currentDays, longestDays, loggedToday };
}
