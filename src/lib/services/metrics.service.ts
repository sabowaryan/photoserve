/**
 * Metrics Service
 * 
 * Tracks and exposes metrics for monitoring and observability.
 * Collects metrics for API key validation, plugin downloads, active users,
 * error rates, and database query performance.
 * 
 * Requirements: 14.9
 */

interface PercentileMetrics {
  p50: number;
  p95: number;
  p99: number;
  count: number;
}

interface ErrorMetric {
  endpoint: string;
  errorCount: number;
  totalRequests: number;
  errorRate: number;
}

interface ActiveUsersMetric {
  daily: number;
  weekly: number;
  monthly: number;
}

/**
 * In-memory metrics store
 * In production, this should be replaced with a proper metrics backend like Prometheus
 */
class MetricsStore {
  private apiKeyValidationTimes: number[] = [];
  private apiKeyValidationSuccess: number = 0;
  private apiKeyValidationFailure: number = 0;
  private pluginDownloadCount: number = 0;
  private pluginDownloadFailures: number = 0;
  private errorsByEndpoint: Map<string, { errors: number; total: number }> = new Map();
  private dbQueryTimes: number[] = [];
  
  // Time window for metrics (keep last 1 hour)
  private readonly METRIC_WINDOW_MS = 60 * 60 * 1000;
  private metricsTimestamps: Date[] = [];
  
  /**
   * Record API key validation response time
   */
  recordApiKeyValidationTime(durationMs: number, success: boolean): void {
    this.apiKeyValidationTimes.push(durationMs);
    this.metricsTimestamps.push(new Date());
    
    if (success) {
      this.apiKeyValidationSuccess++;
    } else {
      this.apiKeyValidationFailure++;
    }
    
    // Clean old metrics
    this.cleanOldMetrics();
  }
  
  /**
   * Record plugin download
   */
  recordPluginDownload(success: boolean): void {
    this.pluginDownloadCount++;
    if (!success) {
      this.pluginDownloadFailures++;
    }
  }
  
  /**
   * Record error for an endpoint
   */
  recordError(endpoint: string, isError: boolean): void {
    const current = this.errorsByEndpoint.get(endpoint) || { errors: 0, total: 0 };
    current.total++;
    if (isError) {
      current.errors++;
    }
    this.errorsByEndpoint.set(endpoint, current);
  }
  
  /**
   * Record database query time
   */
  recordDbQueryTime(durationMs: number): void {
    this.dbQueryTimes.push(durationMs);
    this.metricsTimestamps.push(new Date());
    
    // Clean old metrics
    this.cleanOldMetrics();
  }
  
  /**
   * Get API key validation metrics
   */
  getApiKeyValidationMetrics(): PercentileMetrics & { successRate: number } {
    const percentiles = this.calculatePercentiles(this.apiKeyValidationTimes);
    const total = this.apiKeyValidationSuccess + this.apiKeyValidationFailure;
    const successRate = total > 0 ? this.apiKeyValidationSuccess / total : 1;
    
    return {
      ...percentiles,
      successRate,
    };
  }
  
  /**
   * Get plugin download metrics
   */
  getPluginDownloadMetrics(): { total: number; failures: number; failureRate: number } {
    const failureRate = this.pluginDownloadCount > 0 
      ? this.pluginDownloadFailures / this.pluginDownloadCount 
      : 0;
    
    return {
      total: this.pluginDownloadCount,
      failures: this.pluginDownloadFailures,
      failureRate,
    };
  }
  
  /**
   * Get error metrics by endpoint
   */
  getErrorMetrics(): ErrorMetric[] {
    const metrics: ErrorMetric[] = [];
    
    this.errorsByEndpoint.forEach((value, endpoint) => {
      metrics.push({
        endpoint,
        errorCount: value.errors,
        totalRequests: value.total,
        errorRate: value.total > 0 ? value.errors / value.total : 0,
      });
    });
    
    return metrics;
  }
  
  /**
   * Get database query performance metrics
   */
  getDbQueryMetrics(): PercentileMetrics {
    return this.calculatePercentiles(this.dbQueryTimes);
  }
  
