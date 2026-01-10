/**
 * Property-Based Tests for Admin Service
 * 
 * Feature: admin-dashboard
 * Tests admin authorization, plan updates, user suspension, gallery operations, and subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AdminService } from '../admin.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, SubscriptionPlan } from '@/lib/supabase/types';
import type { IAdminRepository } from '@/lib/repositories/admin.repository';
import type { IAuditLogService } from '@/lib/services/audit-log.service';
import { PLAN_LIMITS } from '@/config/plans';

/**
 * Type definitions for test data
 */
interface TestProfile {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: SubscriptionPlan;
  storage_used_mb: number;
  storage_limit_mb: number;
  is_suspended: boolean;
  is_admin: boolean;
  created_at: string;
}

/**
 * Arbitrary generators for test data
 */
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>('free', 'premium', 'pro');

const minTimestamp = new Date('2024-01-01T00:00:00.000Z').getTime();
const maxTimestamp = new Date('2026-01-10T00:00:00.000Z').getTime();
const dateStringArb = fc.integer({ min: minTimestamp, max: maxTimestamp })
  .map(ts => new Date(ts).toISOString());

const profileArb: fc.Arbitrary<TestProfile> = fc.record({
  id: fc.uuid(),
  email: fc.emailAddress(),
  name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  subscription_plan: subscriptionPlanArb,
  storage_used_mb: fc.integer({ min: 0, max: 50000 }),
  storage_limit_mb: fc.integer({ min: 20, max: 51200 }),
  is_suspended: fc.boolean(),
  is_admin: fc.boolean(),
  created_at: dateStringArb,
});


