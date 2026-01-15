"use client";

import { useState } from "react";
import { Lock, AlertTriangle, Calendar, ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/context";
import { LoadingButton } from "@/components/ui/loading-button";

interface PasswordFormProps {
  title: string;
  expiresAt: string;
  backgroundImage?: string;
  customLogo?: string | null;
  onSubmit: (password: string) => Promise<boolean>;
}

export function PasswordForm({ title, expiresAt, backgroundImage, customLogo, onSubmit }: PasswordFormProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(3);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (attempts <= 0) return;
    
    setIsLoading(true);
    setError(null);

    const success = await onSubmit(password);
    
    if (!success) {
      const nextAttempts = attempts - 1;
      setAttempts(nextAttempts);
      setError(
        nextAttempts > 0 
          ? t('errors.gallery.incorrectPassword')
          : t('errors.generic.tooManyAttempts')
      );
    }
    
    setIsLoading(false);
  };

  const formatExpirationDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Image (subtle) */}
      {backgroundImage && (
        <div className="absolute inset-0 z-0">
          <img 
            src={backgroundImage} 
            className="w-full h-full object-cover opacity-5 blur-2xl scale-110" 
            alt="" 
          />
        </div>
      )}

      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-100/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm z-10 animate-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-xl shadow-xl shadow-indigo-500/5 overflow-hidden">
          {/* Header with Logo */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-4 py-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-20 h-20 bg-purple-400/20 rounded-full blur-xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative flex flex-col items-center text-center">
              {/* Logo prominent */}
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg mb-2">
                {customLogo ? (
                  <img 
                    src={customLogo} 
                    alt="Logo" 
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
              <h1 className="text-base font-bold text-white mb-0.5">
                {title}
              </h1>
              <div className="flex items-center gap-1 text-indigo-100/70">
                <ShieldCheck size={10} />
                <span className="text-[10px] font-medium">{t('gallery.view.passwordRequired')}</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <form onSubmit={handleUnlock} className="space-y-3">
              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                  {t('auth.form.password')}
                </label>
                <div className="relative group">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0.5 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={12} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={attempts <= 0}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                    placeholder={t('gallery.view.passwordPlaceholder')}
                    autoFocus
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>
              
              {/* Error Message */}
              {error && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg animate-in slide-in-from-top-2 flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-rose-500 flex-shrink-0" />
                  <span className="text-[10px] text-rose-600 font-medium">{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                disabled={attempts <= 0}
                isLoading={isLoading}
                spinnerSize="sm"
                className="w-full py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{t('gallery.view.passwordSubmit')}</span>
                <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
              </LoadingButton>
            </form>

            {/* Footer Info */}
            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-slate-400">
              <Calendar size={10} />
              <span className="text-[9px] font-medium">
                {t('gallery.detail.expires')} {formatExpirationDate(expiresAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
