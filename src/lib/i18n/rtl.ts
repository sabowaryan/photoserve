/**
 * RTL Layout Manager
 * Handles right-to-left layout detection and application for Arabic language support
 */

import { SupportedLocale, SUPPORTED_LOCALES } from './types';

export class RTLManager {
  /**
   * Check if a locale uses RTL direction
   * @param locale - The locale code to check
   * @returns true if the locale uses RTL, false otherwise
   */
  static isRTL(locale: SupportedLocale): boolean {
    const config = SUPPORTED_LOCALES.find(l => l.code === locale);
    return config?.direction === 'rtl';
  }

  /**
   * Get text direction for a locale
   * @param locale - The locale code
   * @returns 'rtl' for right-to-left languages, 'ltr' for left-to-right languages
   */
  static getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }

  /**
   * Apply RTL direction to document
   * Sets the dir and lang attributes on the document element
   * @param locale - The locale code to apply
   */
  static applyDirection(locale: SupportedLocale): void {
    // Skip if running in non-browser environment (SSR)
    if (typeof document === 'undefined') return;
    
    const direction = this.getDirection(locale);
    document.documentElement.dir = direction;
    document.documentElement.lang = locale;
  }

  /**
   * Get CSS class for RTL support
   * @param locale - The locale code
   * @returns 'rtl' for right-to-left languages, 'ltr' for left-to-right languages
   */
  static getDirectionClass(locale: SupportedLocale): string {
    return this.isRTL(locale) ? 'rtl' : 'ltr';
  }
}
