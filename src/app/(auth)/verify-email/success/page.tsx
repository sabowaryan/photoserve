'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircle2, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { LogoIcon } from '@/components/shared/logo';
import { useTranslation } from '@/lib/i18n/context';

function VerifyEmailSuccessContent() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Auto-redirect after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleRedirect();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRedirect = () => {
    setIsRedirecting(true);
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl) {
      router.push(decodeURIComponent(callbackUrl));
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-48 h-48 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-teal-200/30 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md z-10">
        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 shadow-xl shadow-emerald-500/5 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
            
            <div className="relative">
              {/* Success Icon with Animation */}
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow border border-white/10 animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('auth.verification.successTitle')}
              </h1>
              <p className="text-emerald-100/90 text-sm">
                {t('auth.verification.successSubtitle')}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Success Message */}
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-900 mb-1">
                    {t('auth.verification.accountVerified')}
                  </h3>
                  <p className="text-xs text-emerald-700">
                    {t('auth.verification.accountVerifiedDesc')}
                  </p>
                </div>
              </div>
            </div>

            {/* What's Next */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">
                {t('auth.verification.whatsNext')}
              </h3>
              
              <div className="space-y-2">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">1</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                      {t('auth.verification.nextStep1Title')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('auth.verification.nextStep1Desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">2</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                      {t('auth.verification.nextStep2Title')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('auth.verification.nextStep2Desc')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-indigo-600">3</span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 mb-0.5">
                      {t('auth.verification.nextStep3Title')}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t('auth.verification.nextStep3Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-redirect Notice */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <p className="text-xs text-blue-800">
                {t('auth.verification.redirecting')} <span className="font-bold">{countdown}</span> {t('auth.verification.seconds')}
              </p>
            </div>

            {/* Continue Button */}
            <button
              onClick={handleRedirect}
              disabled={isRedirecting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              aria-label={t('auth.verification.continueToDashboard')}
            >
              {isRedirecting ? (
                <>
                  <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                  <span>{t('common.loading')}</span>
                </>
              ) : (
                <>
                  <span>{t('auth.verification.continueToDashboard')}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </>
              )}
            </button>

            {/* Help Link */}
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

export default function VerifyEmailSuccessPage() {
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
      <VerifyEmailSuccessContent />
    </Suspense>
  );
}
