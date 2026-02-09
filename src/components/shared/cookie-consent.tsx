/**
 * Cookie Consent Banner
 * RGPD-compliant cookie consent management
 * 
 * @module components/shared/cookie-consent
 * Requirement: 23.4 - RGPD compliance with cookie consent
 */

'use client';

import { useState, useEffect } from 'react';
import { Cookie } from 'lucide-react';
import Link from 'next/link';

const CONSENT_KEY = 'piksend_cookie_consent';

export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check if user has already given consent
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Show banner after 1 second delay
      setTimeout(() => setShow(true), 1000);
    } else {
      // Apply consent preferences
      applyConsent(JSON.parse(consent));
    }
  }, []);

  const handleAcceptAll = () => {
    const consent = {
      essential: true,
      analytics: true,
      marketing: false, // We don't use marketing cookies yet
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent(consent);
    setShow(false);
  };

  const handleAcceptEssential = () => {
    const consent = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    applyConsent(consent);
    setShow(false);
  };

  const applyConsent = (consent: any) => {
    // Update Google Analytics consent
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: consent.analytics ? 'granted' : 'denied',
        ad_storage: consent.marketing ? 'granted' : 'denied',
      });
    }

    // Update Mixpanel consent
    if (typeof window !== 'undefined' && (window as any).mixpanel) {
      if (!consent.analytics) {
        (window as any).mixpanel.opt_out_tracking();
      } else {
        (window as any).mixpanel.opt_in_tracking();
      }
    }
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 p-6">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Cookie className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Nous utilisons des cookies
            </h3>
            <p className="text-sm text-slate-600">
              Nous utilisons des cookies essentiels pour le fonctionnement du site et des cookies analytiques pour améliorer votre expérience. 
              Vous pouvez choisir d&apos;accepter tous les cookies ou uniquement les cookies essentiels.{' '}
              <Link href="/privacy" className="text-indigo-600 hover:text-indigo-700 font-medium underline">
                En savoir plus
              </Link>
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <button
              onClick={handleAcceptEssential}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-all text-sm whitespace-nowrap"
            >
              Essentiels uniquement
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:from-indigo-700 hover:to-violet-700 transition-all text-sm whitespace-nowrap shadow-lg shadow-indigo-500/25"
            >
              Accepter tous
            </button>
          </div>
        </div>

        {/* Cookie Details */}
        <div className="px-6 pb-6">
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer font-medium hover:text-slate-700 transition-colors">
              Détails des cookies
            </summary>
            <div className="mt-3 space-y-2 pl-4">
              <div>
                <strong className="text-slate-700">Cookies essentiels :</strong> Nécessaires au fonctionnement du site (authentification, session). Toujours actifs.
              </div>
              <div>
                <strong className="text-slate-700">Cookies analytiques :</strong> Google Analytics, Mixpanel. Nous aident à comprendre comment vous utilisez le site.
              </div>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
