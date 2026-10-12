"use client";

import type { MealType } from "@/types";
import { MEAL_TYPE_LABEL } from "@/lib/utils/meal";
import { cn } from "@/lib/utils";

const TYPES: MealType[] = ["breakfast", "lunch", "snack", "dinner"];

interface MealTypeSelectorProps {
  value: MealType;
  onChange: (type: MealType) => void;
  className?: string;
}

export function MealTypeSelector({ value, onChange, className }: MealTypeSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Meal type" className={cn("flex gap-1.5 overflow-x-auto", className)}>
      {TYPES.map((type) => (
        <button
          key={type}
          type="button"
          role="radio"
          aria-checked={value === type}
          onClick={() => onChange(type)}
          className={cn(
            "shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
            value === type
              ? "bg-brand-tamarind text-white"
              : "bg-muted text-muted-foreground hover:text-foreground",
          )}
        >
          {MEAL_TYPE_LABEL[type]}
        </button>
      ))}
    </div>
  );
}
