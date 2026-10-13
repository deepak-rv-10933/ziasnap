"use client";

import { useId, useMemo, useRef, useState } from "react";
import type { WeightTrend } from "@/types";

const WIDTH = 320;
const HEIGHT = 150;
const PAD = { top: 14, right: 44, bottom: 22, left: 30 };
const DAY_MS = 86_400_000;

const toTime = (dateKey: string) => Date.parse(`${dateKey}T00:00:00Z`);
const shortDate = (dateKey: string) =>
  new Date(`${dateKey}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

function niceTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span <= 3 ? 1 : span <= 8 ? 2 : 5;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max; value += step) ticks.push(value);
  return ticks;
}

/**
 * Single-series weight chart: the smoothed trend is the line (the thing to
 * read), daily readings are small muted dots (the noise it smooths), the
 * target is a labelled hairline. Hover, touch and arrow keys move a
 * crosshair that snaps to the nearest weigh-in.
 */
export function WeightChart({ trend, todayDateKey }: { trend: WeightTrend; todayDateKey: string }) {
  const titleId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const geometry = useMemo(() => {
    const { entries, trend: line, targetWeightKg } = trend;
    const start = toTime(entries[0].dateKey);
    const end = Math.max(toTime(todayDateKey), toTime(entries[entries.length - 1].dateKey), start + 7 * DAY_MS);
    const values = [...entries.map((entry) => entry.weightKg), targetWeightKg];
    const min = Math.floor(Math.min(...values) - 0.5);
    const max = Math.ceil(Math.max(...values) + 0.5);

    const x = (dateKey: string) => PAD.left + ((toTime(dateKey) - start) / (end - start)) * (WIDTH - PAD.left - PAD.right);
    const y = (kg: number) => PAD.top + ((max - kg) / (max - min)) * (HEIGHT - PAD.top - PAD.bottom);

    return {
      x,
      y,
      ticks: niceTicks(min, max),
      path: line.map((point, index) => `${index === 0 ? "M" : "L"}${x(point.dateKey).toFixed(1)},${y(point.trendKg).toFixed(1)}`).join(" "),
      startLabel: shortDate(entries[0].dateKey),
      endLabel: shortDate(new Date(end).toISOString().slice(0, 10)),
    };
  }, [trend, todayDateKey]);

  const { entries, trend: line, targetWeightKg } = trend;
  const last = line[line.length - 1];

  const nearestIndex = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const svgX = ((clientX - rect.left) / rect.width) * WIDTH;
    let best = 0;
    entries.forEach((entry, index) => {
      if (Math.abs(geometry.x(entry.dateKey) - svgX) < Math.abs(geometry.x(entries[best].dateKey) - svgX)) best = index;
    });
    return best;
  };

  const active = activeIndex !== null ? entries[activeIndex] : null;
  const activeTrend = active ? line.find((point) => point.dateKey === active.dateKey) : null;
  const tooltipLeft = active ? Math.min(Math.max((geometry.x(active.dateKey) / WIDTH) * 100, 18), 82) : 0;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-pan-y select-none overflow-visible focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50 rounded-lg"
        role="img"
        aria-labelledby={titleId}
        tabIndex={0}
        onPointerMove={(event) => setActiveIndex(nearestIndex(event.clientX))}
        onPointerDown={(event) => setActiveIndex(nearestIndex(event.clientX))}
        onPointerLeave={() => setActiveIndex(null)}
        onBlur={() => setActiveIndex(null)}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          setActiveIndex((current) => {
            const base = current ?? entries.length - 1;
            return Math.min(entries.length - 1, Math.max(0, base + (event.key === "ArrowRight" ? 1 : -1)));
          });
        }}
      >
        <title id={titleId}>
          {`Weight trend from ${geometry.startLabel}: now about ${last.trendKg} kg, target ${targetWeightKg} kg. Use the arrow keys to read each weigh-in.`}
        </title>

        {geometry.ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={geometry.y(tick)} y2={geometry.y(tick)} className="stroke-border" strokeWidth={1} />
            <text x={PAD.left - 6} y={geometry.y(tick)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[9px] tabular-nums">
              {tick}
            </text>
          </g>
        ))}

        {/* Target: a labelled reference hairline in text ink, not a series colour. */}
        <line
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={geometry.y(targetWeightKg)}
          y2={geometry.y(targetWeightKg)}
          className="stroke-foreground/45"
          strokeWidth={1}
        />
        <text x={WIDTH - PAD.right + 4} y={geometry.y(targetWeightKg)} dy="0.32em" className="fill-muted-foreground text-[9px] font-semibold">
          Target
        </text>

        {entries.map((entry, index) => (
          <circle
            key={entry.id}
            cx={geometry.x(entry.dateKey)}
            cy={geometry.y(entry.weightKg)}
            r={index === activeIndex ? 4 : 2.5}
            className={index === activeIndex ? "fill-foreground stroke-card" : "fill-muted-foreground/45"}
            strokeWidth={index === activeIndex ? 2 : 0}
          />
        ))}

        <path d={geometry.path} fill="none" className="stroke-chart-trend" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={geometry.x(last.dateKey)} cy={geometry.y(last.trendKg)} r={4} className="fill-chart-trend stroke-card" strokeWidth={2} />
        <text x={geometry.x(last.dateKey) + 7} y={geometry.y(last.trendKg)} dy="0.32em" className="fill-foreground text-[10px] font-semibold tabular-nums">
          {last.trendKg} kg
        </text>

        {active ? (
          <line
            x1={geometry.x(active.dateKey)}
            x2={geometry.x(active.dateKey)}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            className="stroke-foreground/40"
            strokeWidth={1}
          />
        ) : null}

        <text x={PAD.left} y={HEIGHT - 6} className="fill-muted-foreground text-[9px]">
          {geometry.startLabel}
        </text>
        <text x={WIDTH - PAD.right} y={HEIGHT - 6} textAnchor="end" className="fill-muted-foreground text-[9px]">
          {geometry.endLabel}
        </text>
      </svg>

      {active && activeTrend ? (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-border/70 bg-popover px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: `${tooltipLeft}%` }}
          role="status"
        >
          <p className="font-semibold text-foreground">{shortDate(active.dateKey)}</p>
          <p className="tabular-nums text-foreground">{active.weightKg} kg weighed</p>
          <p className="tabular-nums text-muted-foreground">Trend {activeTrend.trendKg} kg</p>
        </div>
      ) : null}
    </div>
  );
}