describe('Admin Service - Admin Authorization (Property 1)', () => {
  /**
   * Feature: admin-dashboard, Property 1: Admin Authorization
   * Validates: Requirements 1.1, 1.2
   * 
   * For any user attempting to access admin routes, access SHALL be granted
   * if and only if the user's is_admin field is true.
   */

  it('should grant access only to users with is_admin = true', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb,
        async (profile) => {
          // Create mock Supabase client
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    eq: vi.fn().mockImplementation(() => ({
                      single: vi.fn().mockReturnValue(
                        Promise.resolve({
                          data: { is_admin: profile.is_admin },
                          error: null,
                        })
                      ),
                    })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(mockClient);
          const isAdmin = await service.isAdmin(profile.id);

          // Access should be granted if and only if is_admin is true
          expect(isAdmin).toBe(profile.is_admin === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access when user is not found', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Create mock Supabase client that returns not found
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    eq: vi.fn().mockImplementation(() => ({
                      single: vi.fn().mockReturnValue(
                        Promise.resolve({
                          data: null,
                          error: { code: 'PGRST116', message: 'Not found' },
                        })
                      ),
                    })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(mockClient);
          const isAdmin = await service.isAdmin(userId);

          // Non-existent users should not have admin access
          expect(isAdmin).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly distinguish admin from non-admin users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 1, maxLength: 20 }),
        async (profiles) => {
          // Test each profile
          for (const profile of profiles) {
            const mockClient = {
              from: vi.fn().mockImplementation((table: string) => {
                if (table === 'profiles') {
                  return {
                    select: vi.fn().mockImplementation(() => ({
                      eq: vi.fn().mockImplementation(() => ({
                        single: vi.fn().mockReturnValue(
                          Promise.resolve({
                            data: { is_admin: profile.is_admin },
                            error: null,
                          })
                        ),
                      })),
                    })),
                  };
                }
                return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
              }),
            } as unknown as SupabaseClient<Database>;

            const service = new AdminService(mockClient);
            const isAdmin = await service.isAdmin(profile.id);

            // The result should exactly match the is_admin field
            if (profile.is_admin) {
              expect(isAdmin).toBe(true);
            } else {
              expect(isAdmin).toBe(false);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Service - Plan Update Changes Limits (Property 5)', () => {
  /**
   * Feature: admin-dashboard, Property 5: Plan Update Changes Limits
   * Validates: Requirements 3.4, 6.3
   * 
   * For any user and any target subscription plan, after calling updateUserPlan(),
   * the user's limits (storage_limit_mb, max_galleries, max_images_per_gallery, max_image_size_mb)
   * SHALL match the limits defined for that plan.
   */

  it('should update user limits to match the new plan', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin), // Non-admin users only
        subscriptionPlanArb,
        fc.uuid(), // adminId
        async (user, targetPlan, adminId) => {
          let updatedPlan: SubscriptionPlan | null = null;
          let updatedLimits: typeof PLAN_LIMITS['free'] | null = null;

          // Create mock repository
          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({
              ...user,
              is_admin: false,
            }),
            updateUserPlan: vi.fn().mockImplementation(async (id: string, plan: SubscriptionPlan) => {
              updatedPlan = plan;
              updatedLimits = PLAN_LIMITS[plan];
            }),
          };

          // Create mock audit log service
          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          // Create mock Supabase client (not used directly in updateUserPlan)
          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.updateUserPlan(adminId, user.id, targetPlan);

          // Verify the plan was updated
          expect(updatedPlan).toBe(targetPlan);

          // Verify the limits match the plan
          const expectedLimits = PLAN_LIMITS[targetPlan];
          expect(updatedLimits).toEqual(expectedLimits);

          // Verify specific limit values
          expect(updatedLimits?.storage_limit_mb).toBe(expectedLimits.storage_limit_mb);
          expect(updatedLimits?.max_galleries).toBe(expectedLimits.max_galleries);
          expect(updatedLimits?.max_images_per_gallery).toBe(expectedLimits.max_images_per_gallery);
          expect(updatedLimits?.max_image_size_mb).toBe(expectedLimits.max_image_size_mb);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should correctly apply limits for each plan type', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin),
        fc.uuid(),
        async (user, adminId) => {
          // Test all three plans
          const plans: SubscriptionPlan[] = ['free', 'premium', 'pro'];

          for (const targetPlan of plans) {
            let capturedLimits: typeof PLAN_LIMITS['free'] | null = null;

            const mockRepository: Partial<IAdminRepository> = {
              getUserById: vi.fn().mockResolvedValue({
                ...user,
                is_admin: false,
              }),
              updateUserPlan: vi.fn().mockImplementation(async (_id: string, plan: SubscriptionPlan) => {
                capturedLimits = PLAN_LIMITS[plan];
              }),
            };

            const mockAuditLogService: Partial<IAuditLogService> = {
              log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
            };

            const mockClient = {
              from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    single: vi.fn().mockResolvedValue({ data: user, error: null }),
                  }),
                }),
              }),
            } as unknown as SupabaseClient<Database>;

            const service = new AdminService(
              mockClient,
              mockRepository as IAdminRepository,
              mockAuditLogService as IAuditLogService
            );

            await service.updateUserPlan(adminId, user.id, targetPlan);

            // Verify limits match expected values for each plan
            expect(capturedLimits).toEqual(PLAN_LIMITS[targetPlan]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


interface TestGallery {
  id: string;
  user_id: string;
  title: string;
  is_active: boolean;
}

const galleryArb: fc.Arbitrary<TestGallery> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  is_active: fc.boolean(),
});

describe('Admin Service - User Suspension Deactivates Galleries (Property 6)', () => {
  /**
   * Feature: admin-dashboard, Property 6: User Suspension Deactivates Galleries
   * Validates: Requirements 3.5
   * 
   * For any user with galleries, after calling suspendUser(),
   * all galleries owned by that user SHALL have is_active = false.
   */

  it('should deactivate all user galleries when user is suspended', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin && !p.is_suspended),
        fc.array(galleryArb, { minLength: 1, maxLength: 10 }),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (user, galleries, adminId, reason) => {
          // Assign galleries to the user
          const userGalleries = galleries.map(g => ({ ...g, user_id: user.id }));
          let suspendedUserId: string | null = null;
          let galleriesDeactivated = false;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({
              ...user,
              is_admin: false,
              is_suspended: false,
              gallery_count: userGalleries.length,
            }),
            suspendUser: vi.fn().mockImplementation(async (id: string) => {
              suspendedUserId = id;
              galleriesDeactivated = true;
              // Simulate deactivating all galleries
              userGalleries.forEach(g => { g.is_active = false; });
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.suspendUser(adminId, user.id, reason);

          // Verify user was suspended
          expect(suspendedUserId).toBe(user.id);
          expect(galleriesDeactivated).toBe(true);

          // Verify all galleries are now inactive
          for (const gallery of userGalleries) {
            expect(gallery.is_active).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not allow suspending admin users', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => p.is_admin),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (adminUser, adminId, reason) => {
          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({
              ...adminUser,
              is_admin: true,
            }),
            suspendUser: vi.fn(),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: adminUser, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // Should throw an error when trying to suspend an admin
          await expect(service.suspendUser(adminId, adminUser.id, reason))
            .rejects.toThrow('Cannot suspend admin users');

          // Verify suspendUser was never called
          expect(mockRepository.suspendUser).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Service - Suspend-Reactivate Round Trip (Property 7)', () => {
  /**
   * Feature: admin-dashboard, Property 7: Suspend-Reactivate Round Trip
   * Validates: Requirements 3.5, 3.6
   * 
   * For any active user with active galleries, suspending then reactivating the user
   * SHALL restore the user's access and reactivate their galleries to their previous state.
   */

  it('should restore user and galleries after suspend-reactivate cycle', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin && !p.is_suspended),
        fc.array(galleryArb.filter(g => g.is_active), { minLength: 1, maxLength: 5 }),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (user, activeGalleries, adminId, reason) => {
          // Track state changes
          let userSuspended = false;
          let userReactivated = false;
          const galleryStates: Record<string, boolean> = {};

          // Initialize gallery states
          const userGalleries = activeGalleries.map(g => {
            const gallery = { ...g, user_id: user.id, is_active: true };
            galleryStates[gallery.id] = true;
            return gallery;
          });

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockImplementation(async () => ({
              ...user,
              is_admin: false,
              is_suspended: userSuspended,
              gallery_count: userGalleries.length,
            })),
            suspendUser: vi.fn().mockImplementation(async () => {
              userSuspended = true;
              // Deactivate all galleries
              userGalleries.forEach(g => {
                galleryStates[g.id] = false;
              });
            }),
            reactivateUser: vi.fn().mockImplementation(async () => {
              userSuspended = false;
              userReactivated = true;
              // Reactivate all galleries
              userGalleries.forEach(g => {
                galleryStates[g.id] = true;
              });
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // Initial state: user active, galleries active
          expect(userSuspended).toBe(false);
          for (const gallery of userGalleries) {
            expect(galleryStates[gallery.id]).toBe(true);
          }

          // Suspend user
          await service.suspendUser(adminId, user.id, reason);

          // After suspend: user suspended, galleries inactive
          expect(userSuspended).toBe(true);
          for (const gallery of userGalleries) {
            expect(galleryStates[gallery.id]).toBe(false);
          }

          // Reactivate user
          await service.reactivateUser(adminId, user.id);

          // After reactivate: user active, galleries active (restored)
          expect(userSuspended).toBe(false);
          expect(userReactivated).toBe(true);
          for (const gallery of userGalleries) {
            expect(galleryStates[gallery.id]).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain idempotency - multiple reactivations have same effect', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin),
        fc.uuid(),
        async (user, adminId) => {
          let reactivationCount = 0;
          let finalState = false;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockImplementation(async () => ({
              ...user,
              is_admin: false,
              is_suspended: reactivationCount === 0, // First call: suspended, after: not suspended
            })),
            reactivateUser: vi.fn().mockImplementation(async () => {
              reactivationCount++;
              finalState = true;
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // First reactivation should succeed
          await service.reactivateUser(adminId, user.id);
          expect(finalState).toBe(true);
          expect(reactivationCount).toBe(1);

          // Second reactivation should fail (user not suspended)
          await expect(service.reactivateUser(adminId, user.id))
            .rejects.toThrow('User is not suspended');
        }
      ),
      { numRuns: 100 }
    );
  });
});


interface TestGalleryListItem {
  id: string;
  title: string;
  unique_slug: string;
  owner_email: string;
  owner_name: string | null;
  owner_id: string;
  image_count: number;
  views_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

const futureTimestamp = new Date('2027-01-01T00:00:00.000Z').getTime();
const futureDateStringArb = fc.integer({ min: minTimestamp, max: futureTimestamp })
  .map(ts => new Date(ts).toISOString());

const galleryListItemArb: fc.Arbitrary<TestGalleryListItem> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  unique_slug: fc.string({ minLength: 8, maxLength: 8 }),
  owner_email: fc.emailAddress(),
  owner_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
  owner_id: fc.uuid(),
  image_count: fc.integer({ min: 0, max: 100 }),
  views_count: fc.integer({ min: 0, max: 10000 }),
  is_active: fc.boolean(),
  expires_at: futureDateStringArb,
  created_at: dateStringArb,
});

describe('Admin Service - Gallery Deactivation Prevents Access (Property 10)', () => {
  /**
   * Feature: admin-dashboard, Property 10: Gallery Deactivation Prevents Access
   * Validates: Requirements 4.4
   * 
   * For any gallery, after calling deactivateGallery(), the gallery's is_active field
   * SHALL be false, and public access attempts SHALL be denied.
   */

  it('should set is_active to false after deactivation', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb.filter(g => g.is_active),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (gallery, adminId, reason) => {
          let galleryIsActive = gallery.is_active;

          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue({
              ...gallery,
              is_active: galleryIsActive,
            }),
            deactivateGallery: vi.fn().mockImplementation(async () => {
              galleryIsActive = false;
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: gallery, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // Before deactivation
          expect(galleryIsActive).toBe(true);

          // Deactivate gallery
          await service.deactivateGallery(adminId, gallery.id, reason);

          // After deactivation
          expect(galleryIsActive).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not allow deactivating already inactive galleries', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb.map(g => ({ ...g, is_active: false })),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (inactiveGallery, adminId, reason) => {
          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue({
              ...inactiveGallery,
              is_active: false,
            }),
            deactivateGallery: vi.fn(),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: inactiveGallery, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // Should throw error for already inactive gallery
          await expect(service.deactivateGallery(adminId, inactiveGallery.id, reason))
            .rejects.toThrow('Gallery is already inactive');

          // Verify deactivateGallery was never called
          expect(mockRepository.deactivateGallery).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Service - Gallery Deletion Frees Storage (Property 11)', () => {
  /**
   * Feature: admin-dashboard, Property 11: Gallery Deletion Frees Storage
   * Validates: Requirements 4.5
   * 
   * For any gallery with images, after calling deleteGallery():
   * - The gallery SHALL no longer exist in the database
   * - All associated images SHALL be deleted
   * - The owner's storage_used_mb SHALL be decremented by the total size of deleted images
   */

  it('should free storage when gallery is deleted', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb,
        fc.array(fc.record({
          id: fc.uuid(),
          file_size_mb: fc.float({ min: Math.fround(0.1), max: Math.fround(50), noNaN: true }),
        }), { minLength: 1, maxLength: 10 }),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (gallery, images, adminId, reason) => {
          const totalImageSize = images.reduce((sum, img) => sum + img.file_size_mb, 0);
          let storageDecremented = 0;
          let galleryDeleted = false;

          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue(gallery),
            deleteGallery: vi.fn().mockImplementation(async () => {
              galleryDeleted = true;
              return {
                deletedImageIds: images.map(img => img.id),
                freedStorageMb: totalImageSize,
                ownerId: gallery.owner_id,
              };
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: gallery, error: null }),
                }),
              }),
            }),
            rpc: vi.fn().mockImplementation((funcName: string, params: { user_id: string; size_mb: number }) => {
              if (funcName === 'decrement_storage') {
                storageDecremented = params.size_mb;
              }
              return Promise.resolve({ error: null });
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.deleteGallery(adminId, gallery.id, reason);

          // Verify gallery was deleted
          expect(galleryDeleted).toBe(true);

          // Verify storage was decremented by the correct amount
          expect(storageDecremented).toBeCloseTo(totalImageSize, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle galleries with no images', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb.map(g => ({ ...g, image_count: 0 })),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (emptyGallery, adminId, reason) => {
          let storageDecremented = false;
          let galleryDeleted = false;

          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue(emptyGallery),
            deleteGallery: vi.fn().mockImplementation(async () => {
              galleryDeleted = true;
              return {
                deletedImageIds: [],
                freedStorageMb: 0,
                ownerId: emptyGallery.owner_id,
              };
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: emptyGallery, error: null }),
                }),
              }),
            }),
            rpc: vi.fn().mockImplementation(() => {
              storageDecremented = true;
              return Promise.resolve({ error: null });
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.deleteGallery(adminId, emptyGallery.id, reason);

          // Verify gallery was deleted
          expect(galleryDeleted).toBe(true);

          // Verify storage decrement was NOT called (no storage to free)
          expect(storageDecremented).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Service - Subscription Cancellation Schedules Downgrade (Property 13)', () => {
  /**
   * Feature: admin-dashboard, Property 13: Subscription Cancellation Schedules Downgrade
   * Validates: Requirements 6.4
   * 
   * For any user with an active paid subscription, after calling cancelSubscription(),
   * the user SHALL be marked for downgrade to the free plan.
   */

  it('should downgrade user to free plan when subscription is cancelled', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin && (p.subscription_plan === 'premium' || p.subscription_plan === 'pro')),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (paidUser, adminId, reason) => {
          let newPlan: SubscriptionPlan | null = null;
          let stripeSubscriptionCleared = false;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({
              ...paidUser,
              is_admin: false,
            }),
            updateUserPlan: vi.fn().mockImplementation(async (_id: string, plan: SubscriptionPlan) => {
              newPlan = plan;
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: paidUser, error: null }),
                    }),
                  }),
                  update: vi.fn().mockImplementation((data: { stripe_subscription_id: null }) => {
                    if (data.stripe_subscription_id === null) {
                      stripeSubscriptionCleared = true;
                    }
                    return {
                      eq: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
                    };
                  }),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.cancelSubscription(adminId, paidUser.id, reason);

          // Verify user was downgraded to free plan
          expect(newPlan).toBe('free');

          // Verify Stripe subscription ID was cleared
          expect(stripeSubscriptionCleared).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not allow cancelling free plan subscriptions', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin).map(p => ({ ...p, subscription_plan: 'free' as SubscriptionPlan })),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (freeUser, adminId, reason) => {
          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({
              ...freeUser,
              is_admin: false,
              subscription_plan: 'free',
            }),
            updateUserPlan: vi.fn(),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockResolvedValue({ id: 'audit-1' }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: freeUser, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          // Should throw error for free plan users
          await expect(service.cancelSubscription(adminId, freeUser.id, reason))
            .rejects.toThrow('User is already on free plan');

          // Verify updateUserPlan was never called
          expect(mockRepository.updateUserPlan).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Service - Audit Logging for Modifications (Property 8)', () => {
  /**
   * Feature: admin-dashboard, Property 8: Audit Logging for Modifications
   * Validates: Requirements 3.7, 4.6, 6.5
   * 
   * For any modification operation (user update, user suspend, user reactivate,
   * gallery deactivate, gallery delete, subscription update, subscription cancel),
   * an audit log entry SHALL be created with the correct action_type, entity_type,
   * entity_id, and admin_id.
   */

  it('should create audit log for user plan update', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin),
        subscriptionPlanArb,
        fc.uuid(),
        async (user, targetPlan, adminId) => {
          let auditLogCreated = false;
          let capturedAuditLog: {
            adminId: string;
            actionType: string;
            entityType: string;
            entityId: string | null;
          } | null = null;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({ ...user, is_admin: false }),
            updateUserPlan: vi.fn().mockResolvedValue(undefined),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockImplementation(async (aId, actionType, entityType, entityId) => {
              auditLogCreated = true;
              capturedAuditLog = { adminId: aId, actionType, entityType, entityId };
              return { id: 'audit-1' };
            }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.updateUserPlan(adminId, user.id, targetPlan);

          expect(auditLogCreated).toBe(true);
          expect(capturedAuditLog?.adminId).toBe(adminId);
          expect(capturedAuditLog?.actionType).toBe('user_update');
          expect(capturedAuditLog?.entityType).toBe('user');
          expect(capturedAuditLog?.entityId).toBe(user.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create audit log for user suspension', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin && !p.is_suspended),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (user, adminId, reason) => {
          let capturedAuditLog: {
            adminId: string;
            actionType: string;
            entityType: string;
            entityId: string | null;
          } | null = null;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({ ...user, is_admin: false, is_suspended: false }),
            suspendUser: vi.fn().mockResolvedValue(undefined),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockImplementation(async (aId, actionType, entityType, entityId) => {
              capturedAuditLog = { adminId: aId, actionType, entityType, entityId };
              return { id: 'audit-1' };
            }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: user, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.suspendUser(adminId, user.id, reason);

          expect(capturedAuditLog?.adminId).toBe(adminId);
          expect(capturedAuditLog?.actionType).toBe('user_suspend');
          expect(capturedAuditLog?.entityType).toBe('user');
          expect(capturedAuditLog?.entityId).toBe(user.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create audit log for gallery deactivation', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb.filter(g => g.is_active),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (gallery, adminId, reason) => {
          let capturedAuditLog: {
            adminId: string;
            actionType: string;
            entityType: string;
            entityId: string | null;
          } | null = null;

          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue({ ...gallery, is_active: true }),
            deactivateGallery: vi.fn().mockResolvedValue(undefined),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockImplementation(async (aId, actionType, entityType, entityId) => {
              capturedAuditLog = { adminId: aId, actionType, entityType, entityId };
              return { id: 'audit-1' };
            }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: gallery, error: null }),
                }),
              }),
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.deactivateGallery(adminId, gallery.id, reason);

          expect(capturedAuditLog?.adminId).toBe(adminId);
          expect(capturedAuditLog?.actionType).toBe('gallery_deactivate');
          expect(capturedAuditLog?.entityType).toBe('gallery');
          expect(capturedAuditLog?.entityId).toBe(gallery.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create audit log for gallery deletion', async () => {
    await fc.assert(
      fc.asyncProperty(
        galleryListItemArb,
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (gallery, adminId, reason) => {
          let capturedAuditLog: {
            adminId: string;
            actionType: string;
            entityType: string;
            entityId: string | null;
          } | null = null;

          const mockRepository: Partial<IAdminRepository> = {
            getGalleryById: vi.fn().mockResolvedValue(gallery),
            deleteGallery: vi.fn().mockResolvedValue({
              deletedImageIds: [],
              freedStorageMb: 0,
              ownerId: gallery.owner_id,
            }),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockImplementation(async (aId, actionType, entityType, entityId) => {
              capturedAuditLog = { adminId: aId, actionType, entityType, entityId };
              return { id: 'audit-1' };
            }),
          };

          const mockClient = {
            from: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: gallery, error: null }),
                }),
              }),
            }),
            rpc: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.deleteGallery(adminId, gallery.id, reason);

          expect(capturedAuditLog?.adminId).toBe(adminId);
          expect(capturedAuditLog?.actionType).toBe('gallery_delete');
          expect(capturedAuditLog?.entityType).toBe('gallery');
          expect(capturedAuditLog?.entityId).toBe(gallery.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create audit log for subscription cancellation', async () => {
    await fc.assert(
      fc.asyncProperty(
        profileArb.filter(p => !p.is_admin && (p.subscription_plan === 'premium' || p.subscription_plan === 'pro')),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (paidUser, adminId, reason) => {
          let capturedAuditLog: {
            adminId: string;
            actionType: string;
            entityType: string;
            entityId: string | null;
          } | null = null;

          const mockRepository: Partial<IAdminRepository> = {
            getUserById: vi.fn().mockResolvedValue({ ...paidUser, is_admin: false }),
            updateUserPlan: vi.fn().mockResolvedValue(undefined),
          };

          const mockAuditLogService: Partial<IAuditLogService> = {
            log: vi.fn().mockImplementation(async (aId, actionType, entityType, entityId) => {
              capturedAuditLog = { adminId: aId, actionType, entityType, entityId };
              return { id: 'audit-1' };
            }),
          };

          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                      single: vi.fn().mockResolvedValue({ data: paidUser, error: null }),
                    }),
                  }),
                  update: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
                  }),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const service = new AdminService(
            mockClient,
            mockRepository as IAdminRepository,
            mockAuditLogService as IAuditLogService
          );

          await service.cancelSubscription(adminId, paidUser.id, reason);

          expect(capturedAuditLog?.adminId).toBe(adminId);
          expect(capturedAuditLog?.actionType).toBe('subscription_cancel');
          expect(capturedAuditLog?.entityType).toBe('subscription');
          expect(capturedAuditLog?.entityId).toBe(paidUser.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
