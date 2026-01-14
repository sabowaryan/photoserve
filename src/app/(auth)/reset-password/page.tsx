'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Loader2, CheckCircle2, ArrowLeft, AlertCircle, Eye, EyeOff, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';

function ResetPasswordContent() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const passwordSchema = z.string().min(6, { message: t('auth.errors.passwordTooShort') });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      passwordSchema.parse(password);
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        setError(err.issues[0].message);
      }
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.errors.genericError'));
        return;
      }

      setIsSuccess(true);
    } catch {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  // No token - show error state
  if (!token) {
    return (
      <div className="w-full max-w-sm z-10 animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 px-5 py-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-3">
                <XCircle size={28} className="text-rose-500" />
              </div>
              <h1 className="text-lg font-bold text-white mb-1">{t('common.linkExpired')}</h1>
              <p className="text-xs text-rose-100/70">{t('common.linkNoLongerValid')}</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-slate-500 text-center">
              {t('auth.errors.resetLinkInvalid')}
            </p>
            <Link 
              href="/forgot-password"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all"
            >
              {t('auth.forgotPassword.sendLink')}
            </Link>
            <Link 
              href="/auth"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-slate-500 hover:bg-slate-50 text-sm font-medium rounded-xl transition-all"
            >
              <ArrowLeft size={14} />
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm z-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
        {/* Header */}
        <div className={`px-5 py-6 relative overflow-hidden ${isSuccess ? 'bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-600' : 'bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700'}`}>
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-3">
              {isSuccess ? (
                <CheckCircle2 size={28} className="text-emerald-500" />
              ) : (
                <LogoIcon size={28} />
              )}
            </div>
            <h1 className="text-lg font-bold text-white mb-1">
              {isSuccess ? t('auth.success.passwordReset') : t('auth.resetPassword.title')}
            </h1>
            <p className="text-xs text-white/70">
              {isSuccess ? '' : t('auth.resetPassword.subtitle')}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-in slide-in-from-top-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
              <span className="text-xs text-rose-600 font-medium">{error}</span>
            </div>
          )}

          {isSuccess ? (
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-500">
                {t('auth.forgotPassword.backToLogin')}
              </p>
              <button
                onClick={() => router.push('/auth')}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-xl shadow-lg transition-all active:scale-[0.98]"
              >
                {t('auth.buttons.signIn')}
                <ArrowRight size={14} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                  {t('auth.resetPassword.newPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                    <Lock className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder={t('common.atLeast6Characters')}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                  {t('auth.resetPassword.confirmPassword')}
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                    <ShieldCheck className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-10 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                    placeholder={t('common.confirmYourPassword')}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <span>{t('common.reset')}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Back button */}
      <Link 
        href="/auth" 
        className="fixed top-4 left-4 z-20 p-3 rounded-2xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm group"
      >
        <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:text-indigo-600 transition-colors" />
      </Link>

      {/* Background Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" />
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-slate-400">Loading...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
