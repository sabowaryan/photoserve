/**
 * Property-based tests for SlugUtils
 * 
 * Tests universal properties that should hold for all inputs
 * Uses fast-check for property-based testing
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SlugUtils, RESERVED_SLUGS } from '../slug.utils';

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid slugs
 * Generates strings matching the pattern ^[a-z0-9-]{1,100}$ that are not reserved
 */
const validSlugArb = fc
  .stringMatching(/^[a-z0-9-]{1,100}$/)
  .filter((slug) => !RESERVED_SLUGS.includes(slug as any));

/**
 * Generator for invalid slugs
 * Generates strings that violate at least one validation rule
 */
const invalidSlugArb = fc.oneof(
  // Empty strings
  fc.constant(''),
  // Too long
  fc.string({ minLength: 101, maxLength: 150 }),
  // Contains uppercase
  fc.stringMatching(/[A-Z]/),
  // Contains invalid characters
  fc.stringMatching(/[^a-z0-9-]/),
  // Reserved slugs
  fc.constantFrom(...RESERVED_SLUGS)
);

/**
 * Generator for strings with uppercase letters
 */
const uppercaseStringArb = fc.string().filter((s) => s !== s.toLowerCase());

/**
 * Generator for strings with spaces
 */
const stringWithSpacesArb = fc.string().filter((s) => s.includes(' '));

// ============================================================================
// Property 4: Validation du format des slugs
// ============================================================================

