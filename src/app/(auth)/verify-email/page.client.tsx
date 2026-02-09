'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCachedSession } from '@/hooks/use-cached-session';
import { 
  Mail, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { signOut } from 'next-auth/react';

function VerifyEmailContent() {
  const { t } = useTranslation();
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(true);
  const [nextResendTime, setNextResendTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isSigningOut, setIsSigningOut] = useState(false);

  const router = useRouter();
  const { data: session, status} = useCachedSession();

  // Redirect if user is already verified or not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth');
    } else if (status === 'authenticated' && session?.user?.emailVerified) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

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

  const handleResendEmail = async () => {
    if (!session?.user?.email || !canResend) return;

    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
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

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ callbackUrl: '/auth' });
    } catch (err) {
      console.error('Sign out error:', err);
      setIsSigningOut(false);
    }
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          </div>
          <p className="text-xs font-medium text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" role="region" aria-label="Email Verification">
      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main" aria-labelledby="page-title">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
            <Mail className="h-8 w-8 text-indigo-600" aria-hidden="true" />
          </div>
          <h1 id="page-title" className="text-3xl font-bold text-slate-900 mb-2">
            {t('auth.verification.title')}
          </h1>
          <p className="text-slate-600">
            {t('auth.verification.subtitle')}
          </p>
        </header>

        <div className="space-y-6">
          {/* Email sent to */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {t('auth.verification.emailSentTo')}
            </p>
            <p className="text-sm font-bold text-slate-900 break-all">
              {session?.user?.email}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-indigo-600">1</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {t('auth.verification.step1Title')}
                </p>
                <p className="text-sm text-slate-600">
                  {t('auth.verification.step1Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-indigo-600">2</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {t('auth.verification.step2Title')}
                </p>
                <p className="text-sm text-slate-600">
                  {t('auth.verification.step2Desc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-indigo-600">3</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">
                  {t('auth.verification.step3Title')}
                </p>
                <p className="text-sm text-slate-600">
                  {t('auth.verification.step3Desc')}
                </p>
              </div>
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
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
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

          {/* Resend Button */}
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

          {/* Help Text */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-sm font-semibold text-indigo-900 mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" aria-hidden="true" />
              {t('auth.verification.didntReceive')}
            </h3>
            <ul className="space-y-1 text-sm text-indigo-800 ml-6 list-disc">
              <li>{t('auth.verification.checkSpam')}</li>
              <li>{t('auth.verification.checkEmail')}</li>
              <li>{t('auth.verification.waitFewMinutes')}</li>
            </ul>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
            aria-label={t('auth.buttons.signOut')}
          >
            {isSigningOut ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
                <span>{t('auth.buttons.signingOut')}</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" aria-hidden="true" />
                <span>{t('auth.buttons.signOut')}</span>
              </>
            )}
          </button>

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

export default function VerifyEmailPageClient() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
