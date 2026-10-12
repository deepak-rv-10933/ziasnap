import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ProfileUpdateInput } from "@/services/nutrition/NutritionRepository";

export function useProfileQuery(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: queryKeys.profile, queryFn: api.getProfile, enabled: options?.enabled ?? true });
}

export function useAccountQuery(options?: { enabled?: boolean }) {
  return useQuery({ queryKey: queryKeys.account, queryFn: api.getMe, staleTime: Infinity, enabled: options?.enabled ?? true });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => api.updateProfile(input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      queryClient.invalidateQueries({ queryKey: queryKeys.goals });
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}
