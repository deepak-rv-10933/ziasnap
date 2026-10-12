"use client";

import type { CuisinePreference, NutrientPriority } from "@/types";
import { ChipSelect, ChipMultiSelect } from "./ChipSelect";

interface NutritionPreferenceSelectorProps {
  cuisinePreference: CuisinePreference;
  onCuisineChange: (value: CuisinePreference) => void;
  nutrientPriorities: NutrientPriority[];
  onToggleNutrientPriority: (value: NutrientPriority) => void;
}

const CUISINE_OPTIONS: { value: CuisinePreference; label: string }[] = [
  { value: "south_indian", label: "South Indian" },
  { value: "north_indian", label: "North Indian" },
  { value: "indo_chinese", label: "Indo-Chinese" },
  { value: "global", label: "Global" },
  { value: "mixed", label: "A mix of everything" },
];

const NUTRIENT_LABEL: Record<NutrientPriority, string> = {
  protein: "Protein",
  fiber: "Fiber",
  iron: "Iron",
  calcium: "Calcium",
  low_sodium: "Low sodium",
  low_sugar: "Low sugar",
  low_gi: "Low glycemic index",
};

export function NutritionPreferenceSelector({
  cuisinePreference,
  onCuisineChange,
  nutrientPriorities,
  onToggleNutrientPriority,
}: NutritionPreferenceSelectorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm font-medium text-foreground">Cuisine preference</p>
        <ChipSelect
          options={CUISINE_OPTIONS}
          value={cuisinePreference}
          onChange={onCuisineChange}
          aria-label="Cuisine preference"
        />
      </div>
      <div>
        <p className="mb-1 text-sm font-medium text-foreground">Nutrient priorities</p>
        <p className="mb-2 text-xs text-muted-foreground">
          Optional — Zia will pay closer attention to these when suggesting meals.
        </p>
        <ChipMultiSelect
          options={(Object.keys(NUTRIENT_LABEL) as NutrientPriority[]).map((value) => ({
            value,
            label: NUTRIENT_LABEL[value],
          }))}
          values={nutrientPriorities}
          onToggle={(value) => onToggleNutrientPriority(value as NutrientPriority)}
          aria-label="Nutrient priorities"
        />
      </div>
    </div>
  );
}
