'use client';

/**
 * I18n Context and Provider
 * Provides translation functionality throughout the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SupportedLocale, TranslationDictionary, TranslationValue, FALLBACK_LOCALE } from './types';
import { languageDetector } from './detector';
import { RTLManager } from './rtl';

// Import translation dictionaries
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
// Note: Additional locale files will be created in task 4
// Uncomment these imports once the locale files are created:
import sv from '@/locales/sv.json';
import no from '@/locales/no.json';
import da from '@/locales/da.json';
import fi from '@/locales/fi.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';
import zhCN from '@/locales/zh-CN.json';
import zhTW from '@/locales/zh-TW.json';
import ar from '@/locales/ar.json';

const dictionaries: Record<SupportedLocale, TranslationDictionary> = {
  en: en as TranslationDictionary,
  fr: fr as TranslationDictionary,
  // Note: Add these entries once locale files are created in task 4:
  sv: sv as TranslationDictionary,
  no: no as TranslationDictionary,
  da: da as TranslationDictionary,
  fi: fi as TranslationDictionary,
  ja: ja as TranslationDictionary,
  ko: ko as TranslationDictionary,
  'zh-CN': zhCN as TranslationDictionary,
  'zh-TW': zhTW as TranslationDictionary,
   ar: ar as TranslationDictionary,
};

export interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  formatDate: (date: Date, format?: string) => string;
  formatNumber: (num: number) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Get a nested value from a dictionary using dot notation
 * e.g., "pricing.modal.title" -> dictionary.pricing.modal.title
 */
function getNestedValue(obj: TranslationDictionary, path: string): TranslationValue | undefined {
  const keys = path.split('.');
  let current: TranslationValue | undefined = obj;

  for (const key of keys) {
    if (current === undefined || typeof current === 'string' || Array.isArray(current)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Replace parameters in a translation string
 * e.g., "Hello {{name}}" with { name: "John" } -> "Hello John"
 * Supports both string and number parameters
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: SupportedLocale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<SupportedLocale>(initialLocale ?? FALLBACK_LOCALE);
  const [isHydrated, setIsHydrated] = useState(false);

  // Detect and set initial locale on client
  useEffect(() => {
    if (!initialLocale) {
      const detected = languageDetector.detect();
      setLocaleState(detected);
    }
    setIsHydrated(true);
  }, [initialLocale]);

  // Apply RTL direction when locale changes
  useEffect(() => {
    RTLManager.applyDirection(locale);
  }, [locale]);

  // Set locale and persist to localStorage
  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    languageDetector.setPreference(newLocale);
  }, []);

  // Translation function
  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      // Try current locale first
      const currentDict = dictionaries[locale];
      let value = getNestedValue(currentDict, key);

      // Fallback to English if not found
      if (value === undefined && locale !== FALLBACK_LOCALE) {
        const fallbackDict = dictionaries[FALLBACK_LOCALE];
        value = getNestedValue(fallbackDict, key);
      }

      // Return key if translation not found
      if (value === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }

      // Handle arrays (return as JSON string or first element)
      if (Array.isArray(value)) {
        return value.join(', ');
      }

      // Handle nested objects (shouldn't happen with proper keys)
      if (typeof value !== 'string') {
        console.warn(`Translation key "${key}" points to an object, not a string`);
        return key;
      }

      return interpolate(value, params);
    },
    [locale]
  );

  // Date formatting function
  const formatDate = useCallback((date: Date): string => {
    // Use Intl.DateTimeFormat for locale-aware date formatting
    return new Intl.DateTimeFormat(locale).format(date);

  }, [locale]);

  // Number formatting function
  const formatNumber = useCallback((num: number): string => {
    // Use Intl.NumberFormat for locale-aware number formatting
    return new Intl.NumberFormat(locale).format(num);
  }, [locale]);

  const contextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      isRTL: RTLManager.isRTL(locale),
      direction: RTLManager.getDirection(locale),
      formatDate,
      formatNumber,
    }),
    [locale, setLocale, t, formatDate, formatNumber]
  );

  // Prevent hydration mismatch by rendering with fallback locale until hydrated
  if (!isHydrated) {
    return (
      <I18nContext.Provider value={{ ...contextValue, locale: initialLocale ?? FALLBACK_LOCALE }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access translation functionality
 */
export function useTranslation() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }

  return context;
}

/**
 * Hook to get current locale only
 */
export function useLocale(): SupportedLocale {
  const { locale } = useTranslation();
  return locale;
}
