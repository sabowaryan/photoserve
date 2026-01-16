/**
 * Cache Service
 * Provides a unified caching interface with Redis support and in-memory fallback
 * 
 * @module lib/services/cache.service
 * Requirements: 11.1 - Caching Strategy
 * - Cache gallery monetization config (5 minutes)
 * - Cache purchase verification (5 minutes)
 * - Cache revenue statistics (15 minutes)
 * - Use Redis for caching (if available)
 * - Invalidate cache on relevant updates
 * - Implement cache warming for popular galleries
 */

import { createClient, RedisClientType } from 'redis';

/**
 * Cache TTL constants in seconds
 */
export const CACHE_TTL = {
  /** Monetization config cache TTL: 5 minutes */
  MONETIZATION_CONFIG: 5 * 60,
  /** Purchase verification cache TTL: 5 minutes */
  PURCHASE_VERIFICATION: 5 * 60,
  /** Revenue statistics cache TTL: 15 minutes */
  REVENUE_STATS: 15 * 60,
  /** Default cache TTL: 5 minutes */
  DEFAULT: 5 * 60,
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  MONETIZATION_CONFIG: 'monetization:config:',
  PURCHASE_VERIFICATION: 'purchase:verify:',
  PURCHASE_ACCESS: 'purchase:access:',
  REVENUE_OVERVIEW: 'revenue:overview:',
  REVENUE_CHART: 'revenue:chart:',
  REVENUE_TOP_GALLERIES: 'revenue:top:',
  REVENUE_FUNNEL: 'revenue:funnel:',
  REVENUE_BY_GALLERY: 'revenue:by-gallery:',
  REVENUE_DETAILED_FUNNEL: 'revenue:detailed-funnel:',
  REVENUE_COHORT: 'revenue:cohort:',
  REVENUE_TRENDS: 'revenue:trends:',
  REVENUE_ADVANCED_SUMMARY: 'revenue:advanced-summary:',
} as const;

/**
 * Cache entry interface for in-memory cache
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
  isRedisConnected: boolean;
}

/**
 * Cache Service Interface
 */
export interface ICacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deletePattern(pattern: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getStats(): CacheStats;
  isRedisAvailable(): boolean;
  disconnect(): Promise<void>;
}

/**
 * Cache Service Implementation
 * Uses Redis when available, falls back to in-memory cache
 */
