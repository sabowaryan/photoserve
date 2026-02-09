'use client';

/**
 * Back Button Component for Auth Pages
 * 
 * Features:
 * - Mobile: Fixed top-left with hover expand effect
 * - Desktop: Inline round button with hover expand
 * - RTL support for Arabic language
 * - WCAG 2.1 AA compliant
 * - Smart routing based on current page
 */

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export function BackButton() {
  const pathname = usePathname();
  const { t, locale } = useTranslation();

  // Determine destination and label based on current page
  const isForgotPassword = pathname === '/forgot-password';
  const isResetPassword = pathname === '/reset-password';
  const isVerifyEmail = pathname === '/verify-email';
  
  const href = (isForgotPassword || isResetPassword) ? '/auth' : '/';
  const label = (isForgotPassword || isResetPassword)
    ? t('auth.forgotPassword.backToLogin')
    : t('common.backToHome');

  // Don't show back button on verify-email page (user should stay there)
  if (isVerifyEmail) {
    return null;
  }

  // Check if RTL language (Arabic)
  const isRTL = locale === 'ar';

  return (
    <>
      {/* Mobile Back Button - Fixed top-start with hover expand */}
      <div className="lg:hidden fixed top-4 start-4 z-40">
        <Link
          href={href}
          className="group flex items-center gap-0 overflow-hidden bg-white shadow-sm border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-piksend-violet focus:ring-offset-2 w-10 h-10 hover:w-auto hover:px-4"
          aria-label={label}
        >
          <ArrowLeft 
            className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ms-2.5 group-hover:ms-0 ${isRTL ? 'rotate-180' : ''}`}
            aria-hidden="true" 
          />
          <span className="text-sm font-medium whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ms-2 group-hover:me-1 transition-all duration-300">
            {label}
          </span>
        </Link>
      </div>

      {/* Desktop Back Button - Inline round with hover expand */}
      <div className="hidden lg:flex mb-8">
        <Link
          href={href}
          className="group flex items-center gap-0 overflow-hidden bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-piksend-violet focus:ring-offset-2 w-10 h-10 hover:w-auto hover:px-4"
          aria-label={label}
        >
          <ArrowLeft 
            className={`w-5 h-5 flex-shrink-0 transition-all duration-300 ms-2.5 group-hover:ms-0 ${isRTL ? 'rotate-180' : ''}`}
            aria-hidden="true" 
          />
          <span className="text-sm font-medium whitespace-nowrap opacity-0 max-w-0 group-hover:opacity-100 group-hover:max-w-xs group-hover:ms-2 group-hover:me-1 transition-all duration-300">
            {label}
          </span>
        </Link>
      </div>
    </>
  );
}
