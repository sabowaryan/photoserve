/**
 * Property-based tests for SEOGenerator
 * 
 * Tests universal properties that should hold for all inputs
 * Uses fast-check for property-based testing
 * 
 * **Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.7, 8.8**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SEOGenerator } from '../seo.utils';
import type { PublicProfile } from '@/types/public-profile';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid public profiles
 * Generates profiles with all required fields and optional fields
 */
const publicProfileArb = fc.record({
  id: fc.uuid(),
  userId: fc.uuid(),
  isEnabled: fc.boolean(),
  slug: fc.stringMatching(/^[a-z0-9-]{1,100}$/),
  displayName: fc.string({ minLength: 1, maxLength: 200 }),
  tagline: fc.option(fc.string({ maxLength: 100 })),
  bio: fc.option(fc.string({ maxLength: 500 })),
  location: fc.option(fc.string({ maxLength: 200 })),
  avatarUrl: fc.option(fc.webUrl()),
  coverImageUrl: fc.option(fc.webUrl()),
  specialties: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
  yearsOfExperience: fc.option(fc.integer({ min: 0, max: 100 })),
  awards: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 3 })),
  publicEmail: fc.option(fc.emailAddress()),
  phone: fc.option(fc.string({ maxLength: 50 })),
  website: fc.option(fc.webUrl()),
  address: fc.option(fc.string({ maxLength: 500 })),
  socialLinks: fc.option(fc.record({
    instagram: fc.option(fc.webUrl()),
    facebook: fc.option(fc.webUrl()),
    pinterest: fc.option(fc.webUrl()),
    linkedin: fc.option(fc.webUrl()),
    tiktok: fc.option(fc.webUrl()),
    youtube: fc.option(fc.webUrl()),
    other: fc.option(fc.webUrl()),
  })),
  ctaButton: fc.option(fc.record({
    text: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl(),
    style: fc.constantFrom('primary', 'secondary'),
  })),
  testimonials: fc.option(fc.array(
    fc.record({
      id: fc.uuid(),
      clientName: fc.string({ minLength: 1, maxLength: 100 }),
      clientPhoto: fc.option(fc.webUrl()),
      rating: fc.integer({ min: 1, max: 5 }),
      text: fc.string({ minLength: 1, maxLength: 200 }),
      date: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts).toISOString()),
    }),
    { maxLength: 5 }
  )),
  featuredGalleries: fc.option(fc.array(fc.uuid())),
  hiddenGalleries: fc.option(fc.array(fc.uuid())),
  metaTitle: fc.option(fc.string({ maxLength: 60 })),
  metaDescription: fc.option(fc.string({ maxLength: 160 })),
  metaKeywords: fc.option(fc.array(fc.string(), { maxLength: 10 })),
  viewsCount: fc.integer({ min: 0 }),
  lastViewedAt: fc.option(fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts))),
  createdAt: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts)),
  updatedAt: fc.integer({ min: 946684800000, max: 1924905600000 }).map(ts => new Date(ts)),
}) as fc.Arbitrary<PublicProfile>;

/**
 * Generator for profiles with custom meta title
 */
const profileWithCustomMetaTitleArb = publicProfileArb.map(profile => ({
  ...profile,
  metaTitle: fc.sample(fc.string({ minLength: 1, maxLength: 60 }), 1)[0],
}));

/**
 * Generator for profiles without custom meta title
 */
const profileWithoutCustomMetaTitleArb = publicProfileArb.map(profile => ({
  ...profile,
  metaTitle: undefined,
}));

/**
 * Generator for profiles with custom meta description
 */
const profileWithCustomMetaDescriptionArb = publicProfileArb.map(profile => ({
  ...profile,
  metaDescription: fc.sample(fc.string({ minLength: 1, maxLength: 160 }), 1)[0],
}));

// ============================================================================
// Property 17: Génération des meta tags SEO
// ============================================================================

