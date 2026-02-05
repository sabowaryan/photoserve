/**
 * Alerting Service
 * 
 * Monitors metrics and triggers alerts when thresholds are exceeded.
 * Alerts can be sent via email, Slack, or other notification channels.
 * 
 * Requirements: 14.9
 */

import { metricsService } from './metrics.service';

interface AlertThreshold {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  severity: 'warning' | 'critical';
}

interface Alert {
  name: string;
  description: string;
  severity: 'warning' | 'critical';
  timestamp: Date;
  value?: string;
}

/**
 * Alerting Service
 * 
 * Checks metrics against configured thresholds and triggers alerts
 */
class AlertingService {
  private alerts: Alert[] = [];
  private thresholds: AlertThreshold[] = [];
  
  constructor() {
    this.initializeThresholds();
  }
  
  /**
   * Initialize alert thresholds
   */
  private initializeThresholds(): void {
    // Alert when API validation p95 > 100ms
    this.thresholds.push({
      name: 'api_validation_slow',
      description: 'API key validation p95 response time exceeds 100ms',
      severity: 'warning',
      check: async () => {
        const metrics = metricsService.getApiKeyValidationMetrics();
        return metrics.p95 > 100;
      },
    });
    
    // Alert when error rate > 1%
    this.thresholds.push({
      name: 'high_error_rate',
      description: 'Overall error rate exceeds 1%',
      severity: 'critical',
      check: async () => {
        const errorMetrics = metricsService.getErrorMetrics();
        
        // Calculate overall error rate
        let totalErrors = 0;
        let totalRequests = 0;
        
        errorMetrics.forEach(metric => {
          totalErrors += metric.errorCount;
          totalRequests += metric.totalRequests;
        });
        
        if (totalRequests === 0) return false;
        
        const errorRate = totalErrors / totalRequests;
        return errorRate > 0.01; // 1%
      },
    });
    
    // Alert when download failures > 5%
    this.thresholds.push({
      name: 'high_download_failure_rate',
      description: 'Plugin download failure rate exceeds 5%',
      severity: 'warning',
      check: async () => {
        const downloadMetrics = metricsService.getPluginDownloadMetrics();
        return downloadMetrics.failureRate > 0.05; // 5%
      },
    });
    
    // Alert on database connection pool exhaustion
    // This would require integration with the database connection pool
    // For now, we'll check if database queries are slow (> 1000ms at p95)
    this.thresholds.push({
      name: 'slow_database_queries',
      description: 'Database query p95 response time exceeds 1000ms (possible connection pool exhaustion)',
      severity: 'critical',
      check: async () => {
        const dbMetrics = metricsService.getDbQueryMetrics();
        return dbMetrics.p95 > 1000;
      },
    });
    
    // Alert on Cloudinary upload failures
    // This would be tracked separately when implementing file uploads
    // For now, we'll add a placeholder that always returns false
    this.thresholds.push({
      name: 'cloudinary_upload_failures',
      description: 'Cloudinary upload failures detected',
      severity: 'critical',
      check: async () => {
        // TODO: Implement Cloudinary upload failure tracking
        return false;
      },
    });
  }
  
  /**
   * Check all thresholds and trigger alerts
   */
  async checkThresholds(): Promise<Alert[]> {
    const newAlerts: Alert[] = [];
    
    for (const threshold of this.thresholds) {
      try {
        const shouldAlert = await threshold.check();
        
        if (shouldAlert) {
          const alert: Alert = {
            name: threshold.name,
            description: threshold.description,
            severity: threshold.severity,
            timestamp: new Date(),
          };
          
          newAlerts.push(alert);
          this.alerts.push(alert);
          
          // Log alert
          console.warn(`[Alerting] ${threshold.severity.toUpperCase()}: ${threshold.description}`);
          
          // Send alert notification
          await this.sendAlert(alert);
        }
      } catch (error) {
        console.error(`[Alerting] Error checking threshold ${threshold.name}:`, error);
      }
    }
    
    return newAlerts;
  }
  
  /**
   * Send alert notification
   * 
   * In production, this would send alerts via email, Slack, PagerDuty, etc.
   * For now, we just log to console.
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // TODO: Implement actual alert notification (email, Slack, etc.)
    console.log('[Alerting] Alert triggered:', {
      name: alert.name,
      description: alert.description,
      severity: alert.severity,
      timestamp: alert.timestamp.toISOString(),
    });
    
    // In production, you would:
    // 1. Send email to administrators
    // 2. Post to Slack channel
    // 3. Create PagerDuty incident
    // 4. Send SMS for critical alerts
    // 5. Log to monitoring system (Datadog, New Relic, etc.)
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }
  
  /**
   * Clear all alerts (useful for testing)
   */
  clearAlerts(): void {
    this.alerts = [];
  }
  
  /**
   * Get alert summary
   */
  getAlertSummary(): {
    total: number;
    critical: number;
    warning: number;
    recent: Alert[];
  } {
    const critical = this.alerts.filter(a => a.severity === 'critical').length;
    const warning = this.alerts.filter(a => a.severity === 'warning').length;
    
    return {
      total: this.alerts.length,
      critical,
      warning,
      recent: this.getRecentAlerts(10),
    };
  }
}

// Export singleton instance
export const alertingService = new AlertingService();
export type { Alert, AlertThreshold };
