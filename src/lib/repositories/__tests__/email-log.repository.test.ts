/**
 * Email Log Repository Tests
 * 
 * Requirements: 8.1, 8.2, 8.3
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailLogRepository } from '../email-log.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

describe('EmailLogRepository', () => {
  let repository: EmailLogRepository;
  let mockSupabase: any;

  beforeEach(() => {
    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn(),
    };

    repository = new EmailLogRepository(mockSupabase as unknown as SupabaseClient<Database>);
  });

  describe('listLogs', () => {
    it('should fetch logs with default pagination', async () => {
      const mockLogs = [
        {
          id: '1',
          to_address: 'test@example.com',
          from_address: 'sender@example.com',
          subject: 'Test Email',
          status: 'delivered',
          provider: 'resend',
          created_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
          count: 1,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await repository.listLogs();

      expect(mockSupabase.from).toHaveBeenCalledWith('email_logs');
      expect(mockQuery.select).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(result.logs).toEqual(mockLogs);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });

    it('should apply status filter', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.listLogs({ status: 'failed' });

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'failed');
    });

    it('should apply date range filters', async () => {
      const dateFrom = new Date('2024-01-01');
      const dateTo = new Date('2024-01-31');

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.listLogs({ dateFrom, dateTo });

      expect(mockQuery.gte).toHaveBeenCalledWith('created_at', dateFrom.toISOString());
      expect(mockQuery.lte).toHaveBeenCalledWith('created_at', dateTo.toISOString());
    });

    it('should apply search filters', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await repository.listLogs({ recipient: 'test@example.com' });

      expect(mockQuery.ilike).toHaveBeenCalledWith('to_address', '%test@example.com%');
    });
  });

  describe('getLogById', () => {
    it('should fetch a log with events', async () => {
      const mockLog = {
        id: '1',
        to_address: 'test@example.com',
        from_address: 'sender@example.com',
        subject: 'Test Email',
        status: 'delivered',
        provider: 'resend',
        created_at: new Date().toISOString(),
      };

      const mockEvents = [
        {
          id: 'e1',
          log_id: '1',
          event_type: 'delivered',
          created_at: new Date().toISOString(),
        },
      ];

      const mockLogQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockLog,
          error: null,
        }),
      };

      const mockEventsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: mockEvents,
          error: null,
        }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_logs') return mockLogQuery;
        if (table === 'email_events') return mockEventsQuery;
        return mockLogQuery;
      });

      const result = await repository.getLogById('1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.events).toEqual(mockEvents);
    });

    it('should return null for non-existent log', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await repository.getLogById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getLogStats', () => {
    it('should calculate statistics correctly', async () => {
      const mockLogs = [
        {
          status: 'delivered',
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
          opened_at: new Date().toISOString(),
          clicked_at: null,
          bounced_at: null,
          failed_at: null,
        },
        {
          status: 'failed',
          sent_at: new Date().toISOString(),
          delivered_at: null,
          opened_at: null,
          clicked_at: null,
          bounced_at: null,
          failed_at: new Date().toISOString(),
        },
      ];

      const mockQuery = {
        select: vi.fn().mockResolvedValue({
          data: mockLogs,
          error: null,
        }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const stats = await repository.getLogStats();

      expect(stats.total).toBe(2);
      expect(stats.sent).toBe(2);
      expect(stats.delivered).toBe(1);
      expect(stats.opened).toBe(1);
      expect(stats.clicked).toBe(0);
      expect(stats.bounced).toBe(0);
      expect(stats.failed).toBe(1);
    });
  });
});
