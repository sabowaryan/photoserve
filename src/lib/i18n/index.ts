/**
 * I18n Module Exports
 * 
 * Note: Server-side functions (getServerLocale, getTranslation, createTranslator, getDictionary)
 * should be imported directly from '@/lib/i18n/server' to avoid importing next/headers in client components.
 */

export * from './types';
export * from './detector';
export { I18nProvider, useTranslation, useLocale } from './context';
export { RTLManager } from './rtl';

// Server exports are NOT re-exported here to prevent client component issues
// Import them directly from '@/lib/i18n/server' when needed in server components
