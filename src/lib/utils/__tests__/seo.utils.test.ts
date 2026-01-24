/**
 * Unit tests for SEOGenerator
 * 
 * Tests specific examples and edge cases for SEO generation
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.7, 8.8**
 */

import { describe, it, expect } from 'vitest';
import { SEOGenerator } from '../seo.utils';
import type { PublicProfile } from '@/types/public-profile';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Creates a minimal valid profile for testing
 */
function createMinimalProfile(overrides: Partial<PublicProfile> = {}): PublicProfile {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    isEnabled: true,
    slug: 'john-doe',
    displayName: 'John Doe',
    viewsCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    ...overrides,
  };
}

// ============================================================================
// generateMetaTags() Tests
// ============================================================================

describe('SEOGenerator.generateMetaTags()', () => {
  describe('Title generation', () => {
    it('should use custom meta title when provided', () => {
      const profile = createMinimalProfile({
        metaTitle: 'Custom Title',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.title).toBe('Custom Title');
    });

    it('should generate default title when custom meta title is not provided', () => {
      const profile = createMinimalProfile({
        displayName: 'Jane Smith',
        metaTitle: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.title).toBe('Jane Smith - Photographe Professionnel');
    });

    it('should use displayName in default title', () => {
      const profile = createMinimalProfile({
        displayName: 'Alice Photographer',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.title).toContain('Alice Photographer');
    });
  });

  describe('Description generation', () => {
    it('should use custom meta description when provided', () => {
      const profile = createMinimalProfile({
        metaDescription: 'Custom description for SEO',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toBe('Custom description for SEO');
    });

    it('should use bio when custom description is not provided', () => {
      const profile = createMinimalProfile({
        bio: 'This is my bio as a professional photographer',
        metaDescription: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toBe('This is my bio as a professional photographer');
    });

    it('should truncate bio to 160 characters when used as description', () => {
      const longBio = 'A'.repeat(200);
      const profile = createMinimalProfile({
        bio: longBio,
        metaDescription: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toHaveLength(160);
      expect(metaTags.description).toBe(longBio.substring(0, 160));
    });

    it('should generate default description when neither custom description nor bio is provided', () => {
      const profile = createMinimalProfile({
        displayName: 'Bob Wilson',
        bio: undefined,
        metaDescription: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toBe('Découvrez le portfolio de Bob Wilson, photographe professionnel.');
    });

    it('should handle empty bio by using default description', () => {
      const profile = createMinimalProfile({
        displayName: 'Charlie Brown',
        bio: '',
        metaDescription: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toBe('Découvrez le portfolio de Charlie Brown, photographe professionnel.');
    });
  });

  describe('Keywords generation', () => {
    it('should use custom keywords when provided', () => {
      const profile = createMinimalProfile({
        metaKeywords: ['wedding', 'portrait', 'commercial'],
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.keywords).toBe('wedding, portrait, commercial');
    });

    it('should generate keywords from specialties when custom keywords not provided', () => {
      const profile = createMinimalProfile({
        specialties: ['wedding', 'portrait'],
        metaKeywords: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.keywords).toContain('wedding');
      expect(metaTags.keywords).toContain('portrait');
      expect(metaTags.keywords).toContain('photographe');
      expect(metaTags.keywords).toContain('portfolio');
    });

    it('should include default keywords when no specialties or custom keywords', () => {
      const profile = createMinimalProfile({
        specialties: undefined,
        metaKeywords: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.keywords).toBe('photographe, portfolio');
    });

    it('should handle empty specialties array', () => {
      const profile = createMinimalProfile({
        specialties: [],
        metaKeywords: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.keywords).toBe('photographe, portfolio');
    });
  });

  describe('Image selection', () => {
    it('should use cover image when available', () => {
      const profile = createMinimalProfile({
        coverImageUrl: 'https://example.com/cover.jpg',
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph.image).toBe('https://example.com/cover.jpg');
      expect(metaTags.twitter.image).toBe('https://example.com/cover.jpg');
    });

    it('should fallback to avatar when cover image not available', () => {
      const profile = createMinimalProfile({
        coverImageUrl: undefined,
        avatarUrl: 'https://example.com/avatar.jpg',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph.image).toBe('https://example.com/avatar.jpg');
      expect(metaTags.twitter.image).toBe('https://example.com/avatar.jpg');
    });

    it('should use default image when neither cover nor avatar available', () => {
      const profile = createMinimalProfile({
        coverImageUrl: undefined,
        avatarUrl: undefined,
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph.image).toBe('/default-og-image.jpg');
      expect(metaTags.twitter.image).toBe('/default-og-image.jpg');
    });
  });

  describe('Open Graph tags', () => {
    it('should generate correct Open Graph structure', () => {
      const profile = createMinimalProfile({
        slug: 'test-photographer',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph).toHaveProperty('title');
      expect(metaTags.openGraph).toHaveProperty('description');
      expect(metaTags.openGraph).toHaveProperty('image');
      expect(metaTags.openGraph).toHaveProperty('url');
      expect(metaTags.openGraph).toHaveProperty('type');
      expect(metaTags.openGraph.type).toBe('profile');
    });

    it('should include profile URL in Open Graph', () => {
      const profile = createMinimalProfile({
        slug: 'amazing-photographer',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph.url).toContain('/p/amazing-photographer');
    });
  });

  describe('Twitter Card tags', () => {
    it('should generate correct Twitter Card structure', () => {
      const profile = createMinimalProfile();

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.twitter).toHaveProperty('card');
      expect(metaTags.twitter).toHaveProperty('title');
      expect(metaTags.twitter).toHaveProperty('description');
      expect(metaTags.twitter).toHaveProperty('image');
      expect(metaTags.twitter.card).toBe('summary_large_image');
    });
  });

  describe('Canonical URL', () => {
    it('should generate canonical URL with correct format', () => {
      const profile = createMinimalProfile({
        slug: 'pro-photographer',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.canonical).toMatch(/^https?:\/\/.+\/p\/pro-photographer$/);
    });
  });

  describe('Consistency across tags', () => {
    it('should use same title in meta, OG, and Twitter', () => {
      const profile = createMinimalProfile({
        metaTitle: 'Consistent Title',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.title).toBe('Consistent Title');
      expect(metaTags.openGraph.title).toBe('Consistent Title');
      expect(metaTags.twitter.title).toBe('Consistent Title');
    });

    it('should use same description in meta, OG, and Twitter', () => {
      const profile = createMinimalProfile({
        metaDescription: 'Consistent description',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.description).toBe('Consistent description');
      expect(metaTags.openGraph.description).toBe('Consistent description');
      expect(metaTags.twitter.description).toBe('Consistent description');
    });

    it('should use same image in OG and Twitter', () => {
      const profile = createMinimalProfile({
        coverImageUrl: 'https://example.com/image.jpg',
      });

      const metaTags = SEOGenerator.generateMetaTags(profile);

      expect(metaTags.openGraph.image).toBe('https://example.com/image.jpg');
      expect(metaTags.twitter.image).toBe('https://example.com/image.jpg');
    });
  });
});

// ============================================================================
// generateStructuredData() Tests
// ============================================================================

describe('SEOGenerator.generateStructuredData()', () => {
  it('should generate valid JSON-LD structure', () => {
    const profile = createMinimalProfile();

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect(structuredData).toHaveProperty('@context');
    expect(structuredData).toHaveProperty('@type');
    expect((structuredData as any)['@context']).toBe('https://schema.org');
    expect((structuredData as any)['@type']).toBe('Person');
  });

  it('should include photographer name', () => {
    const profile = createMinimalProfile({
      displayName: 'Emma Photographer',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).name).toBe('Emma Photographer');
  });

  it('should include job title', () => {
    const profile = createMinimalProfile();

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).jobTitle).toBe('Photographe Professionnel');
  });

  it('should include bio as description when available', () => {
    const profile = createMinimalProfile({
      bio: 'Professional wedding and portrait photographer',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).description).toBe('Professional wedding and portrait photographer');
  });

  it('should include avatar URL as image when available', () => {
    const profile = createMinimalProfile({
      avatarUrl: 'https://example.com/avatar.jpg',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).image).toBe('https://example.com/avatar.jpg');
  });

  it('should include profile URL', () => {
    const profile = createMinimalProfile({
      slug: 'test-slug',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).url).toContain('/p/test-slug');
  });

  it('should include social media links in sameAs array', () => {
    const profile = createMinimalProfile({
      socialLinks: {
        instagram: 'https://instagram.com/photographer',
        facebook: 'https://facebook.com/photographer',
        linkedin: 'https://linkedin.com/in/photographer',
      },
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).sameAs).toBeInstanceOf(Array);
    expect((structuredData as any).sameAs).toHaveLength(3);
    expect((structuredData as any).sameAs).toContain('https://instagram.com/photographer');
    expect((structuredData as any).sameAs).toContain('https://facebook.com/photographer');
    expect((structuredData as any).sameAs).toContain('https://linkedin.com/in/photographer');
  });

  it('should filter out undefined social links', () => {
    const profile = createMinimalProfile({
      socialLinks: {
        instagram: 'https://instagram.com/photographer',
        facebook: undefined,
        linkedin: undefined,
      },
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).sameAs).toHaveLength(1);
    expect((structuredData as any).sameAs).toContain('https://instagram.com/photographer');
  });

  it('should include address when location is provided', () => {
    const profile = createMinimalProfile({
      location: 'Paris, France',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).address).toBeDefined();
    expect((structuredData as any).address['@type']).toBe('PostalAddress');
    expect((structuredData as any).address.addressLocality).toBe('Paris, France');
  });

  it('should not include address when location is not provided', () => {
    const profile = createMinimalProfile({
      location: undefined,
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).address).toBeUndefined();
  });

  it('should include email when provided', () => {
    const profile = createMinimalProfile({
      publicEmail: 'contact@photographer.com',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).email).toBe('contact@photographer.com');
  });

  it('should include telephone when provided', () => {
    const profile = createMinimalProfile({
      phone: '+33 1 23 45 67 89',
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect((structuredData as any).telephone).toBe('+33 1 23 45 67 89');
  });

  it('should be valid JSON when stringified', () => {
    const profile = createMinimalProfile({
      displayName: 'Test Photographer',
      bio: 'Professional photographer',
      location: 'New York',
      publicEmail: 'test@example.com',
      phone: '+1234567890',
      socialLinks: {
        instagram: 'https://instagram.com/test',
      },
    });

    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect(() => JSON.stringify(structuredData)).not.toThrow();
    const jsonString = JSON.stringify(structuredData);
    const parsed = JSON.parse(jsonString);
    expect(parsed).toEqual(structuredData);
  });
});

// ============================================================================
// generateSitemapEntry() Tests
// ============================================================================

describe('SEOGenerator.generateSitemapEntry()', () => {
  it('should generate complete sitemap entry', () => {
    const profile = createMinimalProfile();

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry).toHaveProperty('url');
    expect(sitemapEntry).toHaveProperty('lastmod');
    expect(sitemapEntry).toHaveProperty('changefreq');
    expect(sitemapEntry).toHaveProperty('priority');
  });

  it('should use priority 0.8', () => {
    const profile = createMinimalProfile();

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry.priority).toBe(0.8);
  });

  it('should use changefreq "weekly"', () => {
    const profile = createMinimalProfile();

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry.changefreq).toBe('weekly');
  });

  it('should use updatedAt date for lastmod', () => {
    const updatedDate = new Date('2024-03-15T10:30:00Z');
    const profile = createMinimalProfile({
      updatedAt: updatedDate,
    });

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry.lastmod).toBe(updatedDate.toISOString());
  });

  it('should generate valid URL with profile slug', () => {
    const profile = createMinimalProfile({
      slug: 'awesome-photographer',
    });

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry.url).toContain('/p/awesome-photographer');
    expect(sitemapEntry.url).toMatch(/^https?:\/\/.+\/p\/awesome-photographer$/);
  });

  it('should generate lastmod in ISO 8601 format', () => {
    const profile = createMinimalProfile({
      updatedAt: new Date('2024-01-15T14:30:00Z'),
    });

    const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);

    expect(sitemapEntry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(() => new Date(sitemapEntry.lastmod)).not.toThrow();
  });
});

// ============================================================================
// Edge Cases and Integration Tests
// ============================================================================

describe('Edge cases', () => {
  it('should handle profile with all optional fields undefined', () => {
    const profile = createMinimalProfile({
      tagline: undefined,
      bio: undefined,
      location: undefined,
      avatarUrl: undefined,
      coverImageUrl: undefined,
      specialties: undefined,
      yearsOfExperience: undefined,
      awards: undefined,
      publicEmail: undefined,
      phone: undefined,
      website: undefined,
      address: undefined,
      socialLinks: undefined,
      ctaButton: undefined,
      testimonials: undefined,
      featuredGalleries: undefined,
      hiddenGalleries: undefined,
      metaTitle: undefined,
      metaDescription: undefined,
      metaKeywords: undefined,
    });

    expect(() => SEOGenerator.generateMetaTags(profile)).not.toThrow();
    expect(() => SEOGenerator.generateStructuredData(profile)).not.toThrow();
    expect(() => SEOGenerator.generateSitemapEntry(profile)).not.toThrow();
  });

  it('should handle profile with empty strings', () => {
    const profile = createMinimalProfile({
      bio: '',
      location: '',
    });

    const metaTags = SEOGenerator.generateMetaTags(profile);
    const structuredData = SEOGenerator.generateStructuredData(profile);

    expect(metaTags.description).not.toBe('');
    expect((structuredData as any).description).toBe('');
  });

  it('should handle profile with special characters in displayName', () => {
    const profile = createMinimalProfile({
      displayName: 'Jean-François O\'Brien',
    });

    const metaTags = SEOGenerator.generateMetaTags(profile);

    expect(metaTags.title).toContain('Jean-François O\'Brien');
  });
});
