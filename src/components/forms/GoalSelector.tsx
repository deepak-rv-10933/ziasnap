"use client";

import type { Goal } from "@/types";
import { TrendDown, TrendUp, Minus } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface GoalSelectorProps {
  value: Goal;
  onChange: (goal: Goal) => void;
}

const OPTIONS: { value: Goal; label: string; description: string; icon: typeof TrendDown }[] = [
  { value: "lose", label: "Lose weight", description: "A steady calorie deficit", icon: TrendDown },
  { value: "gain", label: "Gain weight", description: "A steady calorie surplus", icon: TrendUp },
  { value: "maintain", label: "Maintain weight", description: "Stay around your current weight", icon: Minus },
];

export function GoalSelector({ value, onChange }: GoalSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Goal" className="flex flex-col gap-2.5">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
              selected ? "border-brand-turmeric bg-brand-turmeric-soft" : "border-border/70 bg-card hover:bg-muted/60",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                selected ? "bg-brand-turmeric text-[#211c16]" : "bg-muted text-muted-foreground",
              )}
            >
              <Icon weight="bold" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">{option.label}</p>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
