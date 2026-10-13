import type { FoodItem } from "@/types";

export type EstimateStatus = "ai_estimate" | "edited" | "added" | "remembered";

/**
 * Separates what Zia guessed from what the user told us. Every saved meal was
 * reviewed, but an untouched item is still Zia's estimate — only edited or
 * hand-added items are user-confirmed data.
 */
export function estimateStatus(item: Pick<FoodItem, "isEdited" | "isUserAdded" | "fromMemory">): EstimateStatus {
  if (item.isUserAdded) return "added";
  if (item.isEdited) return "edited";
  if (item.fromMemory) return "remembered";
  return "ai_estimate";
}

export function estimateStatusLabel(item: Pick<FoodItem, "isEdited" | "isUserAdded" | "fromMemory">): string {
  return {
    ai_estimate: "AI estimate",
    edited: "Edited by you",
    added: "Added by you",
    remembered: "Remembered from your edit",
  }[estimateStatus(item)];
}
