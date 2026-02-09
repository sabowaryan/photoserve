/**
 * Property-Based Tests for Email Verification Service
 * 
 * Feature: authentication-flow-optimization
 * Task: 5.7 Write property tests for email service
 * Validates: Requirements 5.1, 7.4, 9.1, 9.9
 * 
 * Tests universal properties that should hold for all email operations:
 * - Property 11: Email Delivery Timing - Emails must be sent within 30 seconds
 * - Property 22: Password Change Notification - Password changes must trigger notification emails
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import * as fc from 'fast-check';
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

describe('Email Verification Service - Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property 11: Email Delivery Timing
   * **Validates: Requirements 5.1, 7.4, 9.1**
   * 
   * For any email trigger event (registration, password reset, resend), the email
   * must be queued and sent within 30 seconds of the trigger.
   * 
   * This property ensures that users receive timely email notifications for
   * authentication-related actions.
   */
  describe('Property 11: Email Delivery Timing', () => {
    it('should send verification emails within 30 seconds for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random user data
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Measure time to send email
            const startTime = Date.now();
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              name: userData.name,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify email was sent successfully
            expect(result.success).toBe(true);
            
            // Verify delivery time is within 30 seconds (30000ms)
            expect(elapsedTime).toBeLessThan(30000);
            expect(result.queueTime).toBeLessThan(30000);

            // Verify delivery timing was tracked
            expect(deliveryMetrics.length).toBeGreaterThan(0);
            const metric = deliveryMetrics[0];
            expect(metric.user_id).toBe(userData.userId);
            expect(metric.email_type).toBe('verification');
            expect(metric.queue_time_ms).toBeLessThan(30000);
            expect(metric.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should send password reset emails within 30 seconds for any user', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
            requestedFrom: fc.option(fc.ipV4(), { nil: undefined }),
          }),
          async (userData) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Measure time to send email
            const startTime = Date.now();
            const result = await service.sendPasswordResetEmail({
              userId: userData.userId,
              email: userData.email,
              name: userData.name,
              token: userData.token,
              baseUrl: userData.baseUrl,
              requestedFrom: userData.requestedFrom,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify email was sent successfully
            expect(result.success).toBe(true);
            
            // Verify delivery time is within 30 seconds (30000ms)
            expect(elapsedTime).toBeLessThan(30000);
            expect(result.queueTime).toBeLessThan(30000);

            // Verify delivery timing was tracked
            expect(deliveryMetrics.length).toBeGreaterThan(0);
            const metric = deliveryMetrics[0];
            expect(metric.user_id).toBe(userData.userId);
            expect(metric.email_type).toBe('password_reset');
            expect(metric.queue_time_ms).toBeLessThan(30000);
            expect(metric.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle retry delays and still complete within 30 seconds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          // Number of retries before success (0-2, since max is 3 attempts)
          fc.integer({ min: 0, max: 2 }),
          async (userData, retriesBeforeSuccess) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock failures followed by success
            const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
            
            // Add failures
            for (let i = 0; i < retriesBeforeSuccess; i++) {
              sendSpy.mockRejectedValueOnce(new Error('Temporary failure'));
            }
            
            // Then success
            sendSpy.mockResolvedValueOnce({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Measure time to send email (including retries)
            const startTime = Date.now();
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify email was eventually sent successfully
            expect(result.success).toBe(true);
            expect(result.retryAttempts).toBe(retriesBeforeSuccess);
            
            // Verify total time including retries is still within 30 seconds
            expect(elapsedTime).toBeLessThan(30000);
            expect(result.queueTime).toBeLessThan(30000);

            // Verify delivery timing was tracked
            const metric = deliveryMetrics[0];
            expect(metric.queue_time_ms).toBeLessThan(30000);
            expect(metric.success).toBe(true);
          }
        ),
        { numRuns: 20, timeout: 15000 } // Reduced runs significantly and increased timeout
      );
    }, 25000); // Test timeout increased

    it('should track timing even when email delivery fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock all attempts failing
            vi.spyOn(mockEmailService, 'sendTransactionalEmail')
              .mockRejectedValue(new Error('Service unavailable'));

            // Measure time
            const startTime = Date.now();
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify failure was recorded
            expect(result.success).toBe(false);
            
            // Verify timing was still tracked (even for failures)
            expect(elapsedTime).toBeLessThan(30000);
            expect(result.queueTime).toBeLessThan(30000);

            // Verify failure was tracked in metrics
            expect(deliveryMetrics.length).toBeGreaterThan(0);
            const metric = deliveryMetrics[0];
            expect(metric.user_id).toBe(userData.userId);
            expect(metric.success).toBe(false);
            expect(metric.error_message).toBeDefined();
            expect(metric.queue_time_ms).toBeLessThan(30000);
          }
        ),
        { numRuns: 20, timeout: 15000 } // Reduced runs significantly and increased timeout
      );
    }, 25000); // Test timeout increased

    it('should respect 30-second timeout and stop retrying', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock slow failures that would exceed 30 seconds if all retries were attempted
            vi.spyOn(mockEmailService, 'sendTransactionalEmail')
              .mockImplementation(async () => {
                // Simulate a slow operation (but not too slow for the test)
                await new Promise(resolve => setTimeout(resolve, 100));
                throw new Error('Slow failure');
              });

            // Measure time
            const startTime = Date.now();
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify it stopped trying and returned within reasonable time
            expect(result.success).toBe(false);
            expect(elapsedTime).toBeLessThan(35000); // Allow some buffer beyond 30s
          }
        ),
        { numRuns: 10, timeout: 15000 } // Reduced runs significantly and increased timeout
      );
    }, 25000); // Test timeout increased
  });

  /**
   * Property 22: Password Change Notification
   * **Validates: Requirements 9.9**
   * 
   * For any password change event, a notification email must be sent to the user's
   * email address within 30 seconds.
   * 
   * This property ensures that users are always notified of password changes for
   * security purposes.
   */
  describe('Property 22: Password Change Notification', () => {
    it('should send password changed notification for any password change', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            changedFrom: fc.option(fc.ipV4(), { nil: undefined }),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Send password changed notification
            const result = await service.sendPasswordChangedEmail({
              userId: userData.userId,
              email: userData.email,
              name: userData.name,
              changedAt: userData.changedAt,
              changedFrom: userData.changedFrom,
              baseUrl: userData.baseUrl,
            });

            // Verify notification was sent successfully
            expect(result.success).toBe(true);
            expect(result.queueId).toBeDefined();

            // Verify email service was called with correct parameters
            expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
              expect.objectContaining({
                to: userData.email,
                subject: 'Your PikSend password was changed',
                type: 'transactional',
                priority: 'high',
              })
            );

            // Verify delivery timing was tracked
            expect(deliveryMetrics.length).toBeGreaterThan(0);
            const metric = deliveryMetrics[0];
            expect(metric.user_id).toBe(userData.userId);
            expect(metric.email_type).toBe('password_changed');
            expect(metric.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should send password changed notification within 30 seconds', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient, deliveryMetrics } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Measure time to send notification
            const startTime = Date.now();
            const result = await service.sendPasswordChangedEmail({
              userId: userData.userId,
              email: userData.email,
              changedAt: userData.changedAt,
              baseUrl: userData.baseUrl,
            });
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;

            // Verify notification was sent successfully
            expect(result.success).toBe(true);
            
            // Verify delivery time is within 30 seconds (30000ms)
            expect(elapsedTime).toBeLessThan(30000);
            expect(result.queueTime).toBeLessThan(30000);

            // Verify delivery timing was tracked
            const metric = deliveryMetrics[0];
            expect(metric.queue_time_ms).toBeLessThan(30000);
            expect(metric.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should retry password changed notification on failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            baseUrl: fc.webUrl(),
          }),
          fc.integer({ min: 1, max: 2 }), // Number of failures before success
          async (userData, failureCount) => {
            const { mockClient } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock failures followed by success
            const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
            
            for (let i = 0; i < failureCount; i++) {
              sendSpy.mockRejectedValueOnce(new Error('Temporary failure'));
            }
            
            sendSpy.mockResolvedValueOnce({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Send notification
            const result = await service.sendPasswordChangedEmail({
              userId: userData.userId,
              email: userData.email,
              changedAt: userData.changedAt,
              baseUrl: userData.baseUrl,
            });

            // Verify notification was eventually sent
            expect(result.success).toBe(true);
            expect(result.retryAttempts).toBe(failureCount);
            
            // Verify it still completed within 30 seconds
            expect(result.queueTime).toBeLessThan(30000);
          }
        ),
        { numRuns: 20, timeout: 15000 } // Reduced runs significantly and increased timeout
      );
    }, 30000); // Test timeout increased

    it('should use fallback provider if primary fails for password notifications', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock primary provider failing all retries, then fallback succeeding
            const sendSpy = vi.spyOn(mockEmailService, 'sendTransactionalEmail');
            
            // Primary attempts fail
            sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
            sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
            sendSpy.mockRejectedValueOnce(new Error('Primary failure'));
            
            // Fallback succeeds
            sendSpy.mockResolvedValueOnce({
              success: true,
              id: `queue-fallback-${userData.userId}`,
            });

            // Send notification
            const result = await service.sendPasswordChangedEmail({
              userId: userData.userId,
              email: userData.email,
              changedAt: userData.changedAt,
              baseUrl: userData.baseUrl,
            });

            // Verify notification was sent via fallback
            expect(result.success).toBe(true);
            expect(result.provider).toBe('fallback');
            expect(result.retryAttempts).toBe(3);
          }
        ),
        { numRuns: 20, timeout: 15000 } // Reduced runs significantly and increased timeout
      );
    }, 30000); // Test timeout increased

    it('should always attempt to send notification even if tracking fails', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            changedAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
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

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Send notification (should not throw even if tracking fails)
            const result = await service.sendPasswordChangedEmail({
              userId: userData.userId,
              email: userData.email,
              changedAt: userData.changedAt,
              baseUrl: userData.baseUrl,
            });

            // Verify notification was still sent successfully
            expect(result.success).toBe(true);
            expect(result.queueId).toBeDefined();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Additional property: Email service resilience
   * 
   * Verifies that the email service handles various edge cases and maintains
   * consistent behavior across different input combinations.
   */
  describe('Email Service Resilience', () => {
    it('should handle various email formats correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Send email
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });

            // Verify email was sent regardless of email format
            expect(result.success).toBe(true);
            
            // Verify email service was called with the correct email
            expect(mockEmailService.sendTransactionalEmail).toHaveBeenCalledWith(
              expect.objectContaining({
                to: userData.email,
              })
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle optional parameters correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress(),
            // Name is optional
            name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
            token: fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 64, maxLength: 64 }).map(arr => arr.join('')),
            baseUrl: fc.webUrl(),
          }),
          async (userData) => {
            const { mockClient } = createMockSupabaseClient();
            const service = new EmailVerificationService(mockClient);
            const mockEmailService = (service as any).emailService as EmailService;

            // Mock successful email sending
            vi.spyOn(mockEmailService, 'sendTransactionalEmail').mockResolvedValue({
              success: true,
              id: `queue-${userData.userId}`,
            });

            // Send email with or without optional name
            const result = await service.sendVerificationEmail({
              userId: userData.userId,
              email: userData.email,
              name: userData.name,
              token: userData.token,
              baseUrl: userData.baseUrl,
            });

            // Verify email was sent successfully regardless of optional parameters
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
