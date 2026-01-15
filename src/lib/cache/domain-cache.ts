/**
 * Domain Cache
 * 
 * In-memory cache for domain-to-photographer mappings with TTL support.
 * Reduces database queries for custom domain lookups in middleware.
 * 
 * Requirements: 9.1, 9.2, 9.3
 */

/**
 * Cache entry structure
 */
interface DomainCacheEntry {
  domain: string;
  photographerId: string;
  verified: boolean;
  cachedAt: number; // Unix timestamp in milliseconds
  ttl: number; // Time-to-live in milliseconds
}

/**
 * Domain cache configuration
 */
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds (Requirement 9.2)

/**
 * In-memory cache storage
 * Key format: `domain:${domain}` (as specified in design)
 */
const cache = new Map<string, DomainCacheEntry>();

/**
 * Generate cache key for a domain
 * @param domain - The custom domain
 * @returns Cache key in format `domain:${domain}`
 */
function generateCacheKey(domain: string): string {
  return `domain:${domain}`;
}

/**
 * Check if a cache entry is expired
 * @param entry - The cache entry to check
 * @returns True if the entry is expired
 */
function isExpired(entry: DomainCacheEntry): boolean {
  const now = Date.now();
  return now - entry.cachedAt >= entry.ttl;
}

/**
 * Get a cached domain mapping
 * @param domain - The custom domain to lookup
 * @returns The cached photographer ID and verification status, or null if not cached or expired
 */
export function get(domain: string): { photographerId: string; verified: boolean } | null {
  const key = generateCacheKey(domain);
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if entry is expired
  if (isExpired(entry)) {
    // Automatically remove expired entry
    cache.delete(key);
    return null;
  }

  return {
    photographerId: entry.photographerId,
    verified: entry.verified,
  };
}

/**
 * Set a domain mapping in the cache
 * @param domain - The custom domain
 * @param photographerId - The photographer's user ID
 * @param verified - Whether the domain is verified
 */
export function set(domain: string, photographerId: string, verified: boolean): void {
  const key = generateCacheKey(domain);
  const entry: DomainCacheEntry = {
    domain,
    photographerId,
    verified,
    cachedAt: Date.now(),
    ttl: CACHE_TTL,
  };

  cache.set(key, entry);
}

/**
 * Invalidate (remove) a domain from the cache
 * Used when domain configuration changes (add, update, remove)
 * @param domain - The custom domain to invalidate
 */
export function invalidate(domain: string): void {
  const key = generateCacheKey(domain);
  cache.delete(key);
}

/**
 * Clear all cache entries
 * Useful for testing or manual cache reset
 */
export function clear(): void {
  cache.clear();
}

/**
 * Get cache statistics (for monitoring)
 * @returns Object with cache size and entry count
 */
export function getStats(): { size: number; entries: number } {
  return {
    size: cache.size,
    entries: cache.size,
  };
}

/**
 * Clean up expired entries from the cache
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpired(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, entry] of cache.entries()) {
    if (now - entry.cachedAt >= entry.ttl) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    cache.delete(key);
  }
}

// Automatic cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpired, 10 * 60 * 1000);
}
