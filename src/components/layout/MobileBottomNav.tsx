"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Camera } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV_ITEMS } from "./nav-items";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [leftItems, rightItems] = [PRIMARY_NAV_ITEMS.slice(0, 2), PRIMARY_NAV_ITEMS.slice(2)];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 pb-[max(env(safe-area-inset-bottom),0.5rem)] lg:hidden"
    >
      <div className="mx-3 mb-3 flex items-center justify-between rounded-[1.75rem] border border-white/50 bg-card/90 px-2 py-2 shadow-[0_12px_32px_-14px_rgba(16,26,35,0.35)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-card/85">
        {leftItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        <Link
          href="/snap"
          aria-label="Snap a meal"
          className="relative -mt-8 flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-turmeric text-[#1a1206] shadow-[0_10px_24px_-6px_rgba(242,168,29,0.65)] ring-4 ring-background pressable focus-visible:outline-none focus-visible:ring-brand-turmeric/40"
        >
          <Camera weight="fill" className="size-7" />
        </Link>

        {rightItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
      </div>
    </nav>
  );
}

function NavLink({ item, active }: { item: (typeof PRIMARY_NAV_ITEMS)[number]; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "pressable relative flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[0.6875rem] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {/* One pill, shared across tabs: it slides to whichever tab is active. */}
      {active ? (
        <motion.span
          layoutId="nav-active-pill"
          className="absolute inset-0 -z-0 rounded-2xl bg-brand-turmeric-soft"
          transition={{ type: "spring", stiffness: 520, damping: 38 }}
          aria-hidden="true"
        />
      ) : null}
      <Icon weight={active ? "fill" : "regular"} className="relative size-5" />
      <span className="relative">{item.label}</span>
    </Link>
  );
}
