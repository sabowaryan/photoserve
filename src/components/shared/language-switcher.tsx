'use client';

/**
 * Language Switcher Component
 * Displays current language with flag and dropdown to switch languages
 */

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
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
  const { locale, setLocale } = useTranslation();
  const currentLocale = getLocaleConfig(locale);
  const [mounted, setMounted] = useState(false);

  // Only render the Select component on the client to avoid hydration mismatch
  // Radix UI generates different IDs on server vs client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLocaleChange = (value: string) => {
    setLocale(value as SupportedLocale);
  };

  // Show a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    if (variant === 'compact') {
      return (
        <div className={cn('flex items-center gap-1.5 px-2 py-1 h-8', className)}>
          <Globe className="h-4 w-4" />
          {currentLocale?.flagSvg && (
            <img 
              src={currentLocale.flagSvg} 
              alt={currentLocale.name}
              className="w-5 h-auto"
            />
          )}
        </div>
      );
    }
    return (
      <div className={cn('flex items-center gap-2 w-[140px] h-10 px-3 border rounded-md', className)}>
        <Globe className="h-4 w-4" />
        {currentLocale?.flagSvg && (
          <img 
            src={currentLocale.flagSvg} 
            alt={currentLocale.name}
            className="w-5 h-auto"
          />
        )}
        <span>{currentLocale?.name}</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Select value={locale} onValueChange={handleLocaleChange}>
        <SelectTrigger
          className={cn(
            'w-auto gap-1.5 border-none bg-transparent px-2 py-1 h-8 text-sm focus:ring-0 focus:ring-offset-0',
            className
          )}
          aria-label="Select language"
        >
          <Globe className="h-4 w-4" />
          {currentLocale?.flagSvg && (
            <img 
              src={currentLocale.flagSvg} 
              alt={currentLocale.name}
              className="w-5 h-auto"
            />
          )}
        </SelectTrigger>
        <SelectContent align="end">
          {SUPPORTED_LOCALES.map((loc) => (
            <SelectItem key={loc.code} value={loc.code}>
              <span className="flex items-center gap-2">
                {loc.flagSvg && (
                  <img 
                    src={loc.flagSvg} 
                    alt={loc.name}
                    className="w-5 h-auto"
                  />
                )}
                <span>{loc.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        className={cn(
          'w-[140px] gap-2',
          className
        )}
        aria-label="Select language"
      >
        <Globe className="h-4 w-4" />
        <SelectValue>
          <span className="flex items-center gap-2">
            {currentLocale?.flagSvg && (
              <img 
                src={currentLocale.flagSvg} 
                alt={currentLocale.name}
                className="w-5 h-auto"
              />
            )}
            <span>{currentLocale?.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {SUPPORTED_LOCALES.map((loc) => (
          <SelectItem key={loc.code} value={loc.code}>
            <span className="flex items-center gap-2">
              {loc.flagSvg && (
                <img 
                  src={loc.flagSvg} 
                  alt={loc.name}
                  className="w-5 h-auto"
                />
              )}
              <span>{loc.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
