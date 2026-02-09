/**
 * Email Sending Service
 * 
 * This service provides high-level email sending functionality with:
 * - Transactional email sending (immediate)
 * - Marketing email sending (with unsubscribe checks)
 * - Email scheduling for delayed sending
 * - Suppression list checking (bounces and complaints)
 * - Email logging and event tracking
 * 
 * Requirements: 4.6, 4.7, 4.8, 4.9
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { QueueManager } from '@/lib/email/queue-manager';
import { EmailProviderService } from './email-provider.service';
import type { EmailPriority, EmailType } from '@/lib/email/providers/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Parameters for sending an email
 */
export interface SendEmailParams {
  /** Recipient email address */
  to: string;
  
  /** Email subject */
  subject: string;
  
  /** HTML content */
  html: string;
  
  /** Plain text content (optional) */
  text?: string;
  
  /** Sender email address (optional, uses default if not provided) */
  from?: string;
  
  /** CC recipients */
  cc?: string[];
  
  /** BCC recipients */
  bcc?: string[];
  
  /** Template ID (if using a template) */
  templateId?: string;
  
  /** Template variables */
  variables?: Record<string, any>;
  
  /** Email priority */
  priority?: EmailPriority;
  
  /** Email type */
  type: EmailType;
}

/**
 * Parameters for scheduling an email
 */
export interface ScheduleEmailParams extends SendEmailParams {
  /** Scheduled send time */
  scheduledAt: Date;
}

/**
 * Result of sending/scheduling an email
 */
export interface EmailResult {
  /** Queue item ID */
  id: string;
  
  /** Whether the email was successfully queued */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
}

/**
 * Suppression check result
 */
export interface SuppressionCheckResult {
  /** Whether the email is suppressed */
  isSuppressed: boolean;
  
  /** Suppression reason if suppressed */
  reason?: 'bounce' | 'complaint';
  
  /** Bounce type if applicable */
  bounceType?: 'hard' | 'soft';
}

/**
 * Unsubscribe check result
 */
export interface UnsubscribeCheckResult {
  /** Whether the email is unsubscribed */
  isUnsubscribed: boolean;
  
  /** Unsubscribe date if unsubscribed */
  unsubscribedAt?: Date;
  
  /** Unsubscribe reason if provided */
  reason?: string;
}

/**
 * Email log entry
 */
export interface EmailLogEntry {
  /** Log entry ID */
  id: string;
  
  /** Queue item ID */
  queueId?: string;
  
  /** Email provider used */
  provider: string;
  
  /** Provider message ID */
  providerMessageId?: string;
  
  /** Sender email */
  from: string;
  
  /** Recipient email */
  to: string;
  
  /** Email subject */
  subject: string;
  
  /** Template ID */
  templateId?: string;
  
  /** Email status */
  status: string;
  
  /** Error message if failed */
  errorMessage?: string;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
  
  /** Created timestamp */
  createdAt: Date;
}

// ============================================================================
// Email Service Class
// ============================================================================

/**
 * Email Service
 * 
 * Provides high-level email sending functionality with suppression
 * checking, unsubscribe management, and email logging.
 */
