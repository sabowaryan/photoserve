import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { getServerSession } from "next-auth";
import { authOptions } from "@/config/auth.config";
import { generatePageMetadata } from "@/lib/services";
import { SessionProvider } from "@/components/providers/session-provider";
import { I18nProviderWrapper } from "@/components/providers/i18n-provider";
import { FunnelTrackerProvider } from "@/components/providers/funnel-tracker-provider";
import "./globals.css";

// Force dynamic rendering to ensure session is always fresh
export const dynamic = 'force-dynamic';

// Optimized font loading - only 2 weights for better performance
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "600"], // Only essential weights (reduced from 6 to 2)
  display: 'swap', // Prevent FOIT (Flash of Invisible Text)
  preload: true,
  adjustFontFallback: true, // Better CLS
  fallback: ['system-ui', 'arial'], // System fallback
});

export const metadata: Metadata = {
  ...generatePageMetadata('landing'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PikSend',
  },
  formatDetection: {
    telephone: false,
  },
  // Icons are automatically detected from app/icon.svg and app/apple-icon.png
  other: {
    'msapplication-TileColor': '#ffffff',
    'msapplication-TileImage': '/icons/ms-icon-144x144.png',
    'color-scheme': 'light',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Récupérer la session côté serveur pour éviter les appels API côté client
  const session = await getServerSession(authOptions);

  // Note: The lang attribute is set dynamically by RTLManager.applyDirection()
  // on the client side based on the user's locale preference.
  // Default to 'en' for SSR to avoid hydration mismatches.
  return (
    <html lang="en" suppressHydrationWarning style={{ colorScheme: 'light' }}>
      <head>
        {/* Preconnect to critical origins for better performance */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
      </head>
      <body
        className={`${inter.variable} antialiased font-sans`}
        style={{ colorScheme: 'light' }}
      >
        <SessionProvider session={session}>
          <I18nProviderWrapper>{children}</I18nProviderWrapper>
        </SessionProvider>
        <FunnelTrackerProvider />
        <Toaster position="top-center" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
