/**
 * Property-Based Tests for Rate Limiter Service
 * 
 * Feature: nextjs-migration, Property 10: Rate Limiting Enforcement
 * Validates: Requirements 4.8
 * 
 * Tests that:
 * - For any IP/gallery combination, after 5 failed password attempts within 15 minutes,
 *   subsequent attempts SHALL be blocked until the window expires.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { RateLimiterService, getRateLimitConfig } from '@/lib/services/rate-limiter.service';
import type { RateLimitResult } from '@/types';

// Rate limit configuration constants
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Arbitrary for generating IP addresses
const ipAddressArb = fc.tuple(
  fc.integer({ min: 1, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 }),
  fc.integer({ min: 0, max: 255 })
).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`);

// Arbitrary for generating gallery slugs
const gallerySlugArb = fc.stringMatching(/^[a-z0-9-]{5,20}$/);

// Arbitrary for generating rate limit keys
const rateLimitKeyArb = fc.tuple(ipAddressArb, gallerySlugArb)
  .map(([ip, slug]) => `${ip}:${slug}`);

/**
 * Creates a mock Supabase client for testing
 */
function createMockSupabase(initialData: Map<string, { id: string; attempts: number; expires_at: string }> = new Map()) {
  const data = new Map(initialData);
  let idCounter = 1;

  return {
    from: vi.fn((table: string) => {
      if (table !== 'rate_limit_attempts') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn(() => ({
          eq: vi.fn((field: string, value: string) => ({
            maybeSingle: vi.fn(async () => {
              if (field === 'key') {
                const entry = data.get(value);
                return { data: entry || null, error: null };
              }
              return { data: null, error: null };
            }),
          })),
        })),
        insert: vi.fn(async (record: any) => {
          const id = `id-${idCounter++}`;
          data.set(record.key, {
            id,
            attempts: record.attempts,
            expires_at: record.expires_at,
          });
          return { error: null };
        }),
        update: vi.fn((updates: any) => ({
          eq: vi.fn(async (field: string, value: string) => {
            if (field === 'id') {
              // Find entry by id and update
              for (const [key, entry] of data.entries()) {
                if (entry.id === value) {
                  data.set(key, { ...entry, ...updates });
                  break;
                }
              }
            }
            return { error: null };
          }),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(async (field: string, value: string) => {
            if (field === 'key') {
              data.delete(value);
            } else if (field === 'id') {
              // Find and delete by id
              for (const [key, entry] of data.entries()) {
                if (entry.id === value) {
                  data.delete(key);
                  break;
                }
              }
            }
            return { error: null };
          }),
        })),
      };
    }),
    _getData: () => data, // Helper for testing
  } as any;
}

