import type { NextConfig } from "next";

/**
 * Static export: Slate serves plain files from `out/` with no server
 * function. That keeps the app on Slate's free tier and removes the ~1s
 * server round trip every page used to pay. Real data comes from the
 * `ziasnap-api` Catalyst function; the demo runs in the browser.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BUILD_ID: new Date().toISOString().slice(0, 16) },
};

export default nextConfig;
