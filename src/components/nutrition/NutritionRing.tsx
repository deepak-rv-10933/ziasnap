"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NutritionRingProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  trackClassName?: string;
  progressClassName?: string;
  overLimitClassName?: string;
  children?: React.ReactNode;
}

/** Circular progress arc used for the daily calorie/protein hero visual.
 * Renders a subtle overflow ring in a distinct color when `percent` exceeds
 * 100 so "over target" reads differently from "on track". */
export function NutritionRing({
  percent,
  size = 208,
  strokeWidth = 14,
  className,
  trackClassName = "text-black/10 dark:text-white/10",
  progressClassName = "text-brand-turmeric",
  overLimitClassName = "text-brand-chili",
  children,
}: NutritionRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percent, 100));
  const overflow = Math.max(0, Math.min(percent - 100, 100));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={trackClassName}
          stroke="currentColor"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={progressClassName}
          stroke="currentColor"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
        {overflow > 0 ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius - strokeWidth - 4}
            strokeWidth={Math.max(strokeWidth - 6, 4)}
            fill="none"
            strokeLinecap="round"
            className={overLimitClassName}
            stroke="currentColor"
            strokeDasharray={2 * Math.PI * (radius - strokeWidth - 4)}
            initial={{ strokeDashoffset: 2 * Math.PI * (radius - strokeWidth - 4) }}
            animate={{
              strokeDashoffset:
                2 * Math.PI * (radius - strokeWidth - 4) -
                (overflow / 100) * (2 * Math.PI * (radius - strokeWidth - 4)),
            }}
            transition={{ duration: 1, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          />
        ) : null}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
