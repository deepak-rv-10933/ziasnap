import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomNav } from "./MobileBottomNav";

interface AppShellProps {
  children: React.ReactNode;
  /** Optional contextual panel shown alongside the main content on desktop only. */
  rightPanel?: React.ReactNode;
}

export function AppShell({ children, rightPanel }: AppShellProps) {
  return (
    <div className="flex min-h-dvh w-full justify-center">
      <DesktopSidebar />

      <div className="flex w-full max-w-6xl flex-1 justify-center">
        <main className="w-full min-w-0 max-w-2xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-10 lg:pt-10 lg:pb-12">
          {children}
        </main>

        {rightPanel ? (
          <aside className="sticky top-0 hidden h-dvh w-80 shrink-0 overflow-y-auto border-l border-border/70 px-6 py-10 xl:block">
            {rightPanel}
          </aside>
        ) : null}
      </div>

      <MobileBottomNav />
    </div>
  );
}
