/**
 * Email Monitoring Service
 * 
 * Provides comprehensive monitoring and alerting for the email system including:
 * - Queue size monitoring with alerts
 * - Failed email rate monitoring
 * - Bounce rate monitoring
 * - Provider health checks
 * - Performance monitoring (email sending latency)
 * - Alert generation and notification
 * 
 * Requirements: 12.5, 12.6
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import { QueueManager } from '@/lib/email/queue-manager';
import { AnalyticsService } from './email-analytics.service';
import { EmailProviderService } from './email-provider.service';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert types
 */
export type AlertType = 
  | 'queue_size'
  | 'failure_rate'
  | 'bounce_rate'
  | 'provider_health'
  | 'performance';

/**
 * Alert data
 */
export interface Alert {
  /** Alert ID */
  id: string;
  
  /** Alert type */
  type: AlertType;
  
  /** Alert severity */
  severity: AlertSeverity;
  
  /** Alert message */
  message: string;
  
  /** Current value that triggered the alert */
  currentValue: number;
  
  /** Threshold that was exceeded */
  threshold: number;
  
  /** Timestamp when alert was triggered */
  timestamp: Date;
  
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Monitoring metrics
 */
export interface MonitoringMetrics {
  /** Queue size */
  queueSize: number;
  
  /** Failure rate (percentage) */
  failureRate: number;
  
  /** Bounce rate (percentage) */
  bounceRate: number;
  
  /** Provider health status */
  providerHealthy: boolean;
  
  /** Average email sending latency (milliseconds) */
  avgLatency: number;
  
  /** Timestamp of metrics collection */
  timestamp: Date;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Overall health status */
  healthy: boolean;
  
  /** Provider name */
  provider: string;
  
  /** Response time (milliseconds) */
  responseTime: number;
  
  /** Error message if unhealthy */
  error?: string;
  
  /** Timestamp of health check */
  timestamp: Date;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  /** Average latency (milliseconds) */
  avgLatency: number;
  
  /** P50 latency (milliseconds) */
  p50Latency: number;
  
  /** P95 latency (milliseconds) */
  p95Latency: number;
  
  /** P99 latency (milliseconds) */
  p99Latency: number;
  
  /** Total emails processed */
  totalProcessed: number;
  
  /** Time period (minutes) */
  periodMinutes: number;
}

// ============================================================================
// Monitoring Thresholds
// ============================================================================

/**
 * Default monitoring thresholds
 */
export const DEFAULT_THRESHOLDS = {
  /** Queue size threshold (alert if > 1000) */
  queueSize: 1000,
  
  /** Failure rate threshold (alert if > 5%) */
  failureRate: 5,
  
  /** Bounce rate threshold (alert if > 10%) */
  bounceRate: 10,
  
  /** Provider health check interval (5 minutes) */
  healthCheckInterval: 5 * 60 * 1000,
  
  /** Performance latency threshold (alert if > 5000ms) */
  latencyThreshold: 5000,
};

// ============================================================================
// Email Monitoring Service Class
// ============================================================================

/**
 * Email Monitoring Service
 * 
 * Monitors email system health and triggers alerts when thresholds are exceeded.
 */
export class EmailMonitoringService {
  private supabase: SupabaseClient<Database>;
  private queueManager: QueueManager;
  private analyticsService: AnalyticsService;
  private providerService: EmailProviderService;
  private alerts: Alert[] = [];
  private lastHealthCheck: Date | null = null;
  
  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.queueManager = new QueueManager(supabase);
    this.analyticsService = new AnalyticsService(supabase);
    this.providerService = new EmailProviderService(supabase);
  }
  
  /**
   * Collect current monitoring metrics
   * 
   * @returns Promise resolving to monitoring metrics
   */
  async collectMetrics(): Promise<MonitoringMetrics> {
    try {
      // Get queue stats
      const queueStats = await this.queueManager.getStats();
      const queueSize = queueStats.pending + queueStats.processing;
      
      // Calculate failure rate (last 24 hours)
      const total = queueStats.sent + queueStats.failed;
      const failureRate = total > 0 ? (queueStats.failed / total) * 100 : 0;
      
      // Get bounce rate from analytics (last 24 hours)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const systemAnalytics = await this.analyticsService.getSystemAnalytics({
        from: yesterday,
        to: new Date(),
      });
      const bounceRate = systemAnalytics.bounceRate;
      
      // Check provider health
      const providerHealthy = await this.checkProviderHealth();
      
      // Get performance metrics
      const performanceMetrics = await this.getPerformanceMetrics(60); // Last 60 minutes
      const avgLatency = performanceMetrics.avgLatency;
      
