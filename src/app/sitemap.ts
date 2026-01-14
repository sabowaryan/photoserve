/**
 * Dynamic Sitemap Generation
 * Generates sitemap.xml for SEO with language-specific URLs
 * 
 * Requirements: 7.4, 8.5
 */

import type { MetadataRoute } from 'next';
import { SupportedLocale } from '@/lib/i18n/types';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';

// All supported locales for hreflang
const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'fr', 'sv', 'no', 'da', 'fi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar'];

// Map locale codes to hreflang codes
const HREFLANG_MAP: Record<SupportedLocale, string> = {
  'en': 'en',
  'fr': 'fr',
  'sv': 'sv',
  'no': 'nb', // Norwegian Bokmål
  'da': 'da',
  'fi': 'fi',
  'ja': 'ja',
  'ko': 'ko',
  'zh-CN': 'zh-Hans',
  'zh-TW': 'zh-Hant',
  'ar': 'ar',
};

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  alternates?: {
    languages: Record<string, string>;
  };
}

/**
 * Generate alternate language URLs for a given path
 */
function generateAlternates(path: string): Record<string, string> {
  const alternates: Record<string, string> = {
    'x-default': `${BASE_URL}${path}`,
  };
  
  for (const locale of SUPPORTED_LOCALES) {
    const hreflang = HREFLANG_MAP[locale];
    // For now, all locales point to the same URL since we don't have locale-prefixed routes
    // When locale routing is implemented, this would be: `${BASE_URL}/${locale}${path}`
    alternates[hreflang] = `${BASE_URL}${path}`;
  }
  
  return alternates;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  // Static pages - ordered by priority
  const staticPages: SitemapEntry[] = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: generateAlternates(''),
      },
    },
    {
      url: `${BASE_URL}/features`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: generateAlternates('/features'),
      },
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: {
        languages: generateAlternates('/pricing'),
      },
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: {
        languages: generateAlternates('/help'),
      },
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
      alternates: {
        languages: generateAlternates('/contact'),
      },
    },
  ];

  // Legal pages
  const legalPages: SitemapEntry[] = [
    {
      url: `${BASE_URL}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: generateAlternates('/legal/terms'),
      },
    },
    {
      url: `${BASE_URL}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: generateAlternates('/legal/privacy'),
      },
    },
    {
      url: `${BASE_URL}/legal/cookies`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
      alternates: {
        languages: generateAlternates('/legal/cookies'),
      },
    },
    {
      url: `${BASE_URL}/legal/mentions`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.2,
      alternates: {
        languages: generateAlternates('/legal/mentions'),
      },
    },
  ];

  // Note: Gallery pages (/g/[slug]) are NOT included in sitemap
  // as they are protected and should not be indexed (Requirement 7.8)

  // Note: Dashboard, Settings, and Auth pages are NOT included
  // as they require authentication or should not be indexed

  return [...staticPages, ...legalPages];
}
