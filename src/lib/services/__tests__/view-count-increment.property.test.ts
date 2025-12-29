/**
 * Property-Based Tests for Gallery View Count Increment
 * 
 * Feature: nextjs-migration, Property 8: Gallery View Count Increment
 * Validates: Requirements 4.6
 * 
 * Tests that:
 * - For any successful gallery access (password verified), the views_count 
 *   SHALL be incremented by exactly 1.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { GalleryService } from '@/lib/services/gallery.service';
import type { Gallery, Image } from '@/lib/supabase/types';
import type { IGalleryRepository } from '@/lib/repositories/gallery.repository';
import type { IProfileRepository } from '@/lib/repositories/profile.repository';
import bcrypt from 'bcryptjs';

// Arbitrary for generating UUIDs
const uuidArb = fc.uuid();

// Arbitrary for generating valid slugs
const slugArb = fc.string({ minLength: 6, maxLength: 20 })
  .filter(s => /^[a-zA-Z0-9-]+$/.test(s) && s.length >= 6);

// Arbitrary for generating passwords
const passwordArb = fc.string({ minLength: 4, maxLength: 50 })
  .filter(s => s.length >= 4);

// Arbitrary for generating non-negative view counts
const viewCountArb = fc.integer({ min: 0, max: 1000000 });

// Arbitrary for generating gallery titles
const titleArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Creates a mock gallery with the specified properties
 */
function createMockGallery(
  id: string,
  slug: string,
  passwordHash: string,
  viewsCount: number,
  isActive: boolean = true,
  expiresAt?: Date
): Gallery {
  const now = new Date();
  const defaultExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  return {
    id,
    user_id: 'user-123',
    title: 'Test Gallery',
    unique_slug: slug,
    password_hash: passwordHash,
    expiration_days: 7,
    expires_at: (expiresAt || defaultExpiry).toISOString(),
    views_count: viewsCount,
    is_active: isActive,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

/**
 * Creates a mock gallery repository that tracks view count increments
 */
function createMockGalleryRepository(
  gallery: Gallery | null,
  onIncrementViewCount?: (id: string) => void
): IGalleryRepository {
  return {
    create: vi.fn().mockResolvedValue(gallery),
    findById: vi.fn().mockResolvedValue(gallery),
    findBySlug: vi.fn().mockResolvedValue(gallery),
    findByUserId: vi.fn().mockResolvedValue(gallery ? [gallery] : []),
    update: vi.fn().mockResolvedValue(gallery),
    delete: vi.fn().mockResolvedValue(undefined),
    countByUserId: vi.fn().mockResolvedValue(gallery ? 1 : 0),
    incrementViewCount: vi.fn().mockImplementation(async (id: string) => {
      if (onIncrementViewCount) {
        onIncrementViewCount(id);
      }
    }),
    generateUniqueSlug: vi.fn().mockResolvedValue('unique-slug-123'),
  };
}

/**
 * Creates a mock profile repository
 */
function createMockProfileRepository(): IProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(null),
    findByEmail: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(null),
    update: vi.fn().mockResolvedValue(null),
    incrementStorage: vi.fn().mockResolvedValue(undefined),
    decrementStorage: vi.fn().mockResolvedValue(undefined),
  };
}

/**
 * Creates a mock Supabase client that returns images
 */
function createMockSupabase(images: Image[] = []) {
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: images, error: null }),
        }),
      }),
    }),
  } as any;
}

