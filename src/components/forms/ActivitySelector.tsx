"use client";

import type { ActivityLevel } from "@/types";
import { cn } from "@/lib/utils";

interface ActivitySelectorProps {
  value: ActivityLevel;
  onChange: (level: ActivityLevel) => void;
}

const OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise, desk job" },
  { value: "lightly_active", label: "Lightly active", description: "Light exercise 1-3 days/week" },
  { value: "moderately_active", label: "Moderately active", description: "Moderate exercise 3-5 days/week" },
  { value: "very_active", label: "Very active", description: "Hard exercise 6-7 days/week" },
  { value: "extremely_active", label: "Extremely active", description: "Physical job or twice-daily training" },
];

export function ActivitySelector({ value, onChange }: ActivitySelectorProps) {
  return (
    <div role="radiogroup" aria-label="Activity level" className="flex flex-col gap-2">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
              selected ? "border-brand-turmeric bg-brand-turmeric-soft" : "border-border/70 bg-card hover:bg-muted/60",
            )}
          >
            <p className="text-sm font-semibold text-foreground">{option.label}</p>
            <p className="text-xs text-muted-foreground">{option.description}</p>
          </button>
        );
      })}
    </div>
  );
}
