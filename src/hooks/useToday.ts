import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { useNutritionStore } from "@/stores/useNutritionStore";

export function useTodayQuery(dateKey?: string) {
  const query = useQuery({ queryKey: queryKeys.today(dateKey), queryFn: () => api.getToday(dateKey) });
  const syncTodaySummary = useNutritionStore((state) => state.syncTodaySummary);

  useEffect(() => {
    if (query.data && !dateKey) {
      syncTodaySummary(query.data);
    }
  }, [query.data, dateKey, syncTodaySummary]);

  return query;
}
