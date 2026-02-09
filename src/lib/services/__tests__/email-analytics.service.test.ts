/**
 * Email Analytics Service Tests
 * 
 * Tests analytics calculations, event recording, and data export.
 * 
 * Task 21: Checkpoint - Verify webhooks and analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalyticsService } from '../email-analytics.service';
import type { DateRange, RecordEventParams } from '../email-analytics.service';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData = {
    emailLogs: [] as any[],
    emailEvents: [] as any[],
    emailTemplates: new Map(),
    senderAddresses: new Map(),
  };

  return {
    from: (table: string) => ({
      select: (_columns: string) => {
        const query = {
          eq: (column: string, value: any) => {
            if (table === 'email_templates') {
              const template = mockData.emailTemplates.get(value);
              return {
                single: async () => template 
                  ? { data: template, error: null }
                  : { data: null, error: null },
              };
            }
            if (table === 'sender_addresses') {
              const sender = mockData.senderAddresses.get(value);
              return {
                single: async () => sender
                  ? { data: sender, error: null }
                  : { data: null, error: null },
              };
            }
            if (table === 'email_logs') {
              const filtered = mockData.emailLogs.filter((log: any) => log[column] === value);
              return {
                gte: (_col: string, val: any) => ({
                  lte: (_col2: string, val2: any) => ({
                    then: async (callback: any) => {
                      const dateFiltered = filtered.filter((log: any) => {
                        const created = new Date(log.created_at);
                        return created >= new Date(val) && created <= new Date(val2);
                      });
                      return callback({ data: dateFiltered, error: null });
                    },
                  }),
                }),
              };
            }
            return { single: async () => ({ data: null, error: null }) };
          },
          gte: (_column: string, value: any) => ({
            lte: (_col: string, val: any) => {
              const filtered = table === 'email_logs' 
                ? mockData.emailLogs.filter((log: any) => {
                    const created = new Date(log.created_at);
                    return created >= new Date(value) && created <= new Date(val);
                  })
                : [];
              
              // Create a chainable query object
              const createChainableQuery = (currentData: any[]) => {
                const chainable: any = {
                  order: (orderCol: string, options: any) => {
                    const sorted = [...currentData].sort((a, b) => {
                      const aVal = new Date(a[orderCol]).getTime();
                      const bVal = new Date(b[orderCol]).getTime();
                      return options.ascending ? aVal - bVal : bVal - aVal;
                    });
                    return createChainableQuery(sorted);
                  },
                  eq: (eqCol: string, eqVal: any) => {
                    const eqFiltered = currentData.filter((log: any) => log[eqCol] === eqVal);
                    return createChainableQuery(eqFiltered);
                  },
                  then: (resolve: any) => resolve({ data: currentData, error: null }),
                  catch: (reject: any) => reject,
                };
                
                // Make it awaitable
                chainable[Symbol.toStringTag] = 'Promise';
                
                return chainable;
              };
              
              return createChainableQuery(filtered);
            },
          }),
        };
        return query;
      },
      insert: (data: any) => ({
        select: (_columns: string) => ({
          single: async () => {
            if (table === 'email_events') {
              const event = { id: `event-${Date.now()}`, ...data };
              mockData.emailEvents.push(event);
              return { data: event, error: null };
            }
            return { data, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            if (table === 'email_logs') {
              const log = mockData.emailLogs.find((l: any) => l[column] === value);
              if (log) {
                Object.assign(log, updates);
              }
              return callback({ data: log, error: null });
            }
            return callback({ data: null, error: null });
          },
        }),
      }),
    }),
    _mockData: mockData,
  };
};

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    service = new AnalyticsService(mockSupabase as any);
  });

  describe('recordEvent', () => {
    it('should record email event successfully', async () => {
      const params: RecordEventParams = {
        logId: 'log-123',
        eventType: 'delivered',
        timestamp: new Date(),
        eventData: { test: 'data' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      };

      const eventId = await service.recordEvent(params);

      expect(eventId).toBeDefined();
      expect(eventId).toContain('event-');
      expect(mockSupabase._mockData.emailEvents.length).toBe(1);
      expect(mockSupabase._mockData.emailEvents[0].event_type).toBe('delivered');
      expect(mockSupabase._mockData.emailEvents[0].log_id).toBe('log-123');
    });

    it('should record event with default timestamp', async () => {
      const params: RecordEventParams = {
        logId: 'log-456',
        eventType: 'opened',
      };

      const eventId = await service.recordEvent(params);

      expect(eventId).toBeDefined();
      expect(mockSupabase._mockData.emailEvents.length).toBe(1);
      expect(mockSupabase._mockData.emailEvents[0].created_at).toBeDefined();
    });
  });

  describe('getTemplateAnalytics', () => {
    beforeEach(() => {
      // Setup mock template
      mockSupabase._mockData.emailTemplates.set('template-123', {
        id: 'template-123',
        name: 'Test Template',
      });

      // Setup mock email logs
      const now = new Date();
      mockSupabase._mockData.emailLogs = [
        {
          id: 'log-1',
          template_id: 'template-123',
          status: 'delivered',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-2',
          template_id: 'template-123',
          status: 'opened',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-3',
          template_id: 'template-123',
          status: 'clicked',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: now.toISOString(),
          clicked_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-4',
          template_id: 'template-123',
          status: 'bounced',
          sent_at: now.toISOString(),
          bounced_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-5',
          template_id: 'template-123',
          status: 'complained',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          complained_at: now.toISOString(),
          created_at: now.toISOString(),
        },
      ];
    });

    it('should calculate template analytics correctly', async () => {
      const dateRange: DateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        to: new Date(),
      };

      const analytics = await service.getTemplateAnalytics('template-123', dateRange);

      expect(analytics.templateId).toBe('template-123');
      expect(analytics.templateName).toBe('Test Template');
      expect(analytics.sent).toBe(5);
      expect(analytics.delivered).toBe(4); // 4 emails have delivered_at
      expect(analytics.opened).toBe(2); // 2 emails have opened_at
      expect(analytics.clicked).toBe(1); // 1 email has clicked_at
      expect(analytics.bounced).toBe(1); // 1 email has bounced_at
      expect(analytics.complained).toBe(1); // 1 email has complained_at
      expect(analytics.failed).toBe(0);
    });

    it('should calculate rates correctly', async () => {
      const dateRange: DateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await service.getTemplateAnalytics('template-123', dateRange);

      // Open rate = (opened / delivered) * 100 = (2 / 4) * 100 = 50%
      expect(analytics.openRate).toBe(50);

      // Click rate = (clicked / delivered) * 100 = (1 / 4) * 100 = 25%
      expect(analytics.clickRate).toBe(25);

      // Bounce rate = (bounced / sent) * 100 = (1 / 5) * 100 = 20%
      expect(analytics.bounceRate).toBe(20);

      // Complaint rate = (complained / sent) * 100 = (1 / 5) * 100 = 20%
      expect(analytics.complaintRate).toBe(20);

      // Delivery rate = (delivered / sent) * 100 = (4 / 5) * 100 = 80%
      expect(analytics.deliveryRate).toBe(80);
    });

    it('should handle zero division gracefully', async () => {
      // Clear logs
      mockSupabase._mockData.emailLogs = [];

      const dateRange: DateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await service.getTemplateAnalytics('template-123', dateRange);

      expect(analytics.sent).toBe(0);
      expect(analytics.delivered).toBe(0);
      expect(analytics.openRate).toBe(0);
      expect(analytics.clickRate).toBe(0);
      expect(analytics.bounceRate).toBe(0);
      expect(analytics.complaintRate).toBe(0);
      expect(analytics.deliveryRate).toBe(0);
    });
  });

  describe('getSenderAnalytics', () => {
    beforeEach(() => {
      // Setup mock sender
      mockSupabase._mockData.senderAddresses.set('sender@example.com', {
        email: 'sender@example.com',
        name: 'Test Sender',
      });

      // Setup mock email logs
      const now = new Date();
      mockSupabase._mockData.emailLogs = [
        {
          id: 'log-1',
          from_address: 'sender@example.com',
          status: 'delivered',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-2',
          from_address: 'sender@example.com',
          status: 'opened',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: now.toISOString(),
          created_at: now.toISOString(),
        },
      ];
    });

    it('should calculate sender analytics correctly', async () => {
      const dateRange: DateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await service.getSenderAnalytics('sender@example.com', dateRange);

      expect(analytics.senderEmail).toBe('sender@example.com');
      expect(analytics.senderName).toBe('Test Sender');
      expect(analytics.sent).toBe(2);
      expect(analytics.delivered).toBe(2);
      expect(analytics.opened).toBe(1);
      expect(analytics.openRate).toBe(50); // (1 / 2) * 100
    });
  });

  describe('getSystemAnalytics', () => {
    beforeEach(() => {
      // Setup mock email logs with multiple templates and senders
      const now = new Date();
      mockSupabase._mockData.emailLogs = [
        {
          id: 'log-1',
          template_id: 'template-1',
          from_address: 'sender1@example.com',
          status: 'delivered',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-2',
          template_id: 'template-1',
          from_address: 'sender1@example.com',
          status: 'opened',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: now.toISOString(),
          created_at: now.toISOString(),
        },
        {
          id: 'log-3',
          template_id: 'template-2',
          from_address: 'sender2@example.com',
          status: 'delivered',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          created_at: now.toISOString(),
        },
      ];
    });

    it('should calculate system-wide analytics correctly', async () => {
      const dateRange: DateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await service.getSystemAnalytics(dateRange);

      expect(analytics.sent).toBe(3);
      expect(analytics.delivered).toBe(3);
      expect(analytics.opened).toBe(1);
      expect(analytics.uniqueTemplates).toBe(2);
      expect(analytics.uniqueSenders).toBe(2);
      expect(analytics.averagePerDay).toBeGreaterThan(0);
    });

    it('should calculate average per day correctly', async () => {
      const dateRange: DateRange = {
        from: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        to: new Date(),
      };

      const analytics = await service.getSystemAnalytics(dateRange);

      // 3 emails over 2 days = 1.5 per day
      expect(analytics.averagePerDay).toBeCloseTo(1.5, 1);
    });
  });

  describe('exportAnalytics', () => {
    beforeEach(() => {
      const now = new Date();
      mockSupabase._mockData.emailLogs = [
        {
          id: 'log-2',
          provider: 'resend',
          provider_message_id: 'msg-2',
          from_address: 'sender@example.com',
          to_address: 'recipient2@example.com',
          subject: 'Test Email 2',
          template_id: 'template-1',
          status: 'opened',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: now.toISOString(),
          clicked_at: null,
          bounced_at: null,
          complained_at: null,
          failed_at: null,
          error_message: null,
          created_at: new Date(now.getTime() + 1000).toISOString(), // 1 second later
        },
        {
          id: 'log-1',
          provider: 'resend',
          provider_message_id: 'msg-1',
          from_address: 'sender@example.com',
          to_address: 'recipient@example.com',
          subject: 'Test Email 1',
          template_id: 'template-1',
          status: 'delivered',
          sent_at: now.toISOString(),
          delivered_at: now.toISOString(),
          opened_at: null,
          clicked_at: null,
          bounced_at: null,
          complained_at: null,
          failed_at: null,
          error_message: null,
          created_at: now.toISOString(),
        },
      ];
    });

    it('should export analytics as JSON', async () => {
      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const result = await service.exportAnalytics(filters, 'json');

      expect(result).toBeDefined();
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].id).toBe('log-2'); // Ordered by created_at desc
      expect(parsed[1].id).toBe('log-1');
    });

    it('should export analytics as CSV', async () => {
      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const result = await service.exportAnalytics(filters, 'csv');

      expect(result).toBeDefined();
      expect(result).toContain('id,provider,provider_message_id');
      expect(result).toContain('log-1');
      expect(result).toContain('log-2');
      expect(result).toContain('sender@example.com');
      expect(result).toContain('recipient@example.com');
    });

    it('should handle CSV special characters', async () => {
      mockSupabase._mockData.emailLogs = [
        {
          id: 'log-1',
          provider: 'resend',
          provider_message_id: 'msg-1',
          from_address: 'sender@example.com',
          to_address: 'recipient@example.com',
          subject: 'Test, Email "with" special\ncharacters',
          template_id: 'template-1',
          status: 'delivered',
          sent_at: new Date().toISOString(),
          delivered_at: new Date().toISOString(),
          opened_at: null,
          clicked_at: null,
          bounced_at: null,
          complained_at: null,
          failed_at: null,
          error_message: null,
          created_at: new Date().toISOString(),
        },
      ];

      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const result = await service.exportAnalytics(filters, 'csv');

      expect(result).toContain('"Test, Email ""with"" special\ncharacters"');
    });

    it('should filter by template ID', async () => {
      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
        templateId: 'template-1',
      };

      const result = await service.exportAnalytics(filters, 'json');
      const parsed = JSON.parse(result);

      expect(parsed.length).toBe(2);
      expect(parsed.every((log: any) => log.template_id === 'template-1')).toBe(true);
    });

    it('should return empty string for no data in CSV format', async () => {
      mockSupabase._mockData.emailLogs = [];

      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const result = await service.exportAnalytics(filters, 'csv');
      expect(result).toBe('');
    });

    it('should return empty array for no data in JSON format', async () => {
      mockSupabase._mockData.emailLogs = [];

      const filters = {
        dateRange: {
          from: new Date(Date.now() - 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const result = await service.exportAnalytics(filters, 'json');
      expect(result).toBe('[]');
    });
  });
});
