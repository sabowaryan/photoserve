"use client";

/**
 * Unlock Banner Component
 * Sticky banner for freemium preview mode
 * 
 * @module components/gallery-view/unlock-banner
 * Requirements: 3.5 - Freemium Preview Mode
 */
import { useState } from "react";
import { Lock, X, Sparkles } from "lucide-react";

/**
 * Format price for display
 */
function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return formatter.format(amount);
}

interface UnlockBannerProps {
  priceCents: number;
  currency: string;
  onUnlock: () => void;
}

/**
 * Sticky unlock banner for freemium galleries
 */
export function UnlockBanner({
  priceCents,
  currency,
  onUnlock,
}: UnlockBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-4 shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>

          <div className="relative flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Message */}
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="hidden sm:flex w-12 h-12 bg-white/10 rounded-xl items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg flex items-center gap-2 justify-center sm:justify-start">
                  <Lock className="w-4 h-4 sm:hidden" />
                  Unlock Full Resolution
                </h3>
                <p className="text-white/80 text-sm">
                  Get HD photos without watermarks
                </p>
              </div>
            </div>

            {/* Right: Price & CTA */}
            <div className="flex items-center gap-3">
              <span className="text-white/90 font-bold text-xl">
                {formatPrice(priceCents, currency)}
              </span>
              <button
                onClick={onUnlock}
                className="px-6 py-2.5 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Unlock Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
