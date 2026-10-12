"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, DeviceMobile } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: DeviceMobile },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Deliberate: next-themes only knows the real theme after mount (it reads
    // localStorage/system preference client-side), so this avoids briefly
    // rendering every option as unselected before that resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div role="radiogroup" aria-label="Appearance" className="grid grid-cols-3 gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = mounted && theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(option.value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-turmeric/50",
              selected
                ? "border-brand-turmeric bg-brand-turmeric-soft text-brand-tamarind dark:text-brand-turmeric"
                : "border-border/70 bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon weight={selected ? "fill" : "regular"} className="size-5" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
