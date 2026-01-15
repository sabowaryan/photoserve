/**
 * Property-Based Tests for Domain Cache
 * 
 * Tests universal properties that should hold across all valid inputs.
 * Uses fast-check for property-based testing.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
import * as domainCache from './domain-cache';

describe('Domain Cache - Property Tests', () => {
  beforeEach(() => {
    domainCache.clear();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property 41: Domain lookup caching
   * **Validates: Requirements 9.1**
   * 
   * For any custom domain lookup in middleware, the system should cache 
   * the domain-to-photographer mapping.
   */
  it('Property 41: should cache any domain-to-photographer mapping', () => {
    fc.assert(
      fc.property(
        fc.domain(), // Generate valid domain names
        fc.uuid(), // Generate photographer IDs
        fc.boolean(), // Generate verification status
        (domain, photographerId, verified) => {
          // Set the mapping
          domainCache.set(domain, photographerId, verified);

          // Get the mapping
          const result = domainCache.get(domain);

          // Should return the cached data
          expect(result).not.toBeNull();
          expect(result?.photographerId).toBe(photographerId);
          expect(result?.verified).toBe(verified);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 42: Cache TTL configuration
   * **Validates: Requirements 9.2**
   * 
   * For any cached domain mapping, the TTL should be set to 5 minutes (300 seconds).
   */
  it('Property 42: should expire entries after exactly 5 minutes', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.uuid(),
        fc.boolean(),
        (domain, photographerId, verified) => {
          vi.useFakeTimers();

          // Set the mapping
          domainCache.set(domain, photographerId, verified);

          // Just before 5 minutes - should still be valid
          vi.advanceTimersByTime(5 * 60 * 1000 - 1);
          expect(domainCache.get(domain)).not.toBeNull();

          // Clear and reset for second check
          domainCache.clear();
          domainCache.set(domain, photographerId, verified);

          // Just after 5 minutes - should be expired
          vi.advanceTimersByTime(5 * 60 * 1000 + 1);
          expect(domainCache.get(domain)).toBeNull();

          vi.useRealTimers();
        }
      ),
      { numRuns: 50 } // Fewer runs due to timer manipulation
    );
  });

  /**
   * Property 43: Cache invalidation on configuration change
   * **Validates: Requirements 9.3**
   * 
   * For any domain configuration change (add, update, remove), the system 
   * should invalidate the relevant cache entries.
   */
  it('Property 43: should invalidate cache entries on demand', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.uuid(),
        fc.boolean(),
        (domain, photographerId, verified) => {
          // Set the mapping
          domainCache.set(domain, photographerId, verified);

          // Verify it's cached
          expect(domainCache.get(domain)).not.toBeNull();

          // Invalidate it
          domainCache.invalidate(domain);

          // Should be gone
          expect(domainCache.get(domain)).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 44: Cache reuse across requests
   * **Validates: Requirements 9.8**
   * 
   * For any multiple gallery requests to the same custom domain within the 
   * cache TTL, the system should reuse the cached domain lookup.
   */
  it('Property 44: should return same data for multiple lookups within TTL', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.uuid(),
        fc.boolean(),
        fc.integer({ min: 2, max: 10 }), // Number of lookups
        (domain, photographerId, verified, numLookups) => {
          vi.useFakeTimers();

          // Set the mapping
          domainCache.set(domain, photographerId, verified);

          // Calculate time increment that keeps us within TTL
          // Total time should be less than 5 minutes (300 seconds)
          const timeIncrement = Math.floor((4 * 60 * 1000) / numLookups); // 4 minutes divided by lookups

          // Perform multiple lookups within TTL
          for (let i = 0; i < numLookups; i++) {
            // Advance time slightly (but stay within TTL)
            if (i > 0) {
              vi.advanceTimersByTime(timeIncrement);
            }

            const result = domainCache.get(domain);

            // Should always return the same cached data
            expect(result).not.toBeNull();
            expect(result?.photographerId).toBe(photographerId);
            expect(result?.verified).toBe(verified);
          }

          vi.useRealTimers();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional Property: Set-Get Consistency
   * 
   * For any domain, photographer ID, and verification status, 
   * getting immediately after setting should return the same data.
   */
  it('should maintain set-get consistency for any valid input', () => {
    fc.assert(
      fc.property(
        fc.string(), // Allow any string as domain
        fc.string(), // Allow any string as photographer ID
        fc.boolean(),
        (domain, photographerId, verified) => {
          domainCache.set(domain, photographerId, verified);
          const result = domainCache.get(domain);

          expect(result).toEqual({
            photographerId,
            verified,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Invalidation Idempotence
   * 
   * For any domain, invalidating multiple times should have the same effect 
   * as invalidating once.
   */
  it('should handle multiple invalidations idempotently', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.uuid(),
        fc.boolean(),
        fc.integer({ min: 1, max: 5 }), // Number of invalidations
        (domain, photographerId, verified, numInvalidations) => {
          // Set the mapping
          domainCache.set(domain, photographerId, verified);

          // Invalidate multiple times
          for (let i = 0; i < numInvalidations; i++) {
            domainCache.invalidate(domain);
          }

          // Should be gone
          expect(domainCache.get(domain)).toBeNull();

          // Stats should show it's not in cache
          const initialSize = domainCache.getStats().size;

          // Additional invalidations should not change anything
          domainCache.invalidate(domain);
          expect(domainCache.getStats().size).toBe(initialSize);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Cache Isolation
   * 
   * For any two different domains, operations on one should not affect the other.
   */
  it('should maintain isolation between different domains', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.domain(),
        fc.uuid(),
        fc.uuid(),
        fc.boolean(),
        fc.boolean(),
        (domain1, domain2, userId1, userId2, verified1, verified2) => {
          // Skip if domains are the same
          fc.pre(domain1 !== domain2);

          // Set both domains
          domainCache.set(domain1, userId1, verified1);
          domainCache.set(domain2, userId2, verified2);

          // Invalidate first domain
          domainCache.invalidate(domain1);

          // First should be gone
          expect(domainCache.get(domain1)).toBeNull();

          // Second should still exist
          const result2 = domainCache.get(domain2);
          expect(result2).not.toBeNull();
          expect(result2?.photographerId).toBe(userId2);
          expect(result2?.verified).toBe(verified2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Update Overwrites
   * 
   * For any domain, setting a new value should overwrite the old value.
   */
  it('should overwrite previous values when updating', () => {
    fc.assert(
      fc.property(
        fc.domain(),
        fc.uuid(),
        fc.uuid(),
        fc.boolean(),
        fc.boolean(),
        (domain, userId1, userId2, verified1, verified2) => {
          // Skip if values are the same
          fc.pre(userId1 !== userId2 || verified1 !== verified2);

          // Set initial value
          domainCache.set(domain, userId1, verified1);

          // Update with new value
          domainCache.set(domain, userId2, verified2);

          // Should return the new value
          const result = domainCache.get(domain);
          expect(result).toEqual({
            photographerId: userId2,
            verified: verified2,
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional Property: Clear Removes All
   * 
   * For any set of domains, clearing should remove all of them.
   */
  it('should remove all entries when cleared', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            domain: fc.domain(),
            photographerId: fc.uuid(),
            verified: fc.boolean(),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (entries) => {
          // Set all entries
          for (const entry of entries) {
            domainCache.set(entry.domain, entry.photographerId, entry.verified);
          }

          // Verify cache is not empty
          expect(domainCache.getStats().size).toBeGreaterThan(0);

          // Clear cache
          domainCache.clear();

          // All entries should be gone
          expect(domainCache.getStats().size).toBe(0);

          for (const entry of entries) {
            expect(domainCache.get(entry.domain)).toBeNull();
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional Property: Stats Accuracy
   * 
   * For any operations, getStats() should accurately reflect the cache size.
   */
  it('should maintain accurate stats after any operations', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            domain: fc.domain(),
            photographerId: fc.uuid(),
            verified: fc.boolean(),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (entries) => {
          domainCache.clear();

          // Set all entries
          const uniqueDomains = new Set<string>();
          for (const entry of entries) {
            domainCache.set(entry.domain, entry.photographerId, entry.verified);
            uniqueDomains.add(entry.domain);
          }

          // Stats should match unique domain count
          expect(domainCache.getStats().size).toBe(uniqueDomains.size);

          // Invalidate half of them
          const domainsArray = Array.from(uniqueDomains);
          const halfCount = Math.floor(domainsArray.length / 2);
          for (let i = 0; i < halfCount; i++) {
            const domain = domainsArray[i];
            if (domain) {
              domainCache.invalidate(domain);
            }
          }

          // Stats should reflect the removal
          expect(domainCache.getStats().size).toBe(uniqueDomains.size - halfCount);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Additional Property: Cleanup Removes Only Expired
   * 
   * For any set of entries with different ages, cleanup should only remove expired ones.
   */
  it('should only remove expired entries during cleanup', () => {
    fc.assert(
      fc.property(
        fc.array(fc.domain(), { minLength: 2, maxLength: 5 }),
        fc.uuid(),
        (domains, photographerId) => {
          vi.useFakeTimers();

          // Set first half of domains
          const halfIndex = Math.floor(domains.length / 2);
          for (let i = 0; i < halfIndex; i++) {
            const domain = domains[i];
            if (domain) {
              domainCache.set(domain, photographerId, true);
            }
          }

          // Advance time to expire first half
          vi.advanceTimersByTime(6 * 60 * 1000);

          // Set second half of domains (fresh)
          for (let i = halfIndex; i < domains.length; i++) {
            const domain = domains[i];
            if (domain) {
              domainCache.set(domain, photographerId, true);
            }
          }

          // Run cleanup
          domainCache.cleanupExpired();

          // First half should be gone
          for (let i = 0; i < halfIndex; i++) {
            const domain = domains[i];
            if (domain) {
              expect(domainCache.get(domain)).toBeNull();
            }
          }

          // Second half should still exist
          for (let i = halfIndex; i < domains.length; i++) {
            const domain = domains[i];
            if (domain) {
              expect(domainCache.get(domain)).not.toBeNull();
            }
          }

          vi.useRealTimers();
        }
      ),
      { numRuns: 30 }
    );
  });
});
