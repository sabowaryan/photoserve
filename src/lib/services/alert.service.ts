/**
 * Alert Service for Critical Errors
 * 
 * Provides functionality to send alerts to administrators for critical errors
 * and system issues that require immediate attention.
 * 
 * Requirements: 13.9 - Set up alerting for critical errors
 */

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Alert types
 */
export enum AlertType {
  // Error alerts
  CRITICAL_ERROR = 'CRITICAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Performance alerts
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  SLOW_RESPONSE_TIME = 'SLOW_RESPONSE_TIME',
  
  // Security alerts
  MULTIPLE_AUTH_FAILURES = 'MULTIPLE_AUTH_FAILURES',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  
  // System alerts
  DATABASE_CONNECTION_POOL_EXHAUSTED = 'DATABASE_CONNECTION_POOL_EXHAUSTED',
  CLOUDINARY_UPLOAD_FAILURE = 'CLOUDINARY_UPLOAD_FAILURE',
  HIGH_MEMORY_USAGE = 'HIGH_MEMORY_USAGE',
}

/**
 * Alert configuration
 */
interface AlertConfig {
  // Error rate threshold (percentage)
  errorRateThreshold: number;
  
  // Response time threshold (milliseconds)
  responseTimeThreshold: number;
  
  // Download failure threshold (percentage)
  downloadFailureThreshold: number;
  
  // Auth failure threshold (count within time window)
  authFailureThreshold: number;
  authFailureWindowMinutes: number;
  
  // Alert recipients
  adminEmails: string[];
  
  // Alert channels
  enableEmailAlerts: boolean;
  enableSlackAlerts: boolean;
  enableSmsAlerts: boolean;
}

/**
 * Default alert configuration
 * Requirements: 13.9 - Define alert thresholds and conditions
 */
const DEFAULT_ALERT_CONFIG: AlertConfig = {
  errorRateThreshold: 1, // 1% error rate
  responseTimeThreshold: 100, // 100ms for API validation
  downloadFailureThreshold: 5, // 5% download failures
  authFailureThreshold: 10, // 10 failures
  authFailureWindowMinutes: 5, // within 5 minutes
  adminEmails: process.env.ADMIN_ALERT_EMAILS?.split(',') || [],
  enableEmailAlerts: process.env.ENABLE_EMAIL_ALERTS === 'true',
  enableSlackAlerts: process.env.ENABLE_SLACK_ALERTS === 'true',
  enableSmsAlerts: process.env.ENABLE_SMS_ALERTS === 'true',
};

/**
 * Alert payload
 */
interface Alert {
  severity: AlertSeverity;
  type: AlertType;
  title: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Alert Service Class
 */
export class AlertService {
  private config: AlertConfig;
  
  constructor(config?: Partial<AlertConfig>) {
    this.config = { ...DEFAULT_ALERT_CONFIG, ...config };
  }
  
