import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// Preload Inter font with optimal settings
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  preload: true,
  // Optimize font loading
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: 'Sign In | PikSend',
  description: 'Sign in to your PikSend account to manage your photo galleries',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="preconnect" href="https://accounts.google.com" />
      <link rel="dns-prefetch" href="https://accounts.google.com" />

      <div className={`${inter.variable} min-h-screen w-full relative overflow-hidden bg-slate-950 flex items-center justify-center`}>
        {/* Ambient Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Deep gradient base */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-purple-950/40 to-slate-950 z-0" />

          {/* Animated Orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse-slow" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-blue-600/10 rounded-full blur-[100px] animate-pulse-slow delay-2000" />

          {/* Grid Pattern Overlay */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] z-0" style={{ backgroundSize: '30px 30px' }} />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-[100vw] px-4 py-8 md:py-12 flex flex-col items-center justify-center">
          {children}
        </div>
      </div>
    </>
  );
}