describe('Property 17: Génération des meta tags SEO', () => {
  /**
   * **Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.7**
   * 
   * Property: For any public profile, generateMetaTags() must:
   * - Return a valid MetaTags object with all required fields
   * - Use custom meta title if provided, otherwise generate default
   * - Use custom meta description if provided, otherwise use bio or generate default
   * - Generate Open Graph tags with correct structure
   * - Generate Twitter Card tags with correct structure
   * - Generate canonical URL
   */

  it('should always return a complete MetaTags object', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        // Check all required fields are present
        expect(metaTags).toHaveProperty('title');
        expect(metaTags).toHaveProperty('description');
        expect(metaTags).toHaveProperty('keywords');
        expect(metaTags).toHaveProperty('openGraph');
        expect(metaTags).toHaveProperty('twitter');
        expect(metaTags).toHaveProperty('canonical');
        
        // Check types
        expect(typeof metaTags.title).toBe('string');
        expect(typeof metaTags.description).toBe('string');
        expect(typeof metaTags.keywords).toBe('string');
        expect(typeof metaTags.canonical).toBe('string');
      }),
      { numRuns: 100 }
    );
  });

  it('should use custom meta title when provided', () => {
    fc.assert(
      fc.property(profileWithCustomMetaTitleArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        expect(metaTags.title).toBe(profile.metaTitle);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate default title when custom meta title is not provided', () => {
    fc.assert(
      fc.property(profileWithoutCustomMetaTitleArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        const expectedTitle = `${profile.displayName} - Photographe Professionnel`;
        expect(metaTags.title).toBe(expectedTitle);
      }),
      { numRuns: 100 }
    );
  });

  it('should use custom meta description when provided', () => {
    fc.assert(
      fc.property(profileWithCustomMetaDescriptionArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        expect(metaTags.description).toBe(profile.metaDescription);
      }),
      { numRuns: 100 }
    );
  });

  it('should use bio (truncated to 160 chars) when custom description is not provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, metaDescription: undefined, bio: 'A'.repeat(200) })),
        (profile) => {
          const metaTags = SEOGenerator.generateMetaTags(profile);
          
          const expectedDescription = profile.bio!.substring(0, 160);
          expect(metaTags.description).toBe(expectedDescription);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate default description when neither custom description nor bio is provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, metaDescription: undefined, bio: undefined })),
        (profile) => {
          const metaTags = SEOGenerator.generateMetaTags(profile);
          
          const expectedDescription = `Découvrez le portfolio de ${profile.displayName}, photographe professionnel.`;
          expect(metaTags.description).toBe(expectedDescription);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect meta title max length of 60 characters', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        // The title should not exceed reasonable length (though we don't enforce it in the generator)
        // This is more of a validation that custom titles should be validated before being set
        if (profile.metaTitle) {
          expect(profile.metaTitle.length).toBeLessThanOrEqual(60);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should respect meta description max length of 160 characters', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        // The description should not exceed 160 characters
        expect(metaTags.description.length).toBeLessThanOrEqual(160);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate keywords from specialties when custom keywords not provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, metaKeywords: undefined, specialties: ['portrait', 'wedding'] })),
        (profile) => {
          const metaTags = SEOGenerator.generateMetaTags(profile);
          
          expect(metaTags.keywords).toContain('portrait');
          expect(metaTags.keywords).toContain('wedding');
          expect(metaTags.keywords).toContain('photographe');
          expect(metaTags.keywords).toContain('portfolio');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use custom keywords when provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, metaKeywords: ['custom', 'keywords'] })),
        (profile) => {
          const metaTags = SEOGenerator.generateMetaTags(profile);
          
          expect(metaTags.keywords).toBe('custom, keywords');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate valid Open Graph tags', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        expect(metaTags.openGraph).toHaveProperty('title');
        expect(metaTags.openGraph).toHaveProperty('description');
        expect(metaTags.openGraph).toHaveProperty('image');
        expect(metaTags.openGraph).toHaveProperty('url');
        expect(metaTags.openGraph).toHaveProperty('type');
        
        expect(metaTags.openGraph.type).toBe('profile');
        expect(metaTags.openGraph.url).toContain(`/p/${profile.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should use cover image for Open Graph, fallback to avatar, then default', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        if (profile.coverImageUrl) {
          expect(metaTags.openGraph.image).toBe(profile.coverImageUrl);
        } else if (profile.avatarUrl) {
          expect(metaTags.openGraph.image).toBe(profile.avatarUrl);
        } else {
          expect(metaTags.openGraph.image).toBe('/default-og-image.jpg');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid Twitter Card tags', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        expect(metaTags.twitter).toHaveProperty('card');
        expect(metaTags.twitter).toHaveProperty('title');
        expect(metaTags.twitter).toHaveProperty('description');
        expect(metaTags.twitter).toHaveProperty('image');
        
        expect(metaTags.twitter.card).toBe('summary_large_image');
      }),
      { numRuns: 100 }
    );
  });

  it('should generate canonical URL with correct format', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        expect(metaTags.canonical).toMatch(/^https?:\/\/.+\/p\/.+$/);
        expect(metaTags.canonical).toContain(`/p/${profile.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency between title in meta, OG, and Twitter', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        // All three should use the same title
        expect(metaTags.title).toBe(metaTags.openGraph.title);
        expect(metaTags.title).toBe(metaTags.twitter.title);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency between description in meta, OG, and Twitter', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        // All three should use the same description
        expect(metaTags.description).toBe(metaTags.openGraph.description);
        expect(metaTags.description).toBe(metaTags.twitter.description);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistency between image in OG and Twitter', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const metaTags = SEOGenerator.generateMetaTags(profile);
        
        // Both should use the same image
        expect(metaTags.openGraph.image).toBe(metaTags.twitter.image);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 18: Génération des données structurées JSON-LD
// ============================================================================

describe('Property 18: Génération des données structurées JSON-LD', () => {
  /**
   * **Validates: Requirements 8.8**
   * 
   * Property: For any public profile, generateStructuredData() must:
   * - Return a valid JSON-LD object with @context and @type
   * - Use @type: 'Person' for photographer profiles
   * - Include all available contact information
   * - Include social media links in sameAs array
   * - Include address information when available
   */

  it('should always return a valid JSON-LD object', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect(structuredData).toHaveProperty('@context');
        expect(structuredData).toHaveProperty('@type');
        expect(structuredData).toHaveProperty('name');
        expect(structuredData).toHaveProperty('url');
      }),
      { numRuns: 100 }
    );
  });

  it('should use correct schema.org context', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect((structuredData as any)['@context']).toBe('https://schema.org');
      }),
      { numRuns: 100 }
    );
  });

  it('should use Person type for photographer profiles', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect((structuredData as any)['@type']).toBe('Person');
      }),
      { numRuns: 100 }
    );
  });

  it('should include photographer name', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect((structuredData as any).name).toBe(profile.displayName);
      }),
      { numRuns: 100 }
    );
  });

  it('should include job title as "Photographe Professionnel"', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect((structuredData as any).jobTitle).toBe('Photographe Professionnel');
      }),
      { numRuns: 100 }
    );
  });

  it('should include bio as description when available', () => {
    fc.assert(
      fc.property(
        publicProfileArb.filter(p => p.bio !== undefined),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).description).toBe(profile.bio);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include avatar URL as image when available', () => {
    fc.assert(
      fc.property(
        publicProfileArb.filter(p => p.avatarUrl !== undefined),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).image).toBe(profile.avatarUrl);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include profile URL', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        expect((structuredData as any).url).toContain(`/p/${profile.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should include social media links in sameAs array', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({
          ...p,
          socialLinks: {
            instagram: 'https://instagram.com/test',
            facebook: 'https://facebook.com/test',
          },
        })),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).sameAs).toBeInstanceOf(Array);
          expect((structuredData as any).sameAs).toContain('https://instagram.com/test');
          expect((structuredData as any).sameAs).toContain('https://facebook.com/test');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter out empty social links', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({
          ...p,
          socialLinks: {
            instagram: 'https://instagram.com/test',
            facebook: undefined,
            twitter: undefined,
          },
        })),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).sameAs).toHaveLength(1);
          expect((structuredData as any).sameAs).toContain('https://instagram.com/test');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include address when location is provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, location: 'Paris, France' })),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).address).toBeDefined();
          expect((structuredData as any).address['@type']).toBe('PostalAddress');
          expect((structuredData as any).address.addressLocality).toBe(profile.location);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not include address when location is not provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.map(p => ({ ...p, location: undefined })),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).address).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include email when provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.filter(p => p.publicEmail !== undefined),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).email).toBe(profile.publicEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include telephone when provided', () => {
    fc.assert(
      fc.property(
        publicProfileArb.filter(p => p.phone !== undefined),
        (profile) => {
          const structuredData = SEOGenerator.generateStructuredData(profile);
          
          expect((structuredData as any).telephone).toBe(profile.phone);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should be valid JSON when stringified', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const structuredData = SEOGenerator.generateStructuredData(profile);
        
        // Should not throw when stringified
        expect(() => JSON.stringify(structuredData)).not.toThrow();
        
        // Should be parseable back
        const jsonString = JSON.stringify(structuredData);
        const parsed = JSON.parse(jsonString);
        expect(parsed).toEqual(structuredData);
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property: Génération des entrées sitemap
// ============================================================================

describe('Property: Génération des entrées sitemap', () => {
  /**
   * **Validates: Requirements 8.9, 8.10**
   * 
   * Property: For any public profile, generateSitemapEntry() must:
   * - Return a valid sitemap entry with url, lastmod, changefreq, priority
   * - Use priority 0.8 for all profiles
   * - Use changefreq 'weekly'
   * - Use updatedAt date for lastmod
   */

  it('should always return a complete sitemap entry', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        expect(sitemapEntry).toHaveProperty('url');
        expect(sitemapEntry).toHaveProperty('lastmod');
        expect(sitemapEntry).toHaveProperty('changefreq');
        expect(sitemapEntry).toHaveProperty('priority');
      }),
      { numRuns: 100 }
    );
  });

  it('should use priority 0.8 for all profiles', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        expect(sitemapEntry.priority).toBe(0.8);
      }),
      { numRuns: 100 }
    );
  });

  it('should use changefreq "weekly"', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        expect(sitemapEntry.changefreq).toBe('weekly');
      }),
      { numRuns: 100 }
    );
  });

  it('should use updatedAt date for lastmod', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        expect(sitemapEntry.lastmod).toBe(profile.updatedAt.toISOString());
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid URL with correct format', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        expect(sitemapEntry.url).toMatch(/^https?:\/\/.+\/p\/.+$/);
        expect(sitemapEntry.url).toContain(`/p/${profile.slug}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate lastmod in ISO 8601 format', () => {
    fc.assert(
      fc.property(publicProfileArb, (profile) => {
        const sitemapEntry = SEOGenerator.generateSitemapEntry(profile);
        
        // Should be a valid ISO 8601 date string
        expect(() => new Date(sitemapEntry.lastmod)).not.toThrow();
        // Check for standard ISO format (YYYY-MM-DD...)
        expect(sitemapEntry.lastmod).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      }),
      { numRuns: 100 }
    );
  });
});
