/**
 * Property-Based Tests for Gallery Limits Enforcement
 * 
 * Feature: nextjs-migration, Property 7: Plan-Based Gallery Limits Enforcement
 * Validates: Requirements 4.5
 * 
 * Tests that:
 * - For any user attempting to create a gallery, if the user's current gallery count 
 *   equals or exceeds their plan's max_galleries limit, the creation SHALL be rejected 
 *   with an appropriate error.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { PLAN_LIMITS, canCreateGallery, getPlanLimits } from '@/config/plans';
import { GalleryService } from '@/lib/services/gallery.service';
import { GalleryLimitError, NotFoundError } from '@/lib/errors';
import type { SubscriptionPlan, Profile } from '@/types';
import type { IGalleryRepository } from '@/lib/repositories/gallery.repository';
import type { IProfileRepository } from '@/lib/repositories/profile.repository';

// Arbitrary for subscription plans
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>('free', 'premium', 'pro');

// Arbitrary for generating valid gallery creation input
const validGalleryInputArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  password: fc.string({ minLength: 4, maxLength: 50 }),
  expirationDays: fc.integer({ min: 1, max: 30 }), // Use free plan max as baseline
});

// Arbitrary for generating UUIDs
const uuidArb = fc.uuid();

/**
 * Creates a mock profile with the specified plan and limits
 */
function createMockProfile(
  userId: string,
  plan: SubscriptionPlan
): Profile {
  const limits = PLAN_LIMITS[plan];
  return {
    id: userId,
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    subscription_plan: plan,
    storage_used_mb: 0,
    storage_limit_mb: limits.storage_limit_mb,
    max_galleries: limits.max_galleries,
    max_images_per_gallery: limits.max_images_per_gallery,
    max_image_size_mb: limits.max_image_size_mb,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Creates a mock gallery repository
 */
function createMockGalleryRepository(galleryCount: number): IGalleryRepository {
  return {
    create: vi.fn().mockResolvedValue({
      id: 'new-gallery-id',
      user_id: 'user-id',
      title: 'Test Gallery',
      unique_slug: 'test-slug',
      password_hash: 'hashed',
      expiration_days: 7,
      expires_at: new Date().toISOString(),
      views_count: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }),
    findById: vi.fn().mockResolvedValue(null),
    findBySlug: vi.fn().mockResolvedValue(null),
    findByUserId: vi.fn().mockResolvedValue([]),
    update: vi.fn().mockResolvedValue(null),
    delete: vi.fn().mockResolvedValue(undefined),
    countByUserId: vi.fn().mockResolvedValue(galleryCount),
    incrementViewCount: vi.fn().mockResolvedValue(undefined),
    generateUniqueSlug: vi.fn().mockResolvedValue('unique-slug-123'),
  };
}

/**
 * Creates a mock profile repository
 */
function createMockProfileRepository(profile: Profile | null): IProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(profile),
    findByEmail: vi.fn().mockResolvedValue(profile),
    create: vi.fn().mockResolvedValue(profile),
    update: vi.fn().mockResolvedValue(profile),
    incrementStorage: vi.fn().mockResolvedValue(undefined),
    decrementStorage: vi.fn().mockResolvedValue(undefined),
  };
}

