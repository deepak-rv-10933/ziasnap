"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CloudArrowUp } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api } from "@/lib/api/client";
import { flushOutbox, pendingEntries, subscribeOutbox, type OutboxEntry } from "@/lib/offline/outbox";

function send(entry: OutboxEntry) {
  if (entry.kind === "meal") return api.confirmMeal(entry.payload);
  if (entry.kind === "water") return api.addWater(entry.payload.amountMl, entry.payload.dateKey);
  return api.logWeight(entry.payload.weightKg, entry.payload.dateKey);
}

const serverSnapshot: OutboxEntry[] = [];

/**
 * Registers the service worker (installable app + offline shell) and sends
 * the offline outbox whenever the connection comes back. Shows a quiet pill
 * while entries are waiting.
 */
export function OfflineSync() {
  const queryClient = useQueryClient();
  const pending = useSyncExternalStore(subscribeOutbox, pendingEntries, () => serverSnapshot);

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch((error) => console.warn("Service worker not registered", error));
    }
    const sync = async () => {
      if (pendingEntries().length === 0 || !navigator.onLine) return;
      const sent = await flushOutbox(send);
      if (sent > 0) {
        toast.success(`Synced ${sent} offline entr${sent === 1 ? "y" : "ies"}`);
        queryClient.invalidateQueries();
      }
    };
    void sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [queryClient]);

  if (pending.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-2 z-50 flex justify-center px-4" role="status">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur">
        <CloudArrowUp className="size-4 text-brand-tamarind dark:text-brand-turmeric" aria-hidden="true" />
        {pending.length} entr{pending.length === 1 ? "y" : "ies"} saved offline, will sync when you&apos;re back online
      </span>
    </div>
  );
}
