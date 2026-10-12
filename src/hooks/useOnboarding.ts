import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import type { ProfileUpdateInput } from "@/services/nutrition/NutritionRepository";

export function useSubmitOnboardingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileUpdateInput) => api.submitOnboarding(input),
    onSuccess: ({ profile, targets }) => {
      queryClient.setQueryData(queryKeys.profile, profile);
      queryClient.setQueryData(queryKeys.goals, targets);
    },
  });
}
