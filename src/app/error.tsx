'use client';

import Link from 'next/link';
import { ServerCrash, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-red-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-rose-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-100/30 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl w-full text-center space-y-6 relative z-10">
        {/* Animated 500 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black bg-gradient-to-br from-red-600 via-rose-600 to-pink-700 bg-clip-text text-transparent leading-none select-none">
            500
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/80 backdrop-blur-sm rounded-full p-4 shadow-xl shadow-red-500/20">
              <ServerCrash className="w-12 h-12 text-red-600 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {t('errors.500.title')}
          </h2>
          <p className="text-base text-slate-600">
            {t('errors.500.message')}
          </p>
        </div>

        {/* Status */}
        <div className="bg-red-50/60 backdrop-blur-xl border border-red-200 rounded-xl p-4 space-y-2 shadow-lg shadow-red-500/5">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600">{t('errors.503.temporarilyUnavailable')}</span>
          </div>
          <p className="text-sm text-slate-600">
            {t('errors.500.retryLater')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={reset} size="sm" className="gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-lg shadow-red-500/25">
            <RefreshCw className="w-4 h-4" />
            {t('errors.500.retry')}
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2 border-red-200 hover:bg-red-50">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('errors.500.home')}
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            {t('errors.500.problemPersists')}
          </p>
          <Button variant="ghost" size="sm" asChild className="gap-2 hover:bg-red-50">
            <a href="mailto:support@piksend.com">
              <Mail className="w-3.5 h-3.5" />
              {t('errors.500.contactSupport')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
