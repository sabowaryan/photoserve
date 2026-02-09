/**
 * Email Queue Manager
 * 
 * Manages email queue processing with priority handling, retry logic,
 * and scheduling support. Handles enqueueing emails, batch processing,
 * and queue health monitoring.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { EmailPriority, EmailType } from './providers/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Queue status values
 */
export type QueueStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';

/**
 * Email to be queued
 */
export interface QueuedEmail {
  /** Sender email address */
  from: string;
  
  /** Recipient email address */
  to: string;
  
  /** CC recipients */
  cc?: string[];
  
  /** BCC recipients */
  bcc?: string[];
  
  /** Email subject */
  subject: string;
  
  /** HTML content */
  html: string;
  
  /** Plain text content */
  text?: string;
  
  /** Template ID (if using a template) */
  templateId?: string;
  
  /** Template variables */
  variables?: Record<string, any>;
  
  /** Email priority */
  priority?: EmailPriority;
  
  /** Email type */
  type: EmailType;
  
  /** Scheduled send time */
  scheduledAt?: Date;
  
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Queue item from database
 */
export interface QueueItem {
  id: string;
  from_address: string;
  to_address: string;
  cc_addresses: string[] | null;
  bcc_addresses: string[] | null;
  template_id: string | null;
  variables: Record<string, any> | null;
  subject: string;
  html_content: string;
  text_content: string | null;
  priority: EmailPriority;
  type: EmailType;
  status: QueueStatus;
  scheduled_at: string | null;
  retry_count: number;
  max_retries: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Result of processing a batch
 */
export interface ProcessResult {
  /** Email ID */
  id: string;
  
  /** Whether processing was successful */
  success: boolean;
  
  /** Error message if failed */
  error?: string;
  
  /** Whether email should be retried */
  shouldRetry: boolean;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  /** Total pending emails */
  pending: number;
  
  /** Emails currently being processed */
  processing: number;
  
  /** Successfully sent emails (last 24h) */
  sent: number;
  
  /** Failed emails (last 24h) */
  failed: number;
  
  /** Scheduled emails */
  scheduled: number;
  
  /** Emails by priority */
  byPriority: {
    high: number;
    normal: number;
    low: number;
  };
  
  /** Average processing time (seconds) */
  avgProcessingTime?: number;
}

/**
 * Queue health status
 */
export interface QueueHealth {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';
  
  /** Queue depth (pending + processing) */
  queueDepth: number;
  
  /** Processing rate (emails/minute) */
  processingRate: number;
  
  /** Error rate (percentage) */
  errorRate: number;
  
  /** Oldest pending email age (minutes) */
  oldestPendingAge: number;
  
  /** Issues detected */
  issues: string[];
  
  /** Recommendations */
  recommendations: string[];
}

// ============================================================================
// Queue Manager Class
// ============================================================================

/**
 * Email Queue Manager
 * 
 * Manages the email queue with priority handling, retry logic,
 * and scheduling support.
 */
export class QueueManager {
  private supabase: SupabaseClient<Database>;
  
  /**
   * Default retry delays in milliseconds (exponential backoff)
   * Retry 1: 1 minute
   * Retry 2: 5 minutes
   * Retry 3: 15 minutes
   * Retry 4: 45 minutes
   * Retry 5: 2 hours
   */
  private readonly RETRY_DELAYS = [
    60 * 1000,      // 1 minute
    5 * 60 * 1000,  // 5 minutes
    15 * 60 * 1000, // 15 minutes
    45 * 60 * 1000, // 45 minutes
    2 * 60 * 60 * 1000, // 2 hours
  ];
  
  /**
   * Default maximum retry attempts
   */
  private readonly DEFAULT_MAX_RETRIES = 5;
  
