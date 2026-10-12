"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";

const TAB_ROUTES = ["/home", "/history", "/insights", "/profile", "/recommendations", "/snap"] as const;

/**
 * Every request to the host costs ~1s before the first byte, so a tab that
 * fetches its code, page payload and data only when tapped feels laggy.
 * Once the current screen has settled, warm the other tabs — route code and
 * the same queries their hooks run — so switching tabs is instant.
 */
export function PrefetchTabs() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const warm = () => {
      TAB_ROUTES.forEach((route) => router.prefetch(route));
      void queryClient.prefetchQuery({ queryKey: queryKeys.profile, queryFn: api.getProfile });
      void queryClient.prefetchQuery({ queryKey: queryKeys.goals, queryFn: api.getGoalTargets });
      void queryClient.prefetchQuery({ queryKey: queryKeys.history(), queryFn: () => api.getHistory() });
      void queryClient.prefetchQuery({ queryKey: queryKeys.insights(), queryFn: () => api.getInsights() });
      void queryClient.prefetchQuery({ queryKey: queryKeys.recommendations, queryFn: api.getRecommendations });
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    const handle = idle ? idle(warm) : window.setTimeout(warm, 600);
    return () => {
      if (!idle) window.clearTimeout(handle);
    };
  }, [router, queryClient]);

  return null;
}
