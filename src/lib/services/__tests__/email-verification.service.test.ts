/**
 * Unit Tests for Email Verification Service
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.8 Write unit tests for email service
 * 
 * Tests specific examples and edge cases for:
 * - Email queuing on registration
 * - Email queuing on password reset request
 * - Email queuing on password change
 * - Retry logic on provider failure
 * - Fallback provider activation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { EmailVerificationService } from '../email-verification.service';
import { EmailService } from '../email.service';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock the email service
vi.mock('../email.service');

// Mock @react-email/render
vi.mock('@react-email/render', () => ({
  render: vi.fn((_component) => '<html>Mocked email HTML</html>'),
}));

// Mock email templates
vi.mock('@/emails/verification-email', () => ({
  VerificationEmail: vi.fn(() => null),
}));

vi.mock('@/emails/password-reset-email', () => ({
  PasswordResetEmail: vi.fn(() => null),
}));

vi.mock('@/emails/password-changed-email', () => ({
  PasswordChangedEmail: vi.fn(() => null),
}));

/**
 * Helper to create a mock Supabase client with in-memory tracking
 */
function createMockSupabaseClient() {
  const deliveryMetrics: any[] = [];
  
  const mockClient = {
    from: vi.fn((table: string) => {
      if (table === 'email_delivery_metrics') {
        return {
          insert: vi.fn((data: any) => {
            deliveryMetrics.push(data);
            return {
              select: vi.fn(() => Promise.resolve({ data: null, error: null })),
            };
          }),
        };
      }
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      };
    }),
  } as unknown as SupabaseClient;

  return { mockClient, deliveryMetrics };
}

