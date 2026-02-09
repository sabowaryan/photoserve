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
    <div className="w-full" role="region" aria-label="Email Verification Success">
      {/* Auth Card */}
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main" aria-labelledby="page-title">
        {/* Header */}
        <header className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
            <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
          </div>
          <h1 id="page-title" className="text-3xl font-bold text-slate-900 mb-2">
            {t('auth.verification.successTitle')}
          </h1>
          <p className="text-slate-600">
            {t('auth.verification.successSubtitle')}
          </p>
        </header>

        <div className="space-y-6">
          {/* Success Message */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-5 w-5 text-green-600" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  {t('auth.verification.accountVerified')}
                </h3>
                <p className="text-sm text-green-700">
                  {t('auth.verification.accountVerifiedDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-slate-700">
              {t('auth.verification.whatsNext')}
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    {t('auth.verification.nextStep1Title')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t('auth.verification.nextStep1Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">2</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    {t('auth.verification.nextStep2Title')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t('auth.verification.nextStep2Desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-bold text-indigo-600">3</span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-1">
                    {t('auth.verification.nextStep3Title')}
                  </h4>
                  <p className="text-sm text-slate-600">
                    {t('auth.verification.nextStep3Desc')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Auto-redirect Notice */}
          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
            <p className="text-sm text-indigo-800">
              {t('auth.verification.redirecting')} <span className="font-bold">{countdown}</span> {t('auth.verification.seconds')}
            </p>
          </div>

          {/* Continue Button */}
          <button
            onClick={handleRedirect}
            disabled={isRedirecting}
            className="w-full py-3 px-4 bg-piksend-gradient text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={t('auth.verification.continueToDashboard')}
          >
            {isRedirecting ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" aria-hidden="true" />
                <span>{t('common.loading')}</span>
              </>
            ) : (
              <>
                <span>{t('auth.verification.continueToDashboard')}</span>
                <ArrowRight className="w-5 h-5" aria-hidden="true" />
              </>
            )}
          </button>

          {/* Help Link */}
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

export default function VerifyEmailSuccessPageClient() {
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
      <VerifyEmailSuccessContent />
    </Suspense>
  );
}
