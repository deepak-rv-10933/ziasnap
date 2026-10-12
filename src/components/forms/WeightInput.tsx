"use client";

import { Minus, Plus } from "@phosphor-icons/react";

interface WeightInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function WeightInput({ label, value, onChange, min = 30, max = 200 }: WeightInputProps) {
  const inputId = `weight-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-1 rounded-2xl border border-border/70 bg-card py-1.5 pl-1.5 pr-2.5">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
        >
          <Minus className="size-3.5" weight="bold" />
        </button>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className="w-full min-w-0 flex-1 bg-transparent text-center text-base font-semibold tabular-nums text-foreground outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="shrink-0 text-xs text-muted-foreground">kg</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          aria-label={`Increase ${label}`}
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
        >
          <Plus className="size-3.5" weight="bold" />
        </button>
      </div>
    </div>
  );
}
