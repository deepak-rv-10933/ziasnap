"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Catalyst's Web SDK still sends users to the legacy `/app/` path after
 * login. Bounce to `/`, which forwards a signed-in user to Home or onboarding.
 * (public/_redirects covers deeper /app/* paths.)
 */
export default function LegacyAppRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/"), [router]);
  return null;
}