describe('Gallery View Count Increment (Property 8)', () => {
  /**
   * Feature: nextjs-migration, Property 8: Gallery View Count Increment
   * Validates: Requirements 4.6
   */

  describe('incrementViewCount is called on successful password verification', () => {
    it('should call incrementViewCount exactly once for any successful gallery access', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          viewCountArb,
          async (galleryId, slug, password, initialViewCount) => {
            // Hash the password
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Track increment calls
            let incrementCallCount = 0;
            let incrementedGalleryId: string | null = null;
            
            const gallery = createMockGallery(galleryId, slug, passwordHash, initialViewCount);
            const galleryRepo = createMockGalleryRepository(gallery, (id) => {
              incrementCallCount++;
              incrementedGalleryId = id;
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Verify password (should succeed and increment view count)
            const result = await service.verifyPassword(slug, password);
            
            // Assertions
            expect(result.success).toBe(true);
            expect(incrementCallCount).toBe(1);
            expect(incrementedGalleryId).toBe(galleryId);
          }
        ),
        { numRuns: 50 }
      );
    }, 60000); // 60 second timeout due to bcrypt hashing

    it('should NOT call incrementViewCount when password verification fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          passwordArb,
          viewCountArb,
          async (galleryId, slug, correctPassword, wrongPassword, initialViewCount) => {
            // Skip if passwords happen to be the same
            if (correctPassword === wrongPassword) {
              return;
            }
            
            // Hash the correct password
            const passwordHash = await bcrypt.hash(correctPassword, 10);
            
            // Track increment calls
            let incrementCallCount = 0;
            
            const gallery = createMockGallery(galleryId, slug, passwordHash, initialViewCount);
            const galleryRepo = createMockGalleryRepository(gallery, () => {
              incrementCallCount++;
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Verify with wrong password (should fail)
            const result = await service.verifyPassword(slug, wrongPassword);
            
            // Assertions
            expect(result.success).toBe(false);
            expect(incrementCallCount).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);

    it('should NOT call incrementViewCount when gallery is not found', async () => {
      await fc.assert(
        fc.asyncProperty(
          slugArb,
          passwordArb,
          async (slug, password) => {
            // Track increment calls
            let incrementCallCount = 0;
            
            // Gallery not found (null)
            const galleryRepo = createMockGalleryRepository(null, () => {
              incrementCallCount++;
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Verify password (should fail - gallery not found)
            const result = await service.verifyPassword(slug, password);
            
            // Assertions
            expect(result.success).toBe(false);
            expect(result.error).toBe('Galerie non trouvée');
            expect(incrementCallCount).toBe(0);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should NOT call incrementViewCount when gallery is inactive', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          viewCountArb,
          async (galleryId, slug, password, initialViewCount) => {
            // Hash the password
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Track increment calls
            let incrementCallCount = 0;
            
            // Create inactive gallery
            const gallery = createMockGallery(galleryId, slug, passwordHash, initialViewCount, false);
            const galleryRepo = createMockGalleryRepository(gallery, () => {
              incrementCallCount++;
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Verify password (should fail - gallery inactive)
            const result = await service.verifyPassword(slug, password);
            
            // Assertions
            expect(result.success).toBe(false);
            expect(result.error).toBe("Cette galerie n'est plus active");
            expect(incrementCallCount).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);

    it('should NOT call incrementViewCount when gallery has expired', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          viewCountArb,
          async (galleryId, slug, password, initialViewCount) => {
            // Hash the password
            const passwordHash = await bcrypt.hash(password, 10);
            
            // Track increment calls
            let incrementCallCount = 0;
            
            // Create expired gallery (expired 1 day ago)
            const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const gallery = createMockGallery(galleryId, slug, passwordHash, initialViewCount, true, expiredDate);
            const galleryRepo = createMockGalleryRepository(gallery, () => {
              incrementCallCount++;
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Verify password (should fail - gallery expired)
            const result = await service.verifyPassword(slug, password);
            
            // Assertions
            expect(result.success).toBe(false);
            expect(result.error).toBe('Cette galerie a expiré');
            expect(incrementCallCount).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);
  });

  describe('View count increment behavior', () => {
    it('should increment view count for the correct gallery ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          async (galleryId, slug, password) => {
            const passwordHash = await bcrypt.hash(password, 10);
            
            const incrementedIds: string[] = [];
            
            const gallery = createMockGallery(galleryId, slug, passwordHash, 0);
            const galleryRepo = createMockGalleryRepository(gallery, (id) => {
              incrementedIds.push(id);
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            await service.verifyPassword(slug, password);
            
            // Should have incremented exactly the gallery with the matching ID
            expect(incrementedIds).toEqual([galleryId]);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);

    it('should return gallery data along with successful verification', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          slugArb,
          passwordArb,
          titleArb,
          viewCountArb,
          async (galleryId, slug, password, title, viewCount) => {
            const passwordHash = await bcrypt.hash(password, 10);
            
            const gallery = createMockGallery(galleryId, slug, passwordHash, viewCount);
            gallery.title = title;
            
            const galleryRepo = createMockGalleryRepository(gallery);
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            const result = await service.verifyPassword(slug, password);
            
            expect(result.success).toBe(true);
            expect(result.gallery).toBeDefined();
            expect(result.gallery?.id).toBe(galleryId);
            expect(result.gallery?.title).toBe(title);
            expect(result.gallery?.unique_slug).toBe(slug);
          }
        ),
        { numRuns: 30 }
      );
    }, 60000);
  });

  describe('Direct incrementViewCount method', () => {
    it('should call repository incrementViewCount with correct ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          async (galleryId) => {
            const incrementedIds: string[] = [];
            
            const galleryRepo = createMockGalleryRepository(null, (id) => {
              incrementedIds.push(id);
            });
            const profileRepo = createMockProfileRepository();
            const mockSupabase = createMockSupabase();
            
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            await service.incrementViewCount(galleryId);
            
            expect(incrementedIds).toEqual([galleryId]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
