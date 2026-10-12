"use client";

import type { DietaryPreference } from "@/types";
import { ChipSelect } from "./ChipSelect";

interface DietaryPreferenceSelectorProps {
  value: DietaryPreference;
  onChange: (value: DietaryPreference) => void;
}

const OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "eggitarian", label: "Eggitarian" },
  { value: "non_vegetarian", label: "Non-vegetarian" },
];

export function DietaryPreferenceSelector({ value, onChange }: DietaryPreferenceSelectorProps) {
  return <ChipSelect options={OPTIONS} value={value} onChange={onChange} aria-label="Dietary preference" />;
}
