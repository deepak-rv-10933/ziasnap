"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, GearSix, Leaf } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS } from "./nav-items";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border/70 bg-card/60 px-5 py-6 lg:flex">
      <Link href="/home" className="mb-8 flex items-center gap-2 px-1">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-brand-turmeric text-[#211c16]">
          <Leaf weight="fill" className="size-5" />
        </span>
        <span className="font-display text-lg font-semibold tracking-tight">ZiaSnap</span>
      </Link>

      <Link
        href="/snap"
        className="mb-6 flex items-center justify-center gap-2 rounded-2xl bg-brand-turmeric px-4 py-3 text-sm font-semibold text-[#211c16] shadow-[0_10px_24px_-8px_rgba(214,154,45,0.55)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-turmeric/40 active:scale-[0.98]"
      >
        <Camera weight="fill" className="size-5" />
        Snap a meal
      </Link>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-1">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
                active
                  ? "bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon weight={active ? "fill" : "regular"} className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/settings"
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
          pathname.startsWith("/settings")
            ? "bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <GearSix className="size-5" />
        Settings
      </Link>
    </aside>
  );
}
