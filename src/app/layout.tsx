import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const body = Hanken_Grotesk({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ZiaSnap — Snap your food. Understand your nutrition.",
  description:
    "ZiaSnap turns a photo of your meal into an editable nutrition estimate, tracks it against your calorie and protein goals, and recommends what to eat next — built around real Indian and South Indian food.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ZiaSnap",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#17130f" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {process.env.NEXT_PUBLIC_ZIASNAP_API_URL ? (
          <>
            {/* Catalyst Web SDK, then Slate's init.js, which configures it for this project (order matters). */}
            <Script src="https://static.zohocdn.com/catalyst/sdk/js/4.6.1/catalystWebSDK.js" strategy="beforeInteractive" />
            <Script src="/__catalyst/sdk/init.js" strategy="beforeInteractive" />
          </>
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
