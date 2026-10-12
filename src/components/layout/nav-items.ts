import type { Icon } from "@phosphor-icons/react";
import { ChartLineUp, ClockCounterClockwise, House, UserCircle } from "@phosphor-icons/react";

export interface NavItem {
  href: string;
  label: string;
  icon: Icon;
}

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: House },
  { href: "/history", label: "History", icon: ClockCounterClockwise },
  { href: "/insights", label: "Insights", icon: ChartLineUp },
  { href: "/profile", label: "Profile", icon: UserCircle },
];
