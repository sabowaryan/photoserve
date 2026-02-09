/**
 * Email Analytics Service
 * 
 * Provides comprehensive analytics for email performance tracking including:
 * - Event recording (sent, delivered, opened, clicked, bounced, complained)
 * - Template analytics (performance metrics per template)
 * - Sender analytics (performance metrics per sender address)
 * - System-wide analytics (overall email system performance)
 * - Data export (CSV and JSON formats)
 * 
 * Requirements: 5.7, 5.8, 5.9
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Email event types for tracking
 */
export type EmailEventType = 
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'complained'
  | 'failed';

/**
 * Date range for analytics queries
 */
export interface DateRange {
  /** Start date (inclusive) */
  from: Date;
  
  /** End date (inclusive) */
  to: Date;
}

/**
 * Template analytics data
 */
export interface TemplateAnalytics {
  /** Template ID */
  templateId: string;
  
  /** Template name */
  templateName?: string;
  
  /** Total emails sent */
  sent: number;
  
  /** Total emails delivered */
  delivered: number;
  
  /** Total emails opened */
  opened: number;
  
  /** Total emails clicked */
  clicked: number;
  
  /** Total emails bounced */
  bounced: number;
  
  /** Total complaints received */
  complained: number;
  
  /** Total emails failed */
  failed: number;
  
  /** Open rate percentage (opened / delivered * 100) */
  openRate: number;
  
  /** Click rate percentage (clicked / delivered * 100) */
  clickRate: number;
  
  /** Bounce rate percentage (bounced / sent * 100) */
  bounceRate: number;
  
  /** Complaint rate percentage (complained / sent * 100) */
  complaintRate: number;
  
  /** Delivery rate percentage (delivered / sent * 100) */
  deliveryRate: number;
}

/**
 * Sender analytics data
 */
export interface SenderAnalytics {
  /** Sender email address */
  senderEmail: string;
  
  /** Sender name */
  senderName?: string;
  
  /** Total emails sent */
  sent: number;
  
  /** Total emails delivered */
  delivered: number;
  
  /** Total emails opened */
  opened: number;
  
  /** Total emails clicked */
  clicked: number;
  
  /** Total emails bounced */
  bounced: number;
  
  /** Total complaints received */
  complained: number;
  
  /** Total emails failed */
  failed: number;
  
  /** Open rate percentage */
  openRate: number;
  
  /** Click rate percentage */
  clickRate: number;
  
  /** Bounce rate percentage */
  bounceRate: number;
  
  /** Complaint rate percentage */
  complaintRate: number;
  
  /** Delivery rate percentage */
  deliveryRate: number;
}

/**
 * System-wide analytics data
 */
export interface SystemAnalytics {
  /** Total emails sent */
  sent: number;
  
  /** Total emails delivered */
  delivered: number;
  
  /** Total emails opened */
  opened: number;
  
  /** Total emails clicked */
  clicked: number;
  
  /** Total emails bounced */
  bounced: number;
  
  /** Total complaints received */
  complained: number;
  
  /** Total emails failed */
  failed: number;
  
  /** Open rate percentage */
  openRate: number;
  
  /** Click rate percentage */
  clickRate: number;
  
  /** Bounce rate percentage */
  bounceRate: number;
  
  /** Complaint rate percentage */
  complaintRate: number;
  
  /** Delivery rate percentage */
  deliveryRate: number;
  
  /** Total unique templates used */
  uniqueTemplates: number;
  
  /** Total unique senders */
  uniqueSenders: number;
  
  /** Average emails per day */
  averagePerDay: number;
}

/**
 * Analytics filters for export
 */
export interface AnalyticsFilters {
  /** Date range */
  dateRange: DateRange;
  
  /** Filter by template ID */
  templateId?: string;
  
  /** Filter by sender email */
  senderEmail?: string;
  
  /** Filter by email type */
  emailType?: 'transactional' | 'marketing';
  
  /** Filter by status */
  status?: EmailEventType;
}

/**
 * Event recording parameters
 */
export interface RecordEventParams {
  /** Email log ID */
  logId: string;
  
  /** Event type */
  eventType: EmailEventType;
  
  /** Event timestamp */
  timestamp?: Date;
  
  /** Additional event data */
  eventData?: Record<string, any>;
  
