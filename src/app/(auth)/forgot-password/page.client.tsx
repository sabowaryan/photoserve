'use client';

import { useState, useCallback, useMemo, lazy, Suspense } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { z } from 'zod';

// Lazy load non-critical icon with better loading state
const KeyRound = lazy(() => import('lucide-react').then(mod => ({ default: mod.KeyRound })));

export default function ForgotPasswordPageClient() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize email schema to prevent recreation on every render
  const emailSchema = useMemo(
    () => z.string().email({ message: t('auth.errors.invalidEmail') }),
    [t]
  );

  // Memoized submit handler with useCallback
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

    // AbortController for cleanup
    const controller = new AbortController();

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t('auth.errors.genericError'));
        return;
      }

      setEmailSent(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(t('auth.errors.genericError'));
      }
    } finally {
      setIsLoading(false);
    }

    return () => controller.abort();
  }, [email, emailSchema, t]);

  // Memoized error dismiss handler
  const handleDismissError = useCallback(() => setError(null), []);

  return (
    <div className="w-full" role="region" aria-label="Password Reset">
      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main" aria-labelledby="page-title">
        {/* Header */}
        <header className="mb-8">
          <h1 id="page-title" className="text-3xl font-bold text-slate-900 mb-2">
            {emailSent ? t('auth.forgotPassword.checkYourEmail') : t('auth.forgotPassword.title')}
          </h1>
          <p className="text-slate-600">
            {emailSent 
              ? t('auth.forgotPassword.emailSentTo')
              : t('auth.forgotPassword.subtitle')}
          </p>
        </header>

        {/* Error Message */}
        {error && (
          <div role="alert" aria-live="assertive" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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

        {emailSent ? (
          <div className="space-y-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-50 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-green-600" aria-hidden="true" />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-indigo-600 break-all mb-4">{email}</p>
              <p className="text-sm text-slate-600 mb-4">
                {t('auth.forgotPassword.clickLinkToReset')}
              </p>
              <p className="text-xs text-slate-500">
                {t('auth.forgotPassword.didntReceiveEmail')}
              </p>
            </div>

            <Link 
              href="/auth"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={t('auth.forgotPassword.backToLogin')}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              {t('auth.forgotPassword.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Info Box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex items-start gap-3" role="note">
              <Suspense fallback={<div className="w-5 h-5 flex-shrink-0 bg-indigo-200 rounded animate-pulse" role="status" aria-label="Loading icon" />}>
                <KeyRound className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              </Suspense>
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">
                  {t('auth.forgotPassword.weWillEmailYou')}
                </p>
                <p className="text-xs text-indigo-700">
                  {t('auth.forgotPassword.subtitle')}
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email-input" className="block text-sm font-semibold text-slate-700 mb-2">
                {t('auth.form.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" aria-hidden="true" />
                <input
                  id="email-input"
                  type="email"
                  autoComplete="email"
                  aria-required="true"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'email-error' : undefined}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.form.emailPlaceholder')}
                  className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all ${
                    error
                      ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
                  }`}
                />
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
                  {t('auth.forgotPassword.sendLink')}
                  <ArrowRight className="w-4 h-4" aria-hidden="true" />
                </>
              )}
            </button>

            {/* Back Link */}
            <div className="text-center pt-2">
              <Link 
                href="/auth"
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded px-2 py-1"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </article>
    </div>
  );
}
