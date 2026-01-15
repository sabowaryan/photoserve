/**
 * Unit tests for Domain Cache
 * 
 * Tests the in-memory cache implementation for domain-to-photographer mappings.
 * Requirements: 9.1, 9.2, 9.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as domainCache from './domain-cache';

describe('Domain Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    domainCache.clear();
    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get()', () => {
    it('should return null for non-existent domain', () => {
      const result = domainCache.get('photos.example.com');
      expect(result).toBeNull();
    });

    it('should return cached photographer data for existing domain', () => {
      // Set a domain in cache
      domainCache.set('photos.example.com', 'user-123', true);

      // Get the domain
      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should return null for expired cache entry', () => {
      // Use fake timers
      vi.useFakeTimers();

      // Set a domain in cache
      domainCache.set('photos.example.com', 'user-123', true);

      // Fast-forward time by 6 minutes (beyond 5 minute TTL)
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Get the domain - should be expired
      const result = domainCache.get('photos.example.com');

      expect(result).toBeNull();

      vi.useRealTimers();
    });

    it('should automatically remove expired entry on access', () => {
      vi.useFakeTimers();

      // Set a domain in cache
      domainCache.set('photos.example.com', 'user-123', true);

      // Verify it's in cache
      expect(domainCache.getStats().size).toBe(1);

      // Fast-forward time to expire the entry
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Access the expired entry
      domainCache.get('photos.example.com');

      // Verify it was removed
      expect(domainCache.getStats().size).toBe(0);

      vi.useRealTimers();
    });

    it('should return data for non-expired cache entry', () => {
      vi.useFakeTimers();

      // Set a domain in cache
      domainCache.set('photos.example.com', 'user-123', true);

      // Fast-forward time by 4 minutes (within 5 minute TTL)
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Get the domain - should still be valid
      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });

      vi.useRealTimers();
    });
  });

  describe('set()', () => {
    it('should store domain mapping in cache', () => {
      domainCache.set('photos.example.com', 'user-123', true);

      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should store unverified domain mapping', () => {
      domainCache.set('photos.example.com', 'user-456', false);

      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: 'user-456',
        verified: false,
      });
    });

    it('should update existing domain mapping', () => {
      // Set initial value
      domainCache.set('photos.example.com', 'user-123', false);

      // Update with new value
      domainCache.set('photos.example.com', 'user-123', true);

      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should reset TTL when updating existing entry', () => {
      vi.useFakeTimers();

      // Set initial value
      domainCache.set('photos.example.com', 'user-123', true);

      // Fast-forward 4 minutes
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Update the entry (resets TTL)
      domainCache.set('photos.example.com', 'user-123', true);

      // Fast-forward another 4 minutes (total 8 minutes from initial set)
      vi.advanceTimersByTime(4 * 60 * 1000);

      // Should still be valid because TTL was reset
      const result = domainCache.get('photos.example.com');

      expect(result).not.toBeNull();

      vi.useRealTimers();
    });

    it('should handle multiple domains independently', () => {
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', false);

      const result1 = domainCache.get('photos.example.com');
      const result2 = domainCache.get('gallery.another.com');

      expect(result1).toEqual({
        photographerId: 'user-123',
        verified: true,
      });

      expect(result2).toEqual({
        photographerId: 'user-456',
        verified: false,
      });
    });
  });

  describe('invalidate()', () => {
    it('should remove domain from cache', () => {
      // Set a domain
      domainCache.set('photos.example.com', 'user-123', true);

      // Verify it exists
      expect(domainCache.get('photos.example.com')).not.toBeNull();

      // Invalidate it
      domainCache.invalidate('photos.example.com');

      // Verify it's gone
      expect(domainCache.get('photos.example.com')).toBeNull();
    });

    it('should not throw error when invalidating non-existent domain', () => {
      expect(() => {
        domainCache.invalidate('nonexistent.com');
      }).not.toThrow();
    });

    it('should only remove specified domain', () => {
      // Set multiple domains
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', true);

      // Invalidate one
      domainCache.invalidate('photos.example.com');

      // Verify only the specified one was removed
      expect(domainCache.get('photos.example.com')).toBeNull();
      expect(domainCache.get('gallery.another.com')).not.toBeNull();
    });
  });

  describe('clear()', () => {
    it('should remove all entries from cache', () => {
      // Set multiple domains
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', true);
      domainCache.set('pics.third.com', 'user-789', false);

      // Verify they exist
      expect(domainCache.getStats().size).toBe(3);

      // Clear cache
      domainCache.clear();

      // Verify all are gone
      expect(domainCache.getStats().size).toBe(0);
      expect(domainCache.get('photos.example.com')).toBeNull();
      expect(domainCache.get('gallery.another.com')).toBeNull();
      expect(domainCache.get('pics.third.com')).toBeNull();
    });

    it('should work on empty cache', () => {
      expect(() => {
        domainCache.clear();
      }).not.toThrow();

      expect(domainCache.getStats().size).toBe(0);
    });
  });

  describe('getStats()', () => {
    it('should return zero for empty cache', () => {
      const stats = domainCache.getStats();

      expect(stats.size).toBe(0);
      expect(stats.entries).toBe(0);
    });

    it('should return correct count for populated cache', () => {
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', true);

      const stats = domainCache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.entries).toBe(2);
    });

    it('should update after invalidation', () => {
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', true);

      expect(domainCache.getStats().size).toBe(2);

      domainCache.invalidate('photos.example.com');

      expect(domainCache.getStats().size).toBe(1);
    });
  });

  describe('cleanupExpired()', () => {
    it('should remove all expired entries', () => {
      vi.useFakeTimers();

      // Set multiple domains
      domainCache.set('photos.example.com', 'user-123', true);
      domainCache.set('gallery.another.com', 'user-456', true);

      // Fast-forward to expire them
      vi.advanceTimersByTime(6 * 60 * 1000);

      // Add a fresh entry
      domainCache.set('pics.third.com', 'user-789', true);

      // Run cleanup
      domainCache.cleanupExpired();

      // Verify expired entries are gone but fresh one remains
      expect(domainCache.get('photos.example.com')).toBeNull();
      expect(domainCache.get('gallery.another.com')).toBeNull();
      expect(domainCache.get('pics.third.com')).not.toBeNull();

      vi.useRealTimers();
    });

    it('should not remove non-expired entries', () => {
      vi.useFakeTimers();

      domainCache.set('photos.example.com', 'user-123', true);

      // Fast-forward but not enough to expire
      vi.advanceTimersByTime(4 * 60 * 1000);

      domainCache.cleanupExpired();

      // Should still exist
      expect(domainCache.get('photos.example.com')).not.toBeNull();

      vi.useRealTimers();
    });

    it('should work on empty cache', () => {
      expect(() => {
        domainCache.cleanupExpired();
      }).not.toThrow();
    });
  });

  describe('Cache key format', () => {
    it('should use domain: prefix for cache keys', () => {
      // This is an implementation detail test
      // We verify the behavior by ensuring different domains don't collide
      domainCache.set('example.com', 'user-123', true);
      domainCache.set('domain:example.com', 'user-456', true);

      // These should be treated as different domains
      const result1 = domainCache.get('example.com');
      const result2 = domainCache.get('domain:example.com');

      expect(result1?.photographerId).toBe('user-123');
      expect(result2?.photographerId).toBe('user-456');
    });
  });

  describe('TTL configuration', () => {
    it('should use 5 minute TTL as specified in requirements', () => {
      vi.useFakeTimers();

      domainCache.set('photos.example.com', 'user-123', true);

      // At 4:59, should still be valid
      vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);
      expect(domainCache.get('photos.example.com')).not.toBeNull();

      // Clear and reset
      domainCache.clear();
      domainCache.set('photos.example.com', 'user-123', true);

      // At 5:01, should be expired
      vi.advanceTimersByTime(5 * 60 * 1000 + 1000);
      expect(domainCache.get('photos.example.com')).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty string domain', () => {
      domainCache.set('', 'user-123', true);
      const result = domainCache.get('');

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should handle special characters in domain', () => {
      const specialDomain = 'photos-test_123.example.com';
      domainCache.set(specialDomain, 'user-123', true);

      const result = domainCache.get(specialDomain);

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should handle very long domain names', () => {
      const longDomain = 'a'.repeat(253) + '.com'; // Max domain length
      domainCache.set(longDomain, 'user-123', true);

      const result = domainCache.get(longDomain);

      expect(result).toEqual({
        photographerId: 'user-123',
        verified: true,
      });
    });

    it('should handle empty photographer ID', () => {
      domainCache.set('photos.example.com', '', true);

      const result = domainCache.get('photos.example.com');

      expect(result).toEqual({
        photographerId: '',
        verified: true,
      });
    });
  });
});
