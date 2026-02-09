/**
 * Email System Performance Configuration
 * 
 * Centralized configuration for performance-related settings including
 * queue batch sizes, connection pooling, and caching strategies.
 * 
 * Requirements: 11.5, 11.6
 */

/**
 * Queue processing configuration
 */
export const QUEUE_CONFIG = {
  /**
   * Default batch size for queue processing
   * Optimized through benchmarking for balance between throughput and latency
   */
  DEFAULT_BATCH_SIZE: parseInt(process.env.EMAIL_QUEUE_BATCH_SIZE || '10', 10),
  
  /**
   * Maximum batch size (safety limit)
   */
  MAX_BATCH_SIZE: 50,
  
  /**
   * Minimum batch size
   */
  MIN_BATCH_SIZE: 1,
  
  /**
   * Batch size for high-priority emails
   */
  HIGH_PRIORITY_BATCH_SIZE: 5,
  
  /**
   * Processing interval in milliseconds (how often to check queue)
   */
  PROCESSING_INTERVAL: 60 * 1000, // 1 minute
  
  /**
   * Maximum concurrent email sends
   */
  MAX_CONCURRENT_SENDS: 10,
  
  /**
   * Timeout for individual email send (milliseconds)
   */
  SEND_TIMEOUT: 30 * 1000, // 30 seconds
};

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  /**
   * Enable/disable caching
   */
  ENABLED: process.env.EMAIL_CACHE_ENABLED !== 'false',
  
  /**
   * Template cache TTL (milliseconds)
   */
  TEMPLATE_TTL: 15 * 60 * 1000, // 15 minutes
  
  /**
   * Provider config cache TTL (milliseconds)
   */
  PROVIDER_CONFIG_TTL: 5 * 60 * 1000, // 5 minutes
  
  /**
   * Rendered template cache TTL (milliseconds)
   */
  RENDERED_TEMPLATE_TTL: 30 * 60 * 1000, // 30 minutes
  
  /**
   * Sender address cache TTL (milliseconds)
   */
  SENDER_ADDRESS_TTL: 10 * 60 * 1000, // 10 minutes
  
  /**
   * Maximum cache size (number of entries)
   */
  MAX_CACHE_SIZE: 1000,
  
  /**
   * Cleanup interval (milliseconds)
   */
  CLEANUP_INTERVAL: 10 * 60 * 1000, // 10 minutes
};

/**
 * Database connection pooling configuration
 */
export const DB_POOL_CONFIG = {
  /**
   * Minimum number of connections in the pool
   */
  MIN_CONNECTIONS: parseInt(process.env.DB_POOL_MIN || '2', 10),
  
  /**
   * Maximum number of connections in the pool
   */
  MAX_CONNECTIONS: parseInt(process.env.DB_POOL_MAX || '10', 10),
  
  /**
   * Connection idle timeout (milliseconds)
   */
  IDLE_TIMEOUT: 30 * 1000, // 30 seconds
  
  /**
   * Connection acquisition timeout (milliseconds)
   */
  ACQUIRE_TIMEOUT: 10 * 1000, // 10 seconds
  
  /**
   * Enable connection pooling
   */
  ENABLED: process.env.DB_POOL_ENABLED !== 'false',
};

/**
 * Query optimization configuration
 */
export const QUERY_CONFIG = {
  /**
   * Default page size for paginated queries
   */
  DEFAULT_PAGE_SIZE: 20,
  
  /**
   * Maximum page size
   */
  MAX_PAGE_SIZE: 100,
  
  /**
   * Enable query result caching
   */
  CACHE_RESULTS: true,
  
  /**
   * Query timeout (milliseconds)
   */
  TIMEOUT: 30 * 1000, // 30 seconds
  
  /**
   * Enable query logging for slow queries
   */
  LOG_SLOW_QUERIES: process.env.NODE_ENV === 'development',
  
  /**
   * Slow query threshold (milliseconds)
   */
  SLOW_QUERY_THRESHOLD: 1000, // 1 second
};

/**
 * Performance monitoring configuration
 */
