import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
    ],
  },
  // Catalyst's Web SDK still sends users to the legacy web-client path `/app/`
  // after login. Slate serves from `/`, so bounce it home — the welcome page
  // forwards a signed-in user to Home or onboarding.
  async redirects() {
    return [
      { source: "/app", destination: "/", permanent: false },
      { source: "/app/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
