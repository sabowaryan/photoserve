/**
 * API Key Service Tests
 * Tests for API key generation, validation, and management
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { APIKeyService } from '../api-key.service';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}));

describe('APIKeyService', () => {
  let service: APIKeyService;

  beforeEach(() => {
    service = new APIKeyService();
    vi.clearAllMocks();
  });

  describe('API Key Generation', () => {
    it('should generate API key with correct format', () => {
      // Access private method through reflection for testing
      const generateMethod = (service as any).generateAPIKey.bind(service);
      const result = generateMethod();

      // Verify key format: pk_live_<32_chars>
      expect(result.key).toMatch(/^pk_live_[A-Za-z0-9_-]{32}$/);
      
      // Verify hash is 64 hex characters (SHA-256)
      expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
      
      // Verify prefix is first 12 characters
      expect(result.prefix).toBe(result.key.substring(0, 12));
      expect(result.prefix).toHaveLength(12);
      expect(result.prefix).toMatch(/^pk_live_/);
    });

    it('should generate unique keys', () => {
      const generateMethod = (service as any).generateAPIKey.bind(service);
      const keys = new Set();
      
      // Generate 100 keys and verify all are unique
      for (let i = 0; i < 100; i++) {
        const result = generateMethod();
        keys.add(result.key);
      }
      
      expect(keys.size).toBe(100);
    });
  });

  describe('API Key Hashing', () => {
    it('should hash API key consistently', () => {
      const hashMethod = (service as any).hashAPIKey.bind(service);
      const key = 'pk_live_test123456789012345678901234';
      
      const hash1 = hashMethod(key);
      const hash2 = hashMethod(key);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should produce different hashes for different keys', () => {
      const hashMethod = (service as any).hashAPIKey.bind(service);
      
      const hash1 = hashMethod('pk_live_key1');
      const hash2 = hashMethod('pk_live_key2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Constant Time Comparison', () => {
    it('should return true for equal strings', () => {
      const compareMethod = (service as any).constantTimeCompare.bind(service);
      
      const result = compareMethod('test123', 'test123');
      expect(result).toBe(true);
    });

    it('should return false for different strings', () => {
      const compareMethod = (service as any).constantTimeCompare.bind(service);
      
      const result = compareMethod('test123', 'test456');
      expect(result).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const compareMethod = (service as any).constantTimeCompare.bind(service);
      
      const result = compareMethod('test', 'testing');
      expect(result).toBe(false);
    });
  });
});
