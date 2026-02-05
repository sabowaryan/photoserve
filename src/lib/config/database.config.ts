/**
 * Database Configuration
 * Configures connection pooling, timeouts, and retry logic for Supabase
 * 
 * Requirements: 14.6 - Database connection pooling
 */

/**
 * Database connection pool configuration
 */
export const DATABASE_CONFIG = {
  /**
   * Maximum number of connections in the pool
   * Requirement: Configure connection pool with max 20 connections
   */
  MAX_CONNECTIONS: 20,

  /**
   * Minimum number of connections to maintain in the pool
   */
  MIN_CONNECTIONS: 2,

  /**
   * Connection timeout in milliseconds (30 seconds)
   */
  CONNECTION_TIMEOUT_MS: 30000,

  /**
   * Query timeout in milliseconds (10 seconds)
   */
  QUERY_TIMEOUT_MS: 10000,

  /**
   * Idle connection timeout in milliseconds (5 minutes)
   */
  IDLE_TIMEOUT_MS: 5 * 60 * 1000,

  /**
   * Maximum number of retry attempts for failed queries
   */
  MAX_RETRY_ATTEMPTS: 3,

  /**
   * Base delay for exponential backoff in milliseconds
   */
  RETRY_BASE_DELAY_MS: 100,

  /**
   * Maximum delay for exponential backoff in milliseconds
   */
  RETRY_MAX_DELAY_MS: 5000,
} as const;

/**
 * Connection pool statistics
 */
export interface PoolStats {
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  totalConnections: number;
  maxConnections: number;
  utilizationPercent: number;
}

/**
 * Retry configuration for database operations
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: DATABASE_CONFIG.MAX_RETRY_ATTEMPTS,
  baseDelayMs: DATABASE_CONFIG.RETRY_BASE_DELAY_MS,
  maxDelayMs: DATABASE_CONFIG.RETRY_MAX_DELAY_MS,
  shouldRetry: (error: unknown) => {
    // Retry on connection errors, timeouts, and temporary failures
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('connection') ||
        message.includes('timeout') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('temporary')
      );
    }
    return false;
  },
};

/**
 * Calculate exponential backoff delay
 * 
 * @param attempt - Current attempt number (0-indexed)
 * @param baseDelayMs - Base delay in milliseconds
 * @param maxDelayMs - Maximum delay in milliseconds
 * @returns Delay in milliseconds with jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  baseDelayMs: number = DATABASE_CONFIG.RETRY_BASE_DELAY_MS,
  maxDelayMs: number = DATABASE_CONFIG.RETRY_MAX_DELAY_MS
): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt);
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
  
  // Add jitter (±25% randomness) to prevent thundering herd
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);
  
  return Math.floor(cappedDelay + jitter);
}

/**
 * Execute a database operation with retry logic
 * 
 * @param operation - Async operation to execute
 * @param config - Retry configuration
 * @returns Result of the operation
 * @throws Error if all retry attempts fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = config.shouldRetry?.(error) ?? true;
      const isLastAttempt = attempt === config.maxAttempts - 1;
      
      if (!shouldRetry || isLastAttempt) {
        throw error;
      }
      
      // Calculate delay and wait before retrying
      const delay = calculateBackoffDelay(attempt, config.baseDelayMs, config.maxDelayMs);
      
      console.warn(
        `[DatabaseRetry] Attempt ${attempt + 1}/${config.maxAttempts} failed, retrying in ${delay}ms`,
        error instanceof Error ? error.message : 'Unknown error'
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Connection pool monitor
 * Tracks connection pool usage and provides statistics
 */
export class ConnectionPoolMonitor {
  private stats: PoolStats = {
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    totalConnections: 0,
    maxConnections: DATABASE_CONFIG.MAX_CONNECTIONS,
    utilizationPercent: 0,
  };

  /**
   * Update pool statistics
   * Note: Supabase JS client doesn't expose pool stats directly,
   * so this is a placeholder for future implementation with direct PostgreSQL client
   */
  updateStats(stats: Partial<PoolStats>): void {
    this.stats = {
      ...this.stats,
      ...stats,
      utilizationPercent: stats.totalConnections
        ? (stats.totalConnections / DATABASE_CONFIG.MAX_CONNECTIONS) * 100
        : this.stats.utilizationPercent,
    };
  }

  /**
   * Get current pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * Check if pool is near capacity
   * @param threshold - Utilization threshold (0-100)
   * @returns True if utilization is above threshold
   */
  isNearCapacity(threshold: number = 80): boolean {
    return this.stats.utilizationPercent >= threshold;
  }

  /**
   * Check if pool is exhausted
   * @returns True if all connections are in use
   */
  isExhausted(): boolean {
    return this.stats.totalConnections >= DATABASE_CONFIG.MAX_CONNECTIONS;
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0,
      totalConnections: 0,
      maxConnections: DATABASE_CONFIG.MAX_CONNECTIONS,
      utilizationPercent: 0,
    };
  }
}

// Singleton instance
let poolMonitorInstance: ConnectionPoolMonitor | null = null;

/**
 * Get the singleton connection pool monitor instance
 */
export function getPoolMonitor(): ConnectionPoolMonitor {
  if (!poolMonitorInstance) {
    poolMonitorInstance = new ConnectionPoolMonitor();
  }
  return poolMonitorInstance;
}

/**
 * Reset the pool monitor instance (for testing)
 */
export function resetPoolMonitor(): void {
  poolMonitorInstance = null;
}
