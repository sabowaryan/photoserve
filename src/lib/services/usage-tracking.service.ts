/**
 * Usage Tracking Service
 * Handles plugin usage logging and analytics for the Lightroom plugin
 * 
 * Features:
 * - Log plugin actions with metadata
 * - Track user activity and engagement
 * - Generate usage statistics and analytics
 * - Support for date range filtering
 * - Asynchronous processing with job queue and retry logic
 * 
 * Requirements: 14.4 - Asynchronous usage logging
 */
import { createAdminClient } from '@/lib/supabase/server';
import { getJobQueue, JobPriority } from '@/lib/services/job-queue.service';
import { z } from 'zod';

/**
 * Usage log record from database
 */
export interface UsageLog {
  id: string;
  userId: string;
  apiKeyId: string | null;
  action: string;  // 'auth', 'upload', 'create_gallery', etc.
  pluginVersion: string;
  lightroomVersion: string;
  osVersion: string;
  metadata: Record<string, any>;
  createdAt: string;
}

/**
 * Parameters for logging a usage event
 */
export interface LogUsageParams {
  userId: string;
  apiKeyId?: string;
  action: string;
  pluginVersion?: string;
  lightroomVersion?: string;
  osVersion?: string;
  metadata?: Record<string, any>;
}

/**
 * Date range filter for queries
 */
export interface DateRange {
  startDate: string;  // ISO 8601 format
  endDate: string;    // ISO 8601 format
}

/**
 * Aggregated usage statistics
 */
export interface UsageStats {
  totalActions: number;
  uniqueUsers: number;
  actionBreakdown: Record<string, number>;
  versionDistribution: Record<string, number>;
}

/**
 * Statistics for a specific action type
 */
export interface ActionStats {
  action: string;
  totalCount: number;
  uniqueUsers: number;
  averagePerUser: number;
  byDate: Record<string, number>;
}

/**
 * Service interface for usage tracking operations
 */
export interface IUsageTrackingService {
  logUsage(params: LogUsageParams): Promise<void>;
  getUserUsage(userId: string, dateRange?: DateRange): Promise<UsageLog[]>;
  getGlobalStats(dateRange?: DateRange): Promise<UsageStats>;
  getActionStats(action: string, dateRange?: DateRange): Promise<ActionStats>;
}

/**
 * Zod schema for usage log validation
 */
export const logUsageSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
  apiKeyId: z.string().uuid('API Key ID must be a valid UUID').optional().nullable(),
  action: z.string()
    .min(1, 'Action is required')
    .max(50, 'Action must be 50 characters or less'),
  pluginVersion: z.string()
    .regex(/^\d+\.\d+\.\d+(-[a-z]+)?$/, 'Plugin version must follow semantic versioning')
    .optional()
    .nullable(),
  lightroomVersion: z.string()
    .max(20, 'Lightroom version must be 20 characters or less')
    .optional()
    .nullable(),
  osVersion: z.string()
    .max(50, 'OS version must be 50 characters or less')
    .optional()
    .nullable(),
  metadata: z.record(z.string(), z.any())
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        // Validate that metadata can be serialized to JSON
        try {
          const jsonString = JSON.stringify(val);
          // Check size limit (10KB)
          return jsonString.length <= 10240;
        } catch {
          return false;
        }
      },
      { message: 'Metadata must be valid JSON and less than 10KB' }
    ),
});

/**
 * Zod schema for date range validation
 */
export const dateRangeSchema = z.object({
  startDate: z.string().datetime('Start date must be in ISO 8601 format'),
  endDate: z.string().datetime('End date must be in ISO 8601 format'),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'Start date must be before or equal to end date' }
);

/**
 * Type for validated log usage params
 */
export type ValidatedLogUsageParams = z.infer<typeof logUsageSchema>;

/**
 * Type for validated date range
 */
export type ValidatedDateRange = z.infer<typeof dateRangeSchema>;

/**
 * Usage Tracking Service Implementation
 */
export class UsageTrackingService implements IUsageTrackingService {
  private jobQueue = getJobQueue();

  constructor() {
    // Register job handler for usage logging
    this.jobQueue.registerHandler('log-usage', this.processUsageLog.bind(this));
    
    // Start the job queue
    this.jobQueue.start();
  }

