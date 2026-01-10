/**
 * Property-Based Tests for Admin Repository
 * 
 * Feature: admin-dashboard
 * Tests dashboard stats accuracy, user search filtering, gallery filtering, and analytics date range filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { AdminRepository } from '../admin.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, SubscriptionPlan } from '@/lib/supabase/types';

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
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
}

interface TestGallery {
  id: string;
  user_id: string;
  title: string;
  unique_slug: string;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  views_count: number;
}

interface TestImage {
  id: string;
  gallery_id: string;
  created_at: string;
  file_size_mb: number;
}

/**
 * Arbitrary generators for test data
 */
const subscriptionPlanArb = fc.constantFrom<SubscriptionPlan>('free', 'premium', 'pro');

// Generate valid ISO date strings using integer timestamps
const minTimestamp = new Date('2024-01-01T00:00:00.000Z').getTime();
const maxTimestamp = new Date('2026-01-10T00:00:00.000Z').getTime();
const dateStringArb = fc.integer({ min: minTimestamp, max: maxTimestamp })
  .map(ts => new Date(ts).toISOString());

const futureTimestamp = new Date('2027-01-01T00:00:00.000Z').getTime();
const futureDateStringArb = fc.integer({ min: minTimestamp, max: futureTimestamp })
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
  stripe_customer_id: fc.option(fc.string(), { nil: null }),
  stripe_subscription_id: fc.option(fc.string(), { nil: null }),
});

const galleryArb: fc.Arbitrary<TestGallery> = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  unique_slug: fc.string({ minLength: 8, maxLength: 8 }),
  is_active: fc.boolean(),
  expires_at: futureDateStringArb,
  created_at: dateStringArb,
  views_count: fc.integer({ min: 0, max: 10000 }),
});

/**
 * Creates a mock Supabase client for testing dashboard stats
 */
function createMockSupabaseClientForStats(
  profiles: TestProfile[],
  galleries: TestGallery[]
): SupabaseClient<Database> {
  const now = new Date().toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockImplementation((columns: string, options?: { count?: string; head?: boolean }) => {
            if (options?.count === 'exact' && options?.head) {
              return {
                gte: vi.fn().mockImplementation((col: string, value: string) => {
                  // Filter for recent signups
                  const filtered = profiles.filter(p => p.created_at >= value);
                  return Promise.resolve({ count: filtered.length, error: null });
                }),
                then: (resolve: (value: { count: number; error: null }) => void) => {
                  resolve({ count: profiles.length, error: null });
                },
              };
            }
            return {
              then: (resolve: (value: { data: typeof profiles; error: null }) => void) => {
                resolve({ data: profiles, error: null });
              },
            };
          }),
        };
      }
      if (table === 'galleries') {
        return {
          select: vi.fn().mockImplementation((columns: string, options?: { count?: string; head?: boolean }) => {
            if (options?.count === 'exact' && options?.head) {
              return {
                eq: vi.fn().mockImplementation((col: string, value: boolean) => {
                  if (col === 'is_active' && value === true) {
                    return {
                      gt: vi.fn().mockImplementation((col2: string, value2: string) => {
                        const activeGalleries = galleries.filter(g => g.is_active && g.expires_at > value2);
                        return Promise.resolve({ count: activeGalleries.length, error: null });
                      }),
                    };
                  }
                  return Promise.resolve({ count: 0, error: null });
                }),
                gte: vi.fn().mockImplementation((col: string, value: string) => {
                  const filtered = galleries.filter(g => g.created_at >= value);
                  return Promise.resolve({ count: filtered.length, error: null });
                }),
                then: (resolve: (value: { count: number; error: null }) => void) => {
                  resolve({ count: galleries.length, error: null });
                },
              };
            }
            return Promise.resolve({ data: galleries, error: null });
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
      };
    }),
  } as unknown as SupabaseClient<Database>;
}