export const MONITORING_CONFIG = {
  /**
   * Enable performance monitoring
   */
  ENABLED: process.env.EMAIL_MONITORING_ENABLED !== 'false',
  
  /**
   * Metrics collection interval (milliseconds)
   */
  METRICS_INTERVAL: 60 * 1000, // 1 minute
  
  /**
   * Enable detailed timing metrics
   */
  DETAILED_TIMING: process.env.NODE_ENV === 'development',
  
  /**
   * Log performance warnings
   */
  LOG_WARNINGS: true,
  
  /**
   * Performance warning thresholds
   */
  THRESHOLDS: {
    /**
     * Template rendering time (milliseconds)
     */
    TEMPLATE_RENDER: 500,
    
    /**
     * Email send time (milliseconds)
     */
    EMAIL_SEND: 2000,
    
    /**
     * Database query time (milliseconds)
     */
    DB_QUERY: 1000,
    
    /**
     * Queue processing time (milliseconds)
     */
    QUEUE_PROCESS: 5000,
  },
};

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  /**
   * Maximum retry attempts
   */
  MAX_RETRIES: parseInt(process.env.EMAIL_RETRY_MAX_ATTEMPTS || '5', 10),
  
  /**
   * Retry delays (milliseconds) - exponential backoff
   */
  DELAYS: [
    60 * 1000,        // 1 minute
    5 * 60 * 1000,    // 5 minutes
    15 * 60 * 1000,   // 15 minutes
    45 * 60 * 1000,   // 45 minutes
    2 * 60 * 60 * 1000, // 2 hours
  ],
  
  /**
   * Retry on specific error codes
   */
  RETRYABLE_ERRORS: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'RATE_LIMIT_EXCEEDED',
    'SERVICE_UNAVAILABLE',
  ],
};

/**
 * Get optimized batch size based on queue depth and priority
 */
export function getOptimizedBatchSize(
  queueDepth: number,
  priority: 'high' | 'normal' | 'low' = 'normal'
): number {
  // High priority emails get smaller batches for faster processing
  if (priority === 'high') {
    return QUEUE_CONFIG.HIGH_PRIORITY_BATCH_SIZE;
  }
  
  // Adjust batch size based on queue depth
  if (queueDepth > 1000) {
    // Large queue: increase batch size for throughput
    return Math.min(QUEUE_CONFIG.MAX_BATCH_SIZE, 30);
  } else if (queueDepth > 100) {
    // Medium queue: use default batch size
    return QUEUE_CONFIG.DEFAULT_BATCH_SIZE;
  } else {
    // Small queue: use smaller batches for lower latency
    return Math.max(QUEUE_CONFIG.MIN_BATCH_SIZE, 5);
  }
}

/**
 * Check if caching should be used for a specific operation
 */
export function shouldUseCache(_operation: 'template' | 'provider' | 'rendered' | 'sender'): boolean {
  if (!CACHE_CONFIG.ENABLED) {
    return false;
  }
  
  // In development, caching can be disabled for testing
  if (process.env.NODE_ENV === 'development' && process.env.DISABLE_CACHE === 'true') {
    return false;
  }
  
  return true;
}

/**
 * Get cache TTL for a specific operation
 */
export function getCacheTTL(operation: 'template' | 'provider' | 'rendered' | 'sender'): number {
  switch (operation) {
    case 'template':
      return CACHE_CONFIG.TEMPLATE_TTL;
    case 'provider':
      return CACHE_CONFIG.PROVIDER_CONFIG_TTL;
    case 'rendered':
      return CACHE_CONFIG.RENDERED_TEMPLATE_TTL;
    case 'sender':
      return CACHE_CONFIG.SENDER_ADDRESS_TTL;
    default:
      return CACHE_CONFIG.TEMPLATE_TTL;
  }
}

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Simple performance timer
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  
  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
  }
  
  /**
   * End the timer and return metrics
   */
  end(metadata?: Record<string, any>): PerformanceMetrics {
    const duration = Date.now() - this.startTime;
    
    // Log warning if operation exceeded threshold
    if (MONITORING_CONFIG.LOG_WARNINGS) {
      const threshold = this.getThreshold();
      if (threshold && duration > threshold) {
        console.warn(
          `[Performance Warning] ${this.operation} took ${duration}ms (threshold: ${threshold}ms)`,
          metadata
        );
      }
    }
    
    return {
      operation: this.operation,
      duration,
      timestamp: this.startTime,
      metadata,
    };
  }
  
  /**
   * Get threshold for this operation
   */
  private getThreshold(): number | null {
    if (this.operation.includes('render')) {
      return MONITORING_CONFIG.THRESHOLDS.TEMPLATE_RENDER;
    } else if (this.operation.includes('send')) {
      return MONITORING_CONFIG.THRESHOLDS.EMAIL_SEND;
    } else if (this.operation.includes('query') || this.operation.includes('db')) {
      return MONITORING_CONFIG.THRESHOLDS.DB_QUERY;
    } else if (this.operation.includes('queue')) {
      return MONITORING_CONFIG.THRESHOLDS.QUEUE_PROCESS;
    }
    return null;
  }
}

/**
 * Create a performance timer
 */
export function startTimer(operation: string): PerformanceTimer {
  return new PerformanceTimer(operation);
}
