import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { DemoBanner } from "@/components/auth/DemoBanner";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <DemoBanner />
      <AppShell>{children}</AppShell>
    </AuthGate>
  );
}
