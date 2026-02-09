'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCachedSession } from '@/hooks/use-cached-session';
import { 
  Mail, 
  Loader2, 
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
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
  const { data: session, status } = useCachedSession();

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
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
        <div className="absolute top-20 left-10 w-48 h-48 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-violet-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-indigo-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-purple-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow border border-white/10">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('auth.verification.title')}
              </h1>
              <p className="text-indigo-100/90 text-sm">
                {t('auth.verification.subtitle')}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Email sent to */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                {t('auth.verification.emailSentTo')}
              </p>
              <p className="text-sm font-bold text-slate-900 break-all">
                {session?.user?.email}
              </p>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    {t('auth.verification.step1Title')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t('auth.verification.step1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    {t('auth.verification.step2Title')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t('auth.verification.step2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-1">
                    {t('auth.verification.step3Title')}
                  </p>
                  <p className="text-xs text-slate-600">
                    {t('auth.verification.step3Desc')}
                  </p>
                </div>
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
                <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
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

            {/* Resend Button */}
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

            {/* Help Text */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-xs font-bold text-blue-900 mb-2 flex items-center gap-2">
                <AlertCircle size={14} aria-hidden="true" />
                {t('auth.verification.didntReceive')}
              </h3>
              <ul className="space-y-1 text-xs text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('auth.verification.checkSpam')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('auth.verification.checkEmail')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <span>{t('auth.verification.waitFewMinutes')}</span>
                </li>
              </ul>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
              aria-label={t('auth.buttons.signOut')}
            >
              {isSigningOut ? (
                <>
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  <span>{t('auth.buttons.signingOut')}</span>
                </>
              ) : (
                <>
                  <LogOut size={16} aria-hidden="true" />
                  <span>{t('auth.buttons.signOut')}</span>
                </>
              )}
            </button>

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

export default function VerifyEmailPage() {
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
