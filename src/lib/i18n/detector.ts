/**
 * Language Detector
 * Detects user's preferred language from browser settings or stored preference
 * Supports all 11 locales: en, fr, sv, no, da, fi, ja, ko, zh-CN, zh-TW, ar
 */

import { SupportedLocale, DEFAULT_LOCALE, isSupported } from './types';

const STORAGE_KEY = 'piksend_locale';

/**
 * Mapping of browser language codes to supported locales
 * Handles regional variants and alternative codes
 */
export const LANGUAGE_CODE_MAP: Record<string, SupportedLocale> = {
  // English variants
  'en': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'en-au': 'en',
  'en-ca': 'en',
  
  // French variants
  'fr': 'fr',
  'fr-fr': 'fr',
  'fr-ca': 'fr',
  'fr-be': 'fr',
  'fr-ch': 'fr',
  
  // Swedish variants
  'sv': 'sv',
  'sv-se': 'sv',
  'sv-fi': 'sv',
  
  // Norwegian variants (nb = Bokmål, nn = Nynorsk)
  'no': 'no',
  'nb': 'no',
  'nn': 'no',
  'nb-no': 'no',
  'nn-no': 'no',
  'no-no': 'no',
  
  // Danish variants
  'da': 'da',
  'da-dk': 'da',
  
  // Finnish variants
  'fi': 'fi',
  'fi-fi': 'fi',
  
  // Japanese variants
  'ja': 'ja',
  'ja-jp': 'ja',
  
  // Korean variants
  'ko': 'ko',
  'ko-kr': 'ko',
  
  // Chinese variants - Simplified
  'zh-cn': 'zh-CN',
  'zh-hans': 'zh-CN',
  'zh-hans-cn': 'zh-CN',
  'zh-sg': 'zh-CN',  // Singapore uses Simplified
  
  // Chinese variants - Traditional
  'zh-tw': 'zh-TW',
  'zh-hant': 'zh-TW',
  'zh-hant-tw': 'zh-TW',
  'zh-hk': 'zh-TW',  // Hong Kong uses Traditional
  'zh-mo': 'zh-TW',  // Macau uses Traditional
  
  // Chinese base code defaults to Simplified
  'zh': 'zh-CN',
  
  // Arabic variants
  'ar': 'ar',
  'ar-sa': 'ar',
  'ar-ae': 'ar',
  'ar-eg': 'ar',
  'ar-ma': 'ar',
  'ar-dz': 'ar',
  'ar-tn': 'ar',
  'ar-ly': 'ar',
  'ar-jo': 'ar',
  'ar-lb': 'ar',
  'ar-sy': 'ar',
  'ar-iq': 'ar',
  'ar-kw': 'ar',
  'ar-bh': 'ar',
  'ar-qa': 'ar',
  'ar-om': 'ar',
  'ar-ye': 'ar',
};

export interface ILanguageDetector {
  detect(): SupportedLocale;
  getStoredPreference(): SupportedLocale | null;
  setPreference(locale: SupportedLocale): void;
  clearPreference(): void;
  normalizeLanguageCode(code: string): SupportedLocale | null;
}

export class LanguageDetector implements ILanguageDetector {
  /**
   * Detect the user's preferred language
   * Priority: 1. Stored preference, 2. Browser language, 3. Default (English)
   */
  detect(): SupportedLocale {
    // 1. Check stored preference first (highest priority per Requirement 5.5)
    const stored = this.getStoredPreference();
    if (stored) {
      return stored;
    }

    // 2. Check navigator.language (client-side only) per Requirements 5.1, 5.2
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      // Try navigator.language first
      if (navigator.language) {
        const normalized = this.normalizeLanguageCode(navigator.language);
        if (normalized) {
          return normalized;
        }
      }
      
      // Try navigator.languages array for additional preferences
      if (navigator.languages && navigator.languages.length > 0) {
        for (const lang of navigator.languages) {
          const normalized = this.normalizeLanguageCode(lang);
          if (normalized) {
            return normalized;
          }
        }
      }
    }

    // 3. Default to English per Requirement 5.3
    return DEFAULT_LOCALE;
  }

  /**
   * Normalize a browser language code to a supported locale
   * Handles regional variants, alternative codes, and case insensitivity
   * @param code - Browser language code (e.g., 'en-US', 'zh-Hans', 'nb-NO')
   * @returns Supported locale or null if not supported
   */
  normalizeLanguageCode(code: string): SupportedLocale | null {
    if (!code) return null;
    
    const normalizedCode = code.toLowerCase();
    
    // 1. Check exact match in mapping
    if (LANGUAGE_CODE_MAP[normalizedCode]) {
      return LANGUAGE_CODE_MAP[normalizedCode];
    }
    
    // 2. Check if it's already a supported locale (case-insensitive)
    if (isSupported(normalizedCode)) {
      return normalizedCode;
    }
    
    // 3. Try base language code (first part before hyphen)
    const baseLang = normalizedCode.split('-')[0];
    if (baseLang && LANGUAGE_CODE_MAP[baseLang]) {
      return LANGUAGE_CODE_MAP[baseLang];
    }
    
    // 4. Check if base language is directly supported
    if (baseLang && isSupported(baseLang)) {
      return baseLang;
    }
    
    return null;
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