  /**
   * Queue health thresholds
   */
  private readonly HEALTH_THRESHOLDS = {
    queueDepth: {
      warning: 100,
      critical: 500,
    },
    errorRate: {
      warning: 5, // 5%
      critical: 10, // 10%
    },
    oldestPendingAge: {
      warning: 30, // 30 minutes
      critical: 60, // 60 minutes
    },
  };
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  
  /**
   * Add an email to the queue
   * 
   * @param email - Email to queue
   * @returns Promise resolving to queue item ID
   */
  async enqueue(email: QueuedEmail): Promise<string> {
    try {
      // Validate email parameters
      this.validateEmail(email);
      
      // Insert into queue
      const { data, error } = await this.supabase
        .from('email_queue')
        .insert({
          from_address: email.from,
          to_address: email.to,
          cc_addresses: email.cc || null,
          bcc_addresses: email.bcc || null,
          template_id: email.templateId || null,
          variables: email.variables || null,
          subject: email.subject,
          html_content: email.html,
          text_content: email.text || null,
          priority: email.priority || 'normal',
          type: email.type,
          status: 'pending',
          scheduled_at: email.scheduledAt?.toISOString() || null,
          retry_count: 0,
          max_retries: email.maxRetries ?? this.DEFAULT_MAX_RETRIES,
        })
        .select('id')
        .single();
      
      if (error) {
        throw new Error(`Failed to enqueue email: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Failed to enqueue email: No data returned');
      }
      
      return data.id;
    } catch (error) {
      console.error('Error enqueueing email:', error);
      throw error;
    }
  }
  
  /**
   * Process a batch of emails from the queue
   * 
   * Processes emails in priority order (high > normal > low) and
   * respects scheduled send times.
   * 
   * @param batchSize - Number of emails to process (default: optimized based on queue depth)
   * @returns Promise resolving to array of process results
   */
  async processBatch(batchSize?: number): Promise<ProcessResult[]> {
    // Get queue stats to optimize batch size if not provided
    if (!batchSize) {
      const stats = await this.getStats();
      const queueDepth = stats.pending + stats.processing;
      
      // Use optimized batch size based on queue depth
      // Import dynamically to avoid circular dependencies
      const { getOptimizedBatchSize } = await import('./performance-config');
      batchSize = getOptimizedBatchSize(queueDepth);
    }
    try {
      // Get pending emails that are ready to send
      const { data: emails, error } = await this.supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .or(`scheduled_at.is.null,scheduled_at.lte.${new Date().toISOString()}`)
        .order('priority', { ascending: false }) // high > normal > low
        .order('created_at', { ascending: true }) // oldest first
        .limit(batchSize);
      
      if (error) {
        throw new Error(`Failed to fetch emails from queue: ${error.message}`);
      }
      
      if (!emails || emails.length === 0) {
        return [];
      }
      
      // Mark emails as processing
      const emailIds = emails.map(e => e.id);
      await this.supabase
        .from('email_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .in('id', emailIds);
      
      // Process each email
      const results: ProcessResult[] = [];
      
      for (const email of emails) {
        const result = await this.processEmail(email as QueueItem);
        results.push(result);
      }
      
      return results;
    } catch (error) {
      console.error('Error processing batch:', error);
      throw error;
    }
  }
  
  /**
   * Process a single email
   * 
   * @param email - Email to process
   * @returns Promise resolving to process result
   */
  private async processEmail(email: QueueItem): Promise<ProcessResult> {
    try {
      // Get the email provider service
      const { EmailProviderService } = await import('@/lib/services/email-provider.service');
      const providerService = new EmailProviderService(this.supabase);
      
      const provider = await providerService.getActiveProvider();
      
      if (!provider) {
        throw new Error('No active email provider configured');
      }
      
      // Send the email via the provider
      const sendResult = await provider.sendEmail({
        from: email.from_address,
        to: email.to_address,
        cc: email.cc_addresses || undefined,
        bcc: email.bcc_addresses || undefined,
        subject: email.subject,
        html: email.html_content,
        text: email.text_content || undefined,
      });
      
      // Log the email
      await this.supabase
        .from('email_logs')
        .insert({
          queue_id: email.id,
          provider: provider.name,
          provider_message_id: sendResult.id,
          from_address: email.from_address,
          to_address: email.to_address,
          subject: email.subject,
          template_id: email.template_id,
          status: 'sent',
          metadata: sendResult.metadata,
        });
      
      // Update queue status to sent
      const { error } = await this.supabase
        .from('email_queue')
        .update({
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', email.id);
      
      if (error) {
        throw new Error(`Failed to update email status: ${error.message}`);
      }
      
      return {
        id: email.id,
        success: true,
        shouldRetry: false,
      };
    } catch (error) {
      // Log the error
      try {
        await this.supabase
          .from('email_logs')
          .insert({
            queue_id: email.id,
            provider: 'unknown',
            from_address: email.from_address,
            to_address: email.to_address,
            subject: email.subject,
            template_id: email.template_id,
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
      
      // Determine if we should retry
      const shouldRetry = email.retry_count < email.max_retries;
      
      if (shouldRetry) {
        // Schedule retry with exponential backoff
        await this.scheduleRetry(email);
        
        return {
          id: email.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: true,
        };
      } else {
        // Mark as permanently failed
        await this.markAsFailed(email, error instanceof Error ? error.message : 'Unknown error');
        
        return {
          id: email.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          shouldRetry: false,
        };
      }
    }
  }
  
  /**
   * Schedule a retry for a failed email
   * 
   * @param email - Email to retry
   */
  private async scheduleRetry(email: QueueItem): Promise<void> {
    const retryCount = email.retry_count + 1;
    const delay = this.RETRY_DELAYS[retryCount - 1] ?? this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1] ?? 60 * 1000;
    const scheduledAt = new Date(Date.now() + delay);
    
    await this.supabase
      .from('email_queue')
      .update({
        status: 'pending',
        retry_count: retryCount,
        scheduled_at: scheduledAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', email.id);
  }
  
  /**
   * Mark an email as permanently failed
   * 
   * @param email - Email that failed
   * @param error - Error message
   */
  private async markAsFailed(email: QueueItem, error: string): Promise<void> {
    await this.supabase
      .from('email_queue')
      .update({
        status: 'failed',
        last_error: error,
        updated_at: new Date().toISOString(),
      })
      .eq('id', email.id);
  }
  
  /**
   * Cancel a scheduled email
   * 
   * @param emailId - ID of email to cancel
   * @returns Promise resolving to true if cancelled, false if not found or already sent
   */
  async cancel(emailId: string): Promise<boolean> {
    try {
      // Check if email exists and is cancellable
      const { data: email, error: fetchError } = await this.supabase
        .from('email_queue')
        .select('id, status')
        .eq('id', emailId)
        .single();
      
      if (fetchError || !email) {
        return false;
      }
      
      // Can only cancel pending or scheduled emails
      if (email.status !== 'pending') {
        return false;
      }
      
      // Update status to cancelled
      const { error: updateError } = await this.supabase
        .from('email_queue')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', emailId);
      
      if (updateError) {
        throw new Error(`Failed to cancel email: ${updateError.message}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error cancelling email:', error);
      throw error;
    }
  }
  
  /**
   * Get queue statistics
   * 
   * @returns Promise resolving to queue stats
   */
  async getStats(): Promise<QueueStats> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Get counts by status
      const { data: statusCounts, error: statusError } = await this.supabase
        .from('email_queue')
        .select('status')
        .in('status', ['pending', 'processing', 'sent', 'failed']);
      
      if (statusError) {
        throw new Error(`Failed to fetch status counts: ${statusError.message}`);
      }
      
      // Get counts by priority (pending only)
      const { data: priorityCounts, error: priorityError } = await this.supabase
        .from('email_queue')
        .select('priority')
        .eq('status', 'pending');
      
      if (priorityError) {
        throw new Error(`Failed to fetch priority counts: ${priorityError.message}`);
      }
      
      // Get scheduled count
      const { data: scheduledEmails, error: scheduledError } = await this.supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'pending')
        .not('scheduled_at', 'is', null)
        .gt('scheduled_at', now.toISOString());
      
      if (scheduledError) {
        throw new Error(`Failed to fetch scheduled count: ${scheduledError.message}`);
      }
      
      // Count by status
      const pending = statusCounts?.filter(e => e.status === 'pending').length || 0;
      const processing = statusCounts?.filter(e => e.status === 'processing').length || 0;
      
      // Count sent/failed in last 24h
      const { data: recentEmails, error: recentError } = await this.supabase
        .from('email_queue')
        .select('status')
        .in('status', ['sent', 'failed'])
        .gte('updated_at', yesterday.toISOString());
      
      if (recentError) {
        throw new Error(`Failed to fetch recent emails: ${recentError.message}`);
      }
      
      const sent = recentEmails?.filter(e => e.status === 'sent').length || 0;
      const failed = recentEmails?.filter(e => e.status === 'failed').length || 0;
      
      // Count by priority
      const high = priorityCounts?.filter(e => e.priority === 'high').length || 0;
      const normal = priorityCounts?.filter(e => e.priority === 'normal').length || 0;
      const low = priorityCounts?.filter(e => e.priority === 'low').length || 0;
      
      return {
        pending,
        processing,
        sent,
        failed,
        scheduled: scheduledEmails?.length || 0,
        byPriority: {
          high,
          normal,
          low,
        },
      };
    } catch (error) {
      console.error('Error getting queue stats:', error);
      throw error;
    }
  }
  
