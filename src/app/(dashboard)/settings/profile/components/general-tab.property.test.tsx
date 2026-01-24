/**
 * Property-Based Tests for Slug Verification
 * 
 * Tests universal properties for slug availability checking and suggestions.
 * Uses fast-check for property-based testing with 100+ iterations.
 * 
 * **Validates: Requirements 1.5, 14.1, 14.2, 14.3, 14.4**
 * 
 * Note: These tests focus on the service layer logic rather than UI interactions
 * to ensure reliable property-based testing.
 */

import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import { PublicProfileService } from '@/lib/services/public-profile.service';
import { SlugUtils, RESERVED_SLUGS } from '@/lib/utils/slug.utils';

// ============================================================================
// Test Setup and Mocks
// ============================================================================

/**
 * Create a mock Supabase client for testing
 */
function createMockSupabase() {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
  
  return {
    from: vi.fn(() => ({
      select: mockSelect,
    })),
    _mockSingle: mockSingle,
  } as any;
}

// ============================================================================
// Arbitraries (Generators)
// ============================================================================

/**
 * Generator for valid slugs (not reserved)
 */
const validSlugArb = fc
  .stringMatching(/^[a-z0-9-]{1,100}$/)
  .filter((slug) => !RESERVED_SLUGS.includes(slug as any))
  .filter((slug) => !slug.startsWith('-') && !slug.endsWith('-')); // Exclude edge cases

/**
 * Generator for reserved slugs
 */
const reservedSlugArb = fc.constantFrom(...RESERVED_SLUGS);

/**
 * Generator for any slug format (for suggestion testing)
 */
const anySlugArb = fc.oneof(
  validSlugArb,
  fc.stringMatching(/^[a-z0-9-]{1,50}$/).filter(s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-'))
);

// ============================================================================
// Property 22: Vérification en temps réel de la disponibilité des slugs
// ============================================================================

describe('Property 22: Vérification en temps réel de la disponibilité des slugs', () => {
  /**
   * **Validates: Requirements 14.1, 14.2, 14.3**
   * 
   * Property: For any slug entered, the availability check must return:
   * - true if the slug doesn't exist or belongs to the current user
   * - false with suggestions if the slug is taken or reserved
   * 
   * This ensures real-time feedback on slug availability.
   */
  
  it('should return available=true for any non-existent, non-reserved slug', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, async (slug) => {
        const supabase = createMockSupabase();
        
        // Mock: slug doesn't exist in database (PGRST116 error code for not found)
        supabase._mockSingle.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        });

        const service = new PublicProfileService(supabase);
        const result = await service.checkSlugAvailability(slug);

        // Should be available
        expect(result.available).toBe(true);
        expect(result.suggestions).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should return available=false with suggestions for any reserved slug', async () => {
    await fc.assert(
      fc.asyncProperty(reservedSlugArb, async (slug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const result = await service.checkSlugAvailability(slug);

        // Should not be available
        expect(result.available).toBe(false);
        
        // Should provide suggestions
        expect(result.suggestions).toBeDefined();
        expect(Array.isArray(result.suggestions)).toBe(true);
        expect(result.suggestions!.length).toBeGreaterThanOrEqual(3);
      }),
      { numRuns: RESERVED_SLUGS.length }
    );
  });

  it('should return available=false with suggestions for any taken slug', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, fc.uuid(), async (slug, userId) => {
        const supabase = createMockSupabase();
        
        // Mock: slug exists and belongs to different user
        supabase._mockSingle.mockResolvedValueOnce({
          data: {
            id: 'profile-id',
            user_id: 'different-user-id',
            slug,
          },
          error: null,
        });

        const service = new PublicProfileService(supabase);
        const result = await service.checkSlugAvailability(slug, userId);

        // Should not be available
        expect(result.available).toBe(false);
        
        // Should provide suggestions
        expect(result.suggestions).toBeDefined();
        expect(Array.isArray(result.suggestions)).toBe(true);
        expect(result.suggestions!.length).toBeGreaterThanOrEqual(3);
      }),
      { numRuns: 100 }
    );
  });

  it('should return available=true when slug belongs to current user', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, fc.uuid(), async (slug, userId) => {
        const supabase = createMockSupabase();
        
        // Mock: slug exists and belongs to current user
        supabase._mockSingle.mockResolvedValueOnce({
          data: {
            id: 'profile-id',
            user_id: userId,
            slug,
          },
          error: null,
        });

        const service = new PublicProfileService(supabase);
        const result = await service.checkSlugAvailability(slug, userId);

        // Should be available (user's own slug)
        expect(result.available).toBe(true);
        expect(result.suggestions).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });

  it('should handle database errors gracefully', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, async (slug) => {
        const supabase = createMockSupabase();
        
        // Mock: database error (not PGRST116)
        supabase._mockSingle.mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error', code: 'DB_ERROR' },
        });

        const service = new PublicProfileService(supabase);
        
        // Should throw or handle error appropriately
        await expect(service.checkSlugAvailability(slug)).rejects.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 21: Suggestions de slugs alternatifs
// ============================================================================

