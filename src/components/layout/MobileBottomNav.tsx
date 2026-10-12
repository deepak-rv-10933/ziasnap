"use client";

import Link from "next/link";
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
      <div className="mx-3 mb-3 flex items-center justify-between rounded-[1.75rem] border border-border/70 bg-card/95 px-2 py-2 shadow-[0_8px_30px_-12px_rgba(33,28,22,0.35)] backdrop-blur">
        {leftItems.map((item) => (
          <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}

        <Link
          href="/snap"
          aria-label="Snap a meal"
          className="relative -mt-8 flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-turmeric text-[#211c16] shadow-[0_10px_24px_-6px_rgba(214,154,45,0.65)] transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-turmeric/40 active:scale-95 motion-safe:animate-[breathe_3.2s_ease-in-out_infinite]"
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
        "flex w-16 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-[0.6875rem] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
        active ? "text-brand-tamarind dark:text-brand-turmeric" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon weight={active ? "fill" : "regular"} className="size-5" />
      {item.label}
    </Link>
  );
}
