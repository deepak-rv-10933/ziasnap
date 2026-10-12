"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Leaf } from "@phosphor-icons/react";
import { isSignedIn, redirectToLogin } from "@/lib/catalyst/web-sdk";
import { useBackendMode } from "@/lib/catalyst/backend-mode";
import { useProfileQuery } from "@/hooks/useProfile";

interface AuthGateProps {
  children: React.ReactNode;
  /** App screens need a finished profile; the onboarding flow itself does not. */
  requireOnboarding?: boolean;
  /** Let signed-out visitors in as guests instead of sending them to login (the Snap try-out). */
  allowGuest?: boolean;
}

const GuestContext = createContext(false);

/** True when a signed-out visitor is using a guest-enabled screen. Always false in mock builds. */
export function useIsGuest() {
  return useContext(GuestContext);
}

function GateSplash() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-label="Loading your account">
      <span className="flex size-11 animate-pulse items-center justify-center rounded-2xl bg-brand-turmeric text-[#211c16]">
        <Leaf weight="fill" className="size-6" />
      </span>
    </div>
  );
}

/**
 * Real-backend builds only: sends signed-out visitors to Catalyst's hosted
 * login, and signed-in users without a finished profile to onboarding, so a
 * new account never lands on an empty-but-pretend dashboard. Mock builds
 * (no NEXT_PUBLIC_ZIASNAP_API_URL) render straight through.
 */
export function AuthGate({ children, requireOnboarding = true, allowGuest = false }: AuthGateProps) {
  const mode = useBackendMode();
  if (mode === "mock" || mode === "demo") return <>{children}</>;
  if (mode === "pending") return <GateSplash />;
  return (
    <SignedInGate requireOnboarding={requireOnboarding} allowGuest={allowGuest}>
      {children}
    </SignedInGate>
  );
}

function SignedInGate({ children, requireOnboarding, allowGuest }: Required<Omit<AuthGateProps, "children">> & { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    isSignedIn().then((result) => {
      if (cancelled) return;
      if (!result && !allowGuest) redirectToLogin();
      setSignedIn(result);
    });
    return () => {
      cancelled = true;
    };
  }, [allowGuest]);

  const profileQuery = useProfileQuery({ enabled: signedIn === true });
  const needsOnboarding = requireOnboarding && profileQuery.data && !profileQuery.data.onboardingCompletedAt;

  useEffect(() => {
    if (needsOnboarding && !pathname.startsWith("/onboarding")) router.replace("/onboarding/goal");
  }, [needsOnboarding, pathname, router]);

  if (signedIn === false && allowGuest) return <GuestContext.Provider value>{children}</GuestContext.Provider>;
  if (signedIn !== true) return <GateSplash />;
  if (requireOnboarding && (profileQuery.isPending || needsOnboarding)) return <GateSplash />;
  return <>{children}</>;
}