describe('Rate Limiter Service - Rate Limiting Enforcement (Property 10)', () => {
  /**
   * Feature: nextjs-migration, Property 10: Rate Limiting Enforcement
   * Validates: Requirements 4.8
   */

  describe('Configuration', () => {
    it('should have correct rate limit configuration', () => {
      const config = getRateLimitConfig();
      
      expect(config.maxAttempts).toBe(5);
      expect(config.windowMs).toBe(15 * 60 * 1000);
      expect(config.windowMinutes).toBe(15);
    });
  });

  describe('Key Generation', () => {
    it('should generate unique keys for different IP/gallery combinations', () => {
      fc.assert(
        fc.property(
          ipAddressArb,
          ipAddressArb,
          gallerySlugArb,
          gallerySlugArb,
          (ip1, ip2, slug1, slug2) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            const key1 = service.generateKey(ip1, slug1);
            const key2 = service.generateKey(ip2, slug2);
            
            // Keys should be different if either IP or slug is different
            if (ip1 !== ip2 || slug1 !== slug2) {
              expect(key1).not.toBe(key2);
            } else {
              expect(key1).toBe(key2);
            }
            
            // Key format should be ip:slug
            expect(key1).toBe(`${ip1}:${slug1}`);
            expect(key2).toBe(`${ip2}:${slug2}`);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('First Attempt Behavior', () => {
    it('should allow first attempt for any key and return MAX_ATTEMPTS - 1 remaining', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          async (key) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            const result = await service.checkRateLimit(key);
            
            // First attempt should always be allowed
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(MAX_ATTEMPTS - 1);
            expect(result.retryAfterSeconds).toBeUndefined();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Attempt Counting', () => {
    it('should decrement remaining attempts with each check', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          fc.integer({ min: 1, max: MAX_ATTEMPTS - 1 }),
          async (key, attemptCount) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            let lastResult: RateLimitResult | null = null;
            
            // Make attemptCount attempts
            for (let i = 0; i < attemptCount; i++) {
              lastResult = await service.checkRateLimit(key);
            }
            
            // After attemptCount attempts, remaining should be MAX_ATTEMPTS - attemptCount
            expect(lastResult!.allowed).toBe(true);
            expect(lastResult!.remainingAttempts).toBe(MAX_ATTEMPTS - attemptCount);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Rate Limit Blocking', () => {
    it('should block after exactly MAX_ATTEMPTS attempts', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          async (key) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            // Make MAX_ATTEMPTS attempts (all should be allowed)
            for (let i = 0; i < MAX_ATTEMPTS; i++) {
              const result = await service.checkRateLimit(key);
              expect(result.allowed).toBe(true);
            }
            
            // The next attempt should be blocked
            const blockedResult = await service.checkRateLimit(key);
            
            expect(blockedResult.allowed).toBe(false);
            expect(blockedResult.remainingAttempts).toBe(0);
            expect(blockedResult.retryAfterSeconds).toBeDefined();
            expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
            expect(blockedResult.retryAfterSeconds).toBeLessThanOrEqual(15 * 60); // Max 15 minutes
          }
        ),
        { numRuns: 30 }
      );
    });

    it('should continue blocking after MAX_ATTEMPTS until window expires', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          fc.integer({ min: 1, max: 10 }),
          async (key, extraAttempts) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            // Exhaust all attempts
            for (let i = 0; i < MAX_ATTEMPTS; i++) {
              await service.checkRateLimit(key);
            }
            
            // Make additional attempts - all should be blocked
            for (let i = 0; i < extraAttempts; i++) {
              const result = await service.checkRateLimit(key);
              
              expect(result.allowed).toBe(false);
              expect(result.remainingAttempts).toBe(0);
              expect(result.retryAfterSeconds).toBeDefined();
            }
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Independent Rate Limiting', () => {
    it('should track rate limits independently for different keys', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          rateLimitKeyArb,
          async (key1, key2) => {
            // Ensure keys are different
            fc.pre(key1 !== key2);
            
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            // Exhaust attempts for key1
            for (let i = 0; i < MAX_ATTEMPTS; i++) {
              await service.checkRateLimit(key1);
            }
            
            // key1 should be blocked
            const key1Result = await service.checkRateLimit(key1);
            expect(key1Result.allowed).toBe(false);
            
            // key2 should still be allowed (first attempt)
            const key2Result = await service.checkRateLimit(key2);
            expect(key2Result.allowed).toBe(true);
            expect(key2Result.remainingAttempts).toBe(MAX_ATTEMPTS - 1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Rate Limit Reset', () => {
    it('should allow attempts after reset for any key', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          async (key) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            // Exhaust all attempts
            for (let i = 0; i < MAX_ATTEMPTS; i++) {
              await service.checkRateLimit(key);
            }
            
            // Verify blocked
            const blockedResult = await service.checkRateLimit(key);
            expect(blockedResult.allowed).toBe(false);
            
            // Reset the rate limit
            await service.resetRateLimit(key);
            
            // Should be allowed again
            const afterResetResult = await service.checkRateLimit(key);
            expect(afterResetResult.allowed).toBe(true);
            expect(afterResetResult.remainingAttempts).toBe(MAX_ATTEMPTS - 1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Window Expiration', () => {
    it('should allow attempts after window expires', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          async (key) => {
            // Create mock with an expired entry
            const expiredTime = new Date(Date.now() - 1000).toISOString(); // 1 second ago
            const initialData = new Map([
              [key, { id: 'expired-id', attempts: MAX_ATTEMPTS, expires_at: expiredTime }]
            ]);
            
            const mockSupabase = createMockSupabase(initialData);
            const service = new RateLimiterService(mockSupabase);
            
            // Even though attempts were exhausted, expired entry should be reset
            const result = await service.checkRateLimit(key);
            
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(MAX_ATTEMPTS - 1);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Retry-After Header Value', () => {
    it('should return valid retryAfterSeconds when blocked', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          async (key) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            // Exhaust all attempts
            for (let i = 0; i < MAX_ATTEMPTS; i++) {
              await service.checkRateLimit(key);
            }
            
            // Get blocked result
            const result = await service.checkRateLimit(key);
            
            expect(result.allowed).toBe(false);
            expect(result.retryAfterSeconds).toBeDefined();
            
            // retryAfterSeconds should be positive and not exceed window duration
            expect(result.retryAfterSeconds).toBeGreaterThan(0);
            expect(result.retryAfterSeconds).toBeLessThanOrEqual(WINDOW_MS / 1000);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Invariants', () => {
    it('should maintain invariant: remainingAttempts + usedAttempts = MAX_ATTEMPTS', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          fc.integer({ min: 1, max: MAX_ATTEMPTS }),
          async (key, attemptCount) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            let result: RateLimitResult | null = null;
            
            for (let i = 0; i < attemptCount; i++) {
              result = await service.checkRateLimit(key);
            }
            
            // After attemptCount attempts:
            // - If still allowed: remainingAttempts = MAX_ATTEMPTS - attemptCount
            // - If blocked: remainingAttempts = 0
            if (result!.allowed) {
              expect(result!.remainingAttempts! + attemptCount).toBe(MAX_ATTEMPTS);
            } else {
              expect(result!.remainingAttempts).toBe(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should maintain invariant: blocked implies remainingAttempts = 0', async () => {
      await fc.assert(
        fc.asyncProperty(
          rateLimitKeyArb,
          // Need more than MAX_ATTEMPTS to trigger blocking (6th attempt is blocked)
          fc.integer({ min: MAX_ATTEMPTS + 1, max: MAX_ATTEMPTS + 5 }),
          async (key, attemptCount) => {
            const mockSupabase = createMockSupabase();
            const service = new RateLimiterService(mockSupabase);
            
            let result: RateLimitResult | null = null;
            
            for (let i = 0; i < attemptCount; i++) {
              result = await service.checkRateLimit(key);
            }
            
            // After more than MAX_ATTEMPTS, should be blocked with 0 remaining
            // (The 6th attempt and beyond are blocked)
            expect(result!.allowed).toBe(false);
            expect(result!.remainingAttempts).toBe(0);
          }
        ),
        { numRuns: 30 }
      );
    });
  });
});
