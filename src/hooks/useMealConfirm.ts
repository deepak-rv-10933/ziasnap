import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ConfirmMealInput } from "@/services/nutrition/NutritionRepository";
import type { Meal } from "@/types";
import { sumNutrition } from "@/types/nutrition";
import { enqueue, isNetworkError } from "@/lib/offline/outbox";

/** Saves the meal, or, with no connection, queues it and returns a local stand-in. */
async function confirmOrQueue(input: Omit<ConfirmMealInput, "userId">): Promise<Meal> {
  try {
    return await api.confirmMeal(input);
  } catch (error) {
    if (!isNetworkError(error)) throw error;
    const loggedAt = input.loggedAt ?? new Date().toISOString();
    const id = enqueue("meal", { ...input, loggedAt });
    return {
      id,
      userId: "",
      type: input.type,
      source: input.source,
      items: input.items,
      totalNutrition: sumNutrition(input.items.map((item) => item.nutrition)),
      notes: input.notes,
      loggedAt,
      confirmedAt: loggedAt,
    };
  }
}

export function useConfirmMealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: confirmOrQueue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.today() });
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.streak });
    },
  });
}
