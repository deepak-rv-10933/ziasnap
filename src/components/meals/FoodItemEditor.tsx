"use client";

import { Trash } from "@phosphor-icons/react";
import type { FoodItem } from "@/types";
import { scaleNutrition } from "@/types/nutrition";
import { MealPhoto } from "./MealPhoto";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { PortionEditor } from "./PortionEditor";
import { foodImageForItem } from "@/lib/utils/food-image";
import { Input } from "@/components/ui/input";

interface FoodItemEditorProps {
  item: FoodItem;
  onChange: (id: string, patch: Partial<FoodItem>) => void;
  onRemove: (id: string) => void;
}

export function FoodItemEditor({ item, onChange, onRemove }: FoodItemEditorProps) {
  const handleQuantityChange = (quantity: number) => {
    const isSingular = quantity === 1;
    const label = `${formatQuantity(quantity)} ${unitLabelFor(item.portion.unit, isSingular)}`;
    onChange(item.id, {
      portion: { ...item.portion, quantity, label },
      nutrition: scaleNutrition(item.perUnitNutrition, quantity),
    });
  };

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-3">
      <div className="flex gap-3">
        <MealPhoto
          src={foodImageForItem(item)}
          alt={item.name}
          aspect="square"
          className="size-14 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <Input
              value={item.name}
              onChange={(event) => onChange(item.id, { name: event.target.value })}
              aria-label="Food name"
              className="h-8 max-w-[70%] border-none bg-transparent px-0 text-sm font-semibold shadow-none focus-visible:ring-0 focus-visible:border-b focus-visible:border-brand-turmeric"
            />
            <p className="shrink-0 pt-1 text-sm font-semibold tabular-nums text-foreground">
              {Math.round(item.nutrition.calories)} kcal
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="tabular-nums">{Math.round(item.nutrition.proteinG)}g protein</span>
            <span className="tabular-nums">{Math.round(item.nutrition.carbsG)}g carbs</span>
            <span className="tabular-nums">{Math.round(item.nutrition.fatG)}g fat</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ConfidenceBadge confidence={item.confidence} />
            {item.confidence === "low" ? (
              <span className="text-xs font-medium text-muted-foreground">Review portion</span>
            ) : null}
          </div>
          {item.preparationNote ? (
            <p className="mt-1.5 text-xs text-muted-foreground italic">{item.preparationNote}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
        <PortionEditor
          quantity={item.portion.quantity}
          unitLabel={item.portion.label}
          onChange={handleQuantityChange}
        />
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Remove ${item.name}`}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-brand-chili-soft hover:text-brand-chili focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-chili/40"
        >
          <Trash className="size-4" />
        </button>
      </div>
    </div>
  );
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(1);
}

function unitLabelFor(unit: string, isSingular: boolean): string {
  const singular: Record<string, string> = {
    piece: "piece",
    bowl: "bowl",
    cup: "cup",
    plate: "plate",
    tbsp: "tbsp",
    tsp: "tsp",
    gram: "g",
    serving: "serving",
    glass: "glass",
  };
  const plural: Record<string, string> = {
    piece: "pieces",
    bowl: "bowls",
    cup: "cups",
    plate: "plates",
    tbsp: "tbsp",
    tsp: "tsp",
    gram: "g",
    serving: "servings",
    glass: "glasses",
  };
  return (isSingular ? singular[unit] : plural[unit]) ?? unit;
}
