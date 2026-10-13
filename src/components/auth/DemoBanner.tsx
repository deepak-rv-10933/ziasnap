"use client";

import { SIGNUP_PATH, exitDemo } from "@/lib/catalyst/web-sdk";
import { useBackendMode } from "@/lib/catalyst/backend-mode";

/** Tells demo visitors what they're looking at, and how to get a real account. */
export function DemoBanner() {
  if (useBackendMode() !== "demo") return null;

  const leave = (destination: string) => {
    exitDemo();
    // Full navigation so the app reloads in real-account mode.
    window.location.assign(destination);
  };

  return (
    <div className="sticky top-0 z-40 border-b border-brand-turmeric/40 bg-brand-turmeric-soft px-4 py-2 text-xs text-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>
          <span className="font-semibold">Demo account</span> with sample meals. Zia&apos;s analysis is real; your changes
          stay on this device and reset each day.
        </p>
        <div className="flex items-center gap-3 font-semibold">
          <button type="button" onClick={() => leave(SIGNUP_PATH)} className="text-brand-tamarind underline-offset-4 hover:underline dark:text-brand-turmeric">
            Sign up free
          </button>
          <button type="button" onClick={() => leave("/")} className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            Exit demo
          </button>
        </div>
      </div>
    </div>
  );
}
