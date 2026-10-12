"use client";

import { motion } from "framer-motion";
import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";
import { cn } from "@/lib/utils";

interface ProteinProgressProps {
  consumed: number;
  target: number;
  className?: string;
  tone?: "light" | "dark";
}

export function ProteinProgress({ consumed, target, className, tone = "light" }: ProteinProgressProps) {
  const animatedConsumed = useAnimatedNumber(consumed);
  const percent = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const isDark = tone === "dark";

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className={cn("font-medium", isDark ? "text-white/85" : "text-foreground")}>Protein</span>
        <span className={cn("tabular-nums", isDark ? "text-white/70" : "text-muted-foreground")}>
          {Math.round(animatedConsumed)}g <span className="opacity-70">/ {Math.round(target)}g</span>
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(consumed)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-label="Protein progress"
        className={cn("h-2.5 w-full overflow-hidden rounded-full", isDark ? "bg-white/15" : "bg-muted")}
      >
        <motion.div
          className="h-full rounded-full bg-brand-leaf"
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
