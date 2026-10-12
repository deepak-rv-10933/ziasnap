"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { BottomSheet } from "@/components/feedback/BottomSheet";
import { MealPhoto } from "@/components/meals/MealPhoto";
import { Input } from "@/components/ui/input";
import { FOOD_CATALOG } from "@/data/food-catalog";
import { buildFoodItemFromCatalog } from "@/lib/utils/food-item";
import { resolveFoodImage } from "@/lib/utils/food-image";
import { useMealCaptureStore } from "@/stores/useMealCaptureStore";

interface AddFoodSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFoodSheet({ open, onOpenChange }: AddFoodSheetProps) {
  const [query, setQuery] = useState("");
  const addItem = useMealCaptureStore((state) => state.addItem);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = normalized
      ? FOOD_CATALOG.filter((food) => food.name.toLowerCase().includes(normalized))
      : FOOD_CATALOG;
    return matches.slice(0, 20);
  }, [query]);

  const handleAdd = (catalogId: string) => {
    const catalogFood = FOOD_CATALOG.find((food) => food.id === catalogId);
    if (!catalogFood) return;
    const item = buildFoodItemFromCatalog(catalogFood, { confidence: "high", isUserAdded: true });
    addItem(item);
    onOpenChange(false);
    setQuery("");
  };

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Add a food" className="sm:max-w-lg">
      <div className="relative mb-3">
        <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search foods: idli, dosa, paneer…"
          className="pl-9"
          autoFocus
        />
      </div>
      <ul className="flex max-h-[50vh] flex-col gap-1.5 overflow-y-auto">
        {results.map((food) => (
          <li key={food.id}>
            <button
              type="button"
              onClick={() => handleAdd(food.id)}
              className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50"
            >
              <MealPhoto src={resolveFoodImage(food.imageQuery)} alt={food.name} aspect="square" className="size-11 shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{food.name}</p>
                <p className="text-xs text-muted-foreground">
                  {food.defaultPortion.label} · {food.perUnitNutrition.calories} kcal
                </p>
              </div>
            </button>
          </li>
        ))}
        {results.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">No foods match &ldquo;{query}&rdquo;.</p>
        ) : null}
      </ul>
    </BottomSheet>
  );
}
