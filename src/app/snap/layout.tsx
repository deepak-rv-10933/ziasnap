import { AuthGate } from "@/components/auth/AuthGate";
import { DemoBanner } from "@/components/auth/DemoBanner";

export default function SnapLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate allowGuest>
      <DemoBanner />
      <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 py-6 sm:px-6 lg:py-10">{children}</div>
    </AuthGate>
  );
}
