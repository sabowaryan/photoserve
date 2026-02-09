/**
 * Webhook Handler Tests
 * 
 * Tests webhook handling with mock events, event logging,
 * and bounce/complaint handling.
 * 
 * Task 21: Checkpoint - Verify webhooks and analytics
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { WebhookHandler } from '../webhook-handler';
import type { ResendWebhookEvent, SESWebhookEvent, SESNotification } from '../webhook-handler';

// Mock Supabase client
const createMockSupabase = () => {
  const mockData = {
    emailLogs: new Map<string, any>(),
    emailEvents: [] as any[],
    emailSuppressions: new Map<string, any>(),
  };

  return {
    from: (table: string) => ({
      select: (_columns: string) => ({
        eq: (_column: string, value: any) => ({
          single: async () => {
            if (table === 'email_logs') {
              const log = mockData.emailLogs.get(value);
              return log 
                ? { data: log, error: null }
                : { data: null, error: { message: 'Not found' } };
            }
            if (table === 'email_suppressions') {
              const suppression = mockData.emailSuppressions.get(value);
              return suppression
                ? { data: suppression, error: null }
                : { data: null, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
      update: (updates: any) => ({
        eq: (_column: string, value: any) => {
          // Immediately update the data
          if (table === 'email_logs' && mockData.emailLogs.has(value)) {
            const log = mockData.emailLogs.get(value);
            Object.assign(log, updates);
          }
          
          // Return a promise
          return Promise.resolve({ 
            data: mockData.emailLogs.get(value) || null, 
            error: null 
          });
        },
      }),
      insert: (data: any) => ({
        select: (_columns: string) => ({
          single: async () => {
            if (table === 'email_events') {
              const event = { id: `event-${Date.now()}`, ...data };
              mockData.emailEvents.push(event);
              return { data: event, error: null };
            }
            if (table === 'email_suppressions') {
              mockData.emailSuppressions.set(data.email, data);
              return { data, error: null };
            }
            return { data, error: null };
          },
        }),
        then: async (callback: any) => {
          if (table === 'email_suppressions') {
            mockData.emailSuppressions.set(data.email, data);
            return callback({ data, error: null });
          }
          return callback({ data, error: null });
        },
      }),
    }),
    _mockData: mockData,
  };
};

describe('WebhookHandler', () => {
  let handler: WebhookHandler;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = createMockSupabase();
    handler = new WebhookHandler(mockSupabase as any);
  });

  describe('Resend Webhook Handling', () => {
    it('should handle delivered event correctly', async () => {
      // Setup: Create email log
      const emailLog = {
        id: 'log-123',
        provider_message_id: 'resend-msg-123',
        to_address: 'test@example.com',
        status: 'sent',
      };
      mockSupabase._mockData.emailLogs.set('resend-msg-123', emailLog);

      // Create delivered event
      const event: ResendWebhookEvent = {
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-123',
          from: 'sender@example.com',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
        },
      };

      // Handle webhook
      const result = await handler.handleResendWebhook(event);

      // Verify result
      expect(result.success).toBe(true);
      expect(result.eventType).toBe('delivered');

      // Verify email log was updated
      const updatedLog = mockSupabase._mockData.emailLogs.get('resend-msg-123');
      expect(updatedLog.status).toBe('delivered');
      expect(updatedLog.delivered_at).toBeDefined();

      // Verify event was recorded
      expect(mockSupabase._mockData.emailEvents.length).toBe(1);
      expect(mockSupabase._mockData.emailEvents[0].event_type).toBe('delivered');
    });

    it('should handle opened event correctly', async () => {
      // Setup
      const emailLog = {
        id: 'log-456',
        provider_message_id: 'resend-msg-456',
        to_address: 'test@example.com',
        status: 'delivered',
      };
      mockSupabase._mockData.emailLogs.set('resend-msg-456', emailLog);

      const event: ResendWebhookEvent = {
        type: 'email.opened',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-456',
          from: 'sender@example.com',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('opened');

      const updatedLog = mockSupabase._mockData.emailLogs.get('resend-msg-456');
      expect(updatedLog.status).toBe('opened');
      expect(updatedLog.opened_at).toBeDefined();
    });

    it('should handle clicked event correctly', async () => {
      // Setup
      const emailLog = {
        id: 'log-789',
        provider_message_id: 'resend-msg-789',
        to_address: 'test@example.com',
        status: 'opened',
      };
      mockSupabase._mockData.emailLogs.set('resend-msg-789', emailLog);

      const event: ResendWebhookEvent = {
        type: 'email.clicked',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-789',
          from: 'sender@example.com',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
          link: 'https://example.com/link',
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('clicked');

      const updatedLog = mockSupabase._mockData.emailLogs.get('resend-msg-789');
      expect(updatedLog.status).toBe('clicked');
      expect(updatedLog.clicked_at).toBeDefined();
    });

    it('should handle hard bounce and add to suppression list', async () => {
      // Setup
      const emailLog = {
        id: 'log-bounce',
        provider_message_id: 'resend-msg-bounce',
        to_address: 'bounce@example.com',
        status: 'sent',
      };
      mockSupabase._mockData.emailLogs.set('resend-msg-bounce', emailLog);

      const event: ResendWebhookEvent = {
        type: 'email.bounced',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-bounce',
          from: 'sender@example.com',
          to: ['bounce@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
          bounce_type: 'hard',
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('bounced');

      // Verify bounce was recorded
      const updatedLog = mockSupabase._mockData.emailLogs.get('resend-msg-bounce');
      expect(updatedLog.status).toBe('bounced');
      expect(updatedLog.bounced_at).toBeDefined();

      // Verify email was added to suppression list
      const suppression = mockSupabase._mockData.emailSuppressions.get('bounce@example.com');
      expect(suppression).toBeDefined();
      expect(suppression.reason).toBe('bounce');
      expect(suppression.bounce_type).toBe('hard');
    });

    it('should handle complaint and add to suppression list', async () => {
      // Setup
      const emailLog = {
        id: 'log-complaint',
        provider_message_id: 'resend-msg-complaint',
        to_address: 'complaint@example.com',
        status: 'delivered',
      };
      mockSupabase._mockData.emailLogs.set('resend-msg-complaint', emailLog);

      const event: ResendWebhookEvent = {
        type: 'email.complained',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-complaint',
          from: 'sender@example.com',
          to: ['complaint@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('complained');

      // Verify complaint was recorded
      const updatedLog = mockSupabase._mockData.emailLogs.get('resend-msg-complaint');
      expect(updatedLog.status).toBe('complained');
      expect(updatedLog.complained_at).toBeDefined();

      // Verify email was added to suppression list
      const suppression = mockSupabase._mockData.emailSuppressions.get('complaint@example.com');
      expect(suppression).toBeDefined();
      expect(suppression.reason).toBe('complaint');
    });

    it('should return error for unknown event type', async () => {
      const event: ResendWebhookEvent = {
        type: 'email.unknown',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'resend-msg-unknown',
          from: 'sender@example.com',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown event type');
    });

    it('should return error when email log not found', async () => {
      const event: ResendWebhookEvent = {
        type: 'email.delivered',
        created_at: new Date().toISOString(),
        data: {
          email_id: 'nonexistent-msg',
          from: 'sender@example.com',
          to: ['test@example.com'],
          subject: 'Test Email',
          created_at: new Date().toISOString(),
        },
      };

      const result = await handler.handleResendWebhook(event);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email log not found');
    });
  });

  describe('AWS SES Webhook Handling', () => {
    it('should handle delivery notification correctly', async () => {
      // Setup
      const emailLog = {
        id: 'log-ses-123',
        provider_message_id: 'ses-msg-123',
        to_address: 'test@example.com',
        status: 'sent',
      };
      mockSupabase._mockData.emailLogs.set('ses-msg-123', emailLog);

      const notification: SESNotification = {
        notificationType: 'Delivery',
        mail: {
          timestamp: new Date().toISOString(),
          source: 'sender@example.com',
          sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/sender@example.com',
          sendingAccountId: '123456789',
          messageId: 'ses-msg-123',
          destination: ['test@example.com'],
        },
        delivery: {
          timestamp: new Date().toISOString(),
          processingTimeMillis: 1000,
          recipients: ['test@example.com'],
          smtpResponse: '250 OK',
        },
      };

      const event: SESWebhookEvent = {
        Type: 'Notification',
        MessageId: 'sns-msg-123',
        TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-events',
        Message: JSON.stringify(notification),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'mock-signature',
        SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeURL: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      };

      const result = await handler.handleSESWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('delivered');

      const updatedLog = mockSupabase._mockData.emailLogs.get('ses-msg-123');
      expect(updatedLog.status).toBe('delivered');
      expect(updatedLog.delivered_at).toBeDefined();
    });

    it('should handle bounce notification and add to suppression list', async () => {
      // Setup
      const emailLog = {
        id: 'log-ses-bounce',
        provider_message_id: 'ses-msg-bounce',
        to_address: 'bounce@example.com',
        status: 'sent',
      };
      mockSupabase._mockData.emailLogs.set('ses-msg-bounce', emailLog);

      const notification: SESNotification = {
        notificationType: 'Bounce',
        mail: {
          timestamp: new Date().toISOString(),
          source: 'sender@example.com',
          sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/sender@example.com',
          sendingAccountId: '123456789',
          messageId: 'ses-msg-bounce',
          destination: ['bounce@example.com'],
        },
        bounce: {
          bounceType: 'Permanent',
          bounceSubType: 'General',
          bouncedRecipients: [
            {
              emailAddress: 'bounce@example.com',
              status: '5.1.1',
              diagnosticCode: 'smtp; 550 5.1.1 user unknown',
            },
          ],
          timestamp: new Date().toISOString(),
          feedbackId: 'feedback-123',
        },
      };

      const event: SESWebhookEvent = {
        Type: 'Notification',
        MessageId: 'sns-msg-bounce',
        TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-events',
        Message: JSON.stringify(notification),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'mock-signature',
        SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeURL: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      };

      const result = await handler.handleSESWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('bounced');

      // Verify bounce was recorded
      const updatedLog = mockSupabase._mockData.emailLogs.get('ses-msg-bounce');
      expect(updatedLog.status).toBe('bounced');
      expect(updatedLog.bounced_at).toBeDefined();

      // Verify email was added to suppression list
      const suppression = mockSupabase._mockData.emailSuppressions.get('bounce@example.com');
      expect(suppression).toBeDefined();
      expect(suppression.reason).toBe('bounce');
      expect(suppression.bounce_type).toBe('hard');
    });

    it('should handle complaint notification and add to suppression list', async () => {
      // Setup
      const emailLog = {
        id: 'log-ses-complaint',
        provider_message_id: 'ses-msg-complaint',
        to_address: 'complaint@example.com',
        status: 'delivered',
      };
      mockSupabase._mockData.emailLogs.set('ses-msg-complaint', emailLog);

      const notification: SESNotification = {
        notificationType: 'Complaint',
        mail: {
          timestamp: new Date().toISOString(),
          source: 'sender@example.com',
          sourceArn: 'arn:aws:ses:us-east-1:123456789:identity/sender@example.com',
          sendingAccountId: '123456789',
          messageId: 'ses-msg-complaint',
          destination: ['complaint@example.com'],
        },
        complaint: {
          complainedRecipients: [
            {
              emailAddress: 'complaint@example.com',
            },
          ],
          timestamp: new Date().toISOString(),
          feedbackId: 'feedback-complaint-123',
          complaintFeedbackType: 'abuse',
        },
      };

      const event: SESWebhookEvent = {
        Type: 'Notification',
        MessageId: 'sns-msg-complaint',
        TopicArn: 'arn:aws:sns:us-east-1:123456789:ses-events',
        Message: JSON.stringify(notification),
        Timestamp: new Date().toISOString(),
        SignatureVersion: '1',
        Signature: 'mock-signature',
        SigningCertURL: 'https://sns.us-east-1.amazonaws.com/cert.pem',
        UnsubscribeURL: 'https://sns.us-east-1.amazonaws.com/unsubscribe',
      };

      const result = await handler.handleSESWebhook(event);

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('complained');

      // Verify complaint was recorded
      const updatedLog = mockSupabase._mockData.emailLogs.get('ses-msg-complaint');
      expect(updatedLog.status).toBe('complained');
      expect(updatedLog.complained_at).toBeDefined();

      // Verify email was added to suppression list
      const suppression = mockSupabase._mockData.emailSuppressions.get('complaint@example.com');
      expect(suppression).toBeDefined();
      expect(suppression.reason).toBe('complaint');
    });
  });

  describe('Signature Verification', () => {
    it('should verify valid Resend signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      
      // Create valid signature
      const crypto = require('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const signature = hmac.digest('hex');

      const isValid = handler.verifyResendSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid Resend signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';
      const invalidSignature = 'invalid-signature';

      const isValid = handler.verifyResendSignature(payload, invalidSignature, secret);
      expect(isValid).toBe(false);
    });
  });
});