  /** IP address (for opens/clicks) */
  ipAddress?: string;
  
  /** User agent (for opens/clicks) */
  userAgent?: string;
}

// ============================================================================
// Analytics Service Class
// ============================================================================

/**
 * Email Analytics Service
 * 
 * Provides comprehensive analytics and reporting for the email system.
 */
export class AnalyticsService {
  private supabase: SupabaseClient<Database>;
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  
  /**
   * Record an email event
   * 
   * Creates an event record and updates the corresponding email log.
   * 
   * @param params - Event recording parameters
   * @returns Promise resolving to event ID
   */
  async recordEvent(params: RecordEventParams): Promise<string> {
    try {
      const timestamp = params.timestamp || new Date();
      
      // Insert event record
      const { data: event, error: eventError } = await this.supabase
        .from('email_events')
        .insert({
          log_id: params.logId,
          event_type: params.eventType,
          event_data: params.eventData || null,
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
          created_at: timestamp.toISOString(),
        })
        .select('id')
        .single();
      
      if (eventError) {
        throw new Error(`Failed to record event: ${eventError.message}`);
      }
      
      if (!event) {
        throw new Error('Failed to record event: No data returned');
      }
      
      // Update email log with event timestamp
      await this.updateEmailLogForEvent(params.logId, params.eventType, timestamp);
      
      return event.id;
    } catch (error) {
      console.error('Error recording event:', error);
      throw error;
    }
  }
  
