import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme/ThemeContext";
import { GOOGLE_FONTS_IMPORT, FONT_BODY } from "@/lib/theme/tokens";
import "./globals.css";

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
    <html lang="he" dir="rtl" className="h-full antialiased">
      <head>
        {/* Three Google fonts as one stylesheet, matching the artifact's own @import exactly. */}
        <link rel="stylesheet" href={GOOGLE_FONTS_IMPORT} />
      </head>
      <body className="min-h-full flex flex-col" style={{ fontFamily: FONT_BODY }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