describe('Property 21: Suggestions de slugs alternatifs', () => {
  /**
   * **Validates: Requirements 1.5, 14.4**
   * 
   * Property: For any taken slug, the system must generate at least 3 alternative
   * suggestions by adding numeric suffixes or the current year.
   * 
   * This ensures users always have alternatives when their desired slug is taken.
   */
  
  it('should generate exactly 4 suggestions for any base slug', () => {
    fc.assert(
      fc.property(anySlugArb, (baseSlug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const suggestions = service.generateSlugSuggestions(baseSlug);

        // Should generate exactly 4 suggestions
        expect(suggestions).toHaveLength(4);
        
        // All suggestions should be unique
        const uniqueSuggestions = new Set(suggestions);
        expect(uniqueSuggestions.size).toBe(4);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate suggestions with numeric suffixes (1, 2, 3)', () => {
    fc.assert(
      fc.property(anySlugArb, (baseSlug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const suggestions = service.generateSlugSuggestions(baseSlug);
        
        // Normalize the base slug to match what the service does
        const normalizedBase = SlugUtils.normalize(baseSlug);

        // First 3 suggestions should have numeric suffixes
        expect(suggestions[0]).toBe(`${normalizedBase}-1`);
        expect(suggestions[1]).toBe(`${normalizedBase}-2`);
        expect(suggestions[2]).toBe(`${normalizedBase}-3`);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate suggestion with current year as 4th option', () => {
    fc.assert(
      fc.property(anySlugArb, (baseSlug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const suggestions = service.generateSlugSuggestions(baseSlug);
        const currentYear = new Date().getFullYear();
        
        // Normalize the base slug to match what the service does
        const normalizedBase = SlugUtils.normalize(baseSlug);

        // 4th suggestion should have current year
        expect(suggestions[3]).toBe(`${normalizedBase}-${currentYear}`);
      }),
      { numRuns: 100 }
    );
  });

  it('should generate valid slug format for all suggestions', () => {
    fc.assert(
      fc.property(anySlugArb, (baseSlug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const suggestions = service.generateSlugSuggestions(baseSlug);

        // All suggestions should match slug format pattern
        const slugPattern = /^[a-z0-9-]+-[0-9]+$/;
        suggestions.forEach((suggestion) => {
          expect(suggestion).toMatch(slugPattern);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should generate different suggestions for different base slugs', () => {
    fc.assert(
      fc.property(
        anySlugArb,
        anySlugArb,
        (slug1, slug2) => {
          // Skip if slugs normalize to the same value
          const norm1 = SlugUtils.normalize(slug1);
          const norm2 = SlugUtils.normalize(slug2);
          fc.pre(norm1 !== norm2);

          const supabase = createMockSupabase();
          const service = new PublicProfileService(supabase);
          
          const suggestions1 = service.generateSlugSuggestions(slug1);
          const suggestions2 = service.generateSlugSuggestions(slug2);

          // Suggestions should be different
          expect(suggestions1).not.toEqual(suggestions2);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should generate consistent suggestions for the same base slug', () => {
    fc.assert(
      fc.property(anySlugArb, (baseSlug) => {
        const supabase = createMockSupabase();
        const service = new PublicProfileService(supabase);
        
        const suggestions1 = service.generateSlugSuggestions(baseSlug);
        const suggestions2 = service.generateSlugSuggestions(baseSlug);

        // Should generate same suggestions for same input
        expect(suggestions1).toEqual(suggestions2);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle empty string gracefully', () => {
    const supabase = createMockSupabase();
    const service = new PublicProfileService(supabase);
    
    const suggestions = service.generateSlugSuggestions('');

    // Should still generate 4 suggestions (empty string normalizes to empty)
    expect(suggestions).toHaveLength(4);
    // After normalization, empty string stays empty, so suggestions are just suffixes
    expect(suggestions[0]).toBe('-1');
    expect(suggestions[1]).toBe('-2');
    expect(suggestions[2]).toBe('-3');
    expect(suggestions[3]).toBe(`-${new Date().getFullYear()}`);
  });

  it('should handle very long base slugs', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 90, maxLength: 100 }).map(s => 
          s.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 100)
        ).filter(s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-')),
        (longSlug) => {
          const supabase = createMockSupabase();
          const service = new PublicProfileService(supabase);
          
          const suggestions = service.generateSlugSuggestions(longSlug);
          
          // Normalize to see what the service will use
          const normalizedBase = SlugUtils.normalize(longSlug);

          // Should generate 4 suggestions
          expect(suggestions).toHaveLength(4);
          
          // Suggestions should be based on normalized slug
          suggestions.forEach((suggestion) => {
            expect(suggestion).toContain(normalizedBase);
            expect(suggestion).toMatch(/-[0-9]+$/);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Integration Properties
// ============================================================================

describe('Integration: Slug availability and suggestions', () => {
  it('should provide suggestions when slug is unavailable', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, async (slug) => {
        const supabase = createMockSupabase();
        
        // Mock: slug is taken
        supabase._mockSingle.mockResolvedValueOnce({
          data: {
            id: 'profile-id',
            user_id: 'other-user-id',
            slug,
          },
          error: null,
        });

        const service = new PublicProfileService(supabase);
        const result = await service.checkSlugAvailability(slug, 'current-user-id');

        // Should not be available
        expect(result.available).toBe(false);
        
        // Should have suggestions
        expect(result.suggestions).toBeDefined();
        expect(result.suggestions!.length).toBe(4);
        
        // Suggestions should be based on the slug (may be normalized)
        // Just verify they all end with numeric suffixes
        result.suggestions!.forEach((suggestion) => {
          expect(suggestion).toMatch(/-[0-9]+$/);
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should not provide suggestions when slug is available', async () => {
    await fc.assert(
      fc.asyncProperty(validSlugArb, async (slug) => {
        const supabase = createMockSupabase();
        
        // Mock: slug doesn't exist (PGRST116 error)
        supabase._mockSingle.mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        });

        const service = new PublicProfileService(supabase);
        const result = await service.checkSlugAvailability(slug);

        // Should be available
        expect(result.available).toBe(true);
        
        // Should not have suggestions
        expect(result.suggestions).toBeUndefined();
      }),
      { numRuns: 100 }
    );
  });
});
