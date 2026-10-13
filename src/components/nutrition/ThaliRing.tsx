"use client";

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { MealType } from "@/types";
import { MEAL_TYPE_LABEL } from "@/lib/utils/meal";

/** Fixed order = eating order. Colours are validated for adjacent pairs in this order (see globals.css). */
export const THALI_ORDER: MealType[] = ["breakfast", "lunch", "snack", "dinner"];
export const MEAL_STROKE: Record<MealType, string> = {
  breakfast: "var(--meal-breakfast)",
  lunch: "var(--meal-lunch)",
  snack: "var(--meal-snack)",
  dinner: "var(--meal-dinner)",
};

interface ThaliRingProps {
  /** Calories eaten per meal type today. */
  byMeal: Partial<Record<MealType, number>>;
  target: number;
  size?: number;
  overLimitStroke?: string;
  children?: React.ReactNode;
}

const GAP_PX = 3;

/**
 * Today's calories as a steel thali: a brushed-steel rim, and inside it the
 * day's track filling meal by meal, one segment per meal type in eating
 * order. Going over target spills onto an inner ring.
 */
export function ThaliRing({ byMeal, target, size = 220, overLimitStroke = "var(--brand-chili)", children }: ThaliRingProps) {
  const gradientId = useId();
  const reduceMotion = useReducedMotion();
  const center = size / 2;
  const rimWidth = 5;
  const trackWidth = 14;
  const trackRadius = center - rimWidth - 6 - trackWidth / 2;
  const circumference = 2 * Math.PI * trackRadius;

  const total = THALI_ORDER.reduce((sum, type) => sum + (byMeal[type] ?? 0), 0);
  const scale = target > 0 ? Math.min(1, target / Math.max(total, target)) : 0;
  const segments = THALI_ORDER.reduce<{ type: MealType; calories: number; start: number; length: number }[]>((list, type) => {
    const calories = byMeal[type] ?? 0;
    if (calories <= 0 || target <= 0) return list;
    const previous = list[list.length - 1];
    const start = previous ? previous.start + previous.length + GAP_PX : 0;
    const length = (calories / target) * circumference * scale;
    return [...list, { type, calories, start, length: Math.max(length - GAP_PX, 1.5) }];
  }, []);
  const overflow = target > 0 ? Math.max(0, Math.min(total / target - 1, 1)) : 0;
  const innerRadius = trackRadius - trackWidth - 2;
  const innerCircumference = 2 * Math.PI * innerRadius;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id={`${gradientId}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f4f7fa" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#8d9bab" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#dfe6ec" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#6c7b8a" stopOpacity="0.5" />
          </linearGradient>
          <radialGradient id={`${gradientId}-plate`} cx="50%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The plate and its rim */}
        <circle cx={center} cy={center} r={center - rimWidth / 2 - 1} fill={`url(#${gradientId}-plate)`} stroke={`url(#${gradientId}-rim)`} strokeWidth={rimWidth} />
        <circle cx={center} cy={center} r={trackRadius} fill="none" stroke="white" strokeOpacity={0.09} strokeWidth={trackWidth} />

        <g transform={`rotate(-90 ${center} ${center})`}>
          {segments.map((segment, index) => (
            <motion.circle
              key={segment.type}
              cx={center}
              cy={center}
              r={trackRadius}
              fill="none"
              stroke={MEAL_STROKE[segment.type]}
              strokeWidth={trackWidth}
              strokeLinecap="butt"
              strokeDashoffset={-segment.start}
              initial={reduceMotion ? false : { strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${segment.length} ${circumference}` }}
              transition={{ duration: 0.7, delay: 0.12 + index * 0.16, ease: [0.22, 1, 0.36, 1] }}
            >
              <title>{`${MEAL_TYPE_LABEL[segment.type]}: ${Math.round(segment.calories)} kcal`}</title>
            </motion.circle>
          ))}
          {overflow > 0 ? (
            <motion.circle
              cx={center}
              cy={center}
              r={innerRadius}
              fill="none"
              stroke={overLimitStroke}
              strokeWidth={5}
              strokeLinecap="round"
              strokeDasharray={innerCircumference}
              initial={reduceMotion ? false : { strokeDashoffset: innerCircumference }}
              animate={{ strokeDashoffset: innerCircumference * (1 - overflow) }}
              transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            />
          ) : null}
        </g>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

/** The ring's legend: identity is never colour alone. */
export function ThaliLegend({ byMeal }: { byMeal: Partial<Record<MealType, number>> }) {
  const present = THALI_ORDER.filter((type) => (byMeal[type] ?? 0) > 0);
  if (present.length === 0) return null;
  return (
    <ul className="mt-5 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs text-white/75" aria-label="Calories by meal">
      {present.map((type) => (
        <li key={type} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: MEAL_STROKE[type] }} aria-hidden="true" />
          {MEAL_TYPE_LABEL[type]}
          <span className="tabular-nums text-white">{Math.round(byMeal[type] ?? 0)}</span>
        </li>
      ))}
    </ul>
  );
}
