import { AuthGate } from "@/components/auth/AuthGate";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate requireOnboarding={false}>
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 py-8 sm:py-12">{children}</div>
    </AuthGate>
  );
}