  /**
   * Get queue health status
   * 
   * @returns Promise resolving to queue health
   */
  async getQueueHealth(): Promise<QueueHealth> {
    try {
      const stats = await this.getStats();
      const queueDepth = stats.pending + stats.processing;
      
      // Calculate error rate
      const total = stats.sent + stats.failed;
      const errorRate = total > 0 ? (stats.failed / total) * 100 : 0;
      
      // Get oldest pending email
      const { data: oldestEmail } = await this.supabase
        .from('email_queue')
        .select('created_at')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();
      
      const oldestPendingAge = oldestEmail && oldestEmail.created_at
        ? Math.floor((Date.now() - new Date(oldestEmail.created_at).getTime()) / (60 * 1000))
        : 0;
      
      // Calculate processing rate (emails per minute in last hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const { data: recentSent } = await this.supabase
        .from('email_queue')
        .select('id')
        .eq('status', 'sent')
        .gte('updated_at', oneHourAgo.toISOString());
      
      const processingRate = recentSent ? recentSent.length / 60 : 0;
      
      // Determine health status and issues
      const issues: string[] = [];
      const recommendations: string[] = [];
      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      // Check queue depth
      if (queueDepth >= this.HEALTH_THRESHOLDS.queueDepth.critical) {
        status = 'unhealthy';
        issues.push(`Critical queue depth: ${queueDepth} emails`);
        recommendations.push('Increase batch processing size or frequency');
      } else if (queueDepth >= this.HEALTH_THRESHOLDS.queueDepth.warning) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`High queue depth: ${queueDepth} emails`);
        recommendations.push('Monitor queue processing rate');
      }
      
