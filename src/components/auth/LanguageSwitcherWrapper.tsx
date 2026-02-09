'use client';

/**
 * Language Switcher Wrapper for Auth Layout
 * Client component wrapper to use LanguageSwitcher in server components
 * Supports RTL positioning for Arabic language
 */

import { useState, useEffect } from 'react';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslation } from '@/lib/i18n/context';

export function LanguageSwitcherWrapper() {
  const { locale } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher variant="compact" />
      </div>
    );
  }

  // After mount, use RTL-aware positioning
  const isRTL = locale === 'ar';

  return (
    <div className={`fixed top-4 z-50 ${isRTL ? 'left-4' : 'right-4'}`}>
      <LanguageSwitcher variant="compact" />
    </div>
  );
}
