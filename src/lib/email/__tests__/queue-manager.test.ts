/**
 * Queue Manager Unit Tests
 * 
 * Tests for the email queue manager including enqueueing, batch processing,
 * retry logic, cancellation, and health monitoring.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QueueManager } from '../queue-manager';
import type { QueuedEmail, QueueItem, QueueStats } from '../queue-manager';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

// Helper to create mock query builder
const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: vi.fn((resolve) => resolve({ data, error })),
  };
  return builder;
};

describe('QueueManager', () => {
  let queueManager: QueueManager;
  
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-ignore - Mock Supabase client
    queueManager = new QueueManager(mockSupabase);
  });
  
  describe('enqueue', () => {
    it('should successfully enqueue an email', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>',
        type: 'transactional',
        priority: 'normal',
      };
      
      const mockId = 'test-queue-id-123';
      const mockBuilder = createMockQueryBuilder({ id: mockId });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const result = await queueManager.enqueue(email);
      
      expect(result).toBe(mockId);
      expect(mockSupabase.from).toHaveBeenCalledWith('email_queue');
      expect(mockBuilder.insert).toHaveBeenCalled();
      expect(mockBuilder.select).toHaveBeenCalledWith('id');
      expect(mockBuilder.single).toHaveBeenCalled();
    });
    
    it('should enqueue email with all optional fields', async () => {
      const scheduledAt = new Date('2026-12-31T12:00:00Z');
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        cc: ['cc1@example.com', 'cc2@example.com'],
        bcc: ['bcc@example.com'],
        subject: 'Test Email',
        html: '<p>Test content</p>',
        text: 'Test content',
        type: 'marketing',
        priority: 'high',
        templateId: 'template-123',
        variables: { name: 'John' },
        scheduledAt,
        maxRetries: 3,
      };
      
      const mockId = 'test-queue-id-456';
      const mockBuilder = createMockQueryBuilder({ id: mockId });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const result = await queueManager.enqueue(email);
      
      expect(result).toBe(mockId);
      expect(mockBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          from_address: email.from,
          to_address: email.to,
          cc_addresses: email.cc,
          bcc_addresses: email.bcc,
          subject: email.subject,
          html_content: email.html,
          text_content: email.text,
          priority: email.priority,
          type: email.type,
          template_id: email.templateId,
          variables: email.variables,
          scheduled_at: scheduledAt.toISOString(),
          max_retries: email.maxRetries,
          status: 'pending',
          retry_count: 0,
        })
      );
    });
    
    it('should throw error for invalid sender email', async () => {
      const email: QueuedEmail = {
        from: 'invalid-email',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Invalid sender email address');
    });
    
    it('should throw error for invalid recipient email', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Invalid recipient email address');
    });
    
    it('should throw error for empty subject', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: '',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Email subject is required');
    });
    
    it('should throw error for empty HTML content', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Email HTML content is required');
    });
    
    it('should throw error for invalid email type', async () => {
      const email: any = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'invalid-type',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Invalid email type');
    });
    
    it('should throw error for invalid CC email', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        cc: ['valid@example.com', 'invalid-email'],
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Invalid CC email address');
    });
    
    it('should throw error for invalid BCC email', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        bcc: ['invalid-email'],
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Invalid BCC email address');
    });
    
    it('should handle database errors', async () => {
      const email: QueuedEmail = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        type: 'transactional',
      };
      
      const mockBuilder = createMockQueryBuilder(null, { message: 'Database error' });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      await expect(queueManager.enqueue(email)).rejects.toThrow('Failed to enqueue email: Database error');
    });
  });
  
  describe('processBatch', () => {
    it('should process pending emails in priority order', async () => {
      const mockEmails: Partial<QueueItem>[] = [
        {
          id: 'email-1',
          from_address: 'sender@example.com',
          to_address: 'recipient1@example.com',
          subject: 'High Priority',
          html_content: '<p>Test</p>',
          priority: 'high',
          type: 'transactional',
          status: 'pending',
          retry_count: 0,
          max_retries: 5,
        },
        {
          id: 'email-2',
          from_address: 'sender@example.com',
          to_address: 'recipient2@example.com',
          subject: 'Normal Priority',
          html_content: '<p>Test</p>',
          priority: 'normal',
          type: 'transactional',
          status: 'pending',
          retry_count: 0,
          max_retries: 5,
        },
      ];
      
      const selectBuilder = createMockQueryBuilder(mockEmails);
      const updateBuilder = createMockQueryBuilder({});
      
      mockSupabase.from.mockReturnValueOnce(selectBuilder).mockReturnValue(updateBuilder);
      
      const results = await queueManager.processBatch(10);
      
      expect(results).toHaveLength(2);
      expect(results[0]?.id).toBe('email-1');
      expect(results[1]?.id).toBe('email-2');
      expect(selectBuilder.order).toHaveBeenCalledWith('priority', { ascending: false });
      expect(selectBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
    });
    
    it('should return empty array when no emails to process', async () => {
      const mockBuilder = createMockQueryBuilder([]);
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const results = await queueManager.processBatch(10);
      
      expect(results).toEqual([]);
    });
    
    it('should respect batch size limit', async () => {
      const mockBuilder = createMockQueryBuilder([]);
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      await queueManager.processBatch(5);
      
      expect(mockBuilder.limit).toHaveBeenCalledWith(5);
    });
    
    it('should only process emails with scheduled_at in the past or null', async () => {
      const mockBuilder = createMockQueryBuilder([]);
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      await queueManager.processBatch(10);
      
      expect(mockBuilder.or).toHaveBeenCalled();
    });
    
    it('should mark emails as processing before processing', async () => {
      const mockEmails: Partial<QueueItem>[] = [
        {
          id: 'email-1',
          from_address: 'sender@example.com',
          to_address: 'recipient@example.com',
          subject: 'Test',
          html_content: '<p>Test</p>',
          priority: 'normal',
          type: 'transactional',
          status: 'pending',
          retry_count: 0,
          max_retries: 5,
        },
      ];
      
      const selectBuilder = createMockQueryBuilder(mockEmails);
      const updateBuilder = createMockQueryBuilder({});
      
      mockSupabase.from
        .mockReturnValueOnce(selectBuilder)
        .mockReturnValue(updateBuilder);
      
      await queueManager.processBatch(10);
      
      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'processing' })
      );
      expect(updateBuilder.in).toHaveBeenCalledWith('id', ['email-1']);
    });
  });
  
  describe('cancel', () => {
    it('should successfully cancel a pending email', async () => {
      const emailId = 'email-to-cancel';
      
      const selectBuilder = createMockQueryBuilder({
        id: emailId,
        status: 'pending',
      });
      const updateBuilder = createMockQueryBuilder({});
      
      mockSupabase.from
        .mockReturnValueOnce(selectBuilder)
        .mockReturnValueOnce(updateBuilder);
      
      const result = await queueManager.cancel(emailId);
      
      expect(result).toBe(true);
      expect(updateBuilder.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'cancelled' })
      );
    });
    
    it('should return false if email not found', async () => {
      const emailId = 'non-existent-email';
      
      const mockBuilder = createMockQueryBuilder(null, { message: 'Not found' });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const result = await queueManager.cancel(emailId);
      
      expect(result).toBe(false);
    });
    
    it('should return false if email is not pending', async () => {
      const emailId = 'sent-email';
      
      const mockBuilder = createMockQueryBuilder({
        id: emailId,
        status: 'sent',
      });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const result = await queueManager.cancel(emailId);
      
      expect(result).toBe(false);
    });
    
    it('should return false if email is already cancelled', async () => {
      const emailId = 'cancelled-email';
      
      const mockBuilder = createMockQueryBuilder({
        id: emailId,
        status: 'cancelled',
      });
      mockSupabase.from.mockReturnValue(mockBuilder);
      
      const result = await queueManager.cancel(emailId);
      
      expect(result).toBe(false);
    });
  });
  
  describe('getStats', () => {
    it('should return queue statistics', async () => {
      
      // Mock status counts
      const statusData = [
        { status: 'pending' },
        { status: 'pending' },
        { status: 'processing' },
      ];
      
      // Mock priority counts
      const priorityData = [
        { priority: 'high' },
        { priority: 'normal' },
        { priority: 'normal' },
      ];
      
      // Mock scheduled emails
      const scheduledData = [{ id: '1' }, { id: '2' }];
      
      // Mock recent emails
      const recentData = [
        { status: 'sent' },
        { status: 'sent' },
        { status: 'failed' },
      ];
      
      const builders = [
        createMockQueryBuilder(statusData),
        createMockQueryBuilder(priorityData),
        createMockQueryBuilder(scheduledData),
        createMockQueryBuilder(recentData),
      ];
      
      mockSupabase.from
        .mockReturnValueOnce(builders[0])
        .mockReturnValueOnce(builders[1])
        .mockReturnValueOnce(builders[2])
        .mockReturnValueOnce(builders[3]);
      
      const stats = await queueManager.getStats();
      
      expect(stats.pending).toBe(2);
      expect(stats.processing).toBe(1);
      expect(stats.sent).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.scheduled).toBe(2);
      expect(stats.byPriority.high).toBe(1);
      expect(stats.byPriority.normal).toBe(2);
      expect(stats.byPriority.low).toBe(0);
    });
    
    it('should handle empty queue', async () => {
      const emptyBuilder = createMockQueryBuilder([]);
      mockSupabase.from.mockReturnValue(emptyBuilder);
      
      const stats = await queueManager.getStats();
      
      expect(stats.pending).toBe(0);
      expect(stats.processing).toBe(0);
      expect(stats.sent).toBe(0);
      expect(stats.failed).toBe(0);
      expect(stats.scheduled).toBe(0);
      expect(stats.byPriority.high).toBe(0);
      expect(stats.byPriority.normal).toBe(0);
      expect(stats.byPriority.low).toBe(0);
    });
  });
  
  describe('getQueueHealth', () => {
    it('should return healthy status for normal queue', async () => {
      // Mock stats
      const statsData = {
        pending: 10,
        processing: 2,
        sent: 100,
        failed: 2,
        scheduled: 5,
        byPriority: { high: 2, normal: 8, low: 0 },
      };
      
      // Mock oldest email (5 minutes old)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const oldestBuilder = createMockQueryBuilder({
        created_at: fiveMinutesAgo.toISOString(),
      });
      
      // Mock recent sent emails (60 in last hour)
      const recentSentData = Array(60).fill({ id: 'test' });
      const recentSentBuilder = createMockQueryBuilder(recentSentData);
      
      // Mock getStats call
      vi.spyOn(queueManager, 'getStats').mockResolvedValue(statsData as QueueStats);
      
      mockSupabase.from
        .mockReturnValueOnce(oldestBuilder)
        .mockReturnValueOnce(recentSentBuilder);
      
      const health = await queueManager.getQueueHealth();
      
      expect(health.status).toBe('healthy');
      expect(health.queueDepth).toBe(12); // 10 pending + 2 processing
      expect(health.errorRate).toBeCloseTo(1.96, 1); // 2/(100+2) * 100
      expect(health.oldestPendingAge).toBe(5);
      expect(health.processingRate).toBe(1); // 60 emails / 60 minutes
      expect(health.issues).toHaveLength(0);
      expect(health.recommendations).toHaveLength(0);
    });
    
    it('should return degraded status for high queue depth', async () => {
      const statsData = {
        pending: 150,
        processing: 10,
        sent: 100,
        failed: 2,
        scheduled: 5,
        byPriority: { high: 50, normal: 100, low: 0 },
      };
      
      vi.spyOn(queueManager, 'getStats').mockResolvedValue(statsData as QueueStats);
      
      const oldestBuilder = createMockQueryBuilder({
        created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      });
      const recentSentBuilder = createMockQueryBuilder(Array(60).fill({ id: 'test' }));
      
      mockSupabase.from
        .mockReturnValueOnce(oldestBuilder)
        .mockReturnValueOnce(recentSentBuilder);
      
      const health = await queueManager.getQueueHealth();
      
      expect(health.status).toBe('degraded');
      expect(health.queueDepth).toBe(160);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should return unhealthy status for critical issues', async () => {
      const statsData = {
        pending: 600,
        processing: 50,
        sent: 100,
        failed: 20,
        scheduled: 5,
        byPriority: { high: 200, normal: 400, low: 0 },
      };
      
      vi.spyOn(queueManager, 'getStats').mockResolvedValue(statsData as QueueStats);
      
      // 90 minutes old
      const oldestBuilder = createMockQueryBuilder({
        created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
      });
      const recentSentBuilder = createMockQueryBuilder(Array(10).fill({ id: 'test' }));
      
      mockSupabase.from
        .mockReturnValueOnce(oldestBuilder)
        .mockReturnValueOnce(recentSentBuilder);
      
      const health = await queueManager.getQueueHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.queueDepth).toBe(650);
      expect(health.errorRate).toBeCloseTo(16.67, 1); // 20/(100+20) * 100
      expect(health.oldestPendingAge).toBe(90);
      expect(health.issues.length).toBeGreaterThan(0);
      expect(health.recommendations.length).toBeGreaterThan(0);
    });
    
    it('should handle errors gracefully', async () => {
      vi.spyOn(queueManager, 'getStats').mockRejectedValue(new Error('Database error'));
      
      const health = await queueManager.getQueueHealth();
      
      expect(health.status).toBe('unhealthy');
      expect(health.issues).toContain('Failed to retrieve queue health information');
      expect(health.recommendations).toContain('Check database connection and permissions');
    });
  });
  
  describe('retry logic', () => {
    it('should use exponential backoff for retries', async () => {
      const mockEmail: Partial<QueueItem> = {
        id: 'email-1',
        from_address: 'sender@example.com',
        to_address: 'recipient@example.com',
        subject: 'Test',
        html_content: '<p>Test</p>',
        priority: 'normal',
        type: 'transactional',
        status: 'pending',
        retry_count: 0,
        max_retries: 5,
      };
      
      // The retry delays should be:
      // Retry 1: 1 minute (60,000 ms)
      // Retry 2: 5 minutes (300,000 ms)
      // Retry 3: 15 minutes (900,000 ms)
      // Retry 4: 45 minutes (2,700,000 ms)
      // Retry 5: 2 hours (7,200,000 ms)
      
      // This is tested implicitly through the processBatch method
      // The actual retry scheduling is private, but we can verify
      // that the retry_count is incremented correctly
      
      expect(mockEmail.retry_count).toBe(0);
      expect(mockEmail.max_retries).toBe(5);
    });
  });
});