describe('Gallery Limits Enforcement (Property 7)', () => {
  /**
   * Feature: nextjs-migration, Property 7: Plan-Based Gallery Limits Enforcement
   * Validates: Requirements 4.5
   */

  describe('canCreateGallery utility function', () => {
    it('should allow gallery creation when count is below limit for any plan', () => {
      fc.assert(
        fc.property(
          subscriptionPlanArb,
          (plan) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            
            // For any count below the limit, creation should be allowed
            for (let count = 0; count < maxGalleries; count++) {
              expect(canCreateGallery(count, plan)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject gallery creation when count equals limit for any plan', () => {
      fc.assert(
        fc.property(
          subscriptionPlanArb,
          (plan) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            
            // When count equals the limit, creation should be rejected
            expect(canCreateGallery(maxGalleries, plan)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject gallery creation when count exceeds limit for any plan', () => {
      fc.assert(
        fc.property(
          subscriptionPlanArb,
          fc.integer({ min: 1, max: 100 }),
          (plan, excess) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            const countOverLimit = maxGalleries + excess;
            
            // When count exceeds the limit, creation should be rejected
            expect(canCreateGallery(countOverLimit, plan)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Plan limits are correctly defined', () => {
    it('should have correct gallery limits for each plan', () => {
      // Free plan: 3 galleries
      expect(PLAN_LIMITS.free.max_galleries).toBe(3);
      
      // Premium plan: 50 galleries
      expect(PLAN_LIMITS.premium.max_galleries).toBe(50);
      
      // Pro plan: 500 galleries
      expect(PLAN_LIMITS.pro.max_galleries).toBe(500);
    });

    it('should return correct limits via getPlanLimits for any plan', () => {
      fc.assert(
        fc.property(
          subscriptionPlanArb,
          (plan) => {
            const limits = getPlanLimits(plan);
            
            // Limits should match PLAN_LIMITS
            expect(limits).toEqual(PLAN_LIMITS[plan]);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('GalleryService.create limit enforcement', () => {
    it('should throw GalleryLimitError when gallery count equals plan limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          subscriptionPlanArb,
          validGalleryInputArb,
          async (userId, plan, input) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            const profile = createMockProfile(userId, plan);
            
            // Mock repositories with count at the limit
            const galleryRepo = createMockGalleryRepository(maxGalleries);
            const profileRepo = createMockProfileRepository(profile);
            
            // Create service with mocked dependencies
            const mockSupabase = {} as any;
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Adjust expiration days to be within plan limits
            const adjustedInput = {
              ...input,
              expirationDays: Math.min(input.expirationDays, PLAN_LIMITS[plan].max_expiration_days),
            };
            
            // Attempt to create gallery should throw GalleryLimitError
            await expect(service.create(userId, adjustedInput)).rejects.toThrow(GalleryLimitError);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should throw GalleryLimitError when gallery count exceeds plan limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          subscriptionPlanArb,
          validGalleryInputArb,
          fc.integer({ min: 1, max: 10 }),
          async (userId, plan, input, excess) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            const profile = createMockProfile(userId, plan);
            
            // Mock repositories with count exceeding the limit
            const galleryRepo = createMockGalleryRepository(maxGalleries + excess);
            const profileRepo = createMockProfileRepository(profile);
            
            // Create service with mocked dependencies
            const mockSupabase = {} as any;
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Adjust expiration days to be within plan limits
            const adjustedInput = {
              ...input,
              expirationDays: Math.min(input.expirationDays, PLAN_LIMITS[plan].max_expiration_days),
            };
            
            // Attempt to create gallery should throw GalleryLimitError
            await expect(service.create(userId, adjustedInput)).rejects.toThrow(GalleryLimitError);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should allow gallery creation when count is below plan limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          subscriptionPlanArb,
          validGalleryInputArb,
          async (userId, plan, input) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            const profile = createMockProfile(userId, plan);
            
            // Generate a random count below the limit (at least 0, at most maxGalleries - 1)
            const countBelowLimit = maxGalleries > 1 ? Math.floor(Math.random() * (maxGalleries - 1)) : 0;
            
            // Mock repositories with count below the limit
            const galleryRepo = createMockGalleryRepository(countBelowLimit);
            const profileRepo = createMockProfileRepository(profile);
            
            // Create service with mocked dependencies
            const mockSupabase = {} as any;
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Adjust expiration days to be within plan limits
            const adjustedInput = {
              ...input,
              expirationDays: Math.min(input.expirationDays, PLAN_LIMITS[plan].max_expiration_days),
            };
            
            // Attempt to create gallery should succeed (not throw GalleryLimitError)
            const result = await service.create(userId, adjustedInput);
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
          }
        ),
        { numRuns: 30 } // Reduced runs for async test with bcrypt
      );
    }, 30000); // 30 second timeout for async test with bcrypt hashing

    it('should include current count and limit in GalleryLimitError details', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          subscriptionPlanArb,
          validGalleryInputArb,
          async (userId, plan, input) => {
            const maxGalleries = PLAN_LIMITS[plan].max_galleries;
            const profile = createMockProfile(userId, plan);
            
            // Mock repositories with count at the limit
            const galleryRepo = createMockGalleryRepository(maxGalleries);
            const profileRepo = createMockProfileRepository(profile);
            
            // Create service with mocked dependencies
            const mockSupabase = {} as any;
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Adjust expiration days to be within plan limits
            const adjustedInput = {
              ...input,
              expirationDays: Math.min(input.expirationDays, PLAN_LIMITS[plan].max_expiration_days),
            };
            
            try {
              await service.create(userId, adjustedInput);
              // Should not reach here
              expect(true).toBe(false);
            } catch (error) {
              expect(error).toBeInstanceOf(GalleryLimitError);
              const galleryError = error as GalleryLimitError;
              
              // Error should have correct status code
              expect(galleryError.statusCode).toBe(400);
              expect(galleryError.code).toBe('GALLERY_LIMIT_EXCEEDED');
              
              // Error details should include current count and limit
              expect(galleryError.details).toBeDefined();
              expect((galleryError.details as any).currentCount).toBe(maxGalleries);
              expect((galleryError.details as any).limit).toBe(maxGalleries);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Edge cases', () => {
    it('should throw NotFoundError when profile does not exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          uuidArb,
          validGalleryInputArb,
          async (userId, input) => {
            // Mock repositories with no profile
            const galleryRepo = createMockGalleryRepository(0);
            const profileRepo = createMockProfileRepository(null);
            
            // Create service with mocked dependencies
            const mockSupabase = {} as any;
            const service = new GalleryService(mockSupabase, galleryRepo, profileRepo);
            
            // Attempt to create gallery should throw NotFoundError
            await expect(service.create(userId, input)).rejects.toThrow(NotFoundError);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should enforce different limits for different plans correctly', async () => {
      // Test that upgrading plan allows more galleries
      const userId = 'test-user-id';
      const input = {
        title: 'Test Gallery',
        password: 'test1234',
        expirationDays: 7,
      };
      
      // Free plan user at limit (3 galleries)
      const freeProfile = createMockProfile(userId, 'free');
      const freeGalleryRepo = createMockGalleryRepository(3);
      const freeProfileRepo = createMockProfileRepository(freeProfile);
      
      const mockSupabase = {} as any;
      const freeService = new GalleryService(mockSupabase, freeGalleryRepo, freeProfileRepo);
      
      // Should fail for free plan at limit
      await expect(freeService.create(userId, input)).rejects.toThrow(GalleryLimitError);
      
      // Same count but premium plan (limit is 50)
      const premiumProfile = createMockProfile(userId, 'premium');
      const premiumGalleryRepo = createMockGalleryRepository(3);
      const premiumProfileRepo = createMockProfileRepository(premiumProfile);
      
      const premiumService = new GalleryService(mockSupabase, premiumGalleryRepo, premiumProfileRepo);
      
      // Should succeed for premium plan with same count
      const result = await premiumService.create(userId, input);
      expect(result).toBeDefined();
    });
  });
});
