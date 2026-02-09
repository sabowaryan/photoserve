"use client";

/**
 * Guest Gallery Banner Component
 * 
 * Displays "Créé avec PikSend" banner with CTA for guest galleries
 * Shows locked features with upgrade prompts
 * 
 * Requirements: 5.4, 5.5 (sales-funnel-optimization spec)
 */

import { useState } from "react";
import { Sparkles, Lock, Download, Palette, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GuestGalleryBannerProps {
  /** Whether this is a guest gallery (not owned by authenticated user) */
  isGuestGallery: boolean;
  /** Whether the gallery is unlocked (paid) */
  isUnlocked: boolean;
  /** Gallery slug for CTA links */
  gallerySlug: string;
  /** Optional custom styling */
  className?: string;
  /** Optional callback to trigger signup modal for locked features */
  onFeatureLocked?: (feature: string) => void;
}

/**
 * Banner component for guest galleries
 * Shows branding and locked features with upgrade prompts
 */
export function GuestGalleryBanner({
  isGuestGallery,
  isUnlocked,
  className,
  onFeatureLocked,
}: GuestGalleryBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for guest galleries that are not unlocked
  if (!isGuestGallery || isUnlocked || isDismissed) {
    return null;
  }

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4", className)}>
      <div className="max-w-4xl mx-auto">
        {/* Main Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-4 md:p-5 shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          
          {/* Dismiss button */}
          <button
            onClick={() => setIsDismissed(true)}
            className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>

          <div className="relative">
            {/* Top: Branding */}
            <div className="flex items-center justify-center gap-2 mb-4 pb-4 border-b border-white/20">
              <Sparkles className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">
                Créé avec
              </span>
              <Image
                src="/icons/logo.svg"
                alt="PikSend"
                width={20}
                height={20}
                className="brightness-0 invert"
              />
              <span className="text-white font-black text-lg">
                PikSend
              </span>
            </div>

            {/* Middle: Locked Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {/* ZIP Download - Locked */}
              <button
                onClick={() => onFeatureLocked?.('Téléchargement ZIP')}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-start gap-3 hover:bg-white/20 transition-colors cursor-pointer text-left w-full"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-bold text-sm">Téléchargement ZIP</h4>
                    <Lock className="w-3 h-3 text-white/60" />
                  </div>
                  <p className="text-white/70 text-xs">
                    Disponible en <span className="font-bold text-white">Premium/Pro</span>
                  </p>
                </div>
              </button>

              {/* Custom Branding - Locked */}
              <button
                onClick={() => onFeatureLocked?.('Branding personnalisé')}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-3 flex items-start gap-3 hover:bg-white/20 transition-colors cursor-pointer text-left w-full"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-bold text-sm">Branding personnalisé</h4>
                    <Lock className="w-3 h-3 text-white/60" />
                  </div>
                  <p className="text-white/70 text-xs">
                    Disponible en <span className="font-bold text-white">Premium/Pro</span>
                  </p>
                </div>
              </button>
            </div>

            {/* Bottom: CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/auth?intent=signup"
                className="w-full sm:w-auto px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Créer mon compte gratuit
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-bold rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                Voir les plans
              </Link>
            </div>
          </div>
        </div>

        {/* Helper text */}
        <p className="text-center text-xs text-slate-500 mt-2">
          Créez des galeries illimitées avec votre propre branding
        </p>
      </div>
    </div>
  );
}
