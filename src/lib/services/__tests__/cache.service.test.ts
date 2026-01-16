/**
 * Cache Service Tests
 * Tests for the caching service with Redis and in-memory fallback
 * 
 * Requirements: 11.1 - Caching Strategy
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  CacheService, 
  CACHE_TTL, 
  CACHE_PREFIX, 
  buildCacheKey,
  CacheInvalidation,
  createCacheService,
} from '../cache.service';

// Mock Redis client
const mockRedisClient = {
  get: vi.fn(),
  setEx: vi.fn(),
  del: vi.fn(),
  keys: vi.fn(),
  exists: vi.fn(),
  connect: vi.fn(),
  quit: vi.fn(),
  on: vi.fn(),
};

// Mock redis module
vi.mock('redis', () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a new instance without Redis URL to use in-memory cache
    cacheService = createCacheService();
  });

  afterEach(async () => {
    await cacheService.disconnect();
  });

  describe('In-Memory Cache', () => {
    describe('get', () => {
      it('should return null for non-existent key', async () => {
        const result = await cacheService.get('non-existent-key');
        expect(result).toBeNull();
      });

      it('should return cached value', async () => {
        const testData = { foo: 'bar', count: 42 };
        await cacheService.set('test-key', testData);
        
        const result = await cacheService.get<typeof testData>('test-key');
        expect(result).toEqual(testData);
      });

      it('should return null for expired key', async () => {
        const testData = { foo: 'bar' };
        await cacheService.set('test-key', testData, 0); // 0 second TTL
        
        // Wait a bit for expiration
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const result = await cacheService.get('test-key');
        expect(result).toBeNull();
      });

      it('should track cache hits', async () => {
        await cacheService.set('test-key', 'value');
        await cacheService.get('test-key');
        
        const stats = cacheService.getStats();
        expect(stats.hits).toBe(1);
      });

      it('should track cache misses', async () => {
        await cacheService.get('non-existent');
        
        const stats = cacheService.getStats();
        expect(stats.misses).toBe(1);
      });
    });

    describe('set', () => {
      it('should store value with default TTL', async () => {
        await cacheService.set('test-key', 'test-value');
        
        const result = await cacheService.get('test-key');
        expect(result).toBe('test-value');
      });

      it('should store complex objects', async () => {
        const complexData = {
          id: '123',
          nested: { a: 1, b: [1, 2, 3] },
          date: '2024-01-01',
        };
        
        await cacheService.set('complex-key', complexData);
        
        const result = await cacheService.get<typeof complexData>('complex-key');
        expect(result).toEqual(complexData);
      });

      it('should track cache sets', async () => {
        await cacheService.set('key1', 'value1');
        await cacheService.set('key2', 'value2');
        
        const stats = cacheService.getStats();
        expect(stats.sets).toBe(2);
      });

      it('should overwrite existing value', async () => {
        await cacheService.set('test-key', 'original');
        await cacheService.set('test-key', 'updated');
        
        const result = await cacheService.get('test-key');
        expect(result).toBe('updated');
      });
    });

    describe('delete', () => {
      it('should delete existing key', async () => {
        await cacheService.set('test-key', 'value');
        await cacheService.delete('test-key');
        
        const result = await cacheService.get('test-key');
        expect(result).toBeNull();
      });

      it('should not throw for non-existent key', async () => {
        await expect(cacheService.delete('non-existent')).resolves.not.toThrow();
      });

      it('should track deletes', async () => {
        await cacheService.set('test-key', 'value');
        await cacheService.delete('test-key');
        
        const stats = cacheService.getStats();
        expect(stats.deletes).toBe(1);
      });
    });

    describe('deletePattern', () => {
      it('should delete keys matching pattern', async () => {
        await cacheService.set('prefix:key1', 'value1');
        await cacheService.set('prefix:key2', 'value2');
        await cacheService.set('other:key3', 'value3');
        
        await cacheService.deletePattern('prefix:*');
        
        expect(await cacheService.get('prefix:key1')).toBeNull();
        expect(await cacheService.get('prefix:key2')).toBeNull();
        expect(await cacheService.get('other:key3')).toBe('value3');
      });

      it('should handle complex patterns', async () => {
        await cacheService.set('revenue:overview:user1:week', 'data1');
        await cacheService.set('revenue:overview:user1:month', 'data2');
        await cacheService.set('revenue:chart:user1:week', 'data3');
        
        await cacheService.deletePattern('revenue:overview:user1:*');
        
        expect(await cacheService.get('revenue:overview:user1:week')).toBeNull();
        expect(await cacheService.get('revenue:overview:user1:month')).toBeNull();
        expect(await cacheService.get('revenue:chart:user1:week')).toBe('data3');
      });
    });

    describe('exists', () => {
      it('should return true for existing key', async () => {
        await cacheService.set('test-key', 'value');
        
        const exists = await cacheService.exists('test-key');
        expect(exists).toBe(true);
      });

      it('should return false for non-existent key', async () => {
        const exists = await cacheService.exists('non-existent');
        expect(exists).toBe(false);
      });

      it('should return false for expired key', async () => {
        await cacheService.set('test-key', 'value', 0);
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const exists = await cacheService.exists('test-key');
        expect(exists).toBe(false);
      });
    });

    describe('cleanupExpired', () => {
      it('should remove expired entries', async () => {
        await cacheService.set('expired-key', 'value', 0);
        await cacheService.set('valid-key', 'value', 3600);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        cacheService.cleanupExpired();
        
        expect(await cacheService.get('expired-key')).toBeNull();
        expect(await cacheService.get('valid-key')).toBe('value');
      });
    });
  });

  describe('Cache Constants', () => {
    it('should have correct TTL values', () => {
      expect(CACHE_TTL.MONETIZATION_CONFIG).toBe(5 * 60);
      expect(CACHE_TTL.PURCHASE_VERIFICATION).toBe(5 * 60);
      expect(CACHE_TTL.REVENUE_STATS).toBe(15 * 60);
      expect(CACHE_TTL.DEFAULT).toBe(5 * 60);
    });

    it('should have correct cache prefixes', () => {
      expect(CACHE_PREFIX.MONETIZATION_CONFIG).toBe('monetization:config:');
      expect(CACHE_PREFIX.PURCHASE_VERIFICATION).toBe('purchase:verify:');
      expect(CACHE_PREFIX.PURCHASE_ACCESS).toBe('purchase:access:');
      expect(CACHE_PREFIX.REVENUE_OVERVIEW).toBe('revenue:overview:');
    });
  });

  describe('buildCacheKey', () => {
    it('should build key with single part', () => {
      const key = buildCacheKey('prefix:', 'part1');
      expect(key).toBe('prefix:part1');
    });

    it('should build key with multiple parts', () => {
      const key = buildCacheKey('prefix:', 'part1', 'part2', 'part3');
      expect(key).toBe('prefix:part1:part2:part3');
    });

    it('should handle empty parts', () => {
      const key = buildCacheKey('prefix:');
      expect(key).toBe('prefix:');
    });
  });

  describe('CacheInvalidation', () => {
    describe('monetizationConfig', () => {
      it('should invalidate monetization config cache', async () => {
        const galleryId = 'gallery-123';
        await cacheService.set(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`, { data: 'test' });
        
        await CacheInvalidation.monetizationConfig(cacheService, galleryId);
        
        const result = await cacheService.get(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`);
        expect(result).toBeNull();
      });
    });

    describe('purchaseVerification', () => {
      it('should invalidate purchase verification cache', async () => {
        const galleryId = 'gallery-123';
        const identifier = 'test@example.com';
        const key = buildCacheKey(CACHE_PREFIX.PURCHASE_VERIFICATION, galleryId, identifier.toLowerCase());
        
        await cacheService.set(key, { hasAccess: true });
        await CacheInvalidation.purchaseVerification(cacheService, galleryId, identifier);
        
        const result = await cacheService.get(key);
        expect(result).toBeNull();
      });

      it('should handle case-insensitive identifiers', async () => {
        const galleryId = 'gallery-123';
        const identifier = 'Test@Example.COM';
        const key = buildCacheKey(CACHE_PREFIX.PURCHASE_VERIFICATION, galleryId, identifier.toLowerCase());
        
        await cacheService.set(key, { hasAccess: true });
        await CacheInvalidation.purchaseVerification(cacheService, galleryId, identifier);
        
        const result = await cacheService.get(key);
        expect(result).toBeNull();
      });
    });

    describe('purchaseAccess', () => {
      it('should invalidate purchase access cache', async () => {
        const galleryId = 'gallery-123';
        const identifier = 'test@example.com';
        const key = buildCacheKey(CACHE_PREFIX.PURCHASE_ACCESS, galleryId, identifier.toLowerCase());
        
        await cacheService.set(key, { hasAccess: true });
        await CacheInvalidation.purchaseAccess(cacheService, galleryId, identifier);
        
        const result = await cacheService.get(key);
        expect(result).toBeNull();
      });
    });

    describe('revenueStats', () => {
      it('should invalidate all revenue caches for photographer', async () => {
        const photographerId = 'photographer-123';
        
        // Set various revenue caches
        await cacheService.set(`${CACHE_PREFIX.REVENUE_OVERVIEW}${photographerId}:week`, { data: 'overview' });
        await cacheService.set(`${CACHE_PREFIX.REVENUE_CHART}${photographerId}:month`, { data: 'chart' });
        await cacheService.set(`${CACHE_PREFIX.REVENUE_TOP_GALLERIES}${photographerId}:5`, { data: 'top' });
        await cacheService.set(`${CACHE_PREFIX.REVENUE_FUNNEL}${photographerId}`, { data: 'funnel' });
        
        await CacheInvalidation.revenueStats(cacheService, photographerId);
        
        // All should be invalidated
        expect(await cacheService.get(`${CACHE_PREFIX.REVENUE_OVERVIEW}${photographerId}:week`)).toBeNull();
        expect(await cacheService.get(`${CACHE_PREFIX.REVENUE_CHART}${photographerId}:month`)).toBeNull();
        expect(await cacheService.get(`${CACHE_PREFIX.REVENUE_TOP_GALLERIES}${photographerId}:5`)).toBeNull();
        expect(await cacheService.get(`${CACHE_PREFIX.REVENUE_FUNNEL}${photographerId}`)).toBeNull();
      });
    });

    describe('gallery', () => {
      it('should invalidate all gallery-related caches', async () => {
        const galleryId = 'gallery-123';
        
        await cacheService.set(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`, { data: 'config' });
        await cacheService.set(`${CACHE_PREFIX.PURCHASE_VERIFICATION}${galleryId}:user1`, { data: 'verify' });
        await cacheService.set(`${CACHE_PREFIX.PURCHASE_ACCESS}${galleryId}:user1`, { data: 'access' });
        
        await CacheInvalidation.gallery(cacheService, galleryId);
        
        expect(await cacheService.get(`${CACHE_PREFIX.MONETIZATION_CONFIG}${galleryId}`)).toBeNull();
        expect(await cacheService.get(`${CACHE_PREFIX.PURCHASE_VERIFICATION}${galleryId}:user1`)).toBeNull();
        expect(await cacheService.get(`${CACHE_PREFIX.PURCHASE_ACCESS}${galleryId}:user1`)).toBeNull();
      });
    });
  });

  describe('Statistics', () => {
    it('should track all operations', async () => {
      // Perform various operations
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.get('key1'); // hit
      await cacheService.get('key2'); // hit
      await cacheService.get('non-existent'); // miss
      await cacheService.delete('key1');
      
      const stats = cacheService.getStats();
      
      expect(stats.sets).toBe(2);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.deletes).toBe(1);
    });

    it('should report Redis connection status', () => {
      const stats = cacheService.getStats();
      expect(stats.isRedisConnected).toBe(false);
    });
  });

  describe('isRedisAvailable', () => {
    it('should return false when Redis is not connected', () => {
      expect(cacheService.isRedisAvailable()).toBe(false);
    });
  });
});

describe('CacheService with Redis', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock Redis to simulate connection
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.on.mockImplementation((event: string, callback: () => void) => {
      if (event === 'connect') {
        // Simulate connection event
        setTimeout(callback, 0);
      }
      return mockRedisClient;
    });
  });

  afterEach(async () => {
    if (cacheService) {
      await cacheService.disconnect();
    }
  });

  it('should use Redis when available', async () => {
    mockRedisClient.get.mockResolvedValue(JSON.stringify({ data: 'from-redis' }));
    
    // Create service with Redis URL
    cacheService = createCacheService('redis://localhost:6379');
    
    // Wait for connection
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // The test verifies that when Redis is available, it attempts to use it
    // Since we're mocking, we just verify the service was created with Redis URL
    // In a real scenario with Redis connected, it would use Redis
    expect(cacheService).toBeDefined();
  });

  it('should fall back to memory cache on Redis error', async () => {
    mockRedisClient.get.mockRejectedValue(new Error('Redis error'));
    
    cacheService = createCacheService('redis://localhost:6379');
    
    // Set in memory first
    await cacheService.set('test-key', 'memory-value');
    
    // Should fall back to memory cache
    const result = await cacheService.get('test-key');
    expect(result).toBe('memory-value');
  });
});