describe('Property 4: Validation du format des slugs', () => {
  /**
   * **Validates: Requirements 1.4, 14.1, 14.5, 14.6**
   * 
   * Property: For any string, it is accepted as a valid slug if and only if:
   * - It matches the pattern ^[a-z0-9-]+$
   * - It has a length between 1 and 100 characters
   * - It is not in the list of reserved slugs
   */
  it('should accept all valid slugs', () => {
    fc.assert(
      fc.property(validSlugArb, (slug) => {
        const result = SlugUtils.isValid(slug);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject all invalid slugs', () => {
    fc.assert(
      fc.property(invalidSlugArb, (slug) => {
        const result = SlugUtils.isValid(slug);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject all reserved slugs', () => {
    fc.assert(
      fc.property(fc.constantFrom(...RESERVED_SLUGS), (slug) => {
        const result = SlugUtils.isValid(slug);
        expect(result).toBe(false);
      }),
      { numRuns: RESERVED_SLUGS.length }
    );
  });

  it('should reject slugs exceeding max length', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 101, maxLength: 200 }), (longString) => {
        // Even if we normalize it, if the original is too long, validation should fail
        const slug = longString.toLowerCase().replace(/[^a-z0-9-]/g, '');
        if (slug.length > 100) {
          const result = SlugUtils.isValid(slug);
          expect(result).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reject slugs with uppercase letters', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/[A-Z]/),
        (stringWithUppercase) => {
          const result = SlugUtils.isValid(stringWithUppercase);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject slugs with invalid characters', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.stringMatching(/[^a-z0-9-]/), // Contains at least one invalid char
          fc.string().filter((s) => /[^a-z0-9-]/.test(s))
        ),
        (stringWithInvalidChars) => {
          const result = SlugUtils.isValid(stringWithInvalidChars);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept slugs at exactly max length', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split('')), {
          minLength: 100,
          maxLength: 100,
        }).map((arr) => arr.join('')),
        (slug) => {
          // Filter out reserved slugs
          if (!RESERVED_SLUGS.includes(slug as any)) {
            const result = SlugUtils.isValid(slug);
            expect(result).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 5: Normalisation des slugs
// ============================================================================

describe('Property 5: Normalisation des slugs', () => {
  /**
   * **Validates: Requirements 14.7, 14.8**
   * 
   * Property: For any input string containing uppercase letters or spaces,
   * normalization must produce a slug in lowercase with spaces replaced by hyphens.
   */
  it('should convert all uppercase to lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // The normalized slug should be equal to its lowercase version
        expect(normalized).toBe(normalized.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it('should replace all spaces with hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // The normalized slug should not contain any spaces
        expect(normalized).not.toContain(' ');
      }),
      { numRuns: 100 }
    );
  });

  it('should produce idempotent results (normalizing twice gives same result)', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized1 = SlugUtils.normalize(input);
        const normalized2 = SlugUtils.normalize(normalized1);
        // Normalizing an already normalized slug should not change it
        expect(normalized1).toBe(normalized2);
      }),
      { numRuns: 100 }
    );
  });

  it('should remove all invalid characters', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // The normalized slug should only contain valid characters
        const validPattern = /^[a-z0-9-]*$/; // * instead of + to allow empty
        expect(validPattern.test(normalized)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should not exceed max length', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // The normalized slug should never exceed max length
        expect(normalized.length).toBeLessThanOrEqual(100);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle strings with only invalid characters', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('!', '@', '#', '$', '%', '^', '&', '*', '(', ')'))
          .map((arr) => arr.join('')),
        (invalidChars) => {
          const normalized = SlugUtils.normalize(invalidChars);
          // Should result in empty string or valid slug
          expect(normalized).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should remove consecutive hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // Should not contain consecutive hyphens
        expect(normalized).not.toMatch(/--+/);
      }),
      { numRuns: 100 }
    );
  });

  it('should trim hyphens from start and end', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // Should not start or end with hyphen (unless empty)
        if (normalized.length > 0) {
          expect(normalized[0]).not.toBe('-');
          expect(normalized[normalized.length - 1]).not.toBe('-');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should handle accented characters', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('é', 'è', 'ê', 'à', 'ù', 'ç', 'ô', 'î', 'ï', 'ü'))
          .map((arr) => arr.join('')),
        (accentedString) => {
          const normalized = SlugUtils.normalize(accentedString);
          // Should not contain accented characters
          expect(normalized).not.toMatch(/[éèêàùçôîïü]/);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Additional Properties
// ============================================================================

describe('Additional slug properties', () => {
  it('should generate exactly 4 unique suggestions', () => {
    fc.assert(
      fc.property(fc.string(), (baseSlug) => {
        const suggestions = SlugUtils.generateUnique(baseSlug);
        expect(suggestions).toHaveLength(4);
        // All suggestions should be unique
        const uniqueSuggestions = new Set(suggestions);
        expect(uniqueSuggestions.size).toBe(4);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid slugs from any input', () => {
    fc.assert(
      fc.property(fc.string(), (baseSlug) => {
        const suggestions = SlugUtils.generateUnique(baseSlug);
        // All suggestions should be valid slugs (or at least valid format)
        suggestions.forEach((suggestion) => {
          // Check format (may not be valid if it's a reserved slug, but format should be correct)
          expect(suggestion).toMatch(/^[a-z0-9-]*-[0-9]+$/);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should correctly identify reserved slugs', () => {
    fc.assert(
      fc.property(fc.constantFrom(...RESERVED_SLUGS), (reservedSlug) => {
        expect(SlugUtils.isReserved(reservedSlug)).toBe(true);
      }),
      { numRuns: RESERVED_SLUGS.length }
    );
  });

  it('should not identify non-reserved slugs as reserved', () => {
    fc.assert(
      fc.property(validSlugArb, (validSlug) => {
        expect(SlugUtils.isReserved(validSlug)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should return consistent max length', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        expect(SlugUtils.getMaxLength()).toBe(100);
      }),
      { numRuns: 10 }
    );
  });

  it('should return the complete list of reserved slugs', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const reserved = SlugUtils.getReservedSlugs();
        expect(reserved).toEqual(RESERVED_SLUGS);
        expect(reserved.length).toBeGreaterThan(0);
      }),
      { numRuns: 10 }
    );
  });
});

// ============================================================================
// Integration Properties
// ============================================================================

describe('Integration properties', () => {
  it('should normalize then validate correctly', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        // If normalized is not empty and not reserved, it should be valid
        if (normalized.length > 0 && !RESERVED_SLUGS.includes(normalized as any)) {
          expect(SlugUtils.isValid(normalized)).toBe(true);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should generate suggestions that are all valid or only invalid due to being reserved', () => {
    fc.assert(
      fc.property(fc.string(), (baseSlug) => {
        const suggestions = SlugUtils.generateUnique(baseSlug);
        suggestions.forEach((suggestion) => {
          const isValid = SlugUtils.isValid(suggestion);
          const isReserved = SlugUtils.isReserved(suggestion);
          // If not valid, it should be because it's reserved
          if (!isValid) {
            expect(isReserved).toBe(true);
          }
        });
      }),
      { numRuns: 100 }
    );
  });
});
