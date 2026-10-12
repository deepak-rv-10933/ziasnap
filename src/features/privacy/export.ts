import type { UserDataExport } from "@/services/nutrition/NutritionRepository";
import { estimateStatusLabel } from "@/lib/utils/estimate-status";

function csvCell(value: unknown): string {
  const text = value === undefined || value === null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One row per food item — the shape people expect when opening a nutrition log in a spreadsheet. */
export function mealsToCsv(data: UserDataExport): string {
  const header = [
    "date",
    "time",
    "meal",
    "source",
    "item",
    "portion",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "fiber_g",
    "estimate_status",
    "ai_confidence",
    "meal_notes",
  ];
  const rows = data.meals.flatMap((meal) =>
    meal.items.map((item) => [
      meal.dateKey ?? meal.loggedAt.slice(0, 10),
      new Date(meal.loggedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      meal.type,
      meal.source,
      item.name,
      item.portion.label,
      Math.round(item.nutrition.calories),
      item.nutrition.proteinG,
      item.nutrition.carbsG,
      item.nutrition.fatG,
      item.nutrition.fiberG ?? "",
      estimateStatusLabel(item),
      item.isUserAdded ? "" : item.confidence,
      meal.notes ?? "",
    ]),
  );
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadFile(fileName: string, contents: string, mimeType: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
