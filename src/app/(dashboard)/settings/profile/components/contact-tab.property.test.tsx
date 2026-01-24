/**
 * Property-Based Tests for URL Validation
 * 
 * Tests universal properties for URL validation in contact fields.
 * Uses fast-check for property-based testing with 100+ iterations.
 * 
 * **Validates: Requirements 4.3, validation générale**
 * 
 * Property 20: Validation des URLs
 * For all URL fields (avatarUrl, coverImageUrl, website, socialLinks), 
 * if a value is provided, it must be a valid URL starting with http:// or https://.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { PublicProfileSchema, SocialLinksSchema, CTAButtonSchema } from '@/types/public-profile';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid HTTP/HTTPS URLs
 */
const validUrlArb = fc.webUrl({ validSchemes: ['http', 'https'] });


/**
 * Generator for social media platform keys
 */
const socialPlatformArb = fc.constantFrom(
  'instagram',
  'facebook',
  'pinterest',
  'linkedin',
  'tiktok',
  'youtube',
  'other'
);

// ============================================================================
// Property 20: Validation des URLs
// ============================================================================

describe('Property 20: Validation des URLs', () => {
  /**
   * **Validates: Requirements 4.3, validation générale**
   * 
   * Property: For all URL fields, if a value is provided, it must be a valid URL
   * starting with http:// or https://.
   */

  describe('Website URL validation', () => {
    it('should accept all valid HTTP/HTTPS URLs', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const result = PublicProfileSchema.shape.website.safeParse(url);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(url);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject URLs without protocol', () => {
      fc.assert(
        fc.property(fc.domain(), (domain) => {
          const result = PublicProfileSchema.shape.website.safeParse(domain);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'just text',
      ];
      
      malformedUrls.forEach(url => {
        const result = PublicProfileSchema.shape.website.safeParse(url);
        expect(result.success).toBe(false);
      });
    });

    it('should accept undefined for optional website field', () => {
      const result = PublicProfileSchema.shape.website.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should preserve URL exactly as provided when valid', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const result = PublicProfileSchema.shape.website.safeParse(url);
          
          expect(result.success).toBe(true);
          if (result.success) {
            // URL should not be modified
            expect(result.data).toBe(url);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Avatar URL validation', () => {
    it('should accept all valid HTTP/HTTPS URLs for avatar', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const result = PublicProfileSchema.shape.avatarUrl.safeParse(url);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(url);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject URLs without protocol for avatar', () => {
      fc.assert(
        fc.property(fc.domain(), (domain) => {
          const result = PublicProfileSchema.shape.avatarUrl.safeParse(domain);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Cover Image URL validation', () => {
    it('should accept all valid HTTP/HTTPS URLs for cover image', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const result = PublicProfileSchema.shape.coverImageUrl.safeParse(url);
          
          expect(result.success).toBe(true);
          if (result.success) {
            expect(result.data).toBe(url);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should reject URLs without protocol for cover image', () => {
      fc.assert(
        fc.property(fc.domain(), (domain) => {
          const result = PublicProfileSchema.shape.coverImageUrl.safeParse(domain);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Social Links URL validation', () => {
    it('should accept valid URLs for all social platforms', () => {
      fc.assert(
        fc.property(
          socialPlatformArb,
          validUrlArb,
          (platform, url) => {
            const socialLinks = { [platform]: url };
            const result = SocialLinksSchema.safeParse(socialLinks);
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data![platform as keyof typeof result.data]).toBe(url);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject URLs without protocol for social platforms', () => {
      fc.assert(
        fc.property(
          socialPlatformArb,
          fc.domain(),
          (platform, domain) => {
            const socialLinks = { [platform]: domain };
            const result = SocialLinksSchema.safeParse(socialLinks);
            
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept empty object for social links', () => {
      const result = SocialLinksSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it('should accept undefined for social links', () => {
      const result = SocialLinksSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it('should accept partial social links with valid URLs', () => {
      fc.assert(
        fc.property(
          fc.array(socialPlatformArb, { minLength: 1, maxLength: 3 }),
          fc.array(validUrlArb, { minLength: 1, maxLength: 3 }),
          (platforms, urls) => {
            // Create partial social links object
            const socialLinks: Record<string, string> = {};
            platforms.forEach((platform, index) => {
              if (urls[index]) {
                socialLinks[platform] = urls[index];
              }
            });
            
            const result = SocialLinksSchema.safeParse(socialLinks);
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject if any social link has URL without protocol', () => {
      fc.assert(
        fc.property(
          socialPlatformArb,
          validUrlArb,
          fc.domain(),
          (platform1, validUrl, invalidDomain) => {
            // Create social links with one valid and one invalid URL
            const socialLinks = {
              [platform1]: validUrl,
              other: invalidDomain, // No protocol
            };
            
            const result = SocialLinksSchema.safeParse(socialLinks);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CTA Button URL validation', () => {
    it('should accept valid URLs for CTA button', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          validUrlArb,
          fc.constantFrom('primary', 'secondary'),
          (text, url, style) => {
            const ctaButton = { text, url, style };
            const result = CTAButtonSchema.safeParse(ctaButton);
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data!.url).toBe(url);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject URLs without protocol for CTA button', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.domain(),
          fc.constantFrom('primary', 'secondary'),
          (text, domain, style) => {
            const ctaButton = { text, url: domain, style };
            const result = CTAButtonSchema.safeParse(ctaButton);
            
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept undefined for optional CTA button', () => {
      const result = CTAButtonSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  describe('Full profile with multiple URL fields', () => {
    it('should validate all URL fields consistently', () => {
      fc.assert(
        fc.property(
          validUrlArb, // website
          validUrlArb, // avatarUrl
          validUrlArb, // coverImageUrl
          validUrlArb, // instagram
          validUrlArb, // facebook
          validUrlArb, // ctaUrl
          (website, avatarUrl, coverImageUrl, instagram, facebook, ctaUrl) => {
            const profile = {
              isEnabled: true,
              slug: 'test-photographer',
              displayName: 'Test Photographer',
              website,
              avatarUrl,
              coverImageUrl,
              socialLinks: {
                instagram,
                facebook,
              },
              ctaButton: {
                text: 'Contact me',
                url: ctaUrl,
                style: 'primary' as const,
              },
            };
            
            const result = PublicProfileSchema.safeParse(profile);
            
            expect(result.success).toBe(true);
            if (result.success) {
              expect(result.data.website).toBe(website);
              expect(result.data.avatarUrl).toBe(avatarUrl);
              expect(result.data.coverImageUrl).toBe(coverImageUrl);
              expect(result.data.socialLinks?.instagram).toBe(instagram);
              expect(result.data.socialLinks?.facebook).toBe(facebook);
              expect(result.data.ctaButton?.url).toBe(ctaUrl);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject profile if website URL has no protocol', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          (domain) => {
            const profile = {
              isEnabled: true,
              slug: 'test-photographer',
              displayName: 'Test Photographer',
              website: domain, // No protocol
            };
            
            const result = PublicProfileSchema.safeParse(profile);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL format edge cases', () => {
    it('should accept URLs with query parameters', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9_]+$/i.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9_]+$/i.test(s)),
          (baseUrl, key, value) => {
            const urlWithParams = `${baseUrl}?${key}=${value}`;
            const result = PublicProfileSchema.shape.website.safeParse(urlWithParams);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept URLs with fragments/anchors', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-z0-9_-]+$/i.test(s)),
          (baseUrl, fragment) => {
            const urlWithFragment = `${baseUrl}#${fragment}`;
            const result = PublicProfileSchema.shape.website.safeParse(urlWithFragment);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept URLs with paths', () => {
      fc.assert(
        fc.property(
          fc.webUrl(),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9_-]+$/i.test(s)), { minLength: 1, maxLength: 3 }),
          (baseUrl, pathSegments) => {
            const urlWithPath = `${baseUrl}/${pathSegments.join('/')}`;
            const result = PublicProfileSchema.shape.website.safeParse(urlWithPath);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept URLs with ports', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          fc.integer({ min: 1, max: 65535 }),
          (domain, port) => {
            const urlWithPort = `https://${domain}:${port}`;
            const result = PublicProfileSchema.shape.website.safeParse(urlWithPort);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept URLs with subdomains', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z0-9-]+$/i.test(s)),
          (domain, subdomain) => {
            const urlWithSubdomain = `https://${subdomain}.${domain}`;
            const result = PublicProfileSchema.shape.website.safeParse(urlWithSubdomain);
            
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('URL validation consistency', () => {
    it('should validate the same URL consistently across multiple calls', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const result1 = PublicProfileSchema.shape.website.safeParse(url);
          const result2 = PublicProfileSchema.shape.website.safeParse(url);
          
          expect(result1.success).toBe(result2.success);
          if (result1.success && result2.success) {
            expect(result1.data).toBe(result2.data);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should apply same validation rules to all URL fields', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const websiteResult = PublicProfileSchema.shape.website.safeParse(url);
          const avatarResult = PublicProfileSchema.shape.avatarUrl.safeParse(url);
          const coverResult = PublicProfileSchema.shape.coverImageUrl.safeParse(url);
          
          // All should succeed for valid URLs
          expect(websiteResult.success).toBe(true);
          expect(avatarResult.success).toBe(true);
          expect(coverResult.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should apply same validation rules to all social link fields', () => {
      fc.assert(
        fc.property(validUrlArb, (url) => {
          const platforms = ['instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'other'];
          
          platforms.forEach(platform => {
            const socialLinks = { [platform]: url };
            const result = SocialLinksSchema.safeParse(socialLinks);
            
            expect(result.success).toBe(true);
          });
        }),
        { numRuns: 100 }
      );
    });
  });
});

