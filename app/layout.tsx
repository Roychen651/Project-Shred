import type { Metadata } from "next";
import { Frank_Ruhl_Libre, Heebo, IBM_Plex_Sans_Hebrew } from "next/font/google";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { FONT_BODY } from "@/lib/theme/tokens";
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
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