export class CacheService implements ICacheService {
  private redisClient: RedisClientType | null = null;
  private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
  private isRedisConnected: boolean = false;
  private connectionAttempted: boolean = false;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
    isRedisConnected: false,
  };

  constructor(private redisUrl?: string) {
    // Initialize Redis connection asynchronously
    this.initializeRedis();
  }

  /**
   * Initialize Redis connection
   * @private
   */
  private async initializeRedis(): Promise<void> {
    if (this.connectionAttempted) return;
    this.connectionAttempted = true;

    const url = this.redisUrl || process.env.piksend_REDIS_URL;
    
    if (!url) {
      console.log('[CacheService] No Redis URL configured, using in-memory cache');
      return;
    }

    try {
      this.redisClient = createClient({ url });

      this.redisClient.on('error', (err) => {
        console.error('[CacheService] Redis error:', err.message);
        this.isRedisConnected = false;
        this.stats.isRedisConnected = false;
        this.stats.errors++;
      });

      this.redisClient.on('connect', () => {
        console.log('[CacheService] Redis connected');
        this.isRedisConnected = true;
        this.stats.isRedisConnected = true;
      });

      this.redisClient.on('disconnect', () => {
        console.log('[CacheService] Redis disconnected');
        this.isRedisConnected = false;
        this.stats.isRedisConnected = false;
      });

      await this.redisClient.connect();
    } catch (error) {
      console.warn('[CacheService] Failed to connect to Redis, using in-memory cache:', 
        error instanceof Error ? error.message : 'Unknown error');
      this.redisClient = null;
      this.isRedisConnected = false;
    }
  }

  /**
   * Get a value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        const value = await this.redisClient.get(key);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value) as T;
        }
        this.stats.misses++;
        return null;
      }

      // Fall back to in-memory cache
      return this.getFromMemory<T>(key);
    } catch (error) {
      console.error('[CacheService] Error getting cache:', error);
      this.stats.errors++;
      // Fall back to memory cache on Redis error
      return this.getFromMemory<T>(key);
    }
  }

  /**
   * Set a value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = CACHE_TTL.DEFAULT): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      // Try Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setEx(key, ttlSeconds, serialized);
        this.stats.sets++;
        return;
      }

      // Fall back to in-memory cache
      this.setInMemory(key, value, ttlSeconds);
    } catch (error) {
      console.error('[CacheService] Error setting cache:', error);
      this.stats.errors++;
      // Fall back to memory cache on Redis error
      this.setInMemory(key, value, ttlSeconds);
    }
  }

  /**
   * Delete a value from cache
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      // Delete from Redis if connected
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }

      // Always delete from memory cache too
      this.memoryCache.delete(key);
      this.stats.deletes++;
    } catch (error) {
      console.error('[CacheService] Error deleting cache:', error);
      this.stats.errors++;
      // Still delete from memory cache
      this.memoryCache.delete(key);
    }
  }

  /**
   * Delete all keys matching a pattern
   * @param pattern - Pattern to match (e.g., "monetization:config:*")
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      // Delete from Redis if connected
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
          this.stats.deletes += keys.length;
        }
      }

      // Delete from memory cache
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
          this.stats.deletes++;
        }
      }
    } catch (error) {
      console.error('[CacheService] Error deleting pattern:', error);
      this.stats.errors++;
    }
  }

  /**
   * Check if a key exists in cache
   * @param key - Cache key
   * @returns True if key exists and is not expired
   */
  async exists(key: string): Promise<boolean> {
    try {
      // Check Redis first if connected
      if (this.isRedisConnected && this.redisClient) {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      }

      // Check memory cache
      const entry = this.memoryCache.get(key);
      if (!entry) return false;
      if (Date.now() > entry.expiresAt) {
        this.memoryCache.delete(key);
        return false;
      }
      return true;
    } catch (error) {
      console.error('[CacheService] Error checking existence:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns Cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if Redis is available
   * @returns True if Redis is connected
   */
  isRedisAvailable(): boolean {
    return this.isRedisConnected;
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.redisClient && this.isRedisConnected) {
      await this.redisClient.quit();
      this.isRedisConnected = false;
      this.stats.isRedisConnected = false;
    }
  }

  /**
   * Get value from in-memory cache
   * @private
   */
  private getFromMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return entry.data as T;
  }

  /**
   * Set value in in-memory cache
   * @private
   */
  private setInMemory<T>(key: string, value: T, ttlSeconds: number): void {
    this.memoryCache.set(key, {
      data: value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    this.stats.sets++;
  }

  /**
   * Clean up expired entries from memory cache
   * Should be called periodically
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
      }
    }
  }
}

// Singleton instance
let cacheServiceInstance: CacheService | null = null;

/**
 * Get the singleton cache service instance
 * @param redisUrl - Optional Redis URL (only used on first call)
 * @returns Cache service instance
 */
export function getCacheService(redisUrl?: string): CacheService {
  if (!cacheServiceInstance) {
    cacheServiceInstance = new CacheService(redisUrl);
  }
  return cacheServiceInstance;
}

/**
 * Create a new cache service instance (for testing)
 * @param redisUrl - Optional Redis URL
 * @returns New cache service instance
 */
export function createCacheService(redisUrl?: string): CacheService {
  return new CacheService(redisUrl);
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetCacheService(): void {
  if (cacheServiceInstance) {
    cacheServiceInstance.disconnect().catch(console.error);
    cacheServiceInstance = null;
  }
}

/**
 * Helper function to build cache keys
 */
export function buildCacheKey(prefix: string, ...parts: string[]): string {
  return `${prefix}${parts.join(':')}`;
}

/**
 * Cache invalidation helpers
 */
export const CacheInvalidation = {
  /**
   * Invalidate monetization config cache for a gallery
   */
  async monetizationConfig(cacheService: ICacheService, galleryId: string): Promise<void> {
    await cacheService.delete(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`);
  },

  /**
   * Invalidate purchase verification cache
   */
  async purchaseVerification(
    cacheService: ICacheService, 
    galleryId: string, 
    identifier: string
  ): Promise<void> {
    const key = buildCacheKey(CACHE_PREFIX.PURCHASE_VERIFICATION, galleryId, identifier.toLowerCase());
    await cacheService.delete(key);
  },

  /**
   * Invalidate purchase access cache
   */
  async purchaseAccess(
    cacheService: ICacheService, 
    galleryId: string, 
    identifier: string
  ): Promise<void> {
    const key = buildCacheKey(CACHE_PREFIX.PURCHASE_ACCESS, galleryId, identifier.toLowerCase());
    await cacheService.delete(key);
  },

  /**
   * Invalidate all revenue caches for a photographer
   */
  async revenueStats(cacheService: ICacheService, photographerId: string): Promise<void> {
    await Promise.all([
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_OVERVIEW}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_CHART}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_TOP_GALLERIES}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_FUNNEL}${photographerId}`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_BY_GALLERY}${photographerId}`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_DETAILED_FUNNEL}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_COHORT}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_TRENDS}${photographerId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.REVENUE_ADVANCED_SUMMARY}${photographerId}`),
    ]);
  },

  /**
   * Invalidate all caches related to a gallery
   */
  async gallery(cacheService: ICacheService, galleryId: string): Promise<void> {
    await Promise.all([
      cacheService.delete(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`),
      cacheService.deletePattern(`${CACHE_PREFIX.PURCHASE_VERIFICATION}${galleryId}:*`),
      cacheService.deletePattern(`${CACHE_PREFIX.PURCHASE_ACCESS}${galleryId}:*`),
    ]);
  },
};