export class EmailService {
  private supabase: SupabaseClient<Database>;
  private queueManager: QueueManager;
  private providerService: EmailProviderService;
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.queueManager = new QueueManager(supabase);
    this.providerService = new EmailProviderService(supabase);
  }
  
  /**
   * Send a transactional email immediately
   * 
   * Transactional emails are always sent regardless of unsubscribe status.
   * They are checked against the suppression list (bounces/complaints).
   * 
   * @param params - Email parameters
   * @returns Promise resolving to email result
   */
  async sendTransactionalEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      // Validate parameters
      this.validateEmailParams(params);
      
      // Ensure type is transactional
      if (params.type !== 'transactional') {
        throw new Error('Email type must be "transactional" for sendTransactionalEmail');
      }
      
      // Check suppression list
      const suppressionCheck = await this.checkSuppressed(params.to);
      if (suppressionCheck.isSuppressed) {
        return {
          id: '',
          success: false,
          error: `Email address is suppressed due to ${suppressionCheck.reason}: ${params.to}`,
        };
      }
      
      // Get sender address (use default if not provided)
      const from = params.from || await this.getDefaultSender();
      
      // Queue the email
      const queueId = await this.queueManager.enqueue({
        from,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        templateId: params.templateId,
        variables: params.variables,
        priority: params.priority || 'high', // Transactional emails default to high priority
        type: 'transactional',
      });
      
      // Log the email
      await this.logEmail({
        queueId,
        from,
        to: params.to,
        subject: params.subject,
        templateId: params.templateId,
        status: 'queued',
      });
      
      return {
        id: queueId,
        success: true,
      };
    } catch (error) {
      console.error('Error sending transactional email:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Send a marketing email
   * 
   * Marketing emails check both the suppression list and unsubscribe list.
   * Recipients who have unsubscribed will not receive marketing emails.
   * 
   * @param params - Email parameters
   * @returns Promise resolving to email result
   */
  async sendMarketingEmail(params: SendEmailParams): Promise<EmailResult> {
    try {
      // Validate parameters
      this.validateEmailParams(params);
      
      // Ensure type is marketing
      if (params.type !== 'marketing') {
        throw new Error('Email type must be "marketing" for sendMarketingEmail');
      }
      
      // Check suppression list
      const suppressionCheck = await this.checkSuppressed(params.to);
      if (suppressionCheck.isSuppressed) {
        return {
          id: '',
          success: false,
          error: `Email address is suppressed due to ${suppressionCheck.reason}: ${params.to}`,
        };
      }
      
      // Check unsubscribe list
      const unsubscribeCheck = await this.checkUnsubscribed(params.to);
      if (unsubscribeCheck.isUnsubscribed) {
        return {
          id: '',
          success: false,
          error: `Email address has unsubscribed from marketing emails: ${params.to}`,
        };
      }
      
      // Get sender address (use default if not provided)
      const from = params.from || await this.getDefaultSender();
      
      // Queue the email
      const queueId = await this.queueManager.enqueue({
        from,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        templateId: params.templateId,
        variables: params.variables,
        priority: params.priority || 'normal', // Marketing emails default to normal priority
        type: 'marketing',
      });
      
      // Log the email
      await this.logEmail({
        queueId,
        from,
        to: params.to,
        subject: params.subject,
        templateId: params.templateId,
        status: 'queued',
      });
      
      return {
        id: queueId,
        success: true,
      };
    } catch (error) {
      console.error('Error sending marketing email:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Schedule an email for delayed sending
   * 
   * The email will be sent at the specified time. Suppression and unsubscribe
   * checks are performed at the time of scheduling, not at send time.
   * 
   * @param params - Email parameters with scheduled time
   * @returns Promise resolving to email result
   */
  async scheduleEmail(params: ScheduleEmailParams): Promise<EmailResult> {
    try {
      // Validate parameters
      this.validateEmailParams(params);
      
      // Validate scheduled time
      if (!params.scheduledAt || params.scheduledAt <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      
      // Check suppression list
      const suppressionCheck = await this.checkSuppressed(params.to);
      if (suppressionCheck.isSuppressed) {
        return {
          id: '',
          success: false,
          error: `Email address is suppressed due to ${suppressionCheck.reason}: ${params.to}`,
        };
      }
      
      // Check unsubscribe list for marketing emails
      if (params.type === 'marketing') {
        const unsubscribeCheck = await this.checkUnsubscribed(params.to);
        if (unsubscribeCheck.isUnsubscribed) {
          return {
            id: '',
            success: false,
            error: `Email address has unsubscribed from marketing emails: ${params.to}`,
          };
        }
      }
      
      // Get sender address (use default if not provided)
      const from = params.from || await this.getDefaultSender();
      
      // Queue the email with scheduled time
      const queueId = await this.queueManager.enqueue({
        from,
        to: params.to,
        cc: params.cc,
        bcc: params.bcc,
        subject: params.subject,
        html: params.html,
        text: params.text,
        templateId: params.templateId,
        variables: params.variables,
        priority: params.priority || 'normal',
        type: params.type,
        scheduledAt: params.scheduledAt,
      });
      
      // Log the email
      await this.logEmail({
        queueId,
        from,
        to: params.to,
        subject: params.subject,
        templateId: params.templateId,
        status: 'queued',
        metadata: {
          scheduledAt: params.scheduledAt.toISOString(),
        },
      });
      
      return {
        id: queueId,
        success: true,
      };
    } catch (error) {
      console.error('Error scheduling email:', error);
      return {
        id: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  /**
   * Check if an email address is unsubscribed from marketing emails
   * 
   * @param email - Email address to check
   * @returns Promise resolving to unsubscribe check result
   */
  async checkUnsubscribed(email: string): Promise<UnsubscribeCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('email_unsubscribes')
        .select('unsubscribed_at, reason')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        // If no record found, email is not unsubscribed
        if (error.code === 'PGRST116') {
          return { isUnsubscribed: false };
        }
        throw error;
      }
      
      return {
        isUnsubscribed: true,
        unsubscribedAt: data.unsubscribed_at ? new Date(data.unsubscribed_at) : undefined,
        reason: data.reason || undefined,
      };
    } catch (error) {
      console.error('Error checking unsubscribe status:', error);
      // On error, assume not unsubscribed to avoid blocking emails
      return { isUnsubscribed: false };
    }
  }
  
  /**
   * Check if an email address is suppressed (bounced or complained)
   * 
   * @param email - Email address to check
   * @returns Promise resolving to suppression check result
   */
  async checkSuppressed(email: string): Promise<SuppressionCheckResult> {
    try {
      const { data, error } = await this.supabase
        .from('email_suppressions')
        .select('reason, bounce_type')
        .eq('email', email.toLowerCase())
        .single();
      
      if (error) {
        // If no record found, email is not suppressed
        if (error.code === 'PGRST116') {
          return { isSuppressed: false };
        }
        throw error;
      }
      
      return {
        isSuppressed: true,
        reason: data.reason as 'bounce' | 'complaint',
        bounceType: data.bounce_type as 'hard' | 'soft' | undefined,
      };
    } catch (error) {
      console.error('Error checking suppression status:', error);
      // On error, assume not suppressed to avoid blocking emails
      return { isSuppressed: false };
    }
  }
  
  /**
   * Log an email sending attempt
   * 
   * @param params - Log entry parameters
   * @returns Promise resolving to log entry ID
   */
  async logEmail(params: {
    queueId?: string;
    from: string;
    to: string;
    subject: string;
    templateId?: string;
    status: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      // Get active provider
      const provider = await this.providerService.getActiveProvider();
      
      // Insert log entry
      const { data, error } = await this.supabase
        .from('email_logs')
        .insert({
          queue_id: params.queueId || null,
          provider: provider.name,
          from_address: params.from,
          to_address: params.to,
          subject: params.subject,
          template_id: params.templateId || null,
          status: params.status,
          error_message: params.errorMessage || null,
          metadata: params.metadata || null,
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Failed to log email: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Failed to log email: No data returned');
      }
      
      return data.id;
    } catch (error) {
      console.error('Error logging email:', error);
      throw error;
    }
  }
  
  /**
   * Get the default sender email address
   * 
   * @returns Promise resolving to default sender email
   * @throws Error if no default sender is configured
   */
  private async getDefaultSender(): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .from('sender_addresses')
        .select('email')
        .eq('is_default', true)
        .eq('is_verified', true)
        .single();
      
      if (error || !data) {
        throw new Error('No default sender address configured');
      }
      
      return data.email;
    } catch (error) {
      console.error('Error getting default sender:', error);
      throw new Error('Failed to get default sender address');
    }
  }
  
  /**
   * Validate email parameters
   * 
   * @param params - Email parameters to validate
   * @throws Error if parameters are invalid
   */
  private validateEmailParams(params: SendEmailParams): void {
    if (!params.to || !this.isValidEmail(params.to)) {
      throw new Error('Invalid recipient email address');
    }
    
    if (!params.subject || params.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }
    
    if (!params.html || params.html.trim().length === 0) {
      throw new Error('Email HTML content is required');
    }
    
    if (!params.type || !['transactional', 'marketing'].includes(params.type)) {
      throw new Error('Invalid email type');
    }
    
    // Validate CC addresses
    if (params.cc) {
      for (const cc of params.cc) {
        if (!this.isValidEmail(cc)) {
          throw new Error(`Invalid CC email address: ${cc}`);
        }
      }
    }
    
    // Validate BCC addresses
    if (params.bcc) {
      for (const bcc of params.bcc) {
        if (!this.isValidEmail(bcc)) {
          throw new Error(`Invalid BCC email address: ${bcc}`);
        }
      }
    }
    
    // Validate from address if provided
    if (params.from && !this.isValidEmail(params.from)) {
      throw new Error('Invalid sender email address');
    }
  }
  
  /**
   * Validate email address format
   * 
   * @param email - Email address to validate
   * @returns True if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }
}

// ============================================================================
// Exports
// ============================================================================

export default EmailService;
