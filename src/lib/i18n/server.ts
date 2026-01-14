/**
 * Server-side i18n utilities for metadata generation
 * 
 * Since Next.js metadata is generated on the server at build time,
 * we need a way to access translations without React context.
 * This module provides server-side translation functions.
 */

import { SupportedLocale, FALLBACK_LOCALE, TranslationDictionary, TranslationValue } from './types';
import { cookies, headers } from 'next/headers';

// Import all locale dictionaries
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
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

const LOCALE_STORAGE_KEY = 'piksend_locale';
const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'fr', 'sv', 'no', 'da', 'fi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar'];

/**
 * Get a nested value from a dictionary using dot notation
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
 */
function interpolate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;

  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/**
 * Detect locale from request headers (Accept-Language)
 */
function detectLocaleFromHeaders(headersList: Headers): SupportedLocale {
  const acceptLanguage = headersList.get('accept-language');
  
  if (!acceptLanguage) {
    return FALLBACK_LOCALE;
  }

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, qValue] = lang.trim().split(';q=');
      return {
        code: code?.toLowerCase() || '',
        quality: qValue ? parseFloat(qValue) : 1,
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find first supported locale
  for (const { code } of languages) {
    // Check exact match
    if (SUPPORTED_LOCALES.includes(code as SupportedLocale)) {
      return code as SupportedLocale;
    }
    // Check language code without region (e.g., 'en-US' -> 'en')
    const baseCode = code.split('-')[0];
    if (baseCode && SUPPORTED_LOCALES.includes(baseCode as SupportedLocale)) {
      return baseCode as SupportedLocale;
    }
    // Special handling for Chinese variants
    if (code.startsWith('zh')) {
      if (code.includes('tw') || code.includes('hant')) {
        return 'zh-TW';
      }
      return 'zh-CN';
    }
  }

  return FALLBACK_LOCALE;
}

/**
 * Get the current locale from cookies or headers
 * This is an async function that reads from Next.js headers/cookies
 */
export async function getServerLocale(): Promise<SupportedLocale> {
  try {
    // Try to get locale from cookie first
    const cookieStore = await cookies();
    const localeCookie = cookieStore.get(LOCALE_STORAGE_KEY);
    
    if (localeCookie?.value && SUPPORTED_LOCALES.includes(localeCookie.value as SupportedLocale)) {
      return localeCookie.value as SupportedLocale;
    }

    // Fall back to Accept-Language header
    const headersList = await headers();
    return detectLocaleFromHeaders(headersList);
  } catch {
    // If we can't access cookies/headers (e.g., during build), return fallback
    return FALLBACK_LOCALE;
  }
}

/**
 * Get translation for a specific locale (synchronous)
 */
export function getTranslation(
  locale: SupportedLocale,
  key: string,
  params?: Record<string, string | number>
): string {
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
    return key;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  // Handle nested objects
  if (typeof value !== 'string') {
    return key;
  }

  return interpolate(value, params);
}

/**
 * Create a translation function for a specific locale
 */
export function createTranslator(locale: SupportedLocale) {
  return (key: string, params?: Record<string, string | number>) => 
    getTranslation(locale, key, params);
}

/**
 * Get all translations for a locale
 */
export function getDictionary(locale: SupportedLocale): TranslationDictionary {
  return dictionaries[locale] || dictionaries[FALLBACK_LOCALE];
}
