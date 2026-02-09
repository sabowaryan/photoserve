'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, XCircle } from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';
import { AuthButton } from '@/components/auth/AuthButton';
import { FormInput } from '@/components/auth/FormInput';
import { ErrorMessage } from '@/components/auth/ErrorMessage';
import { LoadingSpinner } from '@/components/auth/LoadingSpinner';

function ResetPasswordContent() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
            <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-lg mb-3" style={{ minWidth: '3.5rem', minHeight: '3.5rem' }}>
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
            <ErrorMessage
              message={error}
              dismissible
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center shadow-sm">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{t('auth.resetPassword.passwordResetSuccessful')}</h3>
                <p className="text-sm text-slate-600">
                  {t('auth.resetPassword.canNowSignIn')}
                </p>
              </div>
              <AuthButton
                onClick={() => router.push('/auth')}
                fullWidth
                size="md"
                variant="primary"
                icon={<ArrowRight size={14} />}
              >
                {t('auth.buttons.signIn')}
              </AuthButton>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Info box */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-indigo-900 mb-1">
                    {t('auth.resetPassword.createStrongPassword')}
                  </p>
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    {t('auth.resetPassword.subtitle')}
                  </p>
                </div>
              </div>
              
              {/* Password Input */}
              <FormInput
                id="password-input"
                type="password"
                name="password"
                label={t('auth.resetPassword.newPassword')}
                placeholder={t('common.atLeast6Characters')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={14} />}
                showPasswordToggle
                required
              />

              {/* Confirm Password Input */}
              <FormInput
                id="confirm-password-input"
                type="password"
                name="confirmPassword"
                label={t('auth.resetPassword.confirmPassword')}
                placeholder={t('common.confirmYourPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                icon={<ShieldCheck size={14} />}
                showPasswordToggle
                required
              />

              {/* Submit Button */}
              <AuthButton
                type="submit"
                loading={isLoading}
                fullWidth
                size="md"
                variant="primary"
                icon={<ArrowRight size={14} />}
              >
                {t('common.reset')}
              </AuthButton>
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

      {/* Background Decorative Orbs - Fixed dimensions to prevent CLS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/40 rounded-full blur-3xl" style={{ willChange: 'transform' }} />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-200/40 rounded-full blur-3xl" style={{ willChange: 'transform' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/30 rounded-full blur-3xl" style={{ willChange: 'transform' }} />
      </div>

      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner size="lg" text="Loading" />
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </div>
  );
}
