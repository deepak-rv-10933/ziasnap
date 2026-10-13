import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { FavoriteInput } from "@/services/nutrition/NutritionRepository";
import type { WaterDay, WeightTrend } from "@/types";
import { enqueue, isNetworkError } from "@/lib/offline/outbox";
import { toDateKey } from "@/lib/utils/date";

export function useWaterQuery() {
  return useQuery({ queryKey: queryKeys.water(), queryFn: () => api.getWater() });
}

/** Optimistic: the glass fills the moment it's tapped, and rolls back if the save fails. */
export function useAddWaterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (amountMl: number) => {
      try {
        return await api.addWater(amountMl);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        enqueue("water", { amountMl, dateKey: toDateKey(new Date()) });
        // Keep the optimistic glass: it will sync later.
        return queryClient.getQueryData<WaterDay>(queryKeys.water())!;
      }
    },
    onMutate: async (amountMl) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.water() });
      const previous = queryClient.getQueryData<WaterDay>(queryKeys.water());
      if (previous) {
        queryClient.setQueryData<WaterDay>(queryKeys.water(), {
          ...previous,
          totalMl: previous.totalMl + amountMl,
          entries: [...previous.entries, { id: `pending-${Date.now()}`, amountMl, loggedAt: new Date().toISOString() }],
        });
      }
      return { previous };
    },
    onError: (_error, _amount, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.water(), context.previous);
    },
    onSuccess: (day) => queryClient.setQueryData(queryKeys.water(), day),
  });
}

export function useRemoveWaterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => api.removeWater(entryId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.water() }),
  });
}

export function useWeightTrendQuery() {
  return useQuery({ queryKey: queryKeys.weight, queryFn: api.getWeightTrend });
}

export function useLogWeightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (weightKg: number) => {
      try {
        return await api.logWeight(weightKg);
      } catch (error) {
        if (!isNetworkError(error)) throw error;
        enqueue("weight", { weightKg, dateKey: toDateKey(new Date()) });
        return queryClient.getQueryData<WeightTrend>(queryKeys.weight)!;
      }
    },
    onSuccess: (trend) => {
      queryClient.setQueryData(queryKeys.weight, trend);
      // The latest reading becomes the profile's current weight (and the water goal follows it).
      queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      queryClient.invalidateQueries({ queryKey: ["water"] });
    },
  });
}

export function useDeleteWeightMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entryId: string) => api.deleteWeight(entryId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.weight }),
  });
}

export function useFavoritesQuery() {
  return useQuery({ queryKey: queryKeys.favorites, queryFn: api.getFavorites });
}

export function useSaveFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FavoriteInput) => api.saveFavorite(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

export function useDeleteFavoriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFavorite(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites }),
  });
}

export function useStreakQuery() {
  return useQuery({ queryKey: queryKeys.streak, queryFn: api.getStreak });
}
