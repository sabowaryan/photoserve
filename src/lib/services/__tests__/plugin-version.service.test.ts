/**
 * Plugin Version Service Tests
 * Tests for plugin version management and semantic versioning
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PluginVersionService } from '../plugin-version.service';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    })),
  })),
}));

// Mock cache service
vi.mock('../cache.service', () => ({
  getCacheService: vi.fn(() => ({
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
  })),
}));

describe('PluginVersionService', () => {
  let service: PluginVersionService;

  beforeEach(() => {
    service = new PluginVersionService();
    vi.clearAllMocks();
  });

  describe('Semantic Version Parsing', () => {
    it('should parse stable version correctly', () => {
      const parseMethod = (service as any).parseVersion.bind(service);
      
      const result = parseMethod('1.2.3');
      
      expect(result.major).toBe(1);
      expect(result.minor).toBe(2);
      expect(result.patch).toBe(3);
      expect(result.prerelease).toBeNull();
    });

    it('should parse prerelease version correctly', () => {
      const parseMethod = (service as any).parseVersion.bind(service);
      
      const result = parseMethod('1.0.0-beta');
      
      expect(result.major).toBe(1);
      expect(result.minor).toBe(0);
      expect(result.patch).toBe(0);
      expect(result.prerelease).toBe('beta');
    });

    it('should throw error for invalid version format', () => {
      const parseMethod = (service as any).parseVersion.bind(service);
      
      expect(() => parseMethod('invalid')).toThrow();
      expect(() => parseMethod('1.2')).toThrow();
      expect(() => parseMethod('1.2.3.4')).toThrow();
    });
  });

  describe('Version Comparison', () => {
    it('should compare major versions correctly', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      expect(compareMethod('2.0.0', '1.0.0')).toBe(1);
      expect(compareMethod('1.0.0', '2.0.0')).toBe(-1);
      expect(compareMethod('1.0.0', '1.0.0')).toBe(0);
    });

    it('should compare minor versions correctly', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      expect(compareMethod('1.2.0', '1.1.0')).toBe(1);
      expect(compareMethod('1.1.0', '1.2.0')).toBe(-1);
    });

    it('should compare patch versions correctly', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      expect(compareMethod('1.0.2', '1.0.1')).toBe(1);
      expect(compareMethod('1.0.1', '1.0.2')).toBe(-1);
    });

    it('should treat stable versions as greater than prerelease versions', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      expect(compareMethod('1.0.0', '1.0.0-beta')).toBe(1);
      expect(compareMethod('1.0.0-beta', '1.0.0')).toBe(-1);
    });

    it('should compare prerelease tags alphabetically', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      expect(compareMethod('1.0.0-beta', '1.0.0-alpha')).toBe(1);
      expect(compareMethod('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
    });

    it('should handle complex version comparisons', () => {
      const compareMethod = (service as any).compareVersions.bind(service);
      
      // 2.0.0 > 1.9.9
      expect(compareMethod('2.0.0', '1.9.9')).toBe(1);
      
      // 1.1.0 > 1.0.9
      expect(compareMethod('1.1.0', '1.0.9')).toBe(1);
      
      // 1.0.10 > 1.0.9
      expect(compareMethod('1.0.10', '1.0.9')).toBe(1);
    });
  });

  describe('Version Sorting', () => {
    it('should sort versions in descending order', () => {
      const sortMethod = (service as any).sortVersionsDescending.bind(service);
      
      const versions = ['1.0.0', '2.0.0', '1.5.0', '1.0.1'];
      const sorted = sortMethod(versions);
      
      expect(sorted).toEqual(['2.0.0', '1.5.0', '1.0.1', '1.0.0']);
    });

    it('should sort prerelease versions correctly', () => {
      const sortMethod = (service as any).sortVersionsDescending.bind(service);
      
      const versions = ['1.0.0', '1.0.0-beta', '1.0.0-alpha', '2.0.0'];
      const sorted = sortMethod(versions);
      
      expect(sorted).toEqual(['2.0.0', '1.0.0', '1.0.0-beta', '1.0.0-alpha']);
    });
  });
});
