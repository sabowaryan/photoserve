/**
 * Rate Limiting Middleware
 * 
 * Implements rate limiting for API endpoints using an in-memory cache.
 * Tracks requests per API key hash with configurable limits.
 * 
 * Requirements: 12.3, 12.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  requestsPerMinute: number;  // Max requests per minute per key
  burstLimit: number;         // Max requests per second per key
}

/**
 * Rate limit entry tracking request counts
 */
interface RateLimitEntry {
  minuteCount: number;        // Requests in current minute
  secondCount: number;        // Requests in current second
  minuteResetAt: number;      // Timestamp when minute window resets
  secondResetAt: number;      // Timestamp when second window resets
}

/**
 * In-memory cache for rate limit tracking
 * Key: API key hash
 * Value: RateLimitEntry
 */
const rateLimitCache = new Map<string, RateLimitEntry>();

/**
 * Default rate limit configuration
 */
const DEFAULT_CONFIG: RateLimitConfig = {
  requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '100', 10),
  burstLimit: parseInt(process.env.RATE_LIMIT_BURST || '10', 10),
};

/**
 * Clean up expired entries from the cache
 * Runs periodically to prevent memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const [key, entry] of rateLimitCache.entries()) {
    // If both windows have expired, remove the entry
    if (entry.minuteResetAt < now && entry.secondResetAt < now) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    rateLimitCache.delete(key);
  }
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Hash an API key for use as a cache key
 */
function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Check if a request should be rate limited
 * 
 * @param apiKey - The API key to check
 * @param config - Rate limit configuration
 * @returns Object with isLimited flag and retryAfter seconds
 */
export function checkRateLimit(
  apiKey: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { isLimited: boolean; retryAfter?: number } {
  const keyHash = hashApiKey(apiKey);
  const now = Date.now();
  
  // Get or create rate limit entry
  let entry = rateLimitCache.get(keyHash);
  
  if (!entry) {
    // First request for this key
    entry = {
      minuteCount: 0,
      secondCount: 0,
      minuteResetAt: now + 60000, // 1 minute from now
      secondResetAt: now + 1000,  // 1 second from now
    };
    rateLimitCache.set(keyHash, entry);
  }
  
  // Reset minute window if expired
  if (entry.minuteResetAt <= now) {
    entry.minuteCount = 0;
    entry.minuteResetAt = now + 60000;
  }
  
  // Reset second window if expired
  if (entry.secondResetAt <= now) {
    entry.secondCount = 0;
    entry.secondResetAt = now + 1000;
  }
  
  // Check burst limit (requests per second)
  if (entry.secondCount >= config.burstLimit) {
    const retryAfter = Math.ceil((entry.secondResetAt - now) / 1000);
    return { isLimited: true, retryAfter };
  }
  
  // Check minute limit
  if (entry.minuteCount >= config.requestsPerMinute) {
    const retryAfter = Math.ceil((entry.minuteResetAt - now) / 1000);
    return { isLimited: true, retryAfter };
  }
  
  // Increment counters
  entry.minuteCount++;
  entry.secondCount++;
  
  return { isLimited: false };
}

/**
 * Rate limiting middleware for Next.js API routes
 * 
 * Extracts API key from Authorization header and checks rate limits.
 * Returns 429 Too Many Requests if limits are exceeded.
 * 
 * @param request - Next.js request object
 * @param config - Optional rate limit configuration
 * @returns NextResponse with 429 status if rate limited, null otherwise
 */
export function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): NextResponse | null {
  // Extract Bearer token from Authorization header
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // No API key, skip rate limiting
    // (authentication will fail in the endpoint handler)
    return null;
  }
  
  // Extract the token
  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  
  if (!apiKey) {
    // Empty token, skip rate limiting
    return null;
  }
  
  // Check rate limit
  const { isLimited, retryAfter } = checkRateLimit(apiKey, config);
  
  if (isLimited) {
    // Return 429 with Retry-After header
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': retryAfter?.toString() || '60',
          'X-RateLimit-Limit': config.requestsPerMinute.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + (retryAfter || 60) * 1000).toISOString(),
        },
      }
    );
  }
  
  // Not rate limited, continue
  return null;
}

/**
 * Get current rate limit status for an API key
 * Useful for debugging and monitoring
 */
export function getRateLimitStatus(apiKey: string): {
  minuteCount: number;
  secondCount: number;
  minuteRemaining: number;
  secondRemaining: number;
} | null {
  const keyHash = hashApiKey(apiKey);
  const entry = rateLimitCache.get(keyHash);
  
  if (!entry) {
    return null;
  }
  
  const now = Date.now();
  
  // Reset counts if windows have expired
  const minuteCount = entry.minuteResetAt <= now ? 0 : entry.minuteCount;
  const secondCount = entry.secondResetAt <= now ? 0 : entry.secondCount;
  
  return {
    minuteCount,
    secondCount,
    minuteRemaining: Math.max(0, DEFAULT_CONFIG.requestsPerMinute - minuteCount),
    secondRemaining: Math.max(0, DEFAULT_CONFIG.burstLimit - secondCount),
  };
}

/**
 * Clear rate limit for a specific API key
 * Useful for testing and administrative purposes
 */
export function clearRateLimit(apiKey: string): void {
  const keyHash = hashApiKey(apiKey);
  rateLimitCache.delete(keyHash);
}

/**
 * Clear all rate limits
 * Useful for testing
 */
export function clearAllRateLimits(): void {
  rateLimitCache.clear();
}
