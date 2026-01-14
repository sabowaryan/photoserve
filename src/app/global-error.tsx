'use client';

import { ServerCrash, RefreshCw, Home, Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

// Since global-error can't use React context, we need to get translations directly
// This is a fallback for when the app crashes before context is available
interface Translations {
  title: string;
  message: string;
  temporarilyUnavailable: string;
  retryLater: string;
  retry: string;
  home: string;
  problemPersists: string;
  contactSupport: string;
}

const DEFAULT_TRANSLATIONS: Translations = {
  title: 'Critical Error',
  message: 'An unexpected error occurred. Our team has been notified and is working to resolve the issue.',
  temporarilyUnavailable: 'Service temporarily unavailable',
  retryLater: 'Please try again in a few minutes',
  retry: 'Try again',
  home: 'Back to home',
  problemPersists: 'Problem persists?',
  contactSupport: 'Contact support',
};

const translations: Record<string, Translations> = {
  en: DEFAULT_TRANSLATIONS,
  fr: {
    title: 'Erreur critique',
    message: 'Une erreur inattendue s\'est produite. Notre équipe a été notifiée et travaille à résoudre le problème.',
    temporarilyUnavailable: 'Service temporairement indisponible',
    retryLater: 'Veuillez réessayer dans quelques minutes',
    retry: 'Réessayer',
    home: 'Retour à l\'accueil',
    problemPersists: 'Le problème persiste ?',
    contactSupport: 'Contacter le support',
  },
};

const getTranslations = (locale: string): Translations => {
  return translations[locale] ?? DEFAULT_TRANSLATIONS;
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    // Try to get locale from localStorage or navigator
    const storedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem('piksend-locale') || navigator.language.split('-')[0]
      : 'en';
    setLocale(storedLocale === 'fr' ? 'fr' : 'en');
    
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  const t = getTranslations(locale);

  return (
    <html lang={locale}>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-red-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full text-center space-y-6">
            {/* Animated 500 */}
            <div className="relative">
              <h1 className="text-[120px] sm:text-[140px] font-black text-red-100 leading-none select-none">
                500
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white/80 backdrop-blur-sm rounded-full p-4">
                  <ServerCrash className="w-12 h-12 text-red-500 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {t.title}
              </h2>
              <p className="text-base text-slate-600">
                {t.message}
              </p>
            </div>

            {/* Status */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-red-600">{t.temporarilyUnavailable}</span>
              </div>
              <p className="text-sm text-slate-600">
                {t.retryLater}
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button 
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t.retry}
              </button>
              <a 
                href="/"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm border border-slate-300 bg-white text-slate-900 rounded-md hover:bg-slate-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                {t.home}
              </a>
            </div>

            {/* Support */}
            <div className="pt-3 border-t border-slate-200">
              <p className="text-sm text-slate-600 mb-2">
                {t.problemPersists}
              </p>
              <a 
                href="mailto:support@piksend.com"
                className="inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                {t.contactSupport}
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