      return {
        queueSize,
        failureRate,
        bounceRate,
        providerHealthy,
        avgLatency,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Error collecting monitoring metrics:', error);
      throw error;
    }
  }
  
  /**
   * Check all monitoring thresholds and generate alerts
   * 
   * @returns Promise resolving to array of new alerts
   */
  async checkThresholds(): Promise<Alert[]> {
    try {
      const metrics = await this.collectMetrics();
      const newAlerts: Alert[] = [];
      
      // Check queue size
      if (metrics.queueSize > DEFAULT_THRESHOLDS.queueSize) {
        const alert = this.createAlert({
          type: 'queue_size',
          severity: metrics.queueSize > DEFAULT_THRESHOLDS.queueSize * 2 ? 'critical' : 'warning',
          message: `Email queue size (${metrics.queueSize}) exceeds threshold (${DEFAULT_THRESHOLDS.queueSize})`,
          currentValue: metrics.queueSize,
          threshold: DEFAULT_THRESHOLDS.queueSize,
          metadata: { queueSize: metrics.queueSize },
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
      
      // Check failure rate
      if (metrics.failureRate > DEFAULT_THRESHOLDS.failureRate) {
        const alert = this.createAlert({
          type: 'failure_rate',
          severity: metrics.failureRate > DEFAULT_THRESHOLDS.failureRate * 2 ? 'critical' : 'warning',
          message: `Email failure rate (${metrics.failureRate.toFixed(1)}%) exceeds threshold (${DEFAULT_THRESHOLDS.failureRate}%)`,
          currentValue: metrics.failureRate,
          threshold: DEFAULT_THRESHOLDS.failureRate,
          metadata: { failureRate: metrics.failureRate },
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
      
      // Check bounce rate
      if (metrics.bounceRate > DEFAULT_THRESHOLDS.bounceRate) {
        const alert = this.createAlert({
          type: 'bounce_rate',
          severity: metrics.bounceRate > DEFAULT_THRESHOLDS.bounceRate * 2 ? 'critical' : 'warning',
          message: `Email bounce rate (${metrics.bounceRate.toFixed(1)}%) exceeds threshold (${DEFAULT_THRESHOLDS.bounceRate}%)`,
          currentValue: metrics.bounceRate,
          threshold: DEFAULT_THRESHOLDS.bounceRate,
          metadata: { bounceRate: metrics.bounceRate },
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
      
      // Check provider health
      if (!metrics.providerHealthy) {
        const alert = this.createAlert({
          type: 'provider_health',
          severity: 'critical',
          message: 'Email provider health check failed',
          currentValue: 0,
          threshold: 1,
          metadata: { providerHealthy: false },
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
      
      // Check performance (latency)
      if (metrics.avgLatency > DEFAULT_THRESHOLDS.latencyThreshold) {
        const alert = this.createAlert({
          type: 'performance',
          severity: metrics.avgLatency > DEFAULT_THRESHOLDS.latencyThreshold * 2 ? 'critical' : 'warning',
          message: `Email sending latency (${metrics.avgLatency.toFixed(0)}ms) exceeds threshold (${DEFAULT_THRESHOLDS.latencyThreshold}ms)`,
          currentValue: metrics.avgLatency,
          threshold: DEFAULT_THRESHOLDS.latencyThreshold,
          metadata: { avgLatency: metrics.avgLatency },
        });
        newAlerts.push(alert);
        this.alerts.push(alert);
      }
      
      // Send notifications for new alerts
      for (const alert of newAlerts) {
        await this.sendAlertNotification(alert);
      }
      
      return newAlerts;
    } catch (error) {
      console.error('Error checking monitoring thresholds:', error);
      throw error;
    }
  }
  
  /**
   * Check provider health
   * 
   * @returns Promise resolving to true if provider is healthy
   */
  async checkProviderHealth(): Promise<boolean> {
    try {
      // Check if we need to run health check (every 5 minutes)
      const now = new Date();
      if (
        this.lastHealthCheck &&
        now.getTime() - this.lastHealthCheck.getTime() < DEFAULT_THRESHOLDS.healthCheckInterval
      ) {
        // Use cached result
        return true;
      }
      
      // Get active provider
      const provider = await this.providerService.getActiveProvider();
      
      // Test connection
      const startTime = Date.now();
      const isHealthy = await provider.testConnection();
      const responseTime = Date.now() - startTime;
      
      // Update last health check time
      this.lastHealthCheck = now;
      
      // Log health check result
      console.log(`[Email Monitoring] Provider health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'} (${responseTime}ms)`);
      
      return isHealthy;
    } catch (error) {
      console.error('Error checking provider health:', error);
      return false;
    }
  }
  
  /**
   * Get performance metrics for a time period
   * 
   * @param periodMinutes - Time period in minutes
   * @returns Promise resolving to performance metrics
   */
  async getPerformanceMetrics(periodMinutes: number = 60): Promise<PerformanceMetrics> {
    try {
      const startTime = new Date(Date.now() - periodMinutes * 60 * 1000);
      
      // Query email logs for sent emails in the period
      const { data: logs, error } = await this.supabase
        .from('email_logs')
        .select('sent_at, created_at')
        .eq('status', 'sent')
        .gte('sent_at', startTime.toISOString())
        .not('sent_at', 'is', null);
      
      if (error) {
        throw new Error(`Failed to fetch performance metrics: ${error.message}`);
      }
      
      if (!logs || logs.length === 0) {
        return {
          avgLatency: 0,
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0,
          totalProcessed: 0,
          periodMinutes,
        };
      }
      
      // Calculate latencies (time from created to sent)
      const latencies = logs
        .filter(log => log.created_at && log.sent_at)
        .map(log => {
          const created = new Date(log.created_at!).getTime();
          const sent = new Date(log.sent_at!).getTime();
          return sent - created;
        })
        .sort((a, b) => a - b);
      
      // Calculate metrics
      const totalProcessed = latencies.length;
      const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / totalProcessed;
      const p50Latency = latencies[Math.floor(totalProcessed * 0.5)] || 0;
      const p95Latency = latencies[Math.floor(totalProcessed * 0.95)] || 0;
      const p99Latency = latencies[Math.floor(totalProcessed * 0.99)] || 0;
      
      return {
        avgLatency: Math.round(avgLatency),
        p50Latency: Math.round(p50Latency),
        p95Latency: Math.round(p95Latency),
        p99Latency: Math.round(p99Latency),
        totalProcessed,
        periodMinutes,
      };
    } catch (error) {
      console.error('Error getting performance metrics:', error);
      throw error;
    }
  }
  
  /**
   * Get recent alerts
   * 
   * @param limit - Maximum number of alerts to return
   * @returns Array of recent alerts
   */
  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }
  
  /**
   * Get alerts by type
   * 
   * @param type - Alert type to filter by
   * @param limit - Maximum number of alerts to return
   * @returns Array of alerts of the specified type
   */
  getAlertsByType(type: AlertType, limit: number = 100): Alert[] {
    return this.alerts
      .filter(alert => alert.type === type)
      .slice(-limit);
  }
  
  /**
   * Get alerts by severity
   * 
   * @param severity - Alert severity to filter by
   * @param limit - Maximum number of alerts to return
   * @returns Array of alerts of the specified severity
   */
  getAlertsBySeverity(severity: AlertSeverity, limit: number = 100): Alert[] {
    return this.alerts
      .filter(alert => alert.severity === severity)
      .slice(-limit);
  }
  
  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
  }
  
  /**
   * Get alert summary
   * 
   * @returns Alert summary statistics
   */
  getAlertSummary(): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    byType: Record<AlertType, number>;
    recent: Alert[];
  } {
    const critical = this.alerts.filter(a => a.severity === 'critical').length;
    const warning = this.alerts.filter(a => a.severity === 'warning').length;
    const info = this.alerts.filter(a => a.severity === 'info').length;
    
    const byType: Record<AlertType, number> = {
      queue_size: this.alerts.filter(a => a.type === 'queue_size').length,
      failure_rate: this.alerts.filter(a => a.type === 'failure_rate').length,
      bounce_rate: this.alerts.filter(a => a.type === 'bounce_rate').length,
      provider_health: this.alerts.filter(a => a.type === 'provider_health').length,
      performance: this.alerts.filter(a => a.type === 'performance').length,
    };
    
    return {
      total: this.alerts.length,
      critical,
      warning,
      info,
      byType,
      recent: this.getRecentAlerts(10),
    };
  }
  
  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================
  
  /**
   * Create an alert
   */
  private createAlert(params: {
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    currentValue: number;
    threshold: number;
    metadata?: Record<string, any>;
  }): Alert {
    return {
      id: this.generateAlertId(),
      type: params.type,
      severity: params.severity,
      message: params.message,
      currentValue: params.currentValue,
      threshold: params.threshold,
      timestamp: new Date(),
      metadata: params.metadata,
    };
  }
  
  /**
   * Generate a unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
  
  /**
   * Send alert notification
   * 
   * In production, this would send alerts via email, Slack, PagerDuty, etc.
   * For now, we log to console and integrate with Sentry.
   */
  private async sendAlertNotification(alert: Alert): Promise<void> {
    // Log to console
    const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
    console[logLevel](`[Email Monitoring] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      type: alert.type,
      currentValue: alert.currentValue,
      threshold: alert.threshold,
      timestamp: alert.timestamp.toISOString(),
      metadata: alert.metadata,
    });
    
    // Integrate with Sentry for error tracking
    if (typeof window === 'undefined') {
      // Server-side: dynamically import Sentry
      try {
        const Sentry = await import('@sentry/nextjs');
        
        if (alert.severity === 'critical') {
          Sentry.captureMessage(alert.message, {
            level: 'error',
            tags: {
              alert_type: alert.type,
              alert_severity: alert.severity,
            },
            extra: {
              currentValue: alert.currentValue,
              threshold: alert.threshold,
              metadata: alert.metadata,
            },
          });
        } else if (alert.severity === 'warning') {
          Sentry.captureMessage(alert.message, {
            level: 'warning',
            tags: {
              alert_type: alert.type,
              alert_severity: alert.severity,
            },
            extra: {
              currentValue: alert.currentValue,
              threshold: alert.threshold,
              metadata: alert.metadata,
            },
          });
        }
      } catch (error) {
        // Sentry not configured or import failed - silently continue
        console.debug('[Email Monitoring] Sentry not available:', error);
      }
    }
    
    // TODO: Send email notification to administrators
    // TODO: Post to Slack channel
    // TODO: Create PagerDuty incident for critical alerts
  }
}

// ============================================================================
// Exports
// ============================================================================

export default EmailMonitoringService;
