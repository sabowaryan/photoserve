/**
 * Language Detector
 * Detects user's preferred language from browser settings or stored preference
 */

import { SupportedLocale, DEFAULT_LOCALE, isSupported } from './types';

const STORAGE_KEY = 'piksend_locale';

export interface ILanguageDetector {
  detect(): SupportedLocale;
  getStoredPreference(): SupportedLocale | null;
  setPreference(locale: SupportedLocale): void;
  clearPreference(): void;
}

export class LanguageDetector implements ILanguageDetector {
  /**
   * Detect the user's preferred language
   * Priority: 1. Stored preference, 2. Browser language, 3. Default (English)
   */
  detect(): SupportedLocale {
    // 1. Check stored preference first
    const stored = this.getStoredPreference();
    if (stored) {
      return stored;
    }

    // 2. Check navigator.language (client-side only)
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.split('-')[0]?.toLowerCase();
      if (browserLang && isSupported(browserLang)) {
        return browserLang;
      }
    }

    // 3. Default to English
    return DEFAULT_LOCALE;
  }

  /**
   * Get stored language preference from localStorage
   */
  getStoredPreference(): SupportedLocale | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && isSupported(stored)) {
        return stored;
      }
    } catch {
      // localStorage might not be available
    }

    return null;
  }

  /**
   * Store language preference in localStorage
   */
  setPreference(locale: SupportedLocale): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // localStorage might not be available
    }
  }

  /**
   * Clear stored language preference
   */
  clearPreference(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage might not be available
    }
  }
}

// Singleton instance for convenience
export const languageDetector = new LanguageDetector();
