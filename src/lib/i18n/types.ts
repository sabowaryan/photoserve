/**
 * Translation System Types
 * Supports 11 languages: English, French, Northern European (Swedish, Norwegian, Danish, Finnish),
 * Asian (Japanese, Korean, Simplified Chinese, Traditional Chinese), and Arabic
 */

export type SupportedLocale = 
  | 'en' | 'fr'  // Existing
  | 'sv' | 'no' | 'da' | 'fi'  // Northern European
  | 'ja' | 'ko' | 'zh-CN' | 'zh-TW'  // Asian
  | 'ar';  // Arabic

export interface LocaleConfig {
  code: SupportedLocale;
  name: string;
  nativeName: string;  // Name in native language
  flag: string;
  flagSvg: string; // SVG path for better browser compatibility
  direction: 'ltr' | 'rtl';  // Text direction
  dateFormat: string;  // Locale-specific date format
  numberFormat: {
    decimal: string;
    thousands: string;
  };
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  // Existing
  { 
    code: 'en', 
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    flagSvg: 'https://flagcdn.com/w20/gb.png',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    numberFormat: { decimal: '.', thousands: ',' }
  },
  { 
    code: 'fr', 
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    flagSvg: 'https://flagcdn.com/w20/fr.png',
    direction: 'ltr',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { decimal: ',', thousands: ' ' }
  },
  
  // Northern European
  { 
    code: 'sv', 
    name: 'Swedish',
    nativeName: 'Svenska',
    flag: '🇸🇪',
    flagSvg: 'https://flagcdn.com/w20/se.png',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    numberFormat: { decimal: ',', thousands: ' ' }
  },
  { 
    code: 'no', 
    name: 'Norwegian',
    nativeName: 'Norsk',
    flag: '🇳🇴',
    flagSvg: 'https://flagcdn.com/w20/no.png',
    direction: 'ltr',
    dateFormat: 'DD.MM.YYYY',
    numberFormat: { decimal: ',', thousands: ' ' }
  },
  { 
    code: 'da', 
    name: 'Danish',
    nativeName: 'Dansk',
    flag: '🇩🇰',
    flagSvg: 'https://flagcdn.com/w20/dk.png',
    direction: 'ltr',
    dateFormat: 'DD-MM-YYYY',
    numberFormat: { decimal: ',', thousands: '.' }
  },
  { 
    code: 'fi', 
    name: 'Finnish',
    nativeName: 'Suomi',
    flag: '🇫🇮',
    flagSvg: 'https://flagcdn.com/w20/fi.png',
    direction: 'ltr',
    dateFormat: 'D.M.YYYY',
    numberFormat: { decimal: ',', thousands: ' ' }
  },
  
  // Asian
  { 
    code: 'ja', 
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    flagSvg: 'https://flagcdn.com/w20/jp.png',
    direction: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { decimal: '.', thousands: ',' }
  },
  { 
    code: 'ko', 
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    flagSvg: 'https://flagcdn.com/w20/kr.png',
    direction: 'ltr',
    dateFormat: 'YYYY. MM. DD.',
    numberFormat: { decimal: '.', thousands: ',' }
  },
  { 
    code: 'zh-CN', 
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    flag: '🇨🇳',
    flagSvg: 'https://flagcdn.com/w20/cn.png',
    direction: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { decimal: '.', thousands: ',' }
  },
  { 
    code: 'zh-TW', 
    name: 'Chinese (Traditional)',
    nativeName: '繁體中文',
    flag: '🇹🇼',
    flagSvg: 'https://flagcdn.com/w20/tw.png',
    direction: 'ltr',
    dateFormat: 'YYYY年MM月DD日',
    numberFormat: { decimal: '.', thousands: ',' }
  },
  
  // Arabic
  { 
    code: 'ar', 
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    flagSvg: 'https://flagcdn.com/w20/sa.png',
    direction: 'rtl',
    dateFormat: 'DD/MM/YYYY',
    numberFormat: { decimal: '٫', thousands: '٬' }
  },
];

export const DEFAULT_LOCALE: SupportedLocale = 'en';
export const FALLBACK_LOCALE: SupportedLocale = 'en';

export type TranslationValue = string | string[] | TranslationDictionary;

export interface TranslationDictionary {
  [key: string]: TranslationValue;
}

export interface I18nConfig {
  defaultLocale: SupportedLocale;
  supportedLocales: SupportedLocale[];
  fallbackLocale: SupportedLocale;
}

export const I18N_CONFIG: I18nConfig = {
  defaultLocale: DEFAULT_LOCALE,
  supportedLocales: ['en', 'fr', 'sv', 'no', 'da', 'fi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar'],
  fallbackLocale: FALLBACK_LOCALE,
};

/**
 * Check if a locale is supported
 */
export function isSupported(locale: string): locale is SupportedLocale {
  return I18N_CONFIG.supportedLocales.includes(locale as SupportedLocale);
}

/**
 * Get locale config by code
 */
export function getLocaleConfig(code: SupportedLocale): LocaleConfig | undefined {
  return SUPPORTED_LOCALES.find((l) => l.code === code);
}
