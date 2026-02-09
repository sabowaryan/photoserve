'use client';

/**
 * Language Switcher Component
 * Displays current language with flag and dropdown to switch languages
 * 
 * Features:
 * - Two variants: default (full) and compact (icon + flag only)
 * - Performance optimized with useMemo and useCallback
 * - WCAG 2.1 AA compliant with proper ARIA labels
 * - Smooth transitions and hover effects
 * - Hydration-safe rendering
 * - Language names translated in current language
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Globe, Check } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTranslation } from '@/lib/i18n/context';
import { SUPPORTED_LOCALES, SupportedLocale, getLocaleConfig } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
}

export function LanguageSwitcher({ className, variant = 'default' }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  // Memoize current locale config to avoid recalculation
  const currentLocale = useMemo(() => getLocaleConfig(locale), [locale]);
  
  // Get translated language name
  const getLanguageName = useCallback((code: SupportedLocale) => {
    return t(`common.languages.${code}`);
  }, [t]);

  // Only render the Select component on the client to avoid hydration mismatch
  // Radix UI generates different IDs on server vs client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize locale change handler
  const handleLocaleChange = useCallback((value: string) => {
    setLocale(value as SupportedLocale);
  }, [setLocale]);

  // Show a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    if (variant === 'compact') {
      return (
        <div 
          className={cn(
            'flex items-center gap-2 px-3 py-2 h-10 rounded-lg border border-gray-200 bg-white shadow-sm',
            className
          )}
          role="button"
          aria-label="Language selector loading"
        >
          <Globe className="h-4 w-4 text-gray-600" aria-hidden="true" />
          {currentLocale?.flagSvg && (
            <img 
              src={currentLocale.flagSvg} 
              alt=""
              className="w-5 h-auto"
              aria-hidden="true"
            />
          )}
        </div>
      );
    }
    return (
      <div 
        className={cn(
          'flex items-center gap-2 w-[160px] h-10 px-3 border border-gray-200 rounded-lg bg-white shadow-sm',
          className
        )}
        role="button"
        aria-label="Language selector loading"
      >
        <Globe className="h-4 w-4 text-gray-600" aria-hidden="true" />
        {currentLocale?.flagSvg && (
          <img 
            src={currentLocale.flagSvg} 
            alt=""
            className="w-5 h-auto"
            aria-hidden="true"
          />
        )}
        <span className="text-sm font-medium text-gray-700">{getLanguageName(locale)}</span>
      </div>
    );
  }

  // Compact variant - icon + flag only
  if (variant === 'compact') {
    return (
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          className={cn(
            'w-auto gap-2 px-3 py-2 h-10 rounded-lg border border-gray-200 bg-white shadow-sm',
            'hover:bg-gray-50 hover:border-gray-300 transition-all duration-200',
            'focus:ring-2 focus:ring-piksend-violet focus:ring-offset-2 focus:border-piksend-violet',
            'data-[state=open]:ring-2 data-[state=open]:ring-piksend-violet data-[state=open]:border-piksend-violet',
            className
          )}
          aria-label={`Current language: ${getLanguageName(locale)}. Click to change language`}
        >
          <Globe className="h-4 w-4 text-gray-600" aria-hidden="true" />
          {currentLocale?.flagSvg && (
            <img 
              src={currentLocale.flagSvg} 
              alt=""
              className="w-5 h-auto"
              aria-hidden="true"
            />
          )}
        </SelectTrigger>
        <SelectContent 
          align="end" 
          className="min-w-[200px] max-h-[400px] overflow-y-auto"
          aria-label="Available languages"
        >
          {SUPPORTED_LOCALES.map((loc) => (
            <SelectItem 
              key={loc.code} 
              value={loc.code}
              className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors"
              aria-label={`Switch to ${getLanguageName(loc.code)}`}
            >
              <span className="flex items-center gap-3 py-1">
                {loc.flagSvg && (
                  <img 
                    src={loc.flagSvg} 
                    alt=""
                    className="w-6 h-auto flex-shrink-0"
                    aria-hidden="true"
                  />
                )}
                <span className="text-sm font-medium text-gray-700 flex-1">{getLanguageName(loc.code)}</span>
                {loc.code === locale && (
                  <Check className="h-4 w-4 text-piksend-violet" aria-label="Currently selected" />
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default variant - full display with name
  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        className={cn(
          'w-[160px] gap-2 h-10 rounded-lg border border-gray-200 bg-white shadow-sm',
          'hover:bg-gray-50 hover:border-gray-300 transition-all duration-200',
          'focus:ring-2 focus:ring-piksend-violet focus:ring-offset-2 focus:border-piksend-violet',
          'data-[state=open]:ring-2 data-[state=open]:ring-piksend-violet data-[state=open]:border-piksend-violet',
          className
        )}
        aria-label={`Current language: ${getLanguageName(locale)}. Click to change language`}
      >
        <Globe className="h-4 w-4 text-gray-600 flex-shrink-0" aria-hidden="true" />
        <SelectValue>
          <span className="flex items-center gap-2">
            {currentLocale?.flagSvg && (
              <img 
                src={currentLocale.flagSvg} 
                alt=""
                className="w-5 h-auto flex-shrink-0"
                aria-hidden="true"
              />
            )}
            <span className="text-sm font-medium text-gray-700 truncate">{getLanguageName(locale)}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent 
        align="end" 
        className="min-w-[200px] max-h-[400px] overflow-y-auto"
        aria-label="Available languages"
      >
        {SUPPORTED_LOCALES.map((loc) => (
          <SelectItem 
            key={loc.code} 
            value={loc.code}
            className="cursor-pointer hover:bg-gray-50 focus:bg-gray-50 transition-colors"
            aria-label={`Switch to ${getLanguageName(loc.code)}`}
          >
            <span className="flex items-center gap-3 py-1">
              {loc.flagSvg && (
                <img 
                  src={loc.flagSvg} 
                  alt=""
                  className="w-6 h-auto flex-shrink-0"
                  aria-hidden="true"
                />
              )}
              <span className="text-sm font-medium text-gray-700 flex-1">{getLanguageName(loc.code)}</span>
              {loc.code === locale && (
                <Check className="h-4 w-4 text-piksend-violet" aria-label="Currently selected" />
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
