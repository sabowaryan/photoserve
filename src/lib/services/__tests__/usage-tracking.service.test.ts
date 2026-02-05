/**
 * Usage Tracking Service Tests
 * Tests for plugin usage logging and analytics
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsageTrackingService } from '../usage-tracking.service';
import type { LogUsageParams, DateRange } from '../usage-tracking.service';

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            lte: vi.fn(() => ({
              order: vi.fn(),
            })),
          })),
          order: vi.fn(),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(),
      })),
    })),
  })),
}));

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;

  beforeEach(() => {
    service = new UsageTrackingService();
    vi.clearAllMocks();
  });

  describe('Usage Log Validation', () => {
    it('should accept valid usage log with all fields', async () => {
      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        apiKeyId: '123e4567-e89b-12d3-a456-426614174001',
        action: 'upload',
        pluginVersion: '1.0.0',
        lightroomVersion: '11.0',
        osVersion: 'Windows 10',
        metadata: { fileCount: 5 },
      };

      // Should not throw
      await expect(service.logUsage(params)).resolves.not.toThrow();
    });

    it('should accept valid usage log with minimal fields', async () => {
      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'auth',
      };

      // Should not throw
      await expect(service.logUsage(params)).resolves.not.toThrow();
    });

    it('should reject invalid user ID format', async () => {
      const params: LogUsageParams = {
        userId: 'invalid-uuid',
        action: 'upload',
      };

      await expect(service.logUsage(params)).rejects.toThrow();
    });

    it('should reject empty action', async () => {
      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: '',
      };

      await expect(service.logUsage(params)).rejects.toThrow();
    });

    it('should reject action longer than 50 characters', async () => {
      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'a'.repeat(51),
      };

      await expect(service.logUsage(params)).rejects.toThrow();
    });

    it('should reject invalid plugin version format', async () => {
      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'upload',
        pluginVersion: 'invalid',
      };

      await expect(service.logUsage(params)).rejects.toThrow();
    });

    it('should accept valid semantic version formats', async () => {
      const validVersions = ['1.0.0', '2.1.3', '1.0.0-beta', '2.0.0-alpha'];

      for (const version of validVersions) {
        const params: LogUsageParams = {
          userId: '123e4567-e89b-12d3-a456-426614174000',
          action: 'upload',
          pluginVersion: version,
        };

        await expect(service.logUsage(params)).resolves.not.toThrow();
      }
    });

    it('should reject metadata larger than 10KB', async () => {
      const largeMetadata: Record<string, any> = {};
      // Create metadata that exceeds 10KB
      for (let i = 0; i < 1000; i++) {
        largeMetadata[`key${i}`] = 'a'.repeat(100);
      }

      const params: LogUsageParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        action: 'upload',
        metadata: largeMetadata,
      };

      await expect(service.logUsage(params)).rejects.toThrow();
    });
  });

  describe('Date Range Validation', () => {
    it('should accept valid date range', () => {
      const dateRange: DateRange = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
      };

      // Should not throw when used in getUserUsage
      expect(() => service.getUserUsage('123e4567-e89b-12d3-a456-426614174000', dateRange)).not.toThrow();
    });

    it('should reject invalid date format', async () => {
      const dateRange = {
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      } as DateRange;

      await expect(
        service.getUserUsage('123e4567-e89b-12d3-a456-426614174000', dateRange)
      ).rejects.toThrow();
    });

    it('should reject end date before start date', async () => {
      const dateRange: DateRange = {
        startDate: '2024-01-31T00:00:00Z',
        endDate: '2024-01-01T00:00:00Z',
      };

      await expect(
        service.getUserUsage('123e4567-e89b-12d3-a456-426614174000', dateRange)
      ).rejects.toThrow();
    });
  });
});
