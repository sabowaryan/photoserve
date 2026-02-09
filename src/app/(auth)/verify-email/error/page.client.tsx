'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Mail,
  Clock,
  XCircle
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

type ErrorType = 'expired' | 'invalid' | 'used' | 'not_found' | 'generic';

function VerifyEmailErrorContent() {
  const { t } = useTranslation();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [nextResendTime, setNextResendTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get error type from URL params
  const errorType = (searchParams.get('type') as ErrorType) || 'generic';
  const email = searchParams.get('email');

  // Update countdown timer
  useEffect(() => {
    if (!nextResendTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = nextResendTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCanResend(true);
        setNextResendTime(null);
        setTimeRemaining('');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResendTime]);

  const getErrorDetails = () => {
    switch (errorType) {
      case 'expired':
        return {
          icon: <Clock className="h-10 w-10 text-rose-600" />,
          title: t('auth.verification.error.expiredTitle'),
          description: t('auth.verification.error.expiredDesc'),
          canResend: true,
        };
      case 'used':
        return {
          icon: <XCircle className="h-10 w-10 text-rose-600" />,
          title: t('auth.verification.error.usedTitle'),
          description: t('auth.verification.error.usedDesc'),
          canResend: false,
        };
      case 'invalid':
        return {
          icon: <AlertCircle className="h-10 w-10 text-rose-600" />,
          title: t('auth.verification.error.invalidTitle'),
          description: t('auth.verification.error.invalidDesc'),
          canResend: true,
        };
      case 'not_found':
        return {
          icon: <AlertCircle className="h-10 w-10 text-rose-600" />,
          title: t('auth.verification.error.notFoundTitle'),
          description: t('auth.verification.error.notFoundDesc'),
          canResend: true,
        };
      default:
        return {
          icon: <AlertCircle className="h-10 w-10 text-rose-600" />,
          title: t('auth.verification.error.genericTitle'),
          description: t('auth.verification.error.genericDesc'),
          canResend: true,
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleResendEmail = async () => {
    if (!email || !canResend) {
      setError(t('auth.verification.error.noEmail'));
      return;
    }

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit error
        if (response.status === 429) {
          setError(t('auth.errors.rateLimitExceeded'));
          setCanResend(false);
          // Set next resend time based on rate limit (1 hour from now)
          const nextTime = new Date();
          nextTime.setHours(nextTime.getHours() + 1);
          setNextResendTime(nextTime);
        } else if (data.code === 'EMAIL_ALREADY_VERIFIED') {
          // User is already verified, redirect to dashboard
          router.push('/dashboard');
        } else {
          setError(data.error || t('auth.errors.genericError'));
        }
      } else {
        setSuccess(t('auth.verification.emailResent'));
        setCanResend(false);
        // Set a 1-minute cooldown for successful resend
        const nextTime = new Date();
        nextTime.setMinutes(nextTime.getMinutes() + 1);
        setNextResendTime(nextTime);
      }
    } catch (err) {
      console.error('Resend verification error:', err);
      setError(t('auth.errors.genericError'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full" role="region" aria-label="Email Verification Error">
      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-rose-100 flex items-center justify-center">
            {errorDetails.icon}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {errorDetails.title}
          </h1>
          <p className="text-slate-600">
            {errorDetails.description}
          </p>
        </header>

        <div className="space-y-6">
          {/* Email info if available */}
          {email && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {t('auth.verification.emailAddress')}
              </p>
              <p className="text-sm font-bold text-slate-900 break-all">
                {email}
              </p>
            </div>
          )}

          {/* What happened */}
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-700">
              {t('auth.verification.error.whatHappened')}
            </h3>
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
              <p className="text-sm text-rose-800">
                {errorType === 'expired' && t('auth.verification.error.expiredExplanation')}
                {errorType === 'used' && t('auth.verification.error.usedExplanation')}
                {errorType === 'invalid' && t('auth.verification.error.invalidExplanation')}
                {errorType === 'not_found' && t('auth.verification.error.notFoundExplanation')}
                {errorType === 'generic' && t('auth.verification.error.genericExplanation')}
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
              role="alert"
              aria-live="assertive"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
                {nextResendTime && timeRemaining && (
                  <div className="mt-2 flex items-center gap-2 text-red-600">
                    <Clock className="w-4 h-4" aria-hidden="true" />
                    <span className="text-xs">
                      {t('auth.verification.tryAgainIn')} {timeRemaining}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                aria-label={t('common.dismiss')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div 
              className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3"
              role="status"
              aria-live="polite"
            >
              <Mail className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="text-sm text-green-800">{success}</p>
              </div>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="text-green-400 hover:text-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                aria-label={t('common.dismiss')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* What to do next */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-700">
              {t('auth.verification.error.whatToDo')}
            </h3>
            <div className="space-y-3">
              {errorDetails.canResend && (
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-indigo-600">1</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-1">
                      {t('auth.verification.error.solution1Title')}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {t('auth.verification.error.solution1Desc')}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">{errorDetails.canResend ? '2' : '1'}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    {t('auth.verification.error.solution2Title')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t('auth.verification.error.solution2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">{errorDetails.canResend ? '3' : '2'}</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    {t('auth.verification.error.solution3Title')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t('auth.verification.error.solution3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Resend Button - only show if can resend */}
            {errorDetails.canResend && email && (
              <button
                onClick={handleResendEmail}
                disabled={isResending || !canResend}
                className="w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label={t('auth.verification.resendEmail')}
              >
                {isResending ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
                    <span>{t('auth.verification.sending')}</span>
                  </>
                ) : !canResend && nextResendTime ? (
                  <>
                    <Clock className="w-5 h-5" aria-hidden="true" />
                    <span>{t('auth.verification.waitToResend')} ({timeRemaining})</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-5 h-5" aria-hidden="true" />
                    <span>{t('auth.verification.resendEmail')}</span>
                  </>
                )}
              </button>
            )}

            {/* Back to Sign In */}
            <Link
              href="/auth"
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            >
              <span>{t('auth.verification.error.backToSignIn')}</span>
            </Link>
          </div>

          {/* Support Link */}
          <div className="text-center pt-2">
            <p className="text-sm text-slate-500">
              {t('auth.verification.needHelp')}{' '}
              <Link 
                href="/contact" 
                className="text-primary font-semibold hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
              >
                {t('auth.verification.contactSupport')}
              </Link>
            </p>
          </div>
        </div>
      </article>
    </div>
  );
}

export default function VerifyEmailErrorPageClient() {
  return (
    <Suspense fallback={
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
          <p className="text-xs font-medium text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailErrorContent />
    </Suspense>
  );
}
