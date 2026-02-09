/**
 * Email Webhook Handler
 * 
 * Handles webhooks from email providers (Resend and AWS SES) to track email events.
 * 
 * Features:
 * - Signature verification for both providers
 * - Event processing (delivered, opened, clicked, bounced, complained)
 * - Email log updates
 * - Bounce and complaint handling (suppression list)
 * - Error handling and logging
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type EmailEventType = 
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

export interface ResendWebhookEvent {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // Bounce/complaint specific
    bounce_type?: 'hard' | 'soft';
    complaint_type?: string;
    // Click specific
    link?: string;
  };
}

export interface SESWebhookEvent {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL: string;
}

export interface SESNotification {
  notificationType: 'Bounce' | 'Complaint' | 'Delivery' | 'Send' | 'Reject' | 'Open' | 'Click';
  mail: {
    timestamp: string;
    source: string;
    sourceArn: string;
    sendingAccountId: string;
    messageId: string;
    destination: string[];
  };
  bounce?: {
    bounceType: 'Undetermined' | 'Permanent' | 'Transient';
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
  };
  complaint?: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintFeedbackType?: string;
  };
  delivery?: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
  };
  open?: {
    timestamp: string;
    userAgent: string;
    ipAddress: string;
  };
  click?: {
    timestamp: string;
    userAgent: string;
    ipAddress: string;
    link: string;
  };
}

export interface WebhookHandlerResult {
  success: boolean;
  eventType?: EmailEventType;
  error?: string;
}

// ============================================================================
// Webhook Handler Class
// ============================================================================

export class WebhookHandler {
  private supabase: ReturnType<typeof createClient<Database>>;

  constructor(supabase: ReturnType<typeof createClient<Database>>) {
    this.supabase = supabase;
  }

  // ==========================================================================
  // Resend Webhook Handling
  // ==========================================================================

  /**
   * Verify Resend webhook signature
   */
  verifyResendSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Error verifying Resend signature:', error);
      return false;
    }
  }

  /**
   * Handle Resend webhook event
   */
  async handleResendWebhook(
    event: ResendWebhookEvent
  ): Promise<WebhookHandlerResult> {
    try {
      const eventType = this.mapResendEventType(event.type);
      
      if (!eventType) {
        return {
          success: false,
          error: `Unknown event type: ${event.type}`,
        };
      }

      // Find email log by provider message ID
      const { data: emailLog, error: findError } = await this.supabase
        .from('email_logs')
        .select('id, to_address')
        .eq('provider_message_id', event.data.email_id)
        .single();

      if (findError || !emailLog) {
        console.warn(`Email log not found for message ID: ${event.data.email_id}`);
        return {
          success: false,
          error: 'Email log not found',
        };
      }

      // Update email log
      await this.updateEmailLog(emailLog.id, eventType, event.data);

      // Record event
      await this.recordEmailEvent(emailLog.id, eventType, event.data);

      // Handle bounces and complaints
      if (eventType === 'bounced') {
        await this.handleBounce(
          emailLog.to_address,
          event.data.bounce_type || 'hard',
          event.data
        );
      } else if (eventType === 'complained') {
        await this.handleComplaint(emailLog.to_address, event.data);
      }

      return {
        success: true,
        eventType,
      };
    } catch (error) {
      console.error('Error handling Resend webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map Resend event type to our event type
   */
  private mapResendEventType(resendType: string): EmailEventType | null {
    const mapping: Record<string, EmailEventType> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.delivery_delayed': 'sent', // Keep as sent, will retry
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
    };

    return mapping[resendType] || null;
  }

  // ==========================================================================
  // AWS SES Webhook Handling
  // ==========================================================================

  /**
   * Verify AWS SNS signature
   */
  async verifySNSSignature(event: SESWebhookEvent): Promise<boolean> {
    try {
      // Download the certificate
      const certResponse = await fetch(event.SigningCertURL);
      const cert = await certResponse.text();

      // Build the string to sign
      const stringToSign = this.buildSNSStringToSign(event);

      // Verify signature
      const verifier = crypto.createVerify('RSA-SHA1');
      verifier.update(stringToSign);
      
      return verifier.verify(cert, event.Signature, 'base64');
    } catch (error) {
      console.error('Error verifying SNS signature:', error);
      return false;
    }
  }

  /**
   * Build the string to sign for SNS verification
   */
  private buildSNSStringToSign(event: SESWebhookEvent): string {
    const fields = [
      'Message',
      'MessageId',
      'Subject',
      'Timestamp',
      'TopicArn',
      'Type',
    ];

    let stringToSign = '';
    for (const field of fields) {
      if (event[field as keyof SESWebhookEvent]) {
        stringToSign += `${field}\n${event[field as keyof SESWebhookEvent]}\n`;
      }
    }

    return stringToSign;
  }

  /**
   * Handle AWS SES webhook event
   */
  async handleSESWebhook(
    event: SESWebhookEvent
  ): Promise<WebhookHandlerResult> {
    try {
      // Parse the SNS message
      const notification: SESNotification = JSON.parse(event.Message);
      
      const eventType = this.mapSESEventType(notification.notificationType);
      
      if (!eventType) {
        return {
          success: false,
          error: `Unknown notification type: ${notification.notificationType}`,
        };
      }

      // Find email log by provider message ID
      const { data: emailLog, error: findError } = await this.supabase
        .from('email_logs')
        .select('id, to_address')
        .eq('provider_message_id', notification.mail.messageId)
        .single();

      if (findError || !emailLog) {
        console.warn(`Email log not found for message ID: ${notification.mail.messageId}`);
        return {
          success: false,
          error: 'Email log not found',
        };
      }

      // Update email log
      await this.updateEmailLog(emailLog.id, eventType, notification);

      // Record event
      await this.recordEmailEvent(emailLog.id, eventType, notification);

      // Handle bounces and complaints
      if (eventType === 'bounced' && notification.bounce) {
        for (const recipient of notification.bounce.bouncedRecipients) {
          await this.handleBounce(
            recipient.emailAddress,
            notification.bounce.bounceType === 'Permanent' ? 'hard' : 'soft',
            notification
          );
        }
      } else if (eventType === 'complained' && notification.complaint) {
        for (const recipient of notification.complaint.complainedRecipients) {
          await this.handleComplaint(recipient.emailAddress, notification);
        }
      }

      return {
        success: true,
        eventType,
      };
    } catch (error) {
      console.error('Error handling SES webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map SES notification type to our event type
   */
  private mapSESEventType(sesType: string): EmailEventType | null {
    const mapping: Record<string, EmailEventType> = {
      'Send': 'sent',
      'Delivery': 'delivered',
      'Open': 'opened',
      'Click': 'clicked',
      'Bounce': 'bounced',
      'Complaint': 'complained',
      'Reject': 'failed',
    };

    return mapping[sesType] || null;
  }

  // ==========================================================================
  // Email Log Updates
  // ==========================================================================

  /**
   * Update email log with event data
   */
  private async updateEmailLog(
    logId: string,
    eventType: EmailEventType,
    eventData: any
  ): Promise<void> {
    try {
      const updates: any = {
        status: eventType,
        updated_at: new Date().toISOString(),
      };

      // Set specific timestamps based on event type
      switch (eventType) {
        case 'delivered':
          updates.delivered_at = new Date().toISOString();
          break;
        case 'opened':
          updates.opened_at = new Date().toISOString();
          break;
        case 'clicked':
          updates.clicked_at = new Date().toISOString();
          break;
        case 'bounced':
          updates.bounced_at = new Date().toISOString();
          break;
        case 'complained':
          updates.complained_at = new Date().toISOString();
          break;
        case 'failed':
          updates.failed_at = new Date().toISOString();
          updates.error_message = JSON.stringify(eventData);
          break;
      }

      const { error } = await this.supabase
        .from('email_logs')
        .update(updates)
        .eq('id', logId);

      if (error) {
        console.error('Error updating email log:', error);
      }
    } catch (error) {
      console.error('Error in updateEmailLog:', error);
    }
  }

  /**
   * Record email event
   */
  private async recordEmailEvent(
    logId: string,
    eventType: EmailEventType,
    eventData: any
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('email_events')
        .insert({
          log_id: logId,
          event_type: eventType,
          event_data: eventData,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error recording email event:', error);
      }
    } catch (error) {
      console.error('Error in recordEmailEvent:', error);
    }
  }

  // ==========================================================================
  // Bounce and Complaint Handling
  // ==========================================================================

  /**
   * Handle email bounce
   */
  private async handleBounce(
    email: string,
    bounceType: 'hard' | 'soft',
    eventData: any
  ): Promise<void> {
    try {
      // Only add to suppression list for hard bounces
      if (bounceType === 'hard') {
        // Check if email already exists in suppression list
        const { data: existing } = await this.supabase
          .from('email_suppressions')
          .select('email')
          .eq('email', email)
          .single();

        // Only insert if not already suppressed
        if (!existing) {
          const { error } = await this.supabase
            .from('email_suppressions')
            .insert({
              email,
              reason: 'bounce',
              bounce_type: bounceType,
              metadata: eventData,
              created_at: new Date().toISOString(),
            });

          if (error) {
            console.error('Error adding to suppression list:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error in handleBounce:', error);
    }
  }

  /**
   * Handle spam complaint
   */
  private async handleComplaint(
    email: string,
    eventData: any
  ): Promise<void> {
    try {
      // Check if email already exists in suppression list
      const { data: existing } = await this.supabase
        .from('email_suppressions')
        .select('email')
        .eq('email', email)
        .single();

      // Only insert if not already suppressed
      if (!existing) {
        const { error } = await this.supabase
          .from('email_suppressions')
          .insert({
            email,
            reason: 'complaint',
            metadata: eventData,
            created_at: new Date().toISOString(),
          });

        if (error) {
          console.error('Error adding complaint to suppression list:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleComplaint:', error);
    }
  }
}
