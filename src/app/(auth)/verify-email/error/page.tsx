'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  AlertCircle, 
  Loader2, 
  ArrowLeft,
  RefreshCw,
  Mail,
  Clock,
  XCircle
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
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
          icon: <Clock className="h-10 w-10 text-white" />,
          title: t('auth.verification.error.expiredTitle'),
          description: t('auth.verification.error.expiredDesc'),
          canResend: true,
        };
      case 'used':
        return {
          icon: <XCircle className="h-10 w-10 text-white" />,
          title: t('auth.verification.error.usedTitle'),
          description: t('auth.verification.error.usedDesc'),
          canResend: false,
        };
      case 'invalid':
        return {
          icon: <AlertCircle className="h-10 w-10 text-white" />,
          title: t('auth.verification.error.invalidTitle'),
          description: t('auth.verification.error.invalidDesc'),
          canResend: true,
        };
      case 'not_found':
        return {
          icon: <AlertCircle className="h-10 w-10 text-white" />,
          title: t('auth.verification.error.notFoundTitle'),
          description: t('auth.verification.error.notFoundDesc'),
          canResend: true,
        };
      default:
        return {
          icon: <AlertCircle className="h-10 w-10 text-white" />,
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Back button */}
      <Link 
        href="/" 
        className="fixed top-3 left-3 z-20 p-2 rounded-xl bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-slate-50 hover:border-indigo-200 transition-all shadow-sm group focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label={t('common.backToHome')}
      >
        <ArrowLeft className="h-4 w-4 text-slate-600 group-hover:text-indigo-600 transition-colors" />
      </Link>

      {/* Background Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-orange-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-rose-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-rose-500 via-pink-500 to-red-600 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-pink-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow border border-white/10">
                {errorDetails.icon}
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {errorDetails.title}
              </h1>
              <p className="text-rose-100/90 text-sm">
                {errorDetails.description}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Email info if available */}
            {email && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  {t('auth.verification.emailAddress')}
                </p>
                <p className="text-sm font-bold text-slate-900 break-all">
                  {email}
                </p>
              </div>
            )}

            {/* What happened */}
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                {t('auth.verification.error.whatHappened')}
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-xs text-rose-800">
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
                className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg flex items-start gap-2 shadow-sm"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
              >
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <span>{error}</span>
                  {nextResendTime && timeRemaining && (
                    <div className="mt-2 flex items-center gap-1 text-rose-600">
                      <Clock size={12} aria-hidden="true" />
                      <span className="text-xs">
                        {t('auth.verification.tryAgainIn')} {timeRemaining}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-rose-400 hover:text-rose-600 transition-colors p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  aria-label={t('common.dismiss')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div 
                className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-700 text-xs font-medium rounded-lg flex items-start gap-2 shadow-sm"
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                <Mail size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <span>{success}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess(null)}
                  className="text-emerald-400 hover:text-emerald-600 transition-colors p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  aria-label={t('common.dismiss')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* What to do next */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">
                {t('auth.verification.error.whatToDo')}
              </h3>
              <div className="space-y-2">
                {errorDetails.canResend && (
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-indigo-600">1</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                        {t('auth.verification.error.solution1Title')}
                      </h4>
                      <p className="text-xs text-slate-600">
                        {t('auth.verification.error.solution1Desc')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">{errorDetails.canResend ? '2' : '1'}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                      {t('auth.verification.error.solution2Title')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('auth.verification.error.solution2Desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">{errorDetails.canResend ? '3' : '2'}</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                      {t('auth.verification.error.solution3Title')}
                    </h4>
                    <p className="text-xs text-slate-600">
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
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  aria-label={t('auth.verification.resendEmail')}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                      <span>{t('auth.verification.sending')}</span>
                    </>
                  ) : !canResend && nextResendTime ? (
                    <>
                      <Clock size={16} aria-hidden="true" />
                      <span>{t('auth.verification.waitToResend')} ({timeRemaining})</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} aria-hidden="true" />
                      <span>{t('auth.verification.resendEmail')}</span>
                    </>
                  )}
                </button>
              )}

              {/* Back to Sign In */}
              <Link
                href="/auth"
                className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              >
                <ArrowLeft size={16} aria-hidden="true" />
                <span>{t('auth.verification.error.backToSignIn')}</span>
              </Link>
            </div>

            {/* Support Link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                {t('auth.verification.needHelp')}{' '}
                <Link 
                  href="/support" 
                  className="text-indigo-600 font-bold hover:underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 rounded"
                >
                  {t('auth.verification.contactSupport')}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Logo Footer */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <LogoIcon size={16} className="text-indigo-600" />
            <span className="text-xs font-medium">PikSend</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('common.hdPhotoSharing')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="fixed bottom-4 left-1/2 -translate-x-1/2 text-center text-[10px] text-slate-400 z-10">
        © 2025 PikSend
      </p>
    </div>
  );
}

export default function VerifyEmailErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
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