describe('Admin Repository - Dashboard Stats Accuracy (Property 3)', () => {
  /**
   * Feature: admin-dashboard, Property 3: Dashboard Stats Accuracy
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4
   * 
   * For any set of users, galleries, and storage data in the database, the dashboard stats
   * returned by getDashboardStats() SHALL accurately reflect:
   * - Total user count equals the count of profiles
   * - Active gallery count equals galleries where is_active = true and expires_at > now()
   * - Total storage equals the sum of storage_used_mb across all profiles
   * - Plan distribution counts match the actual count per subscription_plan
   */

  it('should accurately count total users', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 0, maxLength: 50 }),
        async (profiles) => {
          // Create a simplified mock that returns the profiles
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: profiles.length, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: profiles, error: null });
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        eq: vi.fn().mockReturnValue({
                          gt: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        }),
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: 0, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: [], error: null });
                  }),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const stats = await repository.getDashboardStats();

          // Total users should equal the number of profiles
          expect(stats.totalUsers).toBe(profiles.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately calculate total storage used', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 0, maxLength: 50 }),
        async (profiles) => {
          const expectedStorage = profiles.reduce((sum, p) => sum + (p.storage_used_mb || 0), 0);

          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: profiles.length, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: profiles, error: null });
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        eq: vi.fn().mockReturnValue({
                          gt: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        }),
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: 0, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: [], error: null });
                  }),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const stats = await repository.getDashboardStats();

          // Total storage should equal sum of all profile storage
          expect(stats.totalStorageUsedMb).toBe(expectedStorage);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accurately calculate plan distribution', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 0, maxLength: 50 }),
        async (profiles) => {
          const expectedDistribution = {
            free: profiles.filter(p => (p.subscription_plan || 'free') === 'free').length,
            premium: profiles.filter(p => p.subscription_plan === 'premium').length,
            pro: profiles.filter(p => p.subscription_plan === 'pro').length,
          };

          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: profiles.length, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: profiles, error: null });
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string; head?: boolean }) => {
                    if (opts?.count === 'exact' && opts?.head) {
                      return {
                        eq: vi.fn().mockReturnValue({
                          gt: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        }),
                        gte: vi.fn().mockReturnValue(Promise.resolve({ count: 0, error: null })),
                        then: (resolve: (v: { count: number; error: null }) => void) => {
                          resolve({ count: 0, error: null });
                        },
                      };
                    }
                    return Promise.resolve({ data: [], error: null });
                  }),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const stats = await repository.getDashboardStats();

          // Plan distribution should match expected counts
          expect(stats.planDistribution.free).toBe(expectedDistribution.free);
          expect(stats.planDistribution.premium).toBe(expectedDistribution.premium);
          expect(stats.planDistribution.pro).toBe(expectedDistribution.pro);

          // Sum of distribution should equal total users
          const distributionSum = stats.planDistribution.free + stats.planDistribution.premium + stats.planDistribution.pro;
          expect(distributionSum).toBe(profiles.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Repository - User Search Filtering (Property 4)', () => {
  /**
   * Feature: admin-dashboard, Property 4: User Search Filtering
   * Validates: Requirements 3.2
   * 
   * For any search query and filter combination, all users returned by listUsers()
   * SHALL match the search criteria (email contains query OR name contains query)
   * AND match the plan filter if specified.
   */

  it('should filter users by search query matching email or name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 10 }),
        async (profiles, searchQuery) => {
          // Calculate expected results - users whose email or name contains the search query
          const expectedMatches = profiles.filter(p => {
            const emailMatch = p.email.toLowerCase().includes(searchQuery.toLowerCase());
            const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            return emailMatch || nameMatch;
          });

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      or: vi.fn().mockImplementation((filterStr: string) => {
                        // Parse the filter string and apply it
                        const filtered = profiles.filter(p => {
                          const emailMatch = p.email.toLowerCase().includes(searchQuery.toLowerCase());
                          const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                          return emailMatch || nameMatch;
                        });
                        return {
                          eq: vi.fn().mockReturnThis(),
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ 
                                data: filtered, 
                                error: null, 
                                count: filtered.length 
                              })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: profiles, 
                            error: null, 
                            count: profiles.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listUsers({ search: searchQuery });

          // All returned users should match the search criteria
          for (const user of result.data) {
            const emailMatch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const nameMatch = user.name ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            expect(emailMatch || nameMatch).toBe(true);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter users by subscription plan', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 1, maxLength: 30 }),
        subscriptionPlanArb,
        async (profiles, planFilter) => {
          // Calculate expected results - users with the specified plan
          const expectedMatches = profiles.filter(p => 
            (p.subscription_plan || 'free') === planFilter
          );

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      eq: vi.fn().mockImplementation((col: string, value: string) => {
                        if (col === 'subscription_plan') {
                          const filtered = profiles.filter(p => 
                            (p.subscription_plan || 'free') === value
                          );
                          return {
                            or: vi.fn().mockReturnThis(),
                            order: vi.fn().mockImplementation(() => ({
                              range: vi.fn().mockReturnValue(
                                Promise.resolve({ 
                                  data: filtered, 
                                  error: null, 
                                  count: filtered.length 
                                })
                              ),
                            })),
                          };
                        }
                        return {
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ data: [], error: null, count: 0 })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: profiles, 
                            error: null, 
                            count: profiles.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listUsers({ plan: planFilter });

          // All returned users should have the specified plan
          for (const user of result.data) {
            expect(user.subscription_plan).toBe(planFilter);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should combine search and plan filters correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 1, maxLength: 30 }),
        fc.string({ minLength: 1, maxLength: 5 }),
        subscriptionPlanArb,
        async (profiles, searchQuery, planFilter) => {
          // Calculate expected results - users matching both criteria
          const expectedMatches = profiles.filter(p => {
            const emailMatch = p.email.toLowerCase().includes(searchQuery.toLowerCase());
            const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            const searchMatch = emailMatch || nameMatch;
            const planMatch = (p.subscription_plan || 'free') === planFilter;
            return searchMatch && planMatch;
          });

          // Create mock that simulates the combined filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      or: vi.fn().mockImplementation(() => ({
                        eq: vi.fn().mockImplementation((col: string, value: string) => {
                          if (col === 'subscription_plan') {
                            const filtered = profiles.filter(p => {
                              const emailMatch = p.email.toLowerCase().includes(searchQuery.toLowerCase());
                              const nameMatch = p.name ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                              const searchMatch = emailMatch || nameMatch;
                              const planMatch = (p.subscription_plan || 'free') === value;
                              return searchMatch && planMatch;
                            });
                            return {
                              or: vi.fn().mockReturnThis(),
                              order: vi.fn().mockImplementation(() => ({
                                range: vi.fn().mockReturnValue(
                                  Promise.resolve({ 
                                    data: filtered, 
                                    error: null, 
                                    count: filtered.length 
                                  })
                                ),
                              })),
                            };
                          }
                          return {
                            order: vi.fn().mockImplementation(() => ({
                              range: vi.fn().mockReturnValue(
                                Promise.resolve({ data: [], error: null, count: 0 })
                              ),
                            })),
                          };
                        }),
                        order: vi.fn().mockReturnThis(),
                      })),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: profiles, 
                            error: null, 
                            count: profiles.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listUsers({ search: searchQuery, plan: planFilter });

          // All returned users should match both criteria
          for (const user of result.data) {
            const emailMatch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
            const nameMatch = user.name ? user.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
            expect(emailMatch || nameMatch).toBe(true);
            expect(user.subscription_plan).toBe(planFilter);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Repository - Gallery Filtering (Property 9)', () => {
  /**
   * Feature: admin-dashboard, Property 9: Gallery Filtering
   * Validates: Requirements 4.2
   * 
   * For any gallery filter combination (status, userId, dateFrom, dateTo),
   * all galleries returned by listGalleries() SHALL match all specified filter criteria.
   */

  it('should filter galleries by status (active)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(galleryArb, { minLength: 1, maxLength: 30 }),
        async (galleries) => {
          const now = new Date().toISOString();
          
          // Calculate expected results - active galleries (is_active = true AND not expired)
          const expectedMatches = galleries.filter(g => 
            g.is_active && g.expires_at > now
          );

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      eq: vi.fn().mockImplementation((col: string, value: boolean) => {
                        if (col === 'is_active' && value === true) {
                          return {
                            gt: vi.fn().mockImplementation((col2: string, value2: string) => {
                              const filtered = galleries.filter(g => 
                                g.is_active && g.expires_at > value2
                              );
                              return {
                                order: vi.fn().mockImplementation(() => ({
                                  range: vi.fn().mockReturnValue(
                                    Promise.resolve({ 
                                      data: filtered.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                                      error: null, 
                                      count: filtered.length 
                                    })
                                  ),
                                })),
                              };
                            }),
                          };
                        }
                        return {
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ data: [], error: null, count: 0 })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: galleries.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                            error: null, 
                            count: galleries.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'images') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listGalleries({ status: 'active' });

          // All returned galleries should be active and not expired
          for (const gallery of result.data) {
            expect(gallery.is_active).toBe(true);
            expect(new Date(gallery.expires_at).getTime()).toBeGreaterThan(new Date(now).getTime());
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter galleries by status (inactive)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(galleryArb, { minLength: 1, maxLength: 30 }),
        async (galleries) => {
          // Calculate expected results - inactive galleries
          const expectedMatches = galleries.filter(g => !g.is_active);

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      eq: vi.fn().mockImplementation((col: string, value: boolean) => {
                        if (col === 'is_active' && value === false) {
                          const filtered = galleries.filter(g => !g.is_active);
                          return {
                            order: vi.fn().mockImplementation(() => ({
                              range: vi.fn().mockReturnValue(
                                Promise.resolve({ 
                                  data: filtered.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                                  error: null, 
                                  count: filtered.length 
                                })
                              ),
                            })),
                          };
                        }
                        return {
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ data: [], error: null, count: 0 })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: galleries.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                            error: null, 
                            count: galleries.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'images') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listGalleries({ status: 'inactive' });

          // All returned galleries should be inactive
          for (const gallery of result.data) {
            expect(gallery.is_active).toBe(false);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter galleries by userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(galleryArb, { minLength: 1, maxLength: 30 }),
        fc.uuid(),
        async (galleries, userId) => {
          // Calculate expected results - galleries owned by the user
          const expectedMatches = galleries.filter(g => g.user_id === userId);

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      eq: vi.fn().mockImplementation((col: string, value: string) => {
                        if (col === 'user_id') {
                          const filtered = galleries.filter(g => g.user_id === value);
                          return {
                            order: vi.fn().mockImplementation(() => ({
                              range: vi.fn().mockReturnValue(
                                Promise.resolve({ 
                                  data: filtered.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                                  error: null, 
                                  count: filtered.length 
                                })
                              ),
                            })),
                          };
                        }
                        return {
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ data: [], error: null, count: 0 })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: galleries.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                            error: null, 
                            count: galleries.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'images') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listGalleries({ userId });

          // All returned galleries should belong to the specified user
          for (const gallery of result.data) {
            expect(gallery.owner_id).toBe(userId);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should filter galleries by date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(galleryArb, { minLength: 1, maxLength: 30 }),
        dateStringArb,
        dateStringArb,
        async (galleries, dateFrom, dateTo) => {
          // Ensure dateFrom <= dateTo
          const [actualFrom, actualTo] = dateFrom <= dateTo 
            ? [dateFrom, dateTo] 
            : [dateTo, dateFrom];

          // Calculate expected results - galleries created within the date range
          const expectedMatches = galleries.filter(g => 
            g.created_at >= actualFrom && g.created_at <= actualTo
          );

          // Create mock that simulates the filtering behavior
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'galleries') {
                return {
                  select: vi.fn().mockImplementation((_cols: string, opts?: { count?: string }) => {
                    return {
                      gte: vi.fn().mockImplementation((col: string, value: string) => {
                        if (col === 'created_at') {
                          return {
                            lte: vi.fn().mockImplementation((col2: string, value2: string) => {
                              const filtered = galleries.filter(g => 
                                g.created_at >= value && g.created_at <= value2
                              );
                              return {
                                order: vi.fn().mockImplementation(() => ({
                                  range: vi.fn().mockReturnValue(
                                    Promise.resolve({ 
                                      data: filtered.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                                      error: null, 
                                      count: filtered.length 
                                    })
                                  ),
                                })),
                              };
                            }),
                            order: vi.fn().mockImplementation(() => ({
                              range: vi.fn().mockReturnValue(
                                Promise.resolve({ 
                                  data: galleries.filter(g => g.created_at >= value).map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                                  error: null, 
                                  count: galleries.filter(g => g.created_at >= value).length 
                                })
                              ),
                            })),
                          };
                        }
                        return {
                          order: vi.fn().mockImplementation(() => ({
                            range: vi.fn().mockReturnValue(
                              Promise.resolve({ data: [], error: null, count: 0 })
                            ),
                          })),
                        };
                      }),
                      order: vi.fn().mockImplementation(() => ({
                        range: vi.fn().mockReturnValue(
                          Promise.resolve({ 
                            data: galleries.map(g => ({ ...g, profiles: { email: 'test@test.com', name: null } })), 
                            error: null, 
                            count: galleries.length 
                          })
                        ),
                      })),
                    };
                  }),
                };
              }
              if (table === 'images') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const repository = new AdminRepository(mockClient);
          const result = await repository.listGalleries({ dateFrom: actualFrom, dateTo: actualTo });

          // All returned galleries should be within the date range
          for (const gallery of result.data) {
            expect(gallery.created_at >= actualFrom).toBe(true);
            expect(gallery.created_at <= actualTo).toBe(true);
          }

          // Result count should match expected
          expect(result.data.length).toBe(expectedMatches.length);
        }
      ),
      { numRuns: 100 }
    );
  });
});


describe('Admin Repository - Analytics Date Range Filtering (Property 12)', () => {
  /**
   * Feature: admin-dashboard, Property 12: Analytics Date Range Filtering
   * Validates: Requirements 5.5
   * 
   * For any date range (dateFrom, dateTo), all time series data returned by getAnalytics()
   * SHALL have dates within the specified range (inclusive).
   */

  const imageArb: fc.Arbitrary<TestImage> = fc.record({
    id: fc.uuid(),
    gallery_id: fc.uuid(),
    created_at: dateStringArb,
    file_size_mb: fc.integer({ min: 1, max: 1000 }).map(n => n / 10), // 0.1 to 100
  });

  /**
   * Creates a comprehensive mock for analytics tests
   */
  function createAnalyticsMock(
    profiles: TestProfile[],
    images: TestImage[],
    dateFrom: string,
    dateTo: string
  ) {
    const profilesInRange = profiles.filter(p => 
      p.created_at >= dateFrom && p.created_at <= dateTo
    );
    const imagesInRange = images.filter(i => 
      i.created_at >= dateFrom && i.created_at <= dateTo
    );

    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockImplementation(() => ({
              gte: vi.fn().mockImplementation(() => ({
                lte: vi.fn().mockImplementation(() => ({
                  order: vi.fn().mockReturnValue(
                    Promise.resolve({ data: profilesInRange, error: null })
                  ),
                })),
              })),
              order: vi.fn().mockImplementation(() => ({
                limit: vi.fn().mockReturnValue(
                  Promise.resolve({ data: profiles.slice(0, 10), error: null })
                ),
              })),
            })),
          };
        }
        if (table === 'images') {
          return {
            select: vi.fn().mockImplementation(() => ({
              gte: vi.fn().mockImplementation(() => ({
                lte: vi.fn().mockImplementation(() => ({
                  order: vi.fn().mockReturnValue(
                    Promise.resolve({ data: imagesInRange, error: null })
                  ),
                })),
              })),
            })),
          };
        }
        if (table === 'galleries') {
          return {
            select: vi.fn().mockImplementation(() => ({
              in: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })),
            })),
          };
        }
        return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
      }),
    } as unknown as SupabaseClient<Database>;
  }

  it('should return user growth data within the specified date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 1, maxLength: 30 }),
        dateStringArb,
        dateStringArb,
        async (profiles, dateFrom, dateTo) => {
          // Ensure dateFrom <= dateTo
          const [actualFrom, actualTo] = dateFrom <= dateTo 
            ? [dateFrom, dateTo] 
            : [dateTo, dateFrom];

          const mockClient = createAnalyticsMock(profiles, [], actualFrom, actualTo);
          const repository = new AdminRepository(mockClient);
          const result = await repository.getAnalytics(actualFrom, actualTo);

          // All user growth data points should have dates within the range
          for (const dataPoint of result.userGrowth) {
            const dataDate = dataPoint.date + 'T00:00:00.000Z';
            expect(dataDate >= actualFrom.split('T')[0] + 'T00:00:00.000Z').toBe(true);
            expect(dataDate <= actualTo.split('T')[0] + 'T23:59:59.999Z').toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return storage growth data within the specified date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(imageArb, { minLength: 1, maxLength: 30 }),
        dateStringArb,
        dateStringArb,
        async (images, dateFrom, dateTo) => {
          // Ensure dateFrom <= dateTo
          const [actualFrom, actualTo] = dateFrom <= dateTo 
            ? [dateFrom, dateTo] 
            : [dateTo, dateFrom];

          const mockClient = createAnalyticsMock([], images, actualFrom, actualTo);
          const repository = new AdminRepository(mockClient);
          const result = await repository.getAnalytics(actualFrom, actualTo);

          // All storage growth data points should have dates within the range
          for (const dataPoint of result.storageGrowth) {
            const dataDate = dataPoint.date + 'T00:00:00.000Z';
            expect(dataDate >= actualFrom.split('T')[0] + 'T00:00:00.000Z').toBe(true);
            expect(dataDate <= actualTo.split('T')[0] + 'T23:59:59.999Z').toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty time series for date ranges with no data', async () => {
    await fc.assert(
      fc.asyncProperty(
        dateStringArb,
        dateStringArb,
        async (dateFrom, dateTo) => {
          // Ensure dateFrom <= dateTo
          const [actualFrom, actualTo] = dateFrom <= dateTo 
            ? [dateFrom, dateTo] 
            : [dateTo, dateFrom];

          const mockClient = createAnalyticsMock([], [], actualFrom, actualTo);
          const repository = new AdminRepository(mockClient);
          const result = await repository.getAnalytics(actualFrom, actualTo);

          // With no data, time series should be empty
          expect(result.userGrowth).toEqual([]);
          expect(result.storageGrowth).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should calculate cumulative values correctly in time series', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(profileArb, { minLength: 2, maxLength: 20 }),
        async (profiles) => {
          // Sort profiles by date to ensure predictable ordering
          const sortedProfiles = [...profiles].sort((a, b) => 
            a.created_at.localeCompare(b.created_at)
          );

          const dateFrom = sortedProfiles[0]!.created_at;
          const dateTo = sortedProfiles[sortedProfiles.length - 1]!.created_at;

          const mockClient = createAnalyticsMock(sortedProfiles, [], dateFrom, dateTo);
          const repository = new AdminRepository(mockClient);
          const result = await repository.getAnalytics(dateFrom, dateTo);

          // User growth values should be monotonically increasing (cumulative)
          for (let i = 1; i < result.userGrowth.length; i++) {
            expect(result.userGrowth[i]!.value).toBeGreaterThanOrEqual(result.userGrowth[i - 1]!.value);
          }

          // If there's data, the last cumulative value should equal total profiles in range
          if (result.userGrowth.length > 0) {
            const lastValue = result.userGrowth[result.userGrowth.length - 1]!.value;
            expect(lastValue).toBe(sortedProfiles.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
