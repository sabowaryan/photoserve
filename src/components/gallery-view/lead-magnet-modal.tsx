"use client";

import { useState, useEffect, FormEvent } from "react";
import { createPortal } from "react-dom";
import { X, Mail, Sparkles, Lock, CheckCircle2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LeadMagnetModalProps {
  galleryId?: string;
  galleryTitle?: string;
  onSubmit: (email: string) => Promise<void>;
  onSkip?: () => void;
}

export function LeadMagnetModal({
  galleryTitle = "cette galerie",
  onSubmit,
  onSkip,
}: LeadMagnetModalProps) {
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("Veuillez entrer votre adresse email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    if (!gdprConsent) {
      setError("Veuillez accepter la politique de confidentialité");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(email);
      setIsSuccess(true);
      // Auto-close after success
      setTimeout(() => {
        if (onSkip) onSkip();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">
              Merci ! 🎉
            </h3>
            <p className="text-slate-600">
              Vous pouvez maintenant accéder à la galerie
            </p>
          </div>
        ) : (
          <>
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 relative overflow-hidden">
              {/* Decorative orbs */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  {onSkip && (
                    <button
                      onClick={handleSkip}
                      className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      type="button"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>

                <h3 className="text-2xl font-black text-white mb-2">
                  Accédez à {galleryTitle}
                </h3>
                <p className="text-white/80 text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Entrez votre email pour voir les photos
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Email Input */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-slate-900 mb-2"
                >
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 text-base"
                  autoFocus
                />
              </div>

              {/* GDPR Consent Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                <input
                  id="gdpr-consent"
                  type="checkbox"
                  checked={gdprConsent}
                  onChange={(e) => setGdprConsent(e.target.checked)}
                  disabled={isSubmitting}
                  className="mt-0.5 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                />
                <label
                  htmlFor="gdpr-consent"
                  className="text-xs text-slate-600 leading-relaxed cursor-pointer"
                >
                  J'accepte que mon adresse email soit collectée pour accéder à
                  cette galerie. Conformément au RGPD, vous pouvez demander la
                  suppression de vos données à tout moment.
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <p className="text-sm text-rose-600 font-medium">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Vérification...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Accéder à la galerie</span>
                  </>
                )}
              </button>

              {/* Skip Link */}
              {onSkip && (
                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  Continuer sans email
                </button>
              )}
            </form>

            {/* Footer */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-xl">
                <Lock className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <p className="text-xs text-indigo-900 font-medium">
                  Vos données sont sécurisées et ne seront jamais partagées
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
