import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Heebo, IBM_Plex_Sans_Hebrew } from "next/font/google";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { FONT_BODY } from "@/lib/theme/tokens";
import { AddToHomeScreenPrompt } from "@/components/pwa/AddToHomeScreenPrompt";
import "./globals.css";

// Sprint 7: self-hosted via next/font/google instead of a runtime <link> to
// Google's CSS API — see the comment on FONT_DISPLAY/FONT_BODY/FONT_MONO in
// lib/theme/tokens.ts for why. Weights match the artifact's original @import
// exactly; 'hebrew' is listed first since that's the subset the whole app
// actually renders in, 'latin' covers the handful of Latin brand strings.
const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

const ibmPlexSansHebrew = IBM_Plex_Sans_Hebrew({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PROJECT SHRED",
  description: "מעקב תזונה ואימונים",
  // Sprint 9 — PWA install/home-screen metadata. app/manifest.ts covers the
  // Android/Chrome install prompt; iOS Safari's "Add to Home Screen" still
  // primarily reads these two tags (apple-mobile-web-app-*, apple-touch-icon)
  // rather than reliably reading manifest.json on every iOS version, so both
  // paths are wired, not just the modern one.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "PROJECT SHRED",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

// initialScale: 1 with NO maximumScale/userScalable override — deliberately.
// Locking maximumScale to 1 is a common but inaccessible "fix" for iOS's
// zoom-on-input-focus behavior; it also permanently disables pinch-zoom for
// anyone who needs it. The actual, accessible fix for that bug is the 16px+
// input font-size rule in globals.css (Sprint 9) — iOS only auto-zooms when
// the focused input's computed font-size is under 16px, so fixing that at the
// source means zoom never needs to be taken away from the user at all.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0E0C0A" },
    { media: "(prefers-color-scheme: light)", color: "#FBF9F6" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`h-full antialiased ${frankRuhlLibre.variable} ${heebo.variable} ${ibmPlexSansHebrew.variable}`}
    >
      <body className="min-h-full flex flex-col" style={{ fontFamily: FONT_BODY }}>
        <ThemeProvider>
          {children}
          <AddToHomeScreenPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
