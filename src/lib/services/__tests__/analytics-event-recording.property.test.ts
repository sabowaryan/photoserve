/**
 * Property-Based Tests for Analytics Event Recording
 * 
 * Feature: public-photographer-profile
 * 
 * Tests:
 * - Property 14: Enregistrement des événements analytics
 * - Property 15: Incrémentation du compteur de vues
 * 
 * Requirements:
 * - 9.1: Record visit in profile_views table
 * - 9.2: Record hashed IP, user agent, referrer, timestamp
 * - 9.3: Increment views_count on each visit
 * - 9.5: Mark cta_clicked when visitor clicks CTA
 * - 9.6: Record social network name when visitor clicks social link
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { PublicProfileService } from '../public-profile.service';
import type { IPublicProfileRepository } from '@/lib/repositories/public-profile.repository';
import type { IProfileViewsRepository } from '@/lib/repositories/profile-views.repository';

/**
 * Feature: public-photographer-profile, Property 14: Enregistrement des événements analytics
 * 
 * **Validates: Requirements 9.1, 9.2, 9.5, 9.6**
 * 
 * For any trackable event (visit, CTA click, social click), a corresponding record
 * must be created in profile_views with appropriate data (hashed IP, user agent, timestamp).
 */
describe('Property 14: Enregistrement des événements analytics', () => {
  describe('Profile view tracking', () => {
    it('should create a view record with all required fields for any valid input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)), // Valid slug
          fc.ipV4(), // IP address
          fc.string({ minLength: 1, maxLength: 500 }), // User agent
          fc.option(fc.webUrl(), { nil: undefined }), // Optional referrer
          async (slug, ipAddress, userAgent, referrer) => {
            // Mock repositories
            const mockCreate = vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: userAgent,
              referrer: referrer || null,
              viewed_at: new Date().toISOString(),
              cta_clicked: false,
              social_links_clicked: [],
              galleries_viewed: [],
              session_duration: null,
            });

            const mockProfileRepo: Partial<IPublicProfileRepository> = {
              findBySlug: vi.fn().mockResolvedValue({
                id: 'profile-123',
                user_id: 'user-123',
                slug,
                is_enabled: true,
              }),
              incrementViewsCount: vi.fn().mockResolvedValue(undefined),
            };

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              create: mockCreate,
            };

            const service = new PublicProfileService(null as any);
            (service as any).profileRepo = mockProfileRepo;
            (service as any).viewsRepo = mockViewsRepo;

            // Track the view
            const viewId = await service.trackView(slug, {
              ipAddress,
              userAgent,
              referrer,
            });

            // Verify a view record was created (Requirement 9.1)
            expect(mockCreate).toHaveBeenCalledOnce();
            expect(viewId).toBe('view-123');

            // Verify the record contains all required fields (Requirement 9.2)
            const createCall = mockCreate.mock.calls[0]?.[0];
            expect(createCall).toBeDefined();
            expect(createCall.profile_id).toBe('profile-123');
            expect(createCall.visitor_ip_hash).toBeDefined();
            expect(typeof createCall.visitor_ip_hash).toBe('string');
            expect(createCall.visitor_ip_hash.length).toBe(64); // SHA-256 hash
            expect(createCall.user_agent).toBe(userAgent);
            expect(createCall.referrer).toBe(referrer || null);
            expect(createCall.viewed_at).toBeDefined();
            expect(typeof createCall.viewed_at).toBe('string');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should hash IP addresses before storing (never store plain IP)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.ipV4(),
          async (ipAddress) => {
            // Mock repositories
            const mockCreate = vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            });

            const mockProfileRepo: Partial<IPublicProfileRepository> = {
              findBySlug: vi.fn().mockResolvedValue({
                id: 'profile-123',
                user_id: 'user-123',
                slug: 'test-profile',
              }),
              incrementViewsCount: vi.fn().mockResolvedValue(undefined),
            };

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              create: mockCreate,
            };

            const service = new PublicProfileService(null as any);
            (service as any).profileRepo = mockProfileRepo;
            (service as any).viewsRepo = mockViewsRepo;

            // Track the view
            await service.trackView('test-profile', {
              ipAddress,
              userAgent: 'Mozilla/5.0',
            });

            // Get the stored IP hash
            const createCall = mockCreate.mock.calls[0]?.[0];
            const storedHash = createCall?.visitor_ip_hash;

            // Verify the hash doesn't contain the original IP (Requirement 9.2)
            expect(storedHash).toBeDefined();
            expect(storedHash).not.toContain(ipAddress);
            expect(storedHash).not.toContain(ipAddress.replace(/\./g, ''));
            
            // Verify it's a valid SHA-256 hash
            expect(storedHash).toMatch(/^[0-9a-f]{64}$/);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('CTA click tracking', () => {
    it('should mark cta_clicked as true for any valid view ID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          async (viewId) => {
            // Mock repositories
            const mockUpdateCTAClick = vi.fn().mockResolvedValue(undefined);

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              updateCTAClick: mockUpdateCTAClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).viewsRepo = mockViewsRepo;

            // Track CTA click
            await service.trackCTAClick(viewId);

            // Verify CTA click was recorded (Requirement 9.5)
            expect(mockUpdateCTAClick).toHaveBeenCalledOnce();
            expect(mockUpdateCTAClick).toHaveBeenCalledWith(viewId, true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple CTA clicks for the same view', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.integer({ min: 1, max: 10 }),
          async (viewId, clickCount) => {
            // Mock repositories
            const mockUpdateCTAClick = vi.fn().mockResolvedValue(undefined);

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              updateCTAClick: mockUpdateCTAClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).viewsRepo = mockViewsRepo;

            // Track multiple CTA clicks
            for (let i = 0; i < clickCount; i++) {
              await service.trackCTAClick(viewId);
            }

            // Verify all clicks were recorded
            expect(mockUpdateCTAClick).toHaveBeenCalledTimes(clickCount);
            mockUpdateCTAClick.mock.calls.forEach(call => {
              expect(call[0]).toBe(viewId);
              expect(call[1]).toBe(true);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Social link click tracking', () => {
    it('should record social platform name for any valid platform', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube', 'twitter'),
          async (viewId, platform) => {
            // Mock repositories
            const mockAddSocialClick = vi.fn().mockResolvedValue(undefined);

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              addSocialClick: mockAddSocialClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).viewsRepo = mockViewsRepo;

            // Track social click
            await service.trackSocialClick(viewId, platform);

            // Verify social click was recorded (Requirement 9.6)
            expect(mockAddSocialClick).toHaveBeenCalledOnce();
            expect(mockAddSocialClick).toHaveBeenCalledWith(viewId, platform);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple social link clicks for the same view', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.array(
            fc.constantFrom('instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube'),
            { minLength: 1, maxLength: 6 }
          ),
          async (viewId, platforms) => {
            // Mock repositories
            const mockAddSocialClick = vi.fn().mockResolvedValue(undefined);

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              addSocialClick: mockAddSocialClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).viewsRepo = mockViewsRepo;

            // Track multiple social clicks
            for (const platform of platforms) {
              await service.trackSocialClick(viewId, platform);
            }

            // Verify all clicks were recorded
            expect(mockAddSocialClick).toHaveBeenCalledTimes(platforms.length);
            platforms.forEach((platform, index) => {
              expect(mockAddSocialClick.mock.calls[index]?.[0]).toBe(viewId);
              expect(mockAddSocialClick.mock.calls[index]?.[1]).toBe(platform);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle duplicate social platform clicks', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.constantFrom('instagram', 'facebook', 'pinterest', 'linkedin', 'tiktok', 'youtube'),
          fc.integer({ min: 2, max: 5 }),
          async (viewId, platform, clickCount) => {
            // Mock repositories
            const mockAddSocialClick = vi.fn().mockResolvedValue(undefined);

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              addSocialClick: mockAddSocialClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).viewsRepo = mockViewsRepo;

            // Track the same platform multiple times
            for (let i = 0; i < clickCount; i++) {
              await service.trackSocialClick(viewId, platform);
            }

            // Verify all clicks were recorded (even duplicates)
            expect(mockAddSocialClick).toHaveBeenCalledTimes(clickCount);
            mockAddSocialClick.mock.calls.forEach(call => {
              expect(call[0]).toBe(viewId);
              expect(call[1]).toBe(platform);
            });
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Combined event tracking', () => {
    it('should handle view, CTA click, and social clicks in sequence', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
          fc.ipV4(),
          fc.array(
            fc.constantFrom('instagram', 'facebook', 'pinterest', 'linkedin'),
            { minLength: 0, maxLength: 3 }
          ),
          fc.boolean(),
          async (slug, ipAddress, socialPlatforms, shouldClickCTA) => {
            // Mock repositories
            const viewId = 'view-123';
            const mockCreate = vi.fn().mockResolvedValue({
              id: viewId,
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            });

            const mockUpdateCTAClick = vi.fn().mockResolvedValue(undefined);
            const mockAddSocialClick = vi.fn().mockResolvedValue(undefined);

            const mockProfileRepo: Partial<IPublicProfileRepository> = {
              findBySlug: vi.fn().mockResolvedValue({
                id: 'profile-123',
                user_id: 'user-123',
                slug,
              }),
              incrementViewsCount: vi.fn().mockResolvedValue(undefined),
            };

            const mockViewsRepo: Partial<IProfileViewsRepository> = {
              create: mockCreate,
              updateCTAClick: mockUpdateCTAClick,
              addSocialClick: mockAddSocialClick,
            };

            const service = new PublicProfileService(null as any);
            (service as any).profileRepo = mockProfileRepo;
            (service as any).viewsRepo = mockViewsRepo;

            // 1. Track view
            const returnedViewId = await service.trackView(slug, {
              ipAddress,
              userAgent: 'Mozilla/5.0',
            });

            expect(mockCreate).toHaveBeenCalledOnce();
            expect(returnedViewId).toBe(viewId);

            // 2. Track CTA click if applicable
            if (shouldClickCTA) {
              await service.trackCTAClick(viewId);
              expect(mockUpdateCTAClick).toHaveBeenCalledOnce();
              expect(mockUpdateCTAClick).toHaveBeenCalledWith(viewId, true);
            }

            // 3. Track social clicks
            for (const platform of socialPlatforms) {
              await service.trackSocialClick(viewId, platform);
            }

            expect(mockAddSocialClick).toHaveBeenCalledTimes(socialPlatforms.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Feature: public-photographer-profile, Property 15: Incrémentation du compteur de vues
 * 
 * **Validates: Requirements 9.3**
 * 
 * For any profile visit, the views_count field of the profile must be incremented by 1.
 */
describe('Property 15: Incrémentation du compteur de vues', () => {
  it('should increment views_count by 1 for every profile visit', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        fc.ipV4(),
        async (slug, ipAddress) => {
          // Mock repositories
          const mockIncrementViewsCount = vi.fn().mockResolvedValue(undefined);

          const mockProfileRepo: Partial<IPublicProfileRepository> = {
            findBySlug: vi.fn().mockResolvedValue({
              id: 'profile-123',
              user_id: 'user-123',
              slug,
              views_count: 0,
            }),
            incrementViewsCount: mockIncrementViewsCount,
          };

          const mockViewsRepo: Partial<IProfileViewsRepository> = {
            create: vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            }),
          };

          const service = new PublicProfileService(null as any);
          (service as any).profileRepo = mockProfileRepo;
          (service as any).viewsRepo = mockViewsRepo;

          // Track a view
          await service.trackView(slug, {
            ipAddress,
            userAgent: 'Mozilla/5.0',
          });

          // Verify views_count was incremented (Requirement 9.3)
          expect(mockIncrementViewsCount).toHaveBeenCalledOnce();
          expect(mockIncrementViewsCount).toHaveBeenCalledWith('profile-123');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should increment views_count for multiple visits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        fc.array(fc.ipV4(), { minLength: 1, maxLength: 10 }),
        async (slug, ipAddresses) => {
          // Mock repositories
          const mockIncrementViewsCount = vi.fn().mockResolvedValue(undefined);

          const mockProfileRepo: Partial<IPublicProfileRepository> = {
            findBySlug: vi.fn().mockResolvedValue({
              id: 'profile-123',
              user_id: 'user-123',
              slug,
              views_count: 0,
            }),
            incrementViewsCount: mockIncrementViewsCount,
          };

          const mockViewsRepo: Partial<IProfileViewsRepository> = {
            create: vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            }),
          };

          const service = new PublicProfileService(null as any);
          (service as any).profileRepo = mockProfileRepo;
          (service as any).viewsRepo = mockViewsRepo;

          // Track multiple views
          for (const ipAddress of ipAddresses) {
            await service.trackView(slug, {
              ipAddress,
              userAgent: 'Mozilla/5.0',
            });
          }

          // Verify views_count was incremented for each visit
          expect(mockIncrementViewsCount).toHaveBeenCalledTimes(ipAddresses.length);
          mockIncrementViewsCount.mock.calls.forEach(call => {
            expect(call[0]).toBe('profile-123');
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should increment views_count even when same IP visits multiple times', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        fc.ipV4(),
        fc.integer({ min: 2, max: 5 }),
        async (slug, ipAddress, visitCount) => {
          // Mock repositories
          const mockIncrementViewsCount = vi.fn().mockResolvedValue(undefined);

          const mockProfileRepo: Partial<IPublicProfileRepository> = {
            findBySlug: vi.fn().mockResolvedValue({
              id: 'profile-123',
              user_id: 'user-123',
              slug,
              views_count: 0,
            }),
            incrementViewsCount: mockIncrementViewsCount,
          };

          const mockViewsRepo: Partial<IProfileViewsRepository> = {
            create: vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            }),
          };

          const service = new PublicProfileService(null as any);
          (service as any).profileRepo = mockProfileRepo;
          (service as any).viewsRepo = mockViewsRepo;

          // Track the same IP multiple times
          for (let i = 0; i < visitCount; i++) {
            await service.trackView(slug, {
              ipAddress,
              userAgent: 'Mozilla/5.0',
            });
          }

          // Verify views_count was incremented for each visit (no deduplication)
          expect(mockIncrementViewsCount).toHaveBeenCalledTimes(visitCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should increment views_count atomically (each call increments by exactly 1)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        fc.ipV4(),
        async (slug, ipAddress) => {
          // Mock repositories with a counter to simulate actual increment
          let currentCount = 0;
          const mockIncrementViewsCount = vi.fn().mockImplementation(() => {
            currentCount += 1;
            return Promise.resolve();
          });

          const mockProfileRepo: Partial<IPublicProfileRepository> = {
            findBySlug: vi.fn().mockResolvedValue({
              id: 'profile-123',
              user_id: 'user-123',
              slug,
              views_count: currentCount,
            }),
            incrementViewsCount: mockIncrementViewsCount,
          };

          const mockViewsRepo: Partial<IProfileViewsRepository> = {
            create: vi.fn().mockResolvedValue({
              id: 'view-123',
              profile_id: 'profile-123',
              visitor_ip_hash: 'hashed-ip',
              user_agent: 'Mozilla/5.0',
              viewed_at: new Date().toISOString(),
            }),
          };

          const service = new PublicProfileService(null as any);
          (service as any).profileRepo = mockProfileRepo;
          (service as any).viewsRepo = mockViewsRepo;

          const initialCount = currentCount;

          // Track a view
          await service.trackView(slug, {
            ipAddress,
            userAgent: 'Mozilla/5.0',
          });

          // Verify count increased by exactly 1
          expect(currentCount).toBe(initialCount + 1);
          expect(mockIncrementViewsCount).toHaveBeenCalledOnce();
        }
      ),
      { numRuns: 100 }
    );
  });
});
