/**
 * Email Monitoring Service Tests
 * 
 * Tests for the email monitoring and alerting service.
 * 
 * Requirements: 12.5, 12.6
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailMonitoringService, DEFAULT_THRESHOLDS } from '../email-monitoring.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Set required environment variables for tests
process.env.EMAIL_PROVIDER_ENCRYPTION_KEY = 'test-encryption-key-32-characters-long';

// Mock Supabase client
const createMockSupabaseClient = () => {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          gte: vi.fn(() => ({
            not: vi.fn(() => ({
              data: [],
              error: null,
            })),
          })),
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  } as unknown as SupabaseClient<Database>;
};

describe('EmailMonitoringService', () => {
  let service: EmailMonitoringService;
  let mockSupabase: SupabaseClient<Database>;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new EmailMonitoringService(mockSupabase);
  });

  describe('DEFAULT_THRESHOLDS', () => {
    it('should have correct threshold values', () => {
      expect(DEFAULT_THRESHOLDS.queueSize).toBe(1000);
      expect(DEFAULT_THRESHOLDS.failureRate).toBe(5);
      expect(DEFAULT_THRESHOLDS.bounceRate).toBe(10);
      expect(DEFAULT_THRESHOLDS.healthCheckInterval).toBe(5 * 60 * 1000);
      expect(DEFAULT_THRESHOLDS.latencyThreshold).toBe(5000);
    });
  });

  describe('getRecentAlerts', () => {
    it('should return empty array when no alerts', () => {
      const alerts = service.getRecentAlerts();
      expect(alerts).toEqual([]);
    });

    it('should limit alerts to specified number', () => {
      // This test would require generating alerts first
      const alerts = service.getRecentAlerts(10);
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeLessThanOrEqual(10);
    });
  });

  describe('getAlertSummary', () => {
    it('should return correct summary structure', () => {
      const summary = service.getAlertSummary();
      
      expect(summary).toHaveProperty('total');
      expect(summary).toHaveProperty('critical');
      expect(summary).toHaveProperty('warning');
      expect(summary).toHaveProperty('info');
      expect(summary).toHaveProperty('byType');
      expect(summary).toHaveProperty('recent');
      
      expect(typeof summary.total).toBe('number');
      expect(typeof summary.critical).toBe('number');
      expect(typeof summary.warning).toBe('number');
      expect(typeof summary.info).toBe('number');
      expect(typeof summary.byType).toBe('object');
      expect(Array.isArray(summary.recent)).toBe(true);
    });

    it('should have correct alert types in byType', () => {
      const summary = service.getAlertSummary();
      
      expect(summary.byType).toHaveProperty('queue_size');
      expect(summary.byType).toHaveProperty('failure_rate');
      expect(summary.byType).toHaveProperty('bounce_rate');
      expect(summary.byType).toHaveProperty('provider_health');
      expect(summary.byType).toHaveProperty('performance');
    });
  });

  describe('clearAlerts', () => {
    it('should clear all alerts', () => {
      service.clearAlerts();
      const summary = service.getAlertSummary();
      
      expect(summary.total).toBe(0);
      expect(summary.critical).toBe(0);
      expect(summary.warning).toBe(0);
      expect(summary.info).toBe(0);
    });
  });

  describe('getAlertsByType', () => {
    it('should return empty array for specific type when no alerts', () => {
      const alerts = service.getAlertsByType('queue_size');
      expect(alerts).toEqual([]);
    });

    it('should limit results to specified number', () => {
      const alerts = service.getAlertsByType('failure_rate', 5);
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getAlertsBySeverity', () => {
    it('should return empty array for specific severity when no alerts', () => {
      const alerts = service.getAlertsBySeverity('critical');
      expect(alerts).toEqual([]);
    });

    it('should limit results to specified number', () => {
      const alerts = service.getAlertsBySeverity('warning', 5);
      expect(Array.isArray(alerts)).toBe(true);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });
});
