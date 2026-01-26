'use client';

/**
 * Cookie Consent Banner Component
 * GDPR-compliant cookie consent banner for public profile pages
 * 
 * Requirements:
 * - 9.10: Allow visitors to refuse tracking via cookie consent banner
 * - 13.4: Hash IP addresses for GDPR compliance
 * - 13.7: Respect Do Not Track headers
 * 
 * @module components/public-profile/cookie-consent-banner
 */

import { useEffect, useState } from 'react';
import { X, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONSENT_STORAGE_KEY = 'piksend-tracking-consent';

export type ConsentChoice = 'accepted' | 'refused' | null;

/**
 * Get the stored consent choice from localStorage
 */
export function getStoredConsent(): ConsentChoice {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'accepted' || stored === 'refused') {
      return stored;
    }
  } catch (error) {
    console.error('Error reading consent from localStorage:', error);
  }
  
  return null;
}

/**
 * Store the consent choice in localStorage
 */
export function storeConsent(choice: 'accepted' | 'refused'): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
  } catch (error) {
    console.error('Error storing consent in localStorage:', error);
  }
}

/**
 * Check if tracking should be enabled based on consent
 * Returns true only if user has explicitly accepted
 */
export function hasTrackingConsent(): boolean {
  return getStoredConsent() === 'accepted';
}

interface CookieConsentBannerProps {
  onConsentChange?: (consent: ConsentChoice) => void;
}

/**
 * Cookie Consent Banner
 * 
 * Displays a GDPR-compliant banner at the bottom of the page
 * allowing users to accept or refuse tracking cookies.
 * 
 * The banner:
 * - Only shows if no consent choice has been made
 * - Stores the choice in localStorage
 * - Provides clear accept/refuse options
 * - Includes a link to the privacy policy
 * - Is dismissible with an X button (counts as refused)
 */
export function CookieConsentBanner({ onConsentChange }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const existingConsent = getStoredConsent();
    
    if (existingConsent === null) {
      // No choice made yet, show the banner after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000); // 1 second delay to not be intrusive
      
      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, []);

  const handleAccept = () => {
    storeConsent('accepted');
    onConsentChange?.('accepted');
    closeBanner();
  };

  const handleRefuse = () => {
    storeConsent('refused');
    onConsentChange?.('refused');
    closeBanner();
  };

  const closeBanner = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300); // Match animation duration
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[300] transition-transform duration-300 ${
        isClosing ? 'translate-y-full' : 'translate-y-0'
      }`}
      role="dialog"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Icon */}
            <div className="flex-shrink-0">
              <Cookie className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2
                id="cookie-consent-title"
                className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1"
              >
                Respect de votre vie privée
              </h2>
              <p
                id="cookie-consent-description"
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Nous utilisons des cookies pour analyser les visites de ce profil et améliorer
                l'expérience. Vos données sont anonymisées et conformes au RGPD.{' '}
                <a
                  href="/legal/cookies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-900 dark:hover:text-gray-200"
                >
                  En savoir plus
                </a>
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button
                onClick={handleRefuse}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Refuser
              </Button>
              <Button
                onClick={handleAccept}
                size="sm"
                className="flex-1 sm:flex-none"
              >
                Accepter
              </Button>
            </div>

            {/* Close button */}
            <button
              onClick={handleRefuse}
              className="absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Fermer et refuser"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
