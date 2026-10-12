/**
 * Core nutrition value model shared across food items, meals and daily summaries.
 */
export interface NutritionValues {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export function emptyNutrition(): NutritionValues {
  return { calories: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
}

export function sumNutrition(values: NutritionValues[]): NutritionValues {
  return values.reduce<NutritionValues>(
    (total, value) => ({
      calories: total.calories + value.calories,
      proteinG: total.proteinG + value.proteinG,
      carbsG: total.carbsG + value.carbsG,
      fatG: total.fatG + value.fatG,
      fiberG: (total.fiberG ?? 0) + (value.fiberG ?? 0),
    }),
    emptyNutrition(),
  );
}

export function scaleNutrition(values: NutritionValues, factor: number): NutritionValues {
  return {
    calories: Math.round(values.calories * factor),
    proteinG: roundTo1(values.proteinG * factor),
    carbsG: roundTo1(values.carbsG * factor),
    fatG: roundTo1(values.fatG * factor),
    fiberG: values.fiberG !== undefined ? roundTo1(values.fiberG * factor) : undefined,
  };
}

function roundTo1(value: number): number {
  return Math.round(value * 10) / 10;
}
