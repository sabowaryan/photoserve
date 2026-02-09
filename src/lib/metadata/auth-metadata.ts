import type { Metadata } from 'next';
import { getServerLocale } from '@/lib/i18n/server';

type AuthPageType = 'signin' | 'signup' | 'forgotPassword' | 'resetPassword' | 'verifyEmail' | 'verifyEmailSuccess';

const ogLocaleMap: Record<string, string> = {
  en: 'en_US',
  fr: 'fr_FR',
  sv: 'sv_SE',
  no: 'nb_NO',
  da: 'da_DK',
  fi: 'fi_FI',
  ja: 'ja_JP',
  ko: 'ko_KR',
  'zh-CN': 'zh_CN',
  'zh-TW': 'zh_TW',
  ar: 'ar_SA',
};

const pageKeywords: Record<AuthPageType, string[]> = {
  signin: [
    'professional photo delivery',
    'photo gallery login',
    'photographer dashboard',
    'secure photo sharing',
    'PikSend sign in',
  ],
  signup: [
    'create account',
    'photographer registration',
    'photo gallery signup',
    'PikSend account',
    'professional photo sharing',
  ],
  forgotPassword: [
    'reset password',
    'forgot password',
    'password recovery',
    'account recovery',
    'PikSend password',
  ],
  resetPassword: [
    'reset password',
    'new password',
    'password change',
    'account security',
    'PikSend password',
  ],
  verifyEmail: [
    'verify email',
    'email verification',
    'confirm email',
    'account activation',
    'PikSend verification',
  ],
  verifyEmailSuccess: [
    'email verified',
    'account activated',
    'verification success',
    'email confirmed',
    'PikSend account ready',
  ],
};

const pageUrls: Record<AuthPageType, string> = {
  signin: '/auth',
  signup: '/auth',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  verifyEmail: '/verify-email',
  verifyEmailSuccess: '/verify-email/success',
};

export async function generateAuthMetadata(pageType: AuthPageType): Promise<Metadata> {
  const locale = await getServerLocale();
  const translations = (await import(`@/locales/${locale}.json`)).default;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';

  // Get title and description based on page type
  let title: string;
  let description: string;

  switch (pageType) {
    case 'signin':
      title = translations.auth?.signin?.title || 'Sign In';
      description = translations.auth?.signin?.subtitle || 'Sign in to your PikSend account to manage your photo galleries';
      break;
    case 'signup':
      title = translations.auth?.signup?.title || 'Create Account';
      description = translations.auth?.signup?.subtitle?.replace('{{count}}+', '500+') || 'Join photographers on PikSend';
      break;
    case 'forgotPassword':
      title = translations.auth?.forgotPassword?.title || 'Forgot Password';
      description = translations.auth?.forgotPassword?.subtitle || 'Enter your email address and we\'ll send you a link to reset your password';
      break;
    case 'resetPassword':
      title = translations.auth?.resetPassword?.title || 'Reset Password';
      description = translations.auth?.resetPassword?.subtitle || 'Choose a strong password for your account';
      break;
    case 'verifyEmail':
      title = translations.auth?.verification?.title || 'Verify Your Email';
      description = translations.auth?.verification?.subtitle || 'We\'ve sent a verification email to your inbox';
      break;
    case 'verifyEmailSuccess':
      title = translations.auth?.verification?.successTitle || 'Email Verified Successfully';
      description = translations.auth?.verification?.successSubtitle || 'Your email has been verified. You can now access your account';
      break;
  }

  const pageUrl = pageUrls[pageType];
  const keywords = pageKeywords[pageType];

  return {
    title: `${title} | PikSend`,
    description,
    keywords,
    authors: [{ name: 'PikSend' }],
    creator: 'PikSend',
    publisher: 'PikSend',
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `${baseUrl}${pageUrl}`,
    },
    openGraph: {
      title: `${title} | PikSend`,
      description,
      type: 'website',
      locale: ogLocaleMap[locale] || 'en_US',
      url: `${baseUrl}${pageUrl}`,
      siteName: 'PikSend',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: `${title} | PikSend`,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary',
      title: `${title} | PikSend`,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
    },
  };
}
