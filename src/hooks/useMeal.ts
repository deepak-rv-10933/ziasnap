import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { UpdateMealInput } from "@/services/nutrition/NutritionRepository";

export function useMealQuery(id: string) {
  return useQuery({ queryKey: queryKeys.meal(id), queryFn: () => api.getMeal(id), enabled: Boolean(id) });
}

export function useUpdateMealMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMealInput) => api.updateMeal(id, input),
    onSuccess: (meal) => {
      queryClient.setQueryData(queryKeys.meal(id), meal);
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
  });
}

export function useDeleteMealMutation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deleteMeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}
