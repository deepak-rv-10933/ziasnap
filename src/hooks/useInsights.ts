import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useInsightsQuery(weekStartDateKey?: string) {
  return useQuery({
    queryKey: queryKeys.insights(weekStartDateKey),
    queryFn: () => api.getInsights(weekStartDateKey),
  });
}