      // Check error rate
      if (errorRate >= this.HEALTH_THRESHOLDS.errorRate.critical) {
        status = 'unhealthy';
        issues.push(`Critical error rate: ${errorRate.toFixed(1)}%`);
        recommendations.push('Check email provider status and configuration');
      } else if (errorRate >= this.HEALTH_THRESHOLDS.errorRate.warning) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`High error rate: ${errorRate.toFixed(1)}%`);
        recommendations.push('Review failed emails for common issues');
      }
      
      // Check oldest pending age
      if (oldestPendingAge >= this.HEALTH_THRESHOLDS.oldestPendingAge.critical) {
        status = 'unhealthy';
        issues.push(`Critical pending age: ${oldestPendingAge} minutes`);
        recommendations.push('Increase processing frequency immediately');
      } else if (oldestPendingAge >= this.HEALTH_THRESHOLDS.oldestPendingAge.warning) {
        if (status === 'healthy') status = 'degraded';
        issues.push(`Old pending emails: ${oldestPendingAge} minutes`);
        recommendations.push('Consider increasing processing frequency');
      }
      
      // Check processing rate
      if (processingRate < 1 && queueDepth > 10) {
        if (status === 'healthy') status = 'degraded';
        issues.push('Low processing rate with pending emails');
        recommendations.push('Verify queue processor is running');
      }
      
      return {
        status,
        queueDepth,
        processingRate,
        errorRate,
        oldestPendingAge,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting queue health:', error);
      
      // Return unhealthy status if we can't get health info
      return {
        status: 'unhealthy',
        queueDepth: 0,
        processingRate: 0,
        errorRate: 0,
        oldestPendingAge: 0,
        issues: ['Failed to retrieve queue health information'],
        recommendations: ['Check database connection and permissions'],
      };
    }
  }
  
  /**
   * Validate email parameters
   * 
   * @param email - Email to validate
   */
  private validateEmail(email: QueuedEmail): void {
    if (!email.from || !this.isValidEmail(email.from)) {
      throw new Error('Invalid sender email address');
    }
    
    if (!email.to || !this.isValidEmail(email.to)) {
      throw new Error('Invalid recipient email address');
    }
    
    if (!email.subject || email.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }
    
    if (!email.html || email.html.trim().length === 0) {
      throw new Error('Email HTML content is required');
    }
    
    if (!email.type || !['transactional', 'marketing'].includes(email.type)) {
      throw new Error('Invalid email type');
    }
    
    // Validate CC addresses
    if (email.cc) {
      for (const cc of email.cc) {
        if (!this.isValidEmail(cc)) {
          throw new Error(`Invalid CC email address: ${cc}`);
        }
      }
    }
    
    // Validate BCC addresses
    if (email.bcc) {
      for (const bcc of email.bcc) {
        if (!this.isValidEmail(bcc)) {
          throw new Error(`Invalid BCC email address: ${bcc}`);
        }
      }
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

export default QueueManager;
