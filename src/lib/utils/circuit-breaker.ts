/**
 * Circuit Breaker Pattern Implementation
 * Provides fault tolerance and graceful degradation for external service calls
 * 
 * Features:
 * - Automatic failure detection
 * - Circuit state management (CLOSED, OPEN, HALF_OPEN)
 * - Configurable thresholds and timeouts
 * - Fallback support
 * - Metrics tracking
 * 
 * Requirements: 14.8 - Graceful degradation for external service failures
 */

/**
 * Circuit breaker states
 */
export enum CircuitState {
  /** Circuit is closed, requests flow normally */
  CLOSED = 'CLOSED',
  
  /** Circuit is open, requests fail immediately */
  OPEN = 'OPEN',
  
  /** Circuit is testing if service has recovered */
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  
  /** Time window for counting failures (ms) */
  failureWindowMs: number;
  
  /** Time to wait before attempting recovery (ms) */
  resetTimeoutMs: number;
  
  /** Number of successful requests needed to close circuit from half-open */
  successThreshold: number;
  
  /** Request timeout (ms) */
  requestTimeoutMs: number;
}

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  state: CircuitState;
  failures: number;
  successes: number;
  rejections: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  stateChangedAt: Date;
}

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  failureWindowMs: 60000, // 1 minute
  resetTimeoutMs: 30000, // 30 seconds
  successThreshold: 2,
  requestTimeoutMs: 10000, // 10 seconds
};

/**
 * Circuit Breaker Implementation
 */
export class CircuitBreaker<T = any> {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private rejections: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessTime?: Date;
  private stateChangedAt: Date = new Date();
  private nextAttemptTime?: Date;
  private config: CircuitBreakerConfig;
  private name: string;

  constructor(name: string, config: Partial<CircuitBreakerConfig> = {}) {
    this.name = name;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with circuit breaker protection
   * 
   * @param fn - Async function to execute
   * @param fallback - Optional fallback function if circuit is open
   * @returns Result of the function or fallback
   * @throws Error if circuit is open and no fallback provided
   */
  async execute<R = T>(
    fn: () => Promise<R>,
    fallback?: () => Promise<R> | R
  ): Promise<R> {
    // Check if circuit is open
    if (this.state === CircuitState.OPEN) {
      // Check if we should attempt recovery
      if (this.shouldAttemptReset()) {
        this.transitionToHalfOpen();
      } else {
        this.rejections++;
        
        // Use fallback if provided
        if (fallback) {
          console.warn(`[CircuitBreaker:${this.name}] Circuit is OPEN, using fallback`);
          return fallback instanceof Function ? await fallback() : fallback;
        }
        
        throw new Error(`Circuit breaker is OPEN for ${this.name}`);
      }
    }

    try {
      // Execute with timeout
      const result = await this.executeWithTimeout(fn);
      
      // Record success
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Record failure
      this.onFailure(error);
      
      // Use fallback if provided
      if (fallback) {
        console.warn(
          `[CircuitBreaker:${this.name}] Request failed, using fallback`,
          error instanceof Error ? error.message : 'Unknown error'
        );
        return fallback instanceof Function ? await fallback() : fallback;
      }
      
      throw error;
    }
  }

  /**
   * Execute function with timeout
   * @private
   */
  private async executeWithTimeout<R>(fn: () => Promise<R>): Promise<R> {
    return Promise.race([
      fn(),
      new Promise<R>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Request timeout after ${this.config.requestTimeoutMs}ms`)),
          this.config.requestTimeoutMs
        )
      ),
    ]);
  }

  /**
   * Handle successful request
   * @private
   */
  private onSuccess(): void {
    this.lastSuccessTime = new Date();
    this.failures = 0; // Reset failure count on success
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      
      // Check if we should close the circuit
      if (this.successes >= this.config.successThreshold) {
        this.transitionToClosed();
      }
    }
  }

  /**
   * Handle failed request
   * @private
   */
  private onFailure(error: unknown): void {
    this.lastFailureTime = new Date();
    this.failures++;
    
    console.error(
      `[CircuitBreaker:${this.name}] Request failed (${this.failures}/${this.config.failureThreshold})`,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    // Check if we should open the circuit
    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open state opens the circuit
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if failure threshold is reached
      if (this.failures >= this.config.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Check if we should attempt to reset the circuit
   * @private
   */
  private shouldAttemptReset(): boolean {
    if (!this.nextAttemptTime) return false;
    return new Date() >= this.nextAttemptTime;
  }

  /**
   * Transition to CLOSED state
   * @private
   */
  private transitionToClosed(): void {
    console.log(`[CircuitBreaker:${this.name}] Transitioning to CLOSED state`);
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.rejections = 0;
    this.stateChangedAt = new Date();
    this.nextAttemptTime = undefined;
  }

  /**
   * Transition to OPEN state
   * @private
   */
  private transitionToOpen(): void {
    console.warn(`[CircuitBreaker:${this.name}] Transitioning to OPEN state`);
    this.state = CircuitState.OPEN;
    this.successes = 0;
    this.stateChangedAt = new Date();
    this.nextAttemptTime = new Date(Date.now() + this.config.resetTimeoutMs);
  }

  /**
   * Transition to HALF_OPEN state
   * @private
   */
  private transitionToHalfOpen(): void {
    console.log(`[CircuitBreaker:${this.name}] Transitioning to HALF_OPEN state`);
    this.state = CircuitState.HALF_OPEN;
    this.successes = 0;
    this.failures = 0;
    this.stateChangedAt = new Date();
  }

  /**
   * Get current circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      rejections: this.rejections,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt,
    };
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Manually reset the circuit breaker
   */
  reset(): void {
    console.log(`[CircuitBreaker:${this.name}] Manual reset`);
    this.transitionToClosed();
  }

  /**
   * Check if circuit is healthy
   */
  isHealthy(): boolean {
    return this.state === CircuitState.CLOSED;
  }
}

/**
 * Circuit breaker registry for managing multiple circuit breakers
 */
class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  /**
   * Get or create a circuit breaker
   */
  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breakers
   */
  getAll(): Map<string, CircuitBreaker> {
    return new Map(this.breakers);
  }

  /**
   * Get metrics for all circuit breakers
   */
  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers.entries()) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }

  /**
   * Clear all circuit breakers (for testing)
   */
  clear(): void {
    this.breakers.clear();
  }
}

// Singleton registry
const registry = new CircuitBreakerRegistry();

/**
 * Get the circuit breaker registry
 */
export function getCircuitBreakerRegistry(): CircuitBreakerRegistry {
  return registry;
}

/**
 * Get or create a circuit breaker
 */
export function getCircuitBreaker(
  name: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  return registry.getOrCreate(name, config);
}
