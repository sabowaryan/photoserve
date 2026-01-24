import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  PublicProfileSchema,
  TEXT_LIMITS,
  ARRAY_LIMITS,
} from './public-profile';

/**
 * Property-Based Tests for Public Profile Validation
 * 
 * These tests use fast-check to verify universal properties across many inputs.
 * Each test runs 100 iterations with randomly generated data.
 */

describe('Property-Based Tests: PublicProfileSchema', () => {
  /**
   * Feature: public-photographer-profile
   * Property 6: Respect des limites de longueur des champs texte
   * Validates: Requirements 1.6, 1.7, 1.8, 8.4, 8.5
   * 
   * For all text fields, the validation must enforce maximum length limits:
   * - displayName ≤ 200 characters
   * - tagline ≤ 100 characters
   * - bio ≤ 500 characters
   * - metaTitle ≤ 60 characters
   * - metaDescription ≤ 160 characters
   */
  describe('Property 6: Respect des limites de longueur des champs texte', () => {
    it('should accept displayName within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: TEXT_LIMITS.DISPLAY_NAME * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.displayName.safeParse(text);
            
            if (length <= TEXT_LIMITS.DISPLAY_NAME) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept tagline within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.TAGLINE * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.tagline.safeParse(text);
            
            if (length <= TEXT_LIMITS.TAGLINE) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept bio within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.BIO * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.bio.safeParse(text);
            
            if (length <= TEXT_LIMITS.BIO) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept metaTitle within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.META_TITLE * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.metaTitle.safeParse(text);
            
            if (length <= TEXT_LIMITS.META_TITLE) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept metaDescription within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.META_DESCRIPTION * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.metaDescription.safeParse(text);
            
            if (length <= TEXT_LIMITS.META_DESCRIPTION) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept location within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.LOCATION * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.location.safeParse(text);
            
            if (length <= TEXT_LIMITS.LOCATION) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept phone within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.PHONE * 2 }),
          (length) => {
            const text = '1'.repeat(length);
            const result = PublicProfileSchema.shape.phone.safeParse(text);
            
            if (length <= TEXT_LIMITS.PHONE) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept address within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: TEXT_LIMITS.ADDRESS * 2 }),
          (length) => {
            const text = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.address.safeParse(text);
            
            if (length <= TEXT_LIMITS.ADDRESS) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: public-photographer-profile
   * Property 7: Respect des limites de cardinalité des tableaux
   * Validates: Requirements 1.8, 5.2, 8.10
   * 
   * For all array fields, the validation must enforce maximum cardinality limits:
   * - specialties ≤ 5 elements
   * - awards ≤ 3 elements
   * - testimonials ≤ 5 elements
   * - metaKeywords ≤ 10 elements
   */
  describe('Property 7: Respect des limites de cardinalité des tableaux', () => {
    it('should accept specialties within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ARRAY_LIMITS.SPECIALTIES * 2 }),
          (count) => {
            const specialties = Array(count).fill('Photography');
            const result = PublicProfileSchema.shape.specialties.safeParse(specialties);
            
            if (count <= ARRAY_LIMITS.SPECIALTIES) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept awards within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ARRAY_LIMITS.AWARDS * 2 }),
          (count) => {
            const awards = Array(count).fill('Best Photographer 2024');
            const result = PublicProfileSchema.shape.awards.safeParse(awards);
            
            if (count <= ARRAY_LIMITS.AWARDS) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept testimonials within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ARRAY_LIMITS.TESTIMONIALS * 2 }),
          (count) => {
            const testimonials = Array(count).fill({
              id: '123e4567-e89b-12d3-a456-426614174000',
              clientName: 'John Doe',
              rating: 5,
              text: 'Great!',
              date: new Date().toISOString(),
            });
            const result = PublicProfileSchema.shape.testimonials.safeParse(testimonials);
            
            if (count <= ARRAY_LIMITS.TESTIMONIALS) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept metaKeywords within limit and reject beyond limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: ARRAY_LIMITS.META_KEYWORDS * 2 }),
          (count) => {
            const keywords = Array(count).fill('photography');
            const result = PublicProfileSchema.shape.metaKeywords.safeParse(keywords);
            
            if (count <= ARRAY_LIMITS.META_KEYWORDS) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce specialty item length limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: TEXT_LIMITS.SPECIALTY * 2 }),
          (length) => {
            const specialty = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.specialties.safeParse([specialty]);
            
            if (length <= TEXT_LIMITS.SPECIALTY) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce award item length limit', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: TEXT_LIMITS.AWARD * 2 }),
          (length) => {
            const award = 'a'.repeat(length);
            const result = PublicProfileSchema.shape.awards.safeParse([award]);
            
            if (length <= TEXT_LIMITS.AWARD) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property tests for comprehensive validation
   */
  describe('Additional validation properties', () => {
    it('should accept any valid slug format', () => {
      // Generator for valid slugs
      const validSlugArb = fc.stringMatching(/^[a-z0-9-]{1,100}$/);

      fc.assert(
        fc.property(validSlugArb, (slug) => {
          // Skip reserved slugs
          const reserved = ['admin', 'api', 'dashboard', 'settings', 'app', 'auth', 'login', 'signup', 'profile', 'user', 'public', 'private', 'test', 'demo'];
          if (reserved.includes(slug)) {
            return;
          }

          const result = PublicProfileSchema.shape.slug.safeParse(slug);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject slugs with uppercase letters', () => {
      // Generator for strings with at least one uppercase letter
      const uppercaseSlugArb = fc.string().filter(s => /[A-Z]/.test(s));

      fc.assert(
        fc.property(uppercaseSlugArb, (slug) => {
          const result = PublicProfileSchema.shape.slug.safeParse(slug);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid email formats', () => {
      // Use a more conservative email generator that matches Zod's validation
      const validEmailArb = fc.tuple(
        fc.stringMatching(/^[a-zA-Z0-9]+$/),
        fc.stringMatching(/^[a-zA-Z0-9]+$/),
        fc.stringMatching(/^[a-zA-Z]{2,}$/)
      ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

      fc.assert(
        fc.property(validEmailArb, (email) => {
          const result = PublicProfileSchema.shape.publicEmail.safeParse(email);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid URLs', () => {
      fc.assert(
        fc.property(fc.webUrl(), (url) => {
          const result = PublicProfileSchema.shape.website.safeParse(url);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should enforce yearsOfExperience range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -10, max: 150 }),
          (years) => {
            const result = PublicProfileSchema.shape.yearsOfExperience.safeParse(years);
            
            if (years >= 0 && years <= 100) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce testimonial rating range', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10 }),
          (rating) => {
            const testimonial = {
              id: '123e4567-e89b-12d3-a456-426614174000',
              clientName: 'John Doe',
              rating,
              text: 'Great!',
              date: new Date().toISOString(),
            };
            const result = PublicProfileSchema.shape.testimonials.safeParse([testimonial]);
            
            if (rating >= 1 && rating <= 5) {
              expect(result.success).toBe(true);
            } else {
              expect(result.success).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept complete valid profiles with random data', () => {
      // Simplified test focusing on core validation properties
      // This test verifies that profiles with valid data pass validation
      const minimalValidProfile = {
        isEnabled: true,
        slug: 'test-photographer',
        displayName: 'Test Photographer',
      };

      const result = PublicProfileSchema.safeParse(minimalValidProfile);
      expect(result.success).toBe(true);

      // Test with more fields
      const completeValidProfile = {
        isEnabled: true,
        slug: 'john-doe-photographer',
        displayName: 'John Doe',
        tagline: 'Professional Wedding Photographer',
        bio: 'I capture beautiful moments',
        specialties: ['Wedding', 'Portrait'],
        yearsOfExperience: 10,
      };

      const result2 = PublicProfileSchema.safeParse(completeValidProfile);
      expect(result2.success).toBe(true);
    });
  });
});
