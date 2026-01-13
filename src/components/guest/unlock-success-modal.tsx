"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, CheckCircle, Sparkles, ArrowRight, UserPlus, PartyPopper, Shield, Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

interface UnlockSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  gallerySlug: string;
  galleryTitle: string;
  expiresAt: string;
}

export function UnlockSuccessModal({
  isOpen,
  onClose,
  gallerySlug,
  galleryTitle,
  expiresAt,
}: UnlockSuccessModalProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  const handleCreateAccount = () => {
    const params = new URLSearchParams({
      intent: 'migrate',
      gallery: gallerySlug,
      callbackUrl: '/dashboard',
    });
    router.push(`/auth?${params.toString()}`);
  };

  const handleContinue = () => {
    handleClose();
  };

  const daysUntilExpiry = Math.ceil(
    (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const modalContent = (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 ${
        isClosing ? "animate-out fade-out duration-200" : "animate-in fade-in duration-300"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden ${
          isClosing ? "animate-out zoom-out-95 duration-200" : "animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        }`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/20 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/80" />
        </button>

        {/* Success header with decorative elements */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 px-8 pt-10 pb-8 text-center relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-yellow-300/20 rounded-full blur-xl" />
          
          {/* Confetti-like decorations */}
          <div className="absolute top-6 left-8 w-2 h-2 bg-yellow-300 rounded-full animate-pulse" />
          <div className="absolute top-12 right-12 w-3 h-3 bg-pink-300 rounded-full animate-pulse delay-100" />
          <div className="absolute bottom-12 left-16 w-2 h-2 bg-white/60 rounded-full animate-pulse delay-200" />
          
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/30">
              <PartyPopper className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              {t('gallery.unlockSuccess.title')}
            </h2>
            <p className="text-emerald-100 font-medium text-sm truncate max-w-[280px] mx-auto">
              &quot;{galleryTitle}&quot;
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Benefits recap - Compact cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 text-center border border-emerald-100">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">
                {t('gallery.unlockSuccess.benefit1')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-4 text-center border border-indigo-100">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">
                {daysUntilExpiry} jours
              </p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 text-center border border-amber-100">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-xs font-bold text-slate-700 leading-tight">
                {t('gallery.unlockSuccess.benefit3')}
              </p>
            </div>
          </div>

          {/* Create account CTA - Enhanced */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 mb-5 relative overflow-hidden">
            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl" />
            
            <div className="relative flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white text-sm mb-1 flex items-center gap-2">
                  {t('gallery.unlockSuccess.createAccountTitle')}
                  <Sparkles className="w-4 h-4 text-amber-400" />
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('gallery.unlockSuccess.createAccountDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCreateAccount}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/25"
            >
              {t('gallery.unlockSuccess.createAccountBtn')}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleContinue}
              className="w-full py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-medium text-sm rounded-xl transition-all"
            >
              {t('gallery.unlockSuccess.continueBtn')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