  /**
   * Calculate percentiles from an array of values
   */
  private calculatePercentiles(values: number[]): PercentileMetrics {
    if (values.length === 0) {
      return { p50: 0, p95: 0, p99: 0, count: 0 };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    
    const p50Index = Math.floor(count * 0.50);
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    
    return {
      p50: sorted[p50Index] || 0,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
      count,
    };
  }
  
  /**
   * Clean metrics older than the time window
   */
  private cleanOldMetrics(): void {
    const cutoffTime = Date.now() - this.METRIC_WINDOW_MS;
    
    // Find the index where metrics are still valid
    let validIndex = 0;
    for (let i = 0; i < this.metricsTimestamps.length; i++) {
      const timestamp = this.metricsTimestamps[i];
      if (timestamp && timestamp.getTime() >= cutoffTime) {
        validIndex = i;
        break;
      }
    }
    
    // Remove old metrics
    if (validIndex > 0) {
      this.apiKeyValidationTimes.splice(0, validIndex);
      this.dbQueryTimes.splice(0, validIndex);
      this.metricsTimestamps.splice(0, validIndex);
    }
  }
  
  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.apiKeyValidationTimes = [];
    this.apiKeyValidationSuccess = 0;
    this.apiKeyValidationFailure = 0;
    this.pluginDownloadCount = 0;
    this.pluginDownloadFailures = 0;
    this.errorsByEndpoint.clear();
    this.dbQueryTimes = [];
    this.metricsTimestamps = [];
  }
}

/**
 * Metrics Service
 * 
 * Provides methods to track and retrieve metrics for monitoring
 */
class MetricsService {
  private store: MetricsStore;
  
  constructor() {
    this.store = new MetricsStore();
  }
  
  /**
   * Track API key validation
   */
  trackApiKeyValidation(durationMs: number, success: boolean): void {
    this.store.recordApiKeyValidationTime(durationMs, success);
  }
  
  /**
   * Track plugin download
   */
  trackPluginDownload(success: boolean): void {
    this.store.recordPluginDownload(success);
  }
  
  /**
   * Track endpoint error
   */
  trackEndpointError(endpoint: string, isError: boolean): void {
    this.store.recordError(endpoint, isError);
  }
  
  /**
   * Track database query performance
   */
  trackDbQuery(durationMs: number): void {
    this.store.recordDbQueryTime(durationMs);
  }
  
  /**
   * Get API key validation metrics
   */
  getApiKeyValidationMetrics(): PercentileMetrics & { successRate: number } {
    return this.store.getApiKeyValidationMetrics();
  }
  
  /**
   * Get plugin download metrics
   */
  getPluginDownloadMetrics(): { total: number; failures: number; failureRate: number } {
    return this.store.getPluginDownloadMetrics();
  }
  
  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetric[] {
    return this.store.getErrorMetrics();
  }
  
  /**
   * Get database query metrics
   */
  getDbQueryMetrics(): PercentileMetrics {
    return this.store.getDbQueryMetrics();
  }
  
  /**
   * Get active users metrics from database
   * This queries the database for actual user activity
   */
  async getActiveUsersMetrics(supabase: any): Promise<ActiveUsersMetric> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Query for daily active users
    const { data: dailyUsers, error: dailyError } = await supabase
      .from('plugin_usage_logs')
      .select('user_id')
      .gte('created_at', oneDayAgo.toISOString())
      .then((result: any) => ({
        data: result.data ? [...new Set(result.data.map((row: any) => row.user_id))] : [],
        error: result.error,
      }));
    
    // Query for weekly active users
    const { data: weeklyUsers, error: weeklyError } = await supabase
      .from('plugin_usage_logs')
      .select('user_id')
      .gte('created_at', oneWeekAgo.toISOString())
      .then((result: any) => ({
        data: result.data ? [...new Set(result.data.map((row: any) => row.user_id))] : [],
        error: result.error,
      }));
    
    // Query for monthly active users
    const { data: monthlyUsers, error: monthlyError } = await supabase
      .from('plugin_usage_logs')
      .select('user_id')
      .gte('created_at', oneMonthAgo.toISOString())
      .then((result: any) => ({
        data: result.data ? [...new Set(result.data.map((row: any) => row.user_id))] : [],
        error: result.error,
      }));
    
    if (dailyError || weeklyError || monthlyError) {
      console.error('[Metrics] Error fetching active users:', { dailyError, weeklyError, monthlyError });
      return { daily: 0, weekly: 0, monthly: 0 };
    }
    
    return {
      daily: dailyUsers?.length ?? 0,
      weekly: weeklyUsers?.length ?? 0,
      monthly: monthlyUsers?.length ?? 0,
    };
  }
  
  /**
   * Get all metrics
   */
  async getAllMetrics(supabase: any): Promise<{
    apiKeyValidation: PercentileMetrics & { successRate: number };
    pluginDownloads: { total: number; failures: number; failureRate: number };
    activeUsers: ActiveUsersMetric;
    errors: ErrorMetric[];
    dbQueries: PercentileMetrics;
  }> {
    const activeUsers = await this.getActiveUsersMetrics(supabase);
    
    return {
      apiKeyValidation: this.getApiKeyValidationMetrics(),
      pluginDownloads: this.getPluginDownloadMetrics(),
      activeUsers,
      errors: this.getErrorMetrics(),
      dbQueries: this.getDbQueryMetrics(),
    };
  }
  
  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.store.reset();
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
export type { PercentileMetrics, ErrorMetric, ActiveUsersMetric };
