import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useGoalTargetsQuery() {
  return useQuery({ queryKey: queryKeys.goals, queryFn: api.getGoalTargets });
}

export function useRecalculateGoalsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.recalculateGoalTargets,
    onSuccess: (targets) => {
      queryClient.setQueryData(queryKeys.goals, targets);
      queryClient.invalidateQueries({ queryKey: queryKeys.recommendations });
    },
  });
}
