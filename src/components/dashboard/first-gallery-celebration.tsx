"use client";

import { useEffect, useState } from "react";
import { PartyPopper, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

interface FirstGalleryCelebrationProps {
  onClose: () => void;
  userName?: string;
}

/**
 * First Gallery Celebration Component
 * 
 * Displays a celebration modal when user creates their first gallery.
 * Includes confetti animation and encouraging message.
 * 
 * Requirements: 13.3 - Display celebration for first gallery creation
 */
export function FirstGalleryCelebration({
  onClose,
  userName = "photographe",
}: FirstGalleryCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger confetti animation
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    // Show modal with animation
    setIsVisible(true);

    // Auto-close after 5 seconds
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transition-all duration-300 ${
          isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all z-10"
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="relative p-8 text-center text-white">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
            <PartyPopper size={40} />
          </div>

          {/* Title */}
          <h2 className="text-3xl font-black mb-3 flex items-center justify-center gap-2">
            <span>Félicitations</span>
            <Sparkles size={24} className="text-yellow-300" />
          </h2>

          {/* Message */}
          <p className="text-lg text-white/90 mb-2">
            Vous avez créé votre première galerie !
          </p>
          <p className="text-sm text-white/70 mb-6">
            C'est le début d'une belle aventure, {userName}. Continuez comme ça ! 🚀
          </p>

          {/* Stats */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold">Première galerie créée</span>
          </div>

          {/* Next steps hint */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-xs text-white/60">
              Prochaine étape : Partagez votre galerie avec vos clients
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
