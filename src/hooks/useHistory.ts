import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useHistoryQuery(startDateKey?: string, endDateKey?: string) {
  return useQuery({
    queryKey: queryKeys.history(startDateKey, endDateKey),
    queryFn: () => api.getHistory(startDateKey, endDateKey),
  });
}
