import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { generatePageMetadata } from "@/lib/services";
import { SessionProvider } from "@/components/providers/session-provider";
import { I18nProviderWrapper } from "@/components/providers/i18n-provider";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = generatePageMetadata('landing');

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Note: The lang attribute is set dynamically by RTLManager.applyDirection()
  // on the client side based on the user's locale preference.
  // Default to 'en' for SSR to avoid hydration mismatches.
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} antialiased font-sans`}
      >
        <SessionProvider>
          <I18nProviderWrapper>{children}</I18nProviderWrapper>
        </SessionProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
