'use client';

import { I18nProvider as BaseI18nProvider } from '@/lib/i18n';

interface I18nProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Client-side wrapper for I18nProvider
 * This component handles language detection and persistence
 */
export function I18nProviderWrapper({ children }: I18nProviderWrapperProps) {
  return <BaseI18nProvider>{children}</BaseI18nProvider>;
}