  /**
   * Process a usage log job (internal handler)
   * @private
   */
  private async processUsageLog(params: ValidatedLogUsageParams): Promise<void> {
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('plugin_usage_logs')
      .insert({
        user_id: params.userId,
        api_key_id: params.apiKeyId || null,
        action: params.action,
        plugin_version: params.pluginVersion || null,
        lightroom_version: params.lightroomVersion || null,
        os_version: params.osVersion || null,
        metadata: params.metadata ? JSON.parse(JSON.stringify(params.metadata)) : null,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('[UsageTrackingService] Failed to log usage:', error);
      throw new Error(`Failed to log usage: ${error.message}`);
    }
  }

  /**
   * Log a plugin usage event
   * Uses background job queue with retry logic to avoid blocking API requests
   * 
   * Requirements:
   * - 14.4: Use background job queue for usage log processing
   * - 14.4: Avoid blocking API requests
   * - 14.4: Implement retry logic for failed logs
   * 
   * @param params - Usage log parameters
   */
  async logUsage(params: LogUsageParams): Promise<void> {
    // Validate required fields
    const validatedParams = logUsageSchema.parse(params);
    
    // Add job to queue with normal priority
    // The job will be processed asynchronously with automatic retry on failure
    await this.jobQueue.addJob(
      'log-usage',
      validatedParams,
      JobPriority.NORMAL,
      3 // Max 3 retry attempts
    );
    
    // Return immediately without waiting for processing
  }

  /**
   * Get usage logs for a specific user
   * 
   * @param userId - User ID to query
   * @param dateRange - Optional date range filter
   * @returns Array of usage logs
   */
  async getUserUsage(userId: string, dateRange?: DateRange): Promise<UsageLog[]> {
    // Validate date range if provided
    if (dateRange) {
      dateRangeSchema.parse(dateRange);
    }
    
    const supabase = createAdminClient();
    
    // Build query with date range filter
    let query = supabase
      .from('plugin_usage_logs')
      .select('*')
      .eq('user_id', userId);
    
    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }
    
    // Order by created_at descending (newest first)
    query = query.order('created_at', { ascending: false });
    
    const { data: logs, error } = await query;
    
    if (error) {
      console.error('[UsageTrackingService] Failed to fetch user usage:', error);
      throw new Error('Failed to fetch user usage logs');
    }
    
    // Map database records to UsageLog interface
    return (logs || []).map((record) => ({
      id: record.id,
      userId: record.user_id,
      apiKeyId: record.api_key_id || null,
      action: record.action,
      pluginVersion: record.plugin_version || '',
      lightroomVersion: record.lightroom_version || '',
      osVersion: record.os_version || '',
      metadata: (record.metadata as Record<string, any>) || {},
      createdAt: record.created_at || new Date().toISOString(),
    }));
  }

  /**
   * Get global usage statistics
   * 
   * @param dateRange - Optional date range filter
   * @returns Aggregated usage statistics
   */
  async getGlobalStats(dateRange?: DateRange): Promise<UsageStats> {
    // Validate date range if provided
    if (dateRange) {
      dateRangeSchema.parse(dateRange);
    }
    
    const supabase = createAdminClient();
    
    // Build query with date range filter
    let query = supabase
      .from('plugin_usage_logs')
      .select('user_id, action, plugin_version');
    
    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      console.error('[UsageTrackingService] Failed to fetch global stats:', error);
      throw new Error('Failed to fetch global statistics');
    }
    
    // Calculate statistics
    const totalActions = logs?.length || 0;
    
    // Count unique users
    const uniqueUserIds = new Set((logs || []).map(log => log.user_id));
    const uniqueUsers = uniqueUserIds.size;
    
    // Action breakdown
    const actionBreakdown: Record<string, number> = {};
    (logs || []).forEach(log => {
      if (log.action) {
        actionBreakdown[log.action] = (actionBreakdown[log.action] || 0) + 1;
      }
    });
    
    // Version distribution
    const versionDistribution: Record<string, number> = {};
    (logs || []).forEach(log => {
      if (log.plugin_version) {
        versionDistribution[log.plugin_version] = (versionDistribution[log.plugin_version] || 0) + 1;
      }
    });
    
    return {
      totalActions,
      uniqueUsers,
      actionBreakdown,
      versionDistribution,
    };
  }

  /**
   * Get statistics for a specific action type
   * 
   * @param action - Action type to query
   * @param dateRange - Optional date range filter
   * @returns Action-specific statistics
   */
  async getActionStats(action: string, dateRange?: DateRange): Promise<ActionStats> {
    // Validate date range if provided
    if (dateRange) {
      dateRangeSchema.parse(dateRange);
    }
    
    const supabase = createAdminClient();
    
    // Build query with action and date range filters
    let query = supabase
      .from('plugin_usage_logs')
      .select('user_id, created_at')
      .eq('action', action);
    
    // Apply date range filter if provided
    if (dateRange) {
      query = query
        .gte('created_at', dateRange.startDate)
        .lte('created_at', dateRange.endDate);
    }
    
    const { data: logs, error } = await query;
    
    if (error) {
      console.error('[UsageTrackingService] Failed to fetch action stats:', error);
      throw new Error('Failed to fetch action statistics');
    }
    
    // Calculate statistics
    const totalCount = logs?.length || 0;
    
    // Count unique users
    const uniqueUserIds = new Set((logs || []).map(log => log.user_id));
    const uniqueUsers = uniqueUserIds.size;
    
    // Calculate average per user
    const averagePerUser = uniqueUsers > 0 ? totalCount / uniqueUsers : 0;
    
    // Group by date
    const byDate: Record<string, number> = {};
    (logs || []).forEach(log => {
      if (log.created_at) {
        const date = new Date(log.created_at).toISOString().split('T')[0];
        if (date) {
          byDate[date] = (byDate[date] || 0) + 1;
        }
      }
    });
    
    return {
      action,
      totalCount,
      uniqueUsers,
      averagePerUser,
      byDate,
    };
  }
}

/**
 * Factory function to create a UsageTrackingService instance
 */
export function createUsageTrackingService(): IUsageTrackingService {
  return new UsageTrackingService();
}

/**
 * Export singleton instance
 */
export const usageTrackingService = new UsageTrackingService();
