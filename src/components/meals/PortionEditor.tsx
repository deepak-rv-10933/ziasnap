"use client";

import { Minus, Plus } from "@phosphor-icons/react";

interface PortionEditorProps {
  quantity: number;
  unitLabel: string;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function PortionEditor({ quantity, unitLabel, onChange, min = 0.5, max = 12, step = 0.5 }: PortionEditorProps) {
  const decrease = () => onChange(Math.max(min, Math.round((quantity - step) * 10) / 10));
  const increase = () => onChange(Math.min(max, Math.round((quantity + step) * 10) / 10));

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-background px-1.5 py-1.5">
      <button
        type="button"
        onClick={decrease}
        disabled={quantity <= min}
        aria-label={`Decrease quantity`}
        className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
      >
        <Minus className="size-3.5" weight="bold" />
      </button>
      <span className="min-w-16 text-center text-sm font-medium tabular-nums" aria-live="polite">
        {unitLabel}
      </span>
      <button
        type="button"
        onClick={increase}
        disabled={quantity >= max}
        aria-label={`Increase quantity`}
        className="flex size-7 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
      >
        <Plus className="size-3.5" weight="bold" />
      </button>
    </div>
  );
}
