/**
 * Email Service Unit Tests
 * 
 * Tests for the EmailService class covering:
 * - Transactional email sending
 * - Marketing email sending
 * - Email scheduling
 * - Suppression checking
 * - Unsubscribe checking
 * - Email logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailService } from '../email.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Mock dependencies
vi.mock('@/lib/email/queue-manager');
vi.mock('../email-provider.service');

describe('EmailService', () => {
  let emailService: EmailService;
  let mockSupabase: any;
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            eq: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
          single: vi.fn(),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    };
    
    emailService = new EmailService(mockSupabase as unknown as SupabaseClient<Database>);
  });
  
  describe('sendTransactionalEmail', () => {
    it('should send a transactional email successfully', async () => {
      // Mock suppression check (not suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }, // Not found
            })),
          })),
        })),
      });
      
      // Mock default sender
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { email: 'noreply@example.com' },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      // Mock queue enqueue
      const mockEnqueue = vi.fn(() => Promise.resolve('queue-id-123'));
      (emailService as any).queueManager.enqueue = mockEnqueue;
      
      // Mock log email
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'log-id-123' },
              error: null,
            })),
          })),
        })),
      });
      
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'resend',
      }));
      
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBe('queue-id-123');
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Email',
          html: '<p>Test content</p>',
          type: 'transactional',
          priority: 'high',
        })
      );
    });
    
    it('should reject email if address is suppressed', async () => {
      // Mock suppression check (suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { reason: 'bounce', bounce_type: 'hard' },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.sendTransactionalEmail({
        to: 'bounced@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('suppressed');
      expect(result.error).toContain('bounce');
    });
    
    it('should reject if type is not transactional', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'marketing' as any,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('transactional');
    });
    
    it('should validate email parameters', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'invalid-email',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid recipient');
    });
  });
  
  describe('sendMarketingEmail', () => {
    it('should send a marketing email successfully', async () => {
      // Mock suppression check (not suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock unsubscribe check (not unsubscribed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock default sender
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { email: 'marketing@example.com' },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      // Mock queue enqueue
      const mockEnqueue = vi.fn(() => Promise.resolve('queue-id-456'));
      (emailService as any).queueManager.enqueue = mockEnqueue;
      
      // Mock log email
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'log-id-456' },
              error: null,
            })),
          })),
        })),
      });
      
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'resend',
      }));
      
      const result = await emailService.sendMarketingEmail({
        to: 'subscriber@example.com',
        subject: 'Newsletter',
        html: '<p>Newsletter content</p>',
        type: 'marketing',
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBe('queue-id-456');
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'subscriber@example.com',
          subject: 'Newsletter',
          type: 'marketing',
          priority: 'normal',
        })
      );
    });
    
    it('should reject email if address is unsubscribed', async () => {
      // Mock suppression check (not suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock unsubscribe check (unsubscribed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                unsubscribed_at: new Date().toISOString(),
                reason: 'Not interested',
              },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.sendMarketingEmail({
        to: 'unsubscribed@example.com',
        subject: 'Newsletter',
        html: '<p>Newsletter content</p>',
        type: 'marketing',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('unsubscribed');
    });
    
    it('should reject if type is not marketing', async () => {
      const result = await emailService.sendMarketingEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional' as any,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('marketing');
    });
  });
  
  describe('scheduleEmail', () => {
    it('should schedule an email successfully', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      
      // Mock suppression check (not suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock default sender
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { email: 'noreply@example.com' },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      // Mock queue enqueue
      const mockEnqueue = vi.fn(() => Promise.resolve('queue-id-789'));
      (emailService as any).queueManager.enqueue = mockEnqueue;
      
      // Mock log email
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'log-id-789' },
              error: null,
            })),
          })),
        })),
      });
      
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'resend',
      }));
      
      const result = await emailService.scheduleEmail({
        to: 'user@example.com',
        subject: 'Scheduled Email',
        html: '<p>Scheduled content</p>',
        type: 'transactional',
        scheduledAt: futureDate,
      });
      
      expect(result.success).toBe(true);
      expect(result.id).toBe('queue-id-789');
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          scheduledAt: futureDate,
        })
      );
    });
    
    it('should reject if scheduled time is in the past', async () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      
      const result = await emailService.scheduleEmail({
        to: 'user@example.com',
        subject: 'Scheduled Email',
        html: '<p>Scheduled content</p>',
        type: 'transactional',
        scheduledAt: pastDate,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('future');
    });
    
    it('should check unsubscribe for marketing emails', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      
      // Mock suppression check (not suppressed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock unsubscribe check (unsubscribed)
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                unsubscribed_at: new Date().toISOString(),
                reason: null,
              },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.scheduleEmail({
        to: 'unsubscribed@example.com',
        subject: 'Scheduled Marketing Email',
        html: '<p>Marketing content</p>',
        type: 'marketing',
        scheduledAt: futureDate,
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('unsubscribed');
    });
  });
  
  describe('checkUnsubscribed', () => {
    it('should return false if email is not unsubscribed', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      const result = await emailService.checkUnsubscribed('user@example.com');
      
      expect(result.isUnsubscribed).toBe(false);
    });
    
    it('should return true if email is unsubscribed', async () => {
      const unsubscribedAt = new Date();
      
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                unsubscribed_at: unsubscribedAt.toISOString(),
                reason: 'Not interested',
              },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.checkUnsubscribed('unsubscribed@example.com');
      
      expect(result.isUnsubscribed).toBe(true);
      expect(result.reason).toBe('Not interested');
      expect(result.unsubscribedAt).toBeInstanceOf(Date);
    });
    
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' },
            })),
          })),
        })),
      });
      
      const result = await emailService.checkUnsubscribed('user@example.com');
      
      // Should return false on error to avoid blocking emails
      expect(result.isUnsubscribed).toBe(false);
    });
  });
  
  describe('checkSuppressed', () => {
    it('should return false if email is not suppressed', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      const result = await emailService.checkSuppressed('user@example.com');
      
      expect(result.isSuppressed).toBe(false);
    });
    
    it('should return true if email is suppressed due to bounce', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                reason: 'bounce',
                bounce_type: 'hard',
              },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.checkSuppressed('bounced@example.com');
      
      expect(result.isSuppressed).toBe(true);
      expect(result.reason).toBe('bounce');
      expect(result.bounceType).toBe('hard');
    });
    
    it('should return true if email is suppressed due to complaint', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: {
                reason: 'complaint',
                bounce_type: null,
              },
              error: null,
            })),
          })),
        })),
      });
      
      const result = await emailService.checkSuppressed('complained@example.com');
      
      expect(result.isSuppressed).toBe(true);
      expect(result.reason).toBe('complaint');
      expect(result.bounceType).toBeNull();
    });
    
    it('should handle database errors gracefully', async () => {
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'SOME_ERROR', message: 'Database error' },
            })),
          })),
        })),
      });
      
      const result = await emailService.checkSuppressed('user@example.com');
      
      // Should return false on error to avoid blocking emails
      expect(result.isSuppressed).toBe(false);
    });
  });
  
  describe('logEmail', () => {
    it('should log an email successfully', async () => {
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'resend',
      }));
      
      // Mock insert
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'log-id-123' },
              error: null,
            })),
          })),
        })),
      });
      
      const logId = await emailService.logEmail({
        queueId: 'queue-id-123',
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        status: 'queued',
      });
      
      expect(logId).toBe('log-id-123');
    });
    
    it('should include optional parameters in log', async () => {
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'aws-ses',
      }));
      
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'log-id-456' },
            error: null,
          })),
        })),
      }));
      
      mockSupabase.from.mockReturnValueOnce({
        insert: mockInsert,
      });
      
      await emailService.logEmail({
        queueId: 'queue-id-456',
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        templateId: 'template-123',
        status: 'sent',
        errorMessage: 'Some error',
        metadata: { key: 'value' },
      });
      
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          template_id: 'template-123',
          error_message: 'Some error',
          metadata: { key: 'value' },
        })
      );
    });
  });
  
  describe('parameter validation', () => {
    it('should reject empty subject', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: '',
        html: '<p>Test content</p>',
        type: 'transactional',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('subject');
    });
    
    it('should reject empty HTML content', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '',
        type: 'transactional',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('HTML content');
    });
    
    it('should reject invalid CC addresses', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
        cc: ['invalid-email'],
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CC');
    });
    
    it('should reject invalid BCC addresses', async () => {
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
        bcc: ['invalid-email'],
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('BCC');
    });
    
    it('should accept valid CC and BCC addresses', async () => {
      // Mock suppression check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' },
            })),
          })),
        })),
      });
      
      // Mock default sender
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: { email: 'noreply@example.com' },
                error: null,
              })),
            })),
          })),
        })),
      });
      
      // Mock queue enqueue
      const mockEnqueue = vi.fn(() => Promise.resolve('queue-id-123'));
      (emailService as any).queueManager.enqueue = mockEnqueue;
      
      // Mock log email
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'log-id-123' },
              error: null,
            })),
          })),
        })),
      });
      
      // Mock provider service
      (emailService as any).providerService.getActiveProvider = vi.fn(() => Promise.resolve({
        name: 'resend',
      }));
      
      const result = await emailService.sendTransactionalEmail({
        to: 'user@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
      });
      
      expect(result.success).toBe(true);
      expect(mockEnqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          cc: ['cc@example.com'],
          bcc: ['bcc@example.com'],
        })
      );
    });
  });
});
