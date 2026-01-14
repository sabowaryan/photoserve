'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, ArrowLeft, CheckCircle2, AlertCircle, ArrowRight, KeyRound } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailSchema = z.string().email({ message: t('auth.errors.invalidEmail') });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      emailSchema.parse(email);
    } catch (err) {
      if (err instanceof z.ZodError && err.issues[0]) {
        setError(err.issues[0].message);
      }
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.errors.genericError'));
        return;
      }

      setEmailSent(true);
    } catch {
      setError(t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

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

      <div className="w-full max-w-sm z-10 animate-in slide-in-from-bottom-4 duration-500">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 px-5 py-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-3">
                <LogoIcon size={28} />
              </div>
              <h1 className="text-lg font-bold text-white mb-1">
                {t('auth.forgotPassword.title')}
              </h1>
              <p className="text-xs text-indigo-100/70">
                {emailSent ? t('auth.forgotPassword.emailSentTo').replace(':', '') : t('auth.forgotPassword.subtitle')}
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

            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">{t('auth.forgotPassword.emailSentTo')}</p>
                  <p className="text-sm font-bold text-indigo-600">{email}</p>
                </div>
                <p className="text-xs text-slate-500">
                  {t('auth.resetPassword.subtitle')}
                </p>
                <Link 
                  href="/auth"
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                >
                  <ArrowLeft size={14} />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Info */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2">
                  <KeyRound size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-indigo-700">
                    {t('auth.forgotPassword.subtitle')}
                  </p>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-0.5">
                    {t('auth.form.email')}
                  </label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 p-1 bg-slate-100 rounded group-focus-within:bg-indigo-100 transition-colors">
                      <Mail className="text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:bg-white outline-none transition-all font-medium"
                      placeholder={t('auth.form.emailPlaceholder')}
                      required
                    />
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
                      <span>{t('auth.forgotPassword.sendLink')}</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>

                {/* Back Link */}
                <Link 
                  href="/auth"
                  className="flex items-center justify-center gap-2 w-full py-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-50 text-sm font-medium rounded-xl transition-all"
                >
                  <ArrowLeft size={14} />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
