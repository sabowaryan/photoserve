'use client';

import { useState, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, CheckCircle2, ArrowRight, ShieldCheck, XCircle, Eye, EyeOff } from 'lucide-react';
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

  // Memoize password schema to prevent recreation on every render
  const passwordSchema = useMemo(
    () => z.string().min(6, { message: t('auth.errors.passwordTooShort') }),
    [t]
  );

  // Memoized submit handler with useCallback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

    // AbortController for cleanup
    const controller = new AbortController();

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.errors.genericError'));
        return;
      }

      setIsSuccess(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(t('auth.errors.genericError'));
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [password, confirmPassword, passwordSchema, token, t]);

  // Memoized error dismiss handler
  const handleDismissError = useCallback(() => setError(null), []);

  // No token - show error state
  if (!token) {
    return (
      <div className="w-full" role="region" aria-label="Invalid Reset Link">
        <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="alert">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-red-50 rounded-full">
              <XCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">{t('common.linkExpired')}</h1>
              <p className="text-slate-600 mb-4">{t('auth.errors.resetLinkInvalid')}</p>
            </div>

            <div className="space-y-3">
              <Link 
                href="/forgot-password"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('auth.forgotPassword.sendLink')}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
              
              <Link 
                href="/auth"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="w-full" role="region" aria-label="Reset Password">
      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main" aria-labelledby="page-title">
        {/* Header */}
        <header className="mb-8">
          <h1 id="page-title" className="text-3xl font-bold text-slate-900 mb-2">
            {isSuccess ? t('auth.success.passwordReset') : t('auth.resetPassword.title')}
          </h1>
          <p className="text-slate-600">
            {isSuccess 
              ? t('auth.resetPassword.canNowSignIn')
              : t('auth.resetPassword.subtitle')}
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button 
              onClick={handleDismissError} 
              className="text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
              aria-label="Dismiss error message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-50 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            
            <div className="text-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {t('auth.resetPassword.passwordResetSuccessful')}
              </h3>
              <p className="text-sm text-slate-600 mb-6">
                {t('auth.resetPassword.canNowSignIn')}
              </p>
            </div>

            <button
              onClick={() => router.push('/auth')}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {t('auth.buttons.signIn')}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3" role="note">
              <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  {t('auth.resetPassword.createStrongPassword')}
                </p>
                <p className="text-xs text-indigo-700">
                  {t('common.atLeast6Characters')}
                </p>
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password-input" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.resetPassword.newPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'password-error' : 'password-hint'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.form.passwordPlaceholder')}
                  className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
              <p id="password-hint" className="mt-1 text-xs text-slate-500">{t('common.atLeast6Characters')}</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirm-password-input" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.resetPassword.confirmPassword')}
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="confirm-password-input"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'confirm-password-error' : undefined}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('common.confirmYourPassword')}
                  className={`w-full pl-11 pr-11 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  {t('common.reset')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        )}
      </article>
    </div>
  );
}

export default function ResetPasswordPageClient() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" role="status" aria-label="Loading">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
