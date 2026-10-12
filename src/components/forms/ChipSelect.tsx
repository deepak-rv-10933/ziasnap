"use client";

import { cn } from "@/lib/utils";

interface ChipOption<T extends string> {
  value: T;
  label: string;
}

interface ChipSelectProps<T extends string> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  "aria-label"?: string;
}

export function ChipSelect<T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: ChipSelectProps<T>) {
  return (
    <div role="radiogroup" aria-label={rest["aria-label"]} className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
            value === option.value
              ? "border-brand-turmeric bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric"
              : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

type ChipMultiOption = string | { value: string; label: string };

interface ChipMultiSelectProps {
  options: ChipMultiOption[];
  values: string[];
  onToggle: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function ChipMultiSelect({ options, values, onToggle, className, ...rest }: ChipMultiSelectProps) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));

  return (
    <div aria-label={rest["aria-label"]} className={cn("flex flex-wrap gap-2", className)}>
      {normalized.map((option) => {
        const selected = values.includes(option.value);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onToggle(option.value)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
              selected
                ? "border-brand-leaf bg-brand-leaf-soft text-brand-leaf"
                : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
