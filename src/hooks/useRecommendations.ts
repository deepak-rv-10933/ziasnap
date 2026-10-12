import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useRecommendationsQuery() {
  return useQuery({ queryKey: queryKeys.recommendations, queryFn: api.getRecommendations });
}