  /**
   * Send a critical error alert
   * Requirements: 13.9 - Send alerts to administrators
   */
  async sendCriticalErrorAlert(
    error: Error,
    context?: {
      endpoint?: string;
      userId?: string;
      requestId?: string;
      additionalInfo?: Record<string, any>;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.CRITICAL,
      type: AlertType.CRITICAL_ERROR,
      title: 'Critical Error Detected',
      message: `A critical error occurred: ${error.message}`,
      timestamp: new Date().toISOString(),
      metadata: {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
        ...context,
      },
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send a high error rate alert
   */
  async sendHighErrorRateAlert(
    errorRate: number,
    timeWindow: string,
    context?: {
      endpoint?: string;
      errorCount?: number;
      totalRequests?: number;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.ERROR,
      type: AlertType.HIGH_ERROR_RATE,
      title: 'High Error Rate Detected',
      message: `Error rate of ${errorRate.toFixed(2)}% detected in the last ${timeWindow}`,
      timestamp: new Date().toISOString(),
      metadata: {
        errorRate,
        timeWindow,
        threshold: this.config.errorRateThreshold,
        ...context,
      },
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send a slow response time alert
   */
  async sendSlowResponseAlert(
    endpoint: string,
    responseTime: number,
    percentile: string,
    context?: {
      sampleSize?: number;
      timeWindow?: string;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.WARNING,
      type: AlertType.SLOW_RESPONSE_TIME,
      title: 'Slow Response Time Detected',
      message: `${endpoint} ${percentile} response time is ${responseTime}ms (threshold: ${this.config.responseTimeThreshold}ms)`,
      timestamp: new Date().toISOString(),
      metadata: {
        endpoint,
        responseTime,
        percentile,
        threshold: this.config.responseTimeThreshold,
        ...context,
      },
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send a database connection pool exhaustion alert
   */
  async sendDatabasePoolExhaustedAlert(
    context?: {
      activeConnections?: number;
      maxConnections?: number;
      waitingRequests?: number;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.CRITICAL,
      type: AlertType.DATABASE_CONNECTION_POOL_EXHAUSTED,
      title: 'Database Connection Pool Exhausted',
      message: 'Database connection pool has been exhausted. New requests are being queued.',
      timestamp: new Date().toISOString(),
      metadata: context,
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send a Cloudinary upload failure alert
   */
  async sendCloudinaryUploadFailureAlert(
    failureRate: number,
    context?: {
      failedUploads?: number;
      totalUploads?: number;
      timeWindow?: string;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.ERROR,
      type: AlertType.CLOUDINARY_UPLOAD_FAILURE,
      title: 'High Cloudinary Upload Failure Rate',
      message: `Cloudinary upload failure rate of ${failureRate.toFixed(2)}% detected`,
      timestamp: new Date().toISOString(),
      metadata: {
        failureRate,
        threshold: this.config.downloadFailureThreshold,
        ...context,
      },
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send a multiple authentication failures alert
   */
  async sendMultipleAuthFailuresAlert(
    failureCount: number,
    context?: {
      ipAddress?: string;
      userId?: string;
      timeWindow?: string;
    }
  ): Promise<void> {
    const alert: Alert = {
      severity: AlertSeverity.WARNING,
      type: AlertType.MULTIPLE_AUTH_FAILURES,
      title: 'Multiple Authentication Failures Detected',
      message: `${failureCount} authentication failures detected within ${this.config.authFailureWindowMinutes} minutes`,
      timestamp: new Date().toISOString(),
      metadata: {
        failureCount,
        threshold: this.config.authFailureThreshold,
        timeWindow: `${this.config.authFailureWindowMinutes} minutes`,
        ...context,
      },
    };
    
    await this.sendAlert(alert);
  }
  
  /**
   * Send an alert through configured channels
   * Requirements: 13.9 - Send alerts to administrators
   */
  private async sendAlert(alert: Alert): Promise<void> {
    // Log alert to console (always)
    console.error('[ALERT]', JSON.stringify(alert, null, 2));
    
    // Send to configured channels
    const promises: Promise<void>[] = [];
    
    if (this.config.enableEmailAlerts && this.config.adminEmails.length > 0) {
      promises.push(this.sendEmailAlert(alert));
    }
    
    if (this.config.enableSlackAlerts) {
      promises.push(this.sendSlackAlert(alert));
    }
    
    if (this.config.enableSmsAlerts && alert.severity === AlertSeverity.CRITICAL) {
      promises.push(this.sendSmsAlert(alert));
    }
    
    // Send all alerts in parallel
    await Promise.allSettled(promises);
  }
  
  /**
   * Send alert via email
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      // TODO: Implement email sending using your email service
      // Example: SendGrid, AWS SES, Resend, etc.
      console.log('[ALERT] Email alert would be sent to:', this.config.adminEmails);
      console.log('[ALERT] Subject:', alert.title);
      console.log('[ALERT] Body:', alert.message);
      
      // Example implementation:
      // await emailService.send({
      //   to: this.config.adminEmails,
      //   subject: `[${alert.severity}] ${alert.title}`,
      //   html: this.formatAlertEmail(alert),
      // });
    } catch (error) {
      console.error('[ALERT] Failed to send email alert:', error);
    }
  }
  
  /**
   * Send alert via Slack
   */
  private async sendSlackAlert(_alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) {
        console.warn('[ALERT] Slack webhook URL not configured');
        return;
      }
      
      // TODO: Implement Slack webhook integration
      console.log('[ALERT] Slack alert would be sent');
      
      // Example implementation:
      // await fetch(webhookUrl, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     text: `*[${alert.severity}] ${alert.title}*\n${alert.message}`,
      //     attachments: [{
      //       color: this.getSeverityColor(alert.severity),
      //       fields: Object.entries(alert.metadata || {}).map(([key, value]) => ({
      //         title: key,
      //         value: String(value),
      //         short: true,
      //       })),
      //     }],
      //   }),
      // });
    } catch (error) {
      console.error('[ALERT] Failed to send Slack alert:', error);
    }
  }
  
  /**
   * Send alert via SMS
   */
  private async sendSmsAlert(_alert: Alert): Promise<void> {
    try {
      // TODO: Implement SMS sending using Twilio or similar service
      console.log('[ALERT] SMS alert would be sent for critical error');
      
      // Example implementation:
      // await twilioClient.messages.create({
      //   to: process.env.ADMIN_PHONE_NUMBER,
      //   from: process.env.TWILIO_PHONE_NUMBER,
      //   body: `[${alert.severity}] ${alert.title}: ${alert.message}`,
      // });
    } catch (error) {
      console.error('[ALERT] Failed to send SMS alert:', error);
    }
  }
  
  
  
  /**
   * Check if error rate exceeds threshold
   */
  shouldAlertOnErrorRate(errorRate: number): boolean {
    return errorRate > this.config.errorRateThreshold;
  }
  
  /**
   * Check if response time exceeds threshold
   */
  shouldAlertOnResponseTime(responseTime: number): boolean {
    return responseTime > this.config.responseTimeThreshold;
  }
  
  /**
   * Check if download failure rate exceeds threshold
   */
  shouldAlertOnDownloadFailures(failureRate: number): boolean {
    return failureRate > this.config.downloadFailureThreshold;
  }
}

/**
 * Singleton instance of AlertService
 */
export const alertService = new AlertService();
