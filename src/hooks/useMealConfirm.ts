import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ConfirmMealInput } from "@/services/nutrition/NutritionRepository";

export function useConfirmMealMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<ConfirmMealInput, "userId">) => api.confirmMeal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.today() });
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
      queryClient.invalidateQueries({ queryKey: ["insights"] });
    },
  });
}