  /**
   * Get analytics for a specific template
   * 
   * @param templateId - Template ID
   * @param dateRange - Date range for analytics
   * @returns Promise resolving to template analytics
   */
  async getTemplateAnalytics(
    templateId: string,
    dateRange: DateRange
  ): Promise<TemplateAnalytics> {
    try {
      // Get template name
      const { data: template } = await this.supabase
        .from('email_templates')
        .select('name')
        .eq('id', templateId)
        .single();
      
      // Query email logs for the template within date range
      const { data: logs, error } = await this.supabase
        .from('email_logs')
        .select('status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, complained_at, failed_at')
        .eq('template_id', templateId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      
      if (error) {
        throw new Error(`Failed to fetch template analytics: ${error.message}`);
      }
      
      // Calculate metrics
      const metrics = this.calculateMetrics(logs || []);
      
      return {
        templateId,
        templateName: template?.name,
        ...metrics,
      };
    } catch (error) {
      console.error('Error getting template analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get analytics for a specific sender
   * 
   * @param senderEmail - Sender email address
   * @param dateRange - Date range for analytics
   * @returns Promise resolving to sender analytics
   */
  async getSenderAnalytics(
    senderEmail: string,
    dateRange: DateRange
  ): Promise<SenderAnalytics> {
    try {
      // Get sender name
      const { data: sender } = await this.supabase
        .from('sender_addresses')
        .select('name')
        .eq('email', senderEmail)
        .single();
      
      // Query email logs for the sender within date range
      const { data: logs, error } = await this.supabase
        .from('email_logs')
        .select('status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, complained_at, failed_at')
        .eq('from_address', senderEmail)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      
      if (error) {
        throw new Error(`Failed to fetch sender analytics: ${error.message}`);
      }
      
      // Calculate metrics
      const metrics = this.calculateMetrics(logs || []);
      
      return {
        senderEmail,
        senderName: sender?.name || undefined,
        ...metrics,
      };
    } catch (error) {
      console.error('Error getting sender analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get system-wide analytics
   * 
   * @param dateRange - Date range for analytics
   * @returns Promise resolving to system analytics
   */
  async getSystemAnalytics(dateRange: DateRange): Promise<SystemAnalytics> {
    try {
      // Query all email logs within date range
      const { data: logs, error } = await this.supabase
        .from('email_logs')
        .select('status, sent_at, delivered_at, opened_at, clicked_at, bounced_at, complained_at, failed_at, template_id, from_address, created_at')
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString());
      
      if (error) {
        throw new Error(`Failed to fetch system analytics: ${error.message}`);
      }
      
      // Calculate metrics
      const metrics = this.calculateMetrics(logs || []);
      
      // Calculate unique counts
      const uniqueTemplates = new Set(
        logs?.filter(log => log.template_id).map(log => log.template_id)
      ).size;
      
      const uniqueSenders = new Set(
        logs?.map(log => log.from_address)
      ).size;
      
      // Calculate average per day
      const daysDiff = Math.max(
        1,
        Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
      );
      const averagePerDay = metrics.sent / daysDiff;
      
      return {
        ...metrics,
        uniqueTemplates,
        uniqueSenders,
        averagePerDay: Math.round(averagePerDay * 100) / 100,
      };
    } catch (error) {
      console.error('Error getting system analytics:', error);
      throw error;
    }
  }
  
  /**
   * Export analytics data
   * 
   * @param filters - Analytics filters
   * @param format - Export format ('csv' or 'json')
   * @returns Promise resolving to exported data string
   */
  async exportAnalytics(
    filters: AnalyticsFilters,
    format: 'csv' | 'json'
  ): Promise<string> {
    try {
      // Build query with filters
      let query = this.supabase
        .from('email_logs')
        .select('*')
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString())
        .order('created_at', { ascending: false });
      
      // Apply optional filters
      if (filters.templateId) {
        query = query.eq('template_id', filters.templateId);
      }
      
      if (filters.senderEmail) {
        query = query.eq('from_address', filters.senderEmail);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data: logs, error } = await query;
      
      if (error) {
        throw new Error(`Failed to fetch analytics data: ${error.message}`);
      }
      
      if (!logs || logs.length === 0) {
        return format === 'csv' ? '' : '[]';
      }
      
      // Format data based on export format
      if (format === 'csv') {
        return this.formatAsCSV(logs);
      } else {
        return JSON.stringify(logs, null, 2);
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }
  
  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================
  
  /**
   * Update email log with event timestamp
   */
  private async updateEmailLogForEvent(
    logId: string,
    eventType: EmailEventType,
    timestamp: Date
  ): Promise<void> {
    try {
      const updates: any = {
        status: eventType,
        updated_at: new Date().toISOString(),
      };
      
      // Set specific timestamp field based on event type
      switch (eventType) {
        case 'sent':
          updates.sent_at = timestamp.toISOString();
          break;
        case 'delivered':
          updates.delivered_at = timestamp.toISOString();
          break;
        case 'opened':
          updates.opened_at = timestamp.toISOString();
          break;
        case 'clicked':
          updates.clicked_at = timestamp.toISOString();
          break;
        case 'bounced':
          updates.bounced_at = timestamp.toISOString();
          break;
        case 'complained':
          updates.complained_at = timestamp.toISOString();
          break;
        case 'failed':
          updates.failed_at = timestamp.toISOString();
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
      console.error('Error in updateEmailLogForEvent:', error);
    }
  }
  
  /**
   * Calculate metrics from email logs
   */
  private calculateMetrics(logs: any[]): Omit<TemplateAnalytics, 'templateId' | 'templateName'> {
    const sent = logs.length;
    const delivered = logs.filter(log => log.delivered_at).length;
    const opened = logs.filter(log => log.opened_at).length;
    const clicked = logs.filter(log => log.clicked_at).length;
    const bounced = logs.filter(log => log.bounced_at).length;
    const complained = logs.filter(log => log.complained_at).length;
    const failed = logs.filter(log => log.failed_at).length;
    
    // Calculate rates (avoid division by zero)
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;
    const complaintRate = sent > 0 ? (complained / sent) * 100 : 0;
    const deliveryRate = sent > 0 ? (delivered / sent) * 100 : 0;
    
    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      complained,
      failed,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
      complaintRate: Math.round(complaintRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  }
  
  /**
   * Format data as CSV
   */
  private formatAsCSV(logs: any[]): string {
    if (logs.length === 0) {
      return '';
    }
    
    // Define CSV headers
    const headers = [
      'id',
      'provider',
      'provider_message_id',
      'from_address',
      'to_address',
      'subject',
      'template_id',
      'status',
      'sent_at',
      'delivered_at',
      'opened_at',
      'clicked_at',
      'bounced_at',
      'complained_at',
      'failed_at',
      'error_message',
      'created_at',
    ];
    
    // Create CSV header row
    const csvRows = [headers.join(',')];
    
    // Add data rows
    for (const log of logs) {
      const values = headers.map(header => {
        const value = log[header];
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        
        return stringValue;
      });
      
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }
}

// ============================================================================
// Exports
// ============================================================================

export default AnalyticsService;
