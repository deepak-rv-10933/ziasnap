import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

export function useHistoryQuery(startDateKey?: string, endDateKey?: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.history(startDateKey, endDateKey),
    queryFn: () => api.getHistory(startDateKey, endDateKey),
    enabled: options?.enabled ?? true,
  });
}
