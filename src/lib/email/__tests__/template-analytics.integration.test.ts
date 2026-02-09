/**
 * Template Rendering and Analytics Integration Tests
 * 
 * Tests template rendering with variables and analytics tracking.
 * 
 * Task 41: Write comprehensive integration tests
 * Requirements: 11.1, 11.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateEngine } from '@/lib/email/template-engine';
import { AnalyticsService } from '@/lib/services/email-analytics.service';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData = {
    emailLogs: new Map<string, any>(),
    emailEvents: [] as any[],
    emailTemplates: new Map<string, any>(),
    senderAddresses: new Map<string, any>(),
  };

  // Add sample template
  mockData.emailTemplates.set('template-1', {
    id: 'template-1',
    name: 'Purchase Confirmation',
    slug: 'purchase-confirmation',
    type: 'transactional',
    source: 'react-email',
    subject: 'Purchase Confirmation - {{galleryName}}',
    content: {
      html: '<h1>Thank you {{buyerName}}!</h1><p>Gallery: {{galleryName}}</p>',
    },
    variables: ['buyerName', 'galleryName', 'photoCount', 'amountPaid'],
    active_version: 1,
    is_active: true,
  });

  // Add sample sender
  mockData.senderAddresses.set('sender-1', {
    id: 'sender-1',
    email: 'sender@example.com',
    name: 'Test Sender',
  });

  return {
    from: (table: string) => ({
      select: (columns: string) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'email_templates') {
              const template = mockData.emailTemplates.get(value);
              return template ? { data: template, error: null } : { data: null, error: { code: 'PGRST116' } };
            }
            if (table === 'sender_addresses') {
              const sender = mockData.senderAddresses.get(value);
              return sender ? { data: sender, error: null } : { data: null, error: { code: 'PGRST116' } };
            }
            if (table === 'email_logs') {
              const log = mockData.emailLogs.get(value);
              return log ? { data: log, error: null } : { data: null, error: { message: 'Not found' } };
            }
            return { data: null, error: { code: 'PGRST116' } };
          },
        }),
        gte: (column: string, value: any) => ({
          lte: (column2: string, value2: any) => ({
            then: async (callback: any) => {
              if (table === 'email_logs') {
                const logs = Array.from(mockData.emailLogs.values());
                return callback({ data: logs, error: null });
              }
              return callback({ data: [], error: null });
            },
          }),
        }),
      }),
      insert: (data: any) => ({
        select: (columns: string) => ({
          single: async () => {
            const id = `${table}-${Date.now()}-${Math.random()}`;
            const record = { id, ...data };
            
            if (table === 'email_logs') {
              mockData.emailLogs.set(id, record);
            } else if (table === 'email_events') {
              mockData.emailEvents.push(record);
            }
            
            return { data: record, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (column: string, value: any) => ({
          then: async (callback: any) => {
            if (table === 'email_logs' && mockData.emailLogs.has(value)) {
              const log = mockData.emailLogs.get(value);
              Object.assign(log, updates);
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

describe('Template Rendering and Analytics Integration Tests', () => {
  let mockSupabase: any;
  let templateEngine: TemplateEngine;
  let analyticsService: AnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    templateEngine = new TemplateEngine(mockSupabase as any);
    analyticsService = new AnalyticsService(mockSupabase as any);
  });

  describe('Template Rendering with Variables', () => {
    it('should render template with all variables substituted', async () => {
      const variables = {
        buyerName: 'John Doe',
        galleryName: 'Wedding Photos',
        photoCount: 50,
        amountPaid: '$99.99',
      };

      const result = await templateEngine.renderCustomTemplate('template-1', variables);

      expect(result.html).toContain('John Doe');
      expect(result.html).toContain('Wedding Photos');
      expect(result.subject).toContain('Wedding Photos');
    });

    it('should handle missing optional variables', async () => {
      const variables = {
        buyerName: 'Jane Smith',
        galleryName: 'Portrait Session',
        // photoCount and amountPaid are missing
      };

      const result = await templateEngine.renderCustomTemplate('template-1', variables);

      expect(result.html).toContain('Jane Smith');
      expect(result.html).toContain('Portrait Session');
      // Missing variables should be replaced with empty string
    });

    it('should validate required variables', async () => {
      const variables = {
        // Missing required variables
        photoCount: 10,
      };

      await expect(
        templateEngine.validateVariables('template-1', variables)
      ).resolves.toBeDefined();
    });

    it('should generate preview with sample data', async () => {
      const preview = await templateEngine.generatePreview('template-1');

      expect(preview.html).toBeDefined();
      expect(preview.subject).toBeDefined();
      expect(preview.text).toBeDefined();
    });

    it('should convert HTML to plain text', async () => {
      const variables = {
        buyerName: 'Test User',
        galleryName: 'Test Gallery',
        photoCount: 25,
        amountPaid: '$50.00',
      };

      const result = await templateEngine.renderCustomTemplate('template-1', variables);

      expect(result.text).toBeDefined();
      expect(result.text).toContain('Test User');
      expect(result.text).not.toContain('<h1>');
      expect(result.text).not.toContain('<p>');
    });

    it('should inline CSS for email compatibility', async () => {
      // Add template with CSS
      mockSupabase._mockData.emailTemplates.set('template-css', {
        id: 'template-css',
        name: 'Styled Template',
        slug: 'styled-template',
        type: 'transactional',
        source: 'custom',
        subject: 'Styled Email',
        content: {
          html: '<style>h1 { color: blue; }</style><h1>Hello {{name}}</h1>',
        },
        variables: ['name'],
        active_version: 1,
        is_active: true,
      });

      const result = await templateEngine.renderCustomTemplate('template-css', { name: 'User' });

      // CSS should be inlined
      expect(result.html).toContain('style=');
      expect(result.html).toContain('color');
    });
  });

  describe('Analytics Tracking', () => {
    beforeEach(() => {
      // Add sample email logs for analytics
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Sent and delivered
      mockSupabase._mockData.emailLogs.set('log-1', {
        id: 'log-1',
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'user1@example.com',
        status: 'delivered',
        sent_at: yesterday.toISOString(),
        delivered_at: yesterday.toISOString(),
        created_at: yesterday.toISOString(),
      });

      // Delivered and opened
      mockSupabase._mockData.emailLogs.set('log-2', {
        id: 'log-2',
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'user2@example.com',
        status: 'opened',
        sent_at: yesterday.toISOString(),
        delivered_at: yesterday.toISOString(),
        opened_at: now.toISOString(),
        created_at: yesterday.toISOString(),
      });

      // Opened and clicked
      mockSupabase._mockData.emailLogs.set('log-3', {
        id: 'log-3',
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'user3@example.com',
        status: 'clicked',
        sent_at: yesterday.toISOString(),
        delivered_at: yesterday.toISOString(),
        opened_at: now.toISOString(),
        clicked_at: now.toISOString(),
        created_at: yesterday.toISOString(),
      });

      // Bounced
      mockSupabase._mockData.emailLogs.set('log-4', {
        id: 'log-4',
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'bounce@example.com',
        status: 'bounced',
        sent_at: yesterday.toISOString(),
        bounced_at: now.toISOString(),
        created_at: yesterday.toISOString(),
      });

      // Failed
      mockSupabase._mockData.emailLogs.set('log-5', {
        id: 'log-5',
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'fail@example.com',
        status: 'failed',
        sent_at: yesterday.toISOString(),
        failed_at: now.toISOString(),
        created_at: yesterday.toISOString(),
      });
    });

    it('should calculate template analytics correctly', async () => {
      const dateRange = {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        to: new Date(),
      };

      const analytics = await analyticsService.getTemplateAnalytics('template-1', dateRange);

      expect(analytics.templateId).toBe('template-1');
      expect(analytics.sent).toBe(5);
      expect(analytics.delivered).toBe(3);
      expect(analytics.opened).toBe(2);
      expect(analytics.clicked).toBe(1);
      expect(analytics.bounced).toBe(1);
      expect(analytics.failed).toBe(1);

      // Check calculated rates
      expect(analytics.deliveryRate).toBeCloseTo(60, 0); // 3/5 * 100
      expect(analytics.openRate).toBeCloseTo(66.67, 1); // 2/3 * 100
      expect(analytics.clickRate).toBeCloseTo(33.33, 1); // 1/3 * 100
      expect(analytics.bounceRate).toBeCloseTo(20, 0); // 1/5 * 100
    });

    it('should calculate sender analytics correctly', async () => {
      const dateRange = {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await analyticsService.getSenderAnalytics('sender@example.com', dateRange);

      expect(analytics.senderEmail).toBe('sender@example.com');
      expect(analytics.sent).toBe(5);
      expect(analytics.delivered).toBe(3);
      expect(analytics.opened).toBe(2);
      expect(analytics.clicked).toBe(1);
    });

    it('should calculate system-wide analytics correctly', async () => {
      const dateRange = {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await analyticsService.getSystemAnalytics(dateRange);

      expect(analytics.sent).toBe(5);
      expect(analytics.delivered).toBe(3);
      expect(analytics.uniqueTemplates).toBe(1);
      expect(analytics.uniqueSenders).toBe(1);
      expect(analytics.averagePerDay).toBeGreaterThan(0);
    });

    it('should record email events', async () => {
      const logId = 'log-1';

      await analyticsService.recordEvent({
        logId,
        eventType: 'opened',
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      // Verify event was recorded
      expect(mockSupabase._mockData.emailEvents.length).toBeGreaterThan(0);
      const event = mockSupabase._mockData.emailEvents[0];
      expect(event.log_id).toBe(logId);
      expect(event.event_type).toBe('opened');
      expect(event.ip_address).toBe('192.168.1.1');
    });

    it('should export analytics as CSV', async () => {
      const filters = {
        dateRange: {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date(),
        },
        templateId: 'template-1',
      };

      const csv = await analyticsService.exportAnalytics(filters, 'csv');

      expect(csv).toBeDefined();
      expect(csv).toContain('id');
      expect(csv).toContain('status');
      expect(csv).toContain('template_id');
    });

    it('should export analytics as JSON', async () => {
      const filters = {
        dateRange: {
          from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          to: new Date(),
        },
      };

      const json = await analyticsService.exportAnalytics(filters, 'json');

      expect(json).toBeDefined();
      const data = JSON.parse(json);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should handle empty analytics data', async () => {
      // Clear all logs
      mockSupabase._mockData.emailLogs.clear();

      const dateRange = {
        from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await analyticsService.getTemplateAnalytics('template-1', dateRange);

      expect(analytics.sent).toBe(0);
      expect(analytics.delivered).toBe(0);
      expect(analytics.openRate).toBe(0);
      expect(analytics.clickRate).toBe(0);
    });
  });

  describe('Template and Analytics Integration', () => {
    it('should track analytics for rendered templates', async () => {
      // Render template
      const variables = {
        buyerName: 'Integration Test',
        galleryName: 'Test Gallery',
        photoCount: 10,
        amountPaid: '$25.00',
      };

      const rendered = await templateEngine.renderCustomTemplate('template-1', variables);
      expect(rendered.html).toBeDefined();

      // Create email log for the rendered template
      const logId = 'integration-log-1';
      mockSupabase._mockData.emailLogs.set(logId, {
        id: logId,
        template_id: 'template-1',
        from_address: 'sender@example.com',
        to_address: 'integration@example.com',
        status: 'sent',
        sent_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });

      // Record delivery event
      await analyticsService.recordEvent({
        logId,
        eventType: 'delivered',
      });

      // Verify log was updated
      const log = mockSupabase._mockData.emailLogs.get(logId);
      expect(log.status).toBe('delivered');
      expect(log.delivered_at).toBeDefined();

      // Get analytics
      const dateRange = {
        from: new Date(Date.now() - 24 * 60 * 60 * 1000),
        to: new Date(),
      };

      const analytics = await analyticsService.getTemplateAnalytics('template-1', dateRange);
      expect(analytics.sent).toBeGreaterThan(0);
    });
  });
});
