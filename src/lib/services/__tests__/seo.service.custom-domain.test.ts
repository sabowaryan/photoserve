/**
 * Unit tests for SEO Service - Custom Domain Support
 * Validates: Requirements 12.1, 12.2, 12.3, 12.4
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { SeoService } from '../seo.service';
import type { Gallery } from '@/types';

describe('SeoService - Custom Domain Support', () => {
  let seoService: SeoService;
  const BASE_URL = 'https://piksend.com';
  const CUSTOM_DOMAIN = 'photos.example.com';

  beforeEach(() => {
    seoService = new SeoService(BASE_URL);
  });

  describe('Gallery Metadata with Custom Domain', () => {
    const mockGallery: Gallery = {
      id: 'test-id',
      user_id: 'user-id',
      title: 'Test Gallery',
      unique_slug: 'test-slug',
      password_hash: '',
      expiration_days: 30,
      expires_at: '2024-12-31',
      views_count: 0,
      is_active: true,
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
      guest_session_id: null,
      is_unlocked: false,
      payment_type: 'free',
      converted_at: null,
    };

    test('should use custom domain for canonical URL when provided', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.alternates?.canonical).toBe(
        `https://${CUSTOM_DOMAIN}/g/${mockGallery.unique_slug}`
      );
    });

    test('should use custom domain for Open Graph URL when provided', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.openGraph?.url).toBe(
        `https://${CUSTOM_DOMAIN}/g/${mockGallery.unique_slug}`
      );
    });

    test('should use default base URL when custom domain is not provided', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
      });

      expect(metadata.alternates?.canonical).toBe(
        `${BASE_URL}/g/${mockGallery.unique_slug}`
      );
      expect(metadata.openGraph?.url).toBe(
        `${BASE_URL}/g/${mockGallery.unique_slug}`
      );
    });

    test('should maintain noindex meta tag with custom domain', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.robots).toEqual({
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
      });
    });

    test('should preserve Open Graph tags with custom domain', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.openGraph).toBeDefined();
      expect(metadata.openGraph?.title).toBe(mockGallery.title);
      expect(metadata.openGraph?.description).toBe(
        'Professional photo delivery gallery in original quality.'
      );
      expect(metadata.openGraph?.locale).toBe('en_US');
      expect(metadata.openGraph?.siteName).toBe('PikSend');
    });

    test('should preserve Twitter card tags with custom domain', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.twitter).toBeDefined();
      expect(metadata.twitter?.title).toBe(mockGallery.title);
      expect(metadata.twitter?.description).toBe(
        'Professional photo delivery gallery.'
      );
    });

    test('should handle gallery without custom domain', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: undefined,
      });

      expect(metadata.alternates?.canonical).toBe(
        `${BASE_URL}/g/${mockGallery.unique_slug}`
      );
      expect(metadata.openGraph?.url).toBe(
        `${BASE_URL}/g/${mockGallery.unique_slug}`
      );
    });

    test('should handle gallery without gallery data', () => {
      const metadata = seoService.generateMetadata('gallery', {
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.alternates?.canonical).toBe(`https://${CUSTOM_DOMAIN}`);
      expect(metadata.openGraph?.url).toBe(`https://${CUSTOM_DOMAIN}`);
      expect(metadata.title).toBe('Professional Photo Gallery | PikSend');
    });

    test('should include gallery title in page title', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.title).toBe(
        `${mockGallery.title} | PikSend Professional Photo Gallery`
      );
    });

    test('should use HTTPS protocol for custom domain URLs', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: mockGallery,
        customDomain: CUSTOM_DOMAIN,
      });

      expect(metadata.alternates?.canonical).toMatch(/^https:\/\//);
      expect(metadata.openGraph?.url).toMatch(/^https:\/\//);
    });
  });

  describe('Edge Cases', () => {
    test('should handle custom domain with trailing slash', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: {
          id: 'test-id',
          user_id: 'user-id',
          title: 'Test',
          unique_slug: 'test',
          password_hash: '',
          expiration_days: 30,
          expires_at: '2024-12-31',
          views_count: 0,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          guest_session_id: null,
          is_unlocked: false,
          payment_type: 'free',
          converted_at: null,
        },
        customDomain: 'photos.example.com/',
      });

      // Should not have double slashes in the path (excluding protocol)
      const canonical = metadata.alternates?.canonical;
      if (typeof canonical === 'string') {
        const pathPart = canonical.replace(/^https?:\/\//, '');
        expect(pathPart).not.toMatch(/\/\//);
        expect(canonical).toBe('https://photos.example.com/g/test');
      }
    });

    test('should handle empty custom domain string', () => {
      const metadata = seoService.generateMetadata('gallery', {
        gallery: {
          id: 'test-id',
          user_id: 'user-id',
          title: 'Test',
          unique_slug: 'test',
          password_hash: '',
          expiration_days: 30,
          expires_at: '2024-12-31',
          views_count: 0,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          guest_session_id: null,
          is_unlocked: false,
          payment_type: 'free',
          converted_at: null,
        },
        customDomain: '',
      });

      // Should fall back to base URL
      expect(metadata.alternates?.canonical).toContain(BASE_URL);
    });
  });
});
