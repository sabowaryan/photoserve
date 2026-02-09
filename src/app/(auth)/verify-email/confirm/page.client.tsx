'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

function VerifyEmailConfirmContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success'>('verifying');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        // Redirect to error page with invalid type
        router.push('/verify-email/error?type=invalid');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus('success');
          // Redirect to success page after a brief moment
          setTimeout(() => {
            const callbackUrl = searchParams.get('callbackUrl');
            if (callbackUrl) {
              router.push(`/verify-email/success?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            } else {
              router.push('/verify-email/success');
            }
          }, 1000);
        } else {
          // Map error codes to error types and redirect to error page
          let errorType = 'generic';
          switch (data.code) {
            case 'TOKEN_EXPIRED':
              errorType = 'expired';
              break;
            case 'TOKEN_USED':
              errorType = 'used';
              break;
            case 'TOKEN_NOT_FOUND':
              errorType = 'not_found';
              break;
            case 'TOKEN_INVALID':
              errorType = 'invalid';
              break;
          }
          
          // Get email from token if available (for resend functionality)
          const email = searchParams.get('email');
          const errorUrl = `/verify-email/error?type=${errorType}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
          router.push(errorUrl);
        }
      } catch (error) {
        console.error('Verification error:', error);
        router.push('/verify-email/error?type=generic');
      }
    };

    verifyToken();
  }, [searchParams, router, t]);

  return (
    <div className="w-full" role="region" aria-label="Email Verification">
      <article className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8" role="main">
        <div className="text-center">
          {status === 'verifying' && (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t('auth.verification.verifying')}
              </h1>
              <p className="text-slate-600">
                {t('auth.verification.pleaseWait')}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden="true" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">
                {t('auth.verification.successTitle')}
              </h1>
              <p className="text-slate-600">
                {t('auth.verification.redirecting')}
              </p>
            </>
          )}
        </div>
      </article>
    </div>
  );
}

export default function VerifyEmailConfirmPageClient() {
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
      <VerifyEmailConfirmContent />
    </Suspense>
  );
}
