"use client";

/**
 * Gallery Paywall Component
 * Displays a paywall screen for monetized galleries
 * 
 * @module components/gallery-view/gallery-paywall
 * Requirements: 3.4 - UI Paywall Screen (Full Mode)
 */
import { useState } from "react";
import Image from "next/image";
import { Lock, Shield, CreditCard, Check, ImageIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { optimizeLogoUrl } from "@/lib/utils/image-optimization";

/**
 * Preview image interface
 */
interface PreviewImage {
  id: string;
  url: string;
  thumbnailUrl?: string;
}

/**
 * Paywall props interface
 */
interface GalleryPaywallProps {
  galleryId: string;
  galleryTitle: string;
  gallerySlug: string;
  photographerName?: string;
  customLogo?: string | null;
  priceCents: number;
  currency: string;
  previewImages: PreviewImage[];
  totalImages: number;
  viewsCount?: number;
  onPurchaseSuccess?: () => void;
}

/**
 * Format price for display
 */
function formatPrice(cents: number, currency: string): string {
  const amount = cents / 100;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
  });
  return formatter.format(amount);
}

/**
 * Gallery Paywall Component
 * Displays a full-screen paywall with blurred preview images
 */
export function GalleryPaywall({
  galleryId,
  galleryTitle,
  // gallerySlug - reserved for future use (e.g., success redirect)
  photographerName,
  customLogo,
  priceCents,
  currency,
  previewImages,
  totalImages,
  viewsCount = 0,
  // onPurchaseSuccess - reserved for future use (e.g., callback after purchase)
}: GalleryPaywallProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Optimize logo URL
  const optimizedLogoUrl = optimizeLogoUrl(customLogo);

  // Validate email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle purchase
  const handlePurchase = async () => {
    // Validate email
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError(null);

    setIsLoading(true);
    try {
      const response = await fetch("/api/stripe/checkout/gallery-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          galleryId,
          buyerEmail: email,
          buyerSessionId: getSessionId(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("[GalleryPaywall] Purchase error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to start checkout");
    } finally {
      setIsLoading(false);
    }
  };

  // Get or create session ID for guest purchases
  const getSessionId = (): string => {
    const key = "piksend_session_id";
    let sessionId = localStorage.getItem(key);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem(key, sessionId);
    }
    return sessionId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
              {optimizedLogoUrl ? (
                <Image
                  src={optimizedLogoUrl}
                  alt="Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Image
                  src="/icons/logo.svg"
                  alt="PikSend"
                  width={24}
                  height={24}
                />
              )}
            </div>
            <div>
              <h1 className="text-white font-bold text-lg truncate max-w-[200px] sm:max-w-none">
                {galleryTitle}
              </h1>
              {photographerName && (
                <p className="text-slate-400 text-sm">by {photographerName}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-sm">
            <div className="hidden sm:flex items-center gap-1.5">
              <ImageIcon size={14} />
              <span>{totalImages} photos</span>
            </div>
            {viewsCount > 0 && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Eye size={14} />
                <span>{viewsCount.toLocaleString()} views</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-20 pb-32">
        {/* Blurred preview images grid */}
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 p-1 opacity-40">
            {previewImages.slice(0, 8).map((image, index) => (
              <div
                key={image.id}
                className="aspect-[4/3] relative overflow-hidden rounded-lg"
              >
                <Image
                  src={image.thumbnailUrl || image.url}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover blur-xl scale-110"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-slate-900/30" />
              </div>
            ))}
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        </div>

        {/* Paywall card */}
        <div className="relative -mt-32 px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
              {/* Lock icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <Lock className="w-8 h-8 text-white" />
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-2">
                Unlock Full Gallery
              </h2>
              <p className="text-slate-400 text-center mb-6">
                Get instant access to all {totalImages} high-resolution photos
              </p>

              {/* Price */}
              <div className="text-center mb-6">
                <span className="text-4xl sm:text-5xl font-black text-white">
                  {formatPrice(priceCents, currency)}
                </span>
                <span className="text-slate-400 ml-2">one-time</span>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>Full resolution downloads</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>No watermarks</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>Instant access after payment</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>Download all at once</span>
                </div>
              </div>

              {/* Email input */}
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Your email address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError(null);
                  }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-3 bg-white/5 border ${
                    emailError ? 'border-red-500' : 'border-white/10'
                  } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all`}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-red-400">{emailError}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  We&apos;ll send your access link to this email
                </p>
              </div>

              {/* Purchase button */}
              <LoadingButton
                onClick={handlePurchase}
                disabled={isLoading}
                isLoading={isLoading}
                loadingText="Redirecting to checkout..."
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                Purchase Access
              </LoadingButton>

              {/* Security badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <Shield className="w-4 h-4" />
                <span>Secure payment by Stripe</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-2 text-slate-500 text-sm">
          <span>Powered by</span>
          <Image
            src="/icons/logo.svg"
            alt="PikSend"
            width={16}
            height={16}
          />
          <span className="font-semibold text-slate-400">PikSend</span>
        </div>
      </footer>
    </div>
  );
}
