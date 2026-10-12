"use client";

import { useState } from "react";
import Script from "next/script";
import { useBackendMode } from "@/lib/catalyst/backend-mode";

/**
 * Loads the Catalyst Web SDK, then Slate's init.js (which configures it, so
 * order matters). They load after the page is interactive instead of
 * blocking it, and not at all in the demo, which never signs anyone in.
 * Callers wait for the SDK through loadCatalyst().
 */
export function CatalystScripts() {
  const mode = useBackendMode();
  const [sdkLoaded, setSdkLoaded] = useState(false);
  if (mode !== "real") return null;

  return (
    <>
      <Script
        src="https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js"
        strategy="afterInteractive"
        onLoad={() => setSdkLoaded(true)}
      />
      {sdkLoaded ? <Script src="/__catalyst/sdk/init.js" strategy="afterInteractive" /> : null}
    </>
  );
}
