"use client";

import { useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { PERSIST_MAX_AGE_MS, createQueryPersister } from "@/lib/api/query-persistence";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { OfflineSync } from "@/components/layout/OfflineSync";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            // Kept as long as it's remembered on the device, so a reopened app paints instantly.
            gcTime: PERSIST_MAX_AGE_MS,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          // Run mutations even offline: a failed request falls through to the
          // offline outbox (lib/offline/outbox.ts) instead of sitting paused.
          mutations: { networkMode: "always" },
        },
      }),
  );

  const [persister] = useState(createQueryPersister);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE_MS, buster: process.env.NEXT_PUBLIC_BUILD_ID ?? "v1" }}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <TooltipProvider delay={200}>
          {children}
          <OfflineSync />
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
