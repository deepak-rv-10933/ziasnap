import type { FoodItem } from "@/types";
import { MealPhoto } from "./MealPhoto";
import { EstimateStatusBadge } from "./EstimateStatusBadge";
import { foodImageForItem } from "@/lib/utils/food-image";

interface FoodItemCardProps {
  item: FoodItem;
}

export function FoodItemCard({ item }: FoodItemCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border/70 bg-card p-3">
      <MealPhoto src={foodImageForItem(item)} alt={item.name} aspect="square" className="size-14 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{item.name}</p>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {Math.round(item.nutrition.calories)} kcal
          </p>
        </div>
        <p className="text-xs text-muted-foreground">{item.portion.label}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="tabular-nums">{Math.round(item.nutrition.proteinG)}g protein</span>
          <span className="tabular-nums">{Math.round(item.nutrition.carbsG)}g carbs</span>
          <span className="tabular-nums">{Math.round(item.nutrition.fatG)}g fat</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <EstimateStatusBadge item={item} />
        </div>
        {item.preparationNote ? (
          <p className="mt-1.5 text-xs text-muted-foreground italic">{item.preparationNote}</p>
        ) : null}
      </div>
    </div>
  );
}
