/**
 * Rate Limiting Middleware
 * Implements rate limiting for authentication endpoints
 * Requirements: 4.3 - Rate limiting on authentication endpoints
 * 
 * Uses in-memory store for simplicity (single-server deployment)
 * For multi-server deployments, consider Redis-based solution
 */

interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  signin: { requests: 5, window: 15 * 60 * 1000 },      // 5 attempts per 15 minutes
  signup: { requests: 3, window: 60 * 60 * 1000 },      // 3 signups per hour
  forgotPassword: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
  resetPassword: { requests: 5, window: 60 * 60 * 1000 }, // 5 resets per hour
  verifyEmail: { requests: 10, window: 60 * 60 * 1000 }, // 10 verifications per hour
  resendVerification: { requests: 3, window: 60 * 60 * 1000 }, // 3 resends per hour
  requestPasswordReset: { requests: 3, window: 60 * 60 * 1000 }, // 3 requests per hour
};

/**
 * Get client identifier (IP address)
 */
function getClientId(request: Request): string {
  // Try to get real IP from headers (for proxies/load balancers)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    if (firstIp) {
      return firstIp.trim();
    }
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to a default identifier
  return 'unknown';
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now >= entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check rate limit for a given endpoint and client
 */
export function checkRateLimit(
  request: Request,
  endpoint: keyof typeof RATE_LIMITS
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
} {
  const config = RATE_LIMITS[endpoint];
  if (!config) {
    throw new Error(`Unknown rate limit endpoint: ${endpoint}`);
  }

  const clientId = getClientId(request);
  const key = `${endpoint}:${clientId}`;
  const now = Date.now();

  // Cleanup expired entries periodically
  if (Math.random() < 0.01) { // 1% chance on each call
    cleanupExpiredEntries();
  }

  let entry = rateLimitStore.get(key);

  // If no entry or entry expired, create new one
  if (!entry || now >= entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.window,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      limit: config.requests,
      remaining: config.requests - 1,
      reset: entry.resetTime,
    };
  }

  // Increment count
  entry.count++;

  // Check if limit exceeded
  if (entry.count > config.requests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      allowed: false,
      limit: config.requests,
      remaining: 0,
      reset: entry.resetTime,
      retryAfter,
    };
  }

  return {
    allowed: true,
    limit: config.requests,
    remaining: config.requests - entry.count,
    reset: entry.resetTime,
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: ReturnType<typeof checkRateLimit>): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
    ...(result.retryAfter ? { 'Retry-After': result.retryAfter.toString() } : {}),
  };
}

/**
 * Create rate limit error response
 */
export function createRateLimitErrorResponse(result: ReturnType<typeof checkRateLimit>): Response {
  const headers = createRateLimitHeaders(result);
  
  return new Response(
    JSON.stringify({
      error: 'Trop de tentatives',
      message: `Vous avez dépassé le nombre maximum de tentatives. Veuillez réessayer dans ${result.retryAfter} secondes.`,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}
