"use client";

import { useEffect } from "react";
import { Leaf } from "@phosphor-icons/react";
import { enterDemo, hasRealApi } from "@/lib/catalyst/web-sdk";

/**
 * Public demo entry — https://ziasnap.onslate.com/demo. Switches this browser
 * to Arjun's sample account (no sign-in) and opens Today. A full navigation,
 * not a router push, so every module re-reads the mode from scratch.
 */
export default function DemoEntryPage() {
  useEffect(() => {
    if (hasRealApi) enterDemo();
    window.location.replace("/home");
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3" role="status">
      <span className="flex size-11 animate-pulse items-center justify-center rounded-2xl bg-brand-turmeric text-[#211c16]">
        <Leaf weight="fill" className="size-6" />
      </span>
      <p className="text-sm text-muted-foreground">Opening the demo…</p>
    </div>
  );
}
