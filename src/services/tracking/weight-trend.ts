import type { WeightEntry, WeightTrend } from "@/types";

/** Smoothing factor for the trend line: low enough to ignore water-weight swings. */
const ALPHA = 0.25;
const SLOPE_WINDOW_DAYS = 28;
const MIN_ENTRIES_FOR_PACE = 3;
const REACHED_TOLERANCE_KG = 0.3;

const DAY_MS = 86_400_000;
const toTime = (dateKey: string) => Date.parse(`${dateKey}T00:00:00Z`);
const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Weight trend and goal projection. Daily weight jumps around by a kilo or
 * more, so the projection uses an exponentially smoothed trend and a
 * least-squares slope over the last four weeks of that trend — never a
 * single day's reading.
 */
export function buildWeightTrend(entries: WeightEntry[], targetWeightKg: number, todayDateKey: string): WeightTrend {
  const sorted = [...entries].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  if (sorted.length === 0) return { entries: [], trend: [], targetWeightKg, status: "no_data" };

  let smoothed = sorted[0].weightKg;
  const trend = sorted.map((entry, index) => {
    smoothed = index === 0 ? entry.weightKg : ALPHA * entry.weightKg + (1 - ALPHA) * smoothed;
    return { dateKey: entry.dateKey, trendKg: round1(smoothed) };
  });
  const latestTrendKg = trend[trend.length - 1].trendKg;
  const base = { entries: sorted, trend, latestTrendKg, targetWeightKg };

  if (Math.abs(latestTrendKg - targetWeightKg) <= REACHED_TOLERANCE_KG) return { ...base, status: "reached" };

  const windowStart = toTime(todayDateKey) - SLOPE_WINDOW_DAYS * DAY_MS;
  const recent = trend.filter((point) => toTime(point.dateKey) >= windowStart);
  if (recent.length < MIN_ENTRIES_FOR_PACE) return { ...base, status: "too_few" };

  const xs = recent.map((point) => (toTime(point.dateKey) - windowStart) / DAY_MS);
  const ys = recent.map((point) => point.trendKg);
  const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
  const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
  const denominator = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  const slopePerDay = denominator === 0 ? 0 : xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0) / denominator;
  const weeklyChangeKg = round1(slopePerDay * 7);

  const remainingKg = targetWeightKg - latestTrendKg;
  if (Math.abs(slopePerDay) < 0.005) return { ...base, weeklyChangeKg, status: "steady" };
  if (Math.sign(slopePerDay) !== Math.sign(remainingKg)) return { ...base, weeklyChangeKg, status: "off_track" };

  const daysToGo = Math.ceil(remainingKg / slopePerDay);
  if (daysToGo > 3 * 365) return { ...base, weeklyChangeKg, status: "steady" };
  const projectedDateKey = new Date(toTime(todayDateKey) + daysToGo * DAY_MS).toISOString().slice(0, 10);
  return { ...base, weeklyChangeKg, projectedDateKey, status: "on_track" };
}
