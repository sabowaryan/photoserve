/**
 * Dynamic Robots.txt Generation
 * Controls search engine crawling behavior
 * 
 * Requirements: 7.4
 */

import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Protected routes - require authentication
          '/dashboard',
          '/dashboard/*',
          '/settings',
          '/settings/*',
          
          // Gallery pages - protected by password, should not be indexed (Requirement 7.8)
          '/g/',
          '/g/*',
          
          // API routes
          '/api/',
          '/api/*',
          
          // Auth pages - no need to index
          '/auth',
          '/forgot-password',
          '/reset-password',
        ],
      },
      {
        // Block specific bots that might be aggressive
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