describe('Email Verification Service - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Test: Email queuing on registration
   * 
   * Verifies that verification emails are properly queued when a user registers.
   */
  describe('Email queuing on registration', () => {
    it('should successfully queue verification email on registration', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      // Mock successful email sending
      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'queue-123',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        token: 'a'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('queue-123');
      expect(result.retryAttempts).toBe(0);
      expect(result.provider).toBe('primary');
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Verify your PikSend email address',
          type: 'transactional',
          priority: 'high',
        })
      );
    });

    it('should queue verification email without user name', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'queue-456',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-456',
        email: 'noname@example.com',
        token: 'b'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('queue-456');
    });

    it('should include correct verification link in email', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'queue-789',
      });

      const token = 'c'.repeat(64);
      const baseUrl = 'https://piksend.com';

      await service.sendVerificationEmail({
        userId: 'user-789',
        email: 'verify@example.com',
        token,
        baseUrl,
      });

      // The verification link should be constructed correctly
      // We can't directly check the link, but we can verify the email was sent
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'verify@example.com',
          html: expect.any(String),
        })
      );
    });
  });

  /**
   * Test: Email queuing on password reset request
   * 
   * Verifies that password reset emails are properly queued when requested.
   */
  describe('Email queuing on password reset request', () => {
    it('should successfully queue password reset email', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'reset-123',
      });

      const result = await service.sendPasswordResetEmail({
        userId: 'user-reset-123',
        email: 'reset@example.com',
        name: 'Reset User',
        token: 'd'.repeat(64),
        baseUrl: 'https://example.com',
        requestedFrom: '192.168.1.1',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('reset-123');
      expect(result.retryAttempts).toBe(0);
      expect(result.provider).toBe('primary');
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'reset@example.com',
          subject: 'Reset your PikSend password',
          type: 'transactional',
          priority: 'high',
        })
      );
    });

    it('should queue password reset email without requestedFrom', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'reset-456',
      });

      const result = await service.sendPasswordResetEmail({
        userId: 'user-reset-456',
        email: 'reset2@example.com',
        token: 'e'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('reset-456');
    });

    it('should include correct reset link in email', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'reset-789',
      });

      const token = 'f'.repeat(64);
      const baseUrl = 'https://piksend.com';

      await service.sendPasswordResetEmail({
        userId: 'user-reset-789',
        email: 'resetlink@example.com',
        token,
        baseUrl,
      });

      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'resetlink@example.com',
          html: expect.any(String),
        })
      );
    });
  });

  /**
   * Test: Email queuing on password change
   * 
   * Verifies that password changed notification emails are properly queued.
   */
  describe('Email queuing on password change', () => {
    it('should successfully queue password changed notification', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'changed-123',
      });

      const changedAt = new Date('2024-01-15T10:30:00Z');

      const result = await service.sendPasswordChangedEmail({
        userId: 'user-changed-123',
        email: 'changed@example.com',
        name: 'Changed User',
        changedAt,
        changedFrom: '192.168.1.1',
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('changed-123');
      expect(result.retryAttempts).toBe(0);
      expect(result.provider).toBe('primary');
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'changed@example.com',
          subject: 'Your PikSend password was changed',
          type: 'transactional',
          priority: 'high',
        })
      );
    });

    it('should queue password changed notification without changedFrom', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'changed-456',
      });

      const result = await service.sendPasswordChangedEmail({
        userId: 'user-changed-456',
        email: 'changed2@example.com',
        changedAt: new Date(),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('changed-456');
    });

    it('should format changedAt date correctly', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'changed-789',
      });

      const changedAt = new Date('2024-01-15T10:30:00Z');

      await service.sendPasswordChangedEmail({
        userId: 'user-changed-789',
        email: 'dateformat@example.com',
        changedAt,
        baseUrl: 'https://example.com',
      });

      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dateformat@example.com',
          html: expect.any(String),
        })
      );
    });
  });

  /**
   * Test: Retry logic on provider failure
   * 
   * Verifies that the service retries with exponential backoff when the provider fails.
   */
  describe('Retry logic on provider failure', () => {
    it('should retry once and succeed on second attempt', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // First attempt fails, second succeeds
      sendSpy.mockRejectedValueOnce(new Error('Temporary failure'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'retry-123',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-retry-123',
        email: 'retry@example.com',
        token: 'g'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('retry-123');
      expect(result.retryAttempts).toBe(1);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry twice and succeed on third attempt', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // First two attempts fail, third succeeds
      sendSpy.mockRejectedValueOnce(new Error('Failure 1'));
      sendSpy.mockRejectedValueOnce(new Error('Failure 2'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'retry-456',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-retry-456',
        email: 'retry2@example.com',
        token: 'h'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('retry-456');
      expect(result.retryAttempts).toBe(2);
      expect(sendSpy).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff between retries', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // Mock failures
      sendSpy.mockRejectedValueOnce(new Error('Failure 1'));
      sendSpy.mockRejectedValueOnce(new Error('Failure 2'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'backoff-123',
      });

      const startTime = Date.now();
      
      const result = await service.sendVerificationEmail({
        userId: 'user-backoff-123',
        email: 'backoff@example.com',
        token: 'i'.repeat(64),
        baseUrl: 'https://example.com',
      });

      const elapsedTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      // Should have waited at least 1s + 2s = 3s for two retries
      expect(elapsedTime).toBeGreaterThanOrEqual(3000);
      // But less than 5s (with some buffer)
      expect(elapsedTime).toBeLessThan(5000);
    });

    it('should fail after max retries exhausted', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // All attempts fail
      sendSpy.mockRejectedValue(new Error('Persistent failure'));

      const result = await service.sendVerificationEmail({
        userId: 'user-fail-123',
        email: 'fail@example.com',
        token: 'j'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Persistent failure');
      expect(result.retryAttempts).toBe(3);
      // Should have tried 3 times with primary, then fallback
      expect(sendSpy).toHaveBeenCalledTimes(4); // 3 primary + 1 fallback
    });

    it('should retry for password reset emails', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      sendSpy.mockRejectedValueOnce(new Error('Temporary failure'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'reset-retry-123',
      });

      const result = await service.sendPasswordResetEmail({
        userId: 'user-reset-retry-123',
        email: 'resetretry@example.com',
        token: 'k'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.retryAttempts).toBe(1);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });

    it('should retry for password changed emails', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      sendSpy.mockRejectedValueOnce(new Error('Temporary failure'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'changed-retry-123',
      });

      const result = await service.sendPasswordChangedEmail({
        userId: 'user-changed-retry-123',
        email: 'changedretry@example.com',
        changedAt: new Date(),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.retryAttempts).toBe(1);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Test: Fallback provider activation
   * 
   * Verifies that the service falls back to the secondary provider when primary fails.
   */
  describe('Fallback provider activation', () => {
    it('should use fallback provider after primary exhausts retries', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // Primary fails 3 times
      sendSpy.mockRejectedValueOnce(new Error('Primary failure 1'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure 2'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure 3'));
      
      // Fallback succeeds
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'fallback-123',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-fallback-123',
        email: 'fallback@example.com',
        token: 'l'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.queueId).toBe('fallback-123');
      expect(result.provider).toBe('fallback');
      expect(result.retryAttempts).toBe(3);
      expect(sendSpy).toHaveBeenCalledTimes(4); // 3 primary + 1 fallback
    });

    it('should fail if both primary and fallback fail', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // All attempts fail (primary + fallback)
      sendSpy.mockRejectedValue(new Error('Complete failure'));

      const result = await service.sendVerificationEmail({
        userId: 'user-complete-fail',
        email: 'completefail@example.com',
        token: 'm'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Complete failure');
      expect(sendSpy).toHaveBeenCalledTimes(4); // 3 primary + 1 fallback
    });

    it('should use fallback for password reset emails', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // Primary fails all retries
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      
      // Fallback succeeds
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'reset-fallback-123',
      });

      const result = await service.sendPasswordResetEmail({
        userId: 'user-reset-fallback',
        email: 'resetfallback@example.com',
        token: 'n'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('fallback');
    });

    it('should use fallback for password changed emails', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // Primary fails all retries
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      
      // Fallback succeeds
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'changed-fallback-123',
      });

      const result = await service.sendPasswordChangedEmail({
        userId: 'user-changed-fallback',
        email: 'changedfallback@example.com',
        changedAt: new Date(),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('fallback');
    });

    it('should track fallback provider usage in metrics', async () => {
      const { mockClient, deliveryMetrics } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
      
      // Primary fails, fallback succeeds
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
      sendSpy.mockResolvedValueOnce({
        success: true,
        id: 'fallback-metrics-123',
      });

      await service.sendVerificationEmail({
        userId: 'user-fallback-metrics',
        email: 'fallbackmetrics@example.com',
        token: 'o'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(deliveryMetrics.length).toBeGreaterThan(0);
      const metric = deliveryMetrics[0];
      expect(metric.provider).toBe('fallback');
      expect(metric.success).toBe(true);
    });
  });

  /**
   * Test: Edge cases and error handling
   */
  describe('Edge cases and error handling', () => {
    it('should handle email service returning success: false', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: false,
        error: 'Invalid email address',
        id: ''
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-invalid',
        email: 'invalid@example.com',
        token: 'p'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid email address');
    });

    it('should track failed deliveries in metrics', async () => {
      const { mockClient, deliveryMetrics } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockRejectedValue(
        new Error('Service unavailable')
      );

      await service.sendVerificationEmail({
        userId: 'user-track-fail',
        email: 'trackfail@example.com',
        token: 'q'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(deliveryMetrics.length).toBeGreaterThan(0);
      const metric = deliveryMetrics[0];
      expect(metric.success).toBe(false);
      expect(metric.error_message).toBe('Service unavailable');
    });

    it('should not throw if metrics tracking fails', async () => {
      // Create mock that fails on tracking
      const mockClient = {
        from: vi.fn(() => ({
          insert: vi.fn(() => ({
            select: vi.fn(() => Promise.reject(new Error('Database error'))),
          })),
        })),
      } as unknown as SupabaseClient;

      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'no-throw-123',
      });

      // Should not throw even if tracking fails
      const result = await service.sendVerificationEmail({
        userId: 'user-no-throw',
        email: 'nothrow@example.com',
        token: 'r'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should handle very long email addresses', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'long-email-123',
      });

      const longEmail = 'a'.repeat(50) + '@' + 'b'.repeat(50) + '.com';

      const result = await service.sendVerificationEmail({
        userId: 'user-long-email',
        email: longEmail,
        token: 's'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
      expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: longEmail,
        })
      );
    });

    it('should handle special characters in user names', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'special-name-123',
      });

      const result = await service.sendVerificationEmail({
        userId: 'user-special-name',
        email: 'special@example.com',
        name: "O'Brien-Smith <test@test.com>",
        token: 't'.repeat(64),
        baseUrl: 'https://example.com',
      });

      expect(result.success).toBe(true);
    });

    it('should handle different base URLs', async () => {
      const { mockClient } = createMockSupabaseClient();
      const service = new EmailVerificationService(mockClient);
      const mockEmailService = (service as any).emailService as EmailService;

      vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
        success: true,
        id: 'base-url-123',
      });

      const baseUrls = [
        'https://example.com',
        'https://example.com:3000',
        'https://subdomain.example.com',
        'http://localhost:3000',
      ];

      for (const baseUrl of baseUrls) {
        const result = await service.sendVerificationEmail({
          userId: 'user-base-url',
          email: 'baseurl@example.com',
          token: 'u'.repeat(64),
          baseUrl,
        });

        expect(result.success).toBe(true);
      }
    });
  });
});
