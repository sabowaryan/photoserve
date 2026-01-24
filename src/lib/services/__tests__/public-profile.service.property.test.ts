/**
 * Property-Based Tests for PublicProfileService
 * 
 * Tests universal properties that must hold for all valid inputs.
 * Uses fast-check for property-based testing with 100+ iterations.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { PublicGallery } from '@/types/public-profile';
import { PublicProfileService } from '../public-profile.service';

/**
 * Helper to create a mock PublicGallery
 */
function createMockGallery(
  id: string,
  createdAt: Date,
  _isFeatured: boolean = false
): PublicGallery {
  return {
    id,
    slug: `gallery-${id}`,
    title: `Gallery ${id}`,
    coverImageUrl: 'https://example.com/cover.jpg',
    imageCount: 10,
    createdAt,
    isNew: false,
    isPasswordProtected: false,
  };
}

describe('PublicProfileService - Property Tests', () => {
  describe('Propriété 10: Filtrage des galeries publiques', () => {
    /**
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
     * 
     * For any set of galleries, the filtered public galleries must satisfy ALL of:
     * 1. is_active = true
     * 2. expires_at > NOW() or expires_at is null
     * 3. Not in hiddenGalleries array
     * 
     * This property ensures that only appropriate galleries are shown publicly.
     */
    it('should only include active, non-expired, non-hidden galleries', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of galleries with random properties
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('user-123'),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              unique_slug: fc.string({ minLength: 1, maxLength: 50 }),
              is_active: fc.boolean(),
              expires_at: fc.option(
                fc.oneof(
                  // Past date (expired)
                  fc.date({ min: new Date('2020-01-01'), max: new Date(Date.now() - 24 * 60 * 60 * 1000) }),
                  // Future date (not expired)
                  fc.date({ min: new Date(Date.now() + 24 * 60 * 60 * 1000), max: new Date('2030-12-31') })
                )
              ),
              created_at: fc.date({
                min: new Date('2020-01-01'),
                max: new Date(),
              }),
              password_hash: fc.option(fc.string()),
              images: fc.array(
                fc.record({
                  id: fc.uuid(),
                  cloudinary_url: fc.webUrl(),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 5, maxLength: 20 }
          ),
          // Generate array of hidden gallery IDs (subset of gallery IDs)
          fc.integer({ min: 0, max: 3 }),
          async (galleries, hiddenCount) => {
            // Skip if there are duplicate IDs (can happen during shrinking)
            const uniqueIds = new Set(galleries.map(g => g.id));
            fc.pre(uniqueIds.size === galleries.length);

            // Select some gallery IDs to be hidden
            const hiddenIds = galleries
              .slice(0, Math.min(hiddenCount, galleries.length))
              .map(g => g.id);

            // Mock gallery repository
            const mockGalleryRepo = {
              findByUserId: async () => galleries,
            };

            const service = new PublicProfileService(null as any);
            (service as any).galleryRepo = mockGalleryRepo;

            const result = await service.filterPublicGalleries('user-123', hiddenIds);

            const now = new Date();

            // Count how many galleries SHOULD be included
            const shouldBeIncluded = galleries.filter(g => 
              g.is_active &&
              (!g.expires_at || new Date(g.expires_at) > now) &&
              !hiddenIds.includes(g.id)
            );

            // The result length should match the number of galleries that should be included
            expect(result.length).toBe(shouldBeIncluded.length);

            // Verify: All returned galleries meet ALL criteria
            for (const gallery of result) {
              // Find the original gallery
              const original = galleries.find((g) => g.id === gallery.id);
              expect(original).toBeDefined();

              if (original) {
                // Must be active
                expect(original.is_active).toBe(true);

                // Must not be expired
                if (original.expires_at) {
                  const expiresAt = new Date(original.expires_at);
                  expect(expiresAt.getTime()).toBeGreaterThan(now.getTime());
                }

                // Must not be hidden
                expect(hiddenIds).not.toContain(gallery.id);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include galleries with null expires_at', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('user-123'),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              unique_slug: fc.string({ minLength: 1, maxLength: 50 }),
              is_active: fc.constant(true),
              expires_at: fc.constant(null),
              created_at: fc.date({
                min: new Date('2020-01-01'),
                max: new Date(),
              }),
              password_hash: fc.option(fc.string()),
              images: fc.array(
                fc.record({
                  id: fc.uuid(),
                  cloudinary_url: fc.webUrl(),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (galleries) => {
            // Skip if there are duplicate IDs (can happen during shrinking)
            const uniqueIds = new Set(galleries.map(g => g.id));
            fc.pre(uniqueIds.size === galleries.length);

            const mockGalleryRepo = {
              findByUserId: async () => galleries,
            };

            const service = new PublicProfileService(null as any);
            (service as any).galleryRepo = mockGalleryRepo;

            const result = await service.filterPublicGalleries('user-123', []);

            // All galleries should be included (all active, none expired, none hidden)
            // Since all galleries are active, not expired (null), and not hidden
            expect(result.length).toBe(galleries.length);
            
            // Verify all original galleries are in the result
            for (const original of galleries) {
              const found = result.find((g) => g.id === original.id);
              expect(found).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Propriété 11: Badge "Nouveau" basé sur la date', () => {
    /**
     * **Validates: Requirements 3.5**
     * 
     * For any gallery, the isNew property must be true if and only if
     * the gallery was created less than 7 days ago.
     * 
     * This property ensures consistent "New" badge display.
     */
    it('should set isNew to true for galleries created less than 7 days ago', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate galleries with creation dates in the last 6 days
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('user-123'),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              unique_slug: fc.string({ minLength: 1, maxLength: 50 }),
              is_active: fc.constant(true),
              expires_at: fc.constant(null),
              // Generate a number of days ago (0-6 days)
              daysAgo: fc.integer({ min: 0, max: 6 }),
              password_hash: fc.option(fc.string()),
              images: fc.array(
                fc.record({
                  id: fc.uuid(),
                  cloudinary_url: fc.webUrl(),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (galleriesData) => {
            // Skip if there are duplicate IDs (can happen during shrinking)
            const uniqueIds = new Set(galleriesData.map(g => g.id));
            fc.pre(uniqueIds.size === galleriesData.length);

            // Convert to galleries with actual dates calculated at execution time
            const now = Date.now();
            const galleries = galleriesData.map(g => ({
              ...g,
              created_at: new Date(now - g.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            }));

            const mockGalleryRepo = {
              findByUserId: async () => galleries,
            };

            const service = new PublicProfileService(null as any);
            (service as any).galleryRepo = mockGalleryRepo;

            const result = await service.filterPublicGalleries('user-123', []);

            // All galleries should have isNew = true (created within last 7 days)
            for (const gallery of result) {
              expect(gallery.isNew).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should set isNew to false for galleries created more than 7 days ago', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate galleries with creation dates more than 7 days ago
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('user-123'),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              unique_slug: fc.string({ minLength: 1, maxLength: 50 }),
              is_active: fc.constant(true),
              expires_at: fc.constant(null),
              // Generate a number of days ago (8-365 days)
              daysAgo: fc.integer({ min: 8, max: 365 }),
              password_hash: fc.option(fc.string()),
              images: fc.array(
                fc.record({
                  id: fc.uuid(),
                  cloudinary_url: fc.webUrl(),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (galleriesData) => {
            // Skip if there are duplicate IDs (can happen during shrinking)
            const uniqueIds = new Set(galleriesData.map(g => g.id));
            fc.pre(uniqueIds.size === galleriesData.length);

            // Convert to galleries with actual dates calculated at execution time
            const now = Date.now();
            const galleries = galleriesData.map(g => ({
              ...g,
              created_at: new Date(now - g.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            }));

            const mockGalleryRepo = {
              findByUserId: async () => galleries,
            };

            const service = new PublicProfileService(null as any);
            (service as any).galleryRepo = mockGalleryRepo;

            const result = await service.filterPublicGalleries('user-123', []);

            // All galleries should have isNew = false (created more than 7 days ago)
            for (const gallery of result) {
              expect(gallery.isNew).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly determine isNew for mixed age galleries', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate galleries with various creation dates
          fc.array(
            fc.record({
              id: fc.uuid(),
              user_id: fc.constant('user-123'),
              title: fc.string({ minLength: 1, maxLength: 50 }),
              unique_slug: fc.string({ minLength: 1, maxLength: 50 }),
              is_active: fc.constant(true),
              expires_at: fc.constant(null),
              // Generate a number of days ago (0-365 days)
              daysAgo: fc.integer({ min: 0, max: 365 }),
              password_hash: fc.option(fc.string()),
              images: fc.array(
                fc.record({
                  id: fc.uuid(),
                  cloudinary_url: fc.webUrl(),
                  order_index: fc.integer({ min: 0, max: 100 }),
                }),
                { maxLength: 5 }
              ),
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (galleriesData) => {
            // Skip if there are duplicate IDs (can happen during shrinking)
            const uniqueIds = new Set(galleriesData.map(g => g.id));
            fc.pre(uniqueIds.size === galleriesData.length);

            // Convert to galleries with actual dates calculated at execution time
            const now = Date.now();
            const galleries = galleriesData.map(g => ({
              ...g,
              created_at: new Date(now - g.daysAgo * 24 * 60 * 60 * 1000).toISOString(),
            }));

            const mockGalleryRepo = {
              findByUserId: async () => galleries,
            };

            const service = new PublicProfileService(null as any);
            (service as any).galleryRepo = mockGalleryRepo;

            const result = await service.filterPublicGalleries('user-123', []);


            // Verify each gallery's isNew property
            for (const gallery of result) {
              const original = galleriesData.find((g) => g.id === gallery.id);
              expect(original).toBeDefined();

              if (original) {
                // Expected isNew based on daysAgo
                const expectedIsNew = original.daysAgo < 7;
                expect(gallery.isNew).toBe(expectedIsNew);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Propriété 12: Ordre de tri des galeries', () => {
    /**
     * **Validates: Requirements 3.8, 3.9**
     * 
     * For any set of galleries with featured IDs, the sorting must satisfy:
     * 1. Featured galleries appear before non-featured galleries
     * 2. Within each group (featured/non-featured), galleries are sorted by creation date descending
     * 
     * This property ensures that the gallery display order is consistent and predictable.
     */
    it('should always place featured galleries first, then sort by date descending', () => {
      fc.assert(
        fc.property(
          // Generate array of galleries with random dates
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          // Generate array of featured gallery IDs (subset of gallery IDs)
          fc.integer({ min: 0, max: 5 }),
          (galleryData, featuredCount) => {
            // Create galleries from data
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            // Select some galleries to be featured
            const featuredIds = galleries
              .slice(0, Math.min(featuredCount, galleries.length))
              .map((g) => g.id);

            // Create service instance (we only need the sortGalleries method)
            const service = new PublicProfileService(null as any);

            // Sort galleries
            const sorted = service.sortGalleries(galleries, featuredIds);

            // Verify: All featured galleries come before non-featured
            let foundNonFeatured = false;
            for (const gallery of sorted) {
              const isFeatured = featuredIds.includes(gallery.id);

              if (!isFeatured) {
                foundNonFeatured = true;
              }

              // Once we find a non-featured gallery, all subsequent must be non-featured
              if (foundNonFeatured && isFeatured) {
                throw new Error(
                  'Featured gallery found after non-featured gallery'
                );
              }
            }

            // Verify: Featured galleries are sorted by date descending
            const featuredGalleries = sorted.filter((g) =>
              featuredIds.includes(g.id)
            );
            for (let i = 0; i < featuredGalleries.length - 1; i++) {
              const current = featuredGalleries[i]!;
              const next = featuredGalleries[i + 1]!;
              
              // Handle NaN dates (treat as 0)
              const currentTime = isNaN(current.createdAt.getTime()) ? 0 : current.createdAt.getTime();
              const nextTime = isNaN(next.createdAt.getTime()) ? 0 : next.createdAt.getTime();
              
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }

            // Verify: Non-featured galleries are sorted by date descending
            const nonFeaturedGalleries = sorted.filter(
              (g) => !featuredIds.includes(g.id)
            );
            for (let i = 0; i < nonFeaturedGalleries.length - 1; i++) {
              const current = nonFeaturedGalleries[i]!;
              const next = nonFeaturedGalleries[i + 1]!;
              
              // Handle NaN dates (treat as 0)
              const currentTime = isNaN(current.createdAt.getTime()) ? 0 : current.createdAt.getTime();
              const nextTime = isNaN(next.createdAt.getTime()) ? 0 : next.createdAt.getTime();
              
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain sort order when no galleries are featured', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (galleryData) => {
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            const service = new PublicProfileService(null as any);
            const sorted = service.sortGalleries(galleries, []);

            // All galleries should be sorted by date descending
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]!;
              const next = sorted[i + 1]!;
              
              // Handle NaN dates (treat as 0)
              const currentTime = isNaN(current.createdAt.getTime()) ? 0 : current.createdAt.getTime();
              const nextTime = isNaN(next.createdAt.getTime()) ? 0 : next.createdAt.getTime();
              
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain sort order when all galleries are featured', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 2, maxLength: 20 }
          ),
          (galleryData) => {
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            const featuredIds = galleries.map((g) => g.id);

            const service = new PublicProfileService(null as any);
            const sorted = service.sortGalleries(galleries, featuredIds);

            // All galleries should be sorted by date descending
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]!;
              const next = sorted[i + 1]!;
              
              // Handle NaN dates (treat as 0)
              const currentTime = isNaN(current.createdAt.getTime()) ? 0 : current.createdAt.getTime();
              const nextTime = isNaN(next.createdAt.getTime()) ? 0 : next.createdAt.getTime();
              
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not modify the original array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          fc.integer({ min: 0, max: 3 }),
          (galleryData, featuredCount) => {
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            const featuredIds = galleries
              .slice(0, Math.min(featuredCount, galleries.length))
              .map((g) => g.id);

            // Create a copy to compare
            const originalOrder = galleries.map((g) => g.id);

            const service = new PublicProfileService(null as any);
            service.sortGalleries(galleries, featuredIds);

            // Original array should not be modified
            const currentOrder = galleries.map((g) => g.id);
            expect(currentOrder).toEqual(originalOrder);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return same length array', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 0, maxLength: 20 }
          ),
          fc.array(fc.uuid(), { maxLength: 5 }),
          (galleryData, featuredIds) => {
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            const service = new PublicProfileService(null as any);
            const sorted = service.sortGalleries(galleries, featuredIds);

            expect(sorted.length).toBe(galleries.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty gallery array', () => {
      const service = new PublicProfileService(null as any);
      const sorted = service.sortGalleries([], ['some-id']);

      expect(sorted).toEqual([]);
    });

    it('should handle undefined featuredIds', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.uuid(),
              createdAt: fc.date({
                min: new Date('2020-01-01'),
                max: new Date('2024-12-31'),
              }),
            }),
            { minLength: 2, maxLength: 10 }
          ),
          (galleryData) => {
            const galleries = galleryData.map((data) =>
              createMockGallery(data.id, data.createdAt)
            );

            const service = new PublicProfileService(null as any);
            const sorted = service.sortGalleries(galleries, undefined);

            // Should sort by date descending when no featured IDs
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]!;
              const next = sorted[i + 1]!;
              
              // Handle NaN dates (treat as 0)
              const currentTime = isNaN(current.createdAt.getTime()) ? 0 : current.createdAt.getTime();
              const nextTime = isNaN(next.createdAt.getTime()) ? 0 : next.createdAt.getTime();
              
              expect(currentTime).toBeGreaterThanOrEqual(nextTime);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
