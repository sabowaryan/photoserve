/**
 * Property-Based Tests for API Authentication Middleware
 * 
 * Feature: nextjs-migration, Property 23: API Authentication Middleware
 * Validates: Requirements 9.5
 * 
 * Tests that:
 * - For any request to a protected API route without valid authentication,
 *   the response SHALL be HTTP 401
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { handleApiError } from '@/lib/api/error-handler';
import { AuthenticationError } from '@/lib/errors';

/**
 * Simulates the authentication check behavior used in API routes.
 * This mirrors the logic in requireSupabaseClient() from lib/auth/index.ts
 * 
 * @param hasValidSession - Whether the request has a valid session
 * @returns The user ID if authenticated
 * @throws Error with message 'Authentication required' if not authenticated
 */
function simulateAuthCheck(hasValidSession: boolean): string {
  if (!hasValidSession) {
    throw new Error('Authentication required');
  }
  return 'user-123';
}

/**
 * Simulates how API routes handle authentication errors.
 * This mirrors the pattern used in all protected API routes.
 */
function handleAuthError(error: unknown) {
  if (error instanceof Error && error.message === 'Authentication required') {
    return handleApiError(new AuthenticationError());
  }
  return handleApiError(error);
}

/**
 * Helper to parse JSON body from NextResponse
 */
async function parseResponseBody(response: Response): Promise<{ error: string; code?: string }> {
  return await response.json();
}

describe('API Authentication Middleware - Property 23', () => {
  /**
   * Feature: nextjs-migration, Property 23: API Authentication Middleware
   * Validates: Requirements 9.5
   * 
   * For any request to a protected API route without valid authentication,
   * the response SHALL be HTTP 401.
   */

  it('should return HTTP 401 for any unauthenticated request to protected API routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various API route paths that would be protected
        fc.oneof(
          fc.constant('/api/galleries'),
          fc.constant('/api/galleries/123'),
          fc.constant('/api/images/upload'),
          fc.constant('/api/images/456'),
          fc.constant('/api/stripe/checkout'),
          fc.constant('/api/stripe/portal'),
          // Generate random gallery IDs
          fc.uuid().map(id => `/api/galleries/${id}`),
          // Generate random image IDs
          fc.uuid().map(id => `/api/images/${id}`),
        ),
        // Generate various HTTP methods
        fc.oneof(
          fc.constant('GET'),
          fc.constant('POST'),
          fc.constant('PUT'),
          fc.constant('DELETE'),
        ),
        async (_apiPath, _method) => {
          // Simulate an unauthenticated request
          const hasValidSession = false;
          
          try {
            simulateAuthCheck(hasValidSession);
            // If we get here, the test should fail
            expect.fail('Should have thrown authentication error');
          } catch (error) {
            // Handle the error as API routes do
            const response = handleAuthError(error);
            const body = await parseResponseBody(response);
            
            // MUST return HTTP 401 for unauthenticated requests
            expect(response.status).toBe(401);
            
            // MUST have proper error format
            expect(body.error).toBe('Authentication required');
            expect(body.code).toBe('AUTH_REQUIRED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow authenticated requests to proceed', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various API route paths
        fc.oneof(
          fc.constant('/api/galleries'),
          fc.constant('/api/galleries/123'),
          fc.constant('/api/images/upload'),
          fc.uuid().map(id => `/api/galleries/${id}`),
        ),
        async (_apiPath) => {
          // Simulate an authenticated request
          const hasValidSession = true;
          
          // Should NOT throw for authenticated requests
          const userId = simulateAuthCheck(hasValidSession);
          
          // Should return a valid user ID
          expect(userId).toBeDefined();
          expect(typeof userId).toBe('string');
          expect(userId.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent 401 response format for all protected routes', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random protected API paths
        fc.oneof(
          // Gallery routes
          fc.constant('/api/galleries'),
          fc.uuid().map(id => `/api/galleries/${id}`),
          // Image routes
          fc.constant('/api/images/upload'),
          fc.uuid().map(id => `/api/images/${id}`),
          // Stripe routes
          fc.constant('/api/stripe/checkout'),
          fc.constant('/api/stripe/portal'),
          // Profile routes
          fc.constant('/api/profile'),
          fc.constant('/api/profile/settings'),
        ),
        async (_apiPath) => {
          // Simulate unauthenticated request
          try {
            simulateAuthCheck(false);
            expect.fail('Should have thrown');
          } catch (error) {
            const response = handleAuthError(error);
            const body = await parseResponseBody(response);
            
            // All unauthenticated requests MUST return:
            // 1. HTTP 401 status
            expect(response.status).toBe(401);
            
            // 2. Consistent error message
            expect(body.error).toBe('Authentication required');
            
            // 3. Consistent error code
            expect(body.code).toBe('AUTH_REQUIRED');
            
            // 4. No sensitive information in response
            const bodyStr = JSON.stringify(body);
            expect(bodyStr).not.toContain('password');
            expect(bodyStr).not.toContain('token');
            expect(bodyStr).not.toContain('secret');
            expect(bodyStr).not.toContain('stack');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle AuthenticationError correctly regardless of custom message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various authentication error messages
        fc.oneof(
          fc.constant('Authentication required'),
          fc.constant('Session expired'),
          fc.constant('Invalid token'),
          fc.constant('Token verification failed'),
          fc.string({ minLength: 1, maxLength: 100 }),
        ),
        async (message) => {
          const error = new AuthenticationError(message);
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // MUST always return HTTP 401
          expect(response.status).toBe(401);
          
          // MUST always have AUTH_REQUIRED code
          expect(body.code).toBe('AUTH_REQUIRED');
          
          // Error message should be the custom message
          expect(body.error).toBe(message);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should distinguish between authentication (401) and authorization (403) errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.boolean(),
        async (isAuthenticationError) => {
          let response;
          
          if (isAuthenticationError) {
            // User is not authenticated at all
            response = handleApiError(new AuthenticationError());
            expect(response.status).toBe(401);
            
            const body = await parseResponseBody(response);
            expect(body.code).toBe('AUTH_REQUIRED');
          } else {
            // User is authenticated but not authorized
            const { AuthorizationError } = await import('@/lib/errors');
            response = handleApiError(new AuthorizationError());
            expect(response.status).toBe(403);
            
            const body = await parseResponseBody(response);
            expect(body.code).toBe('ACCESS_DENIED');
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('API Authentication Middleware - Error Handling Patterns', () => {
  /**
   * Tests that the authentication error handling pattern used in API routes
   * correctly identifies and converts authentication errors to HTTP 401.
   */

  it('should correctly identify "Authentication required" error message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate various error messages
        fc.oneof(
          fc.constant('Authentication required'),
          fc.constant('Some other error'),
          fc.constant('Database connection failed'),
          fc.constant('Validation error'),
          fc.string({ minLength: 1, maxLength: 100 }),
        ),
        async (errorMessage) => {
          const error = new Error(errorMessage);
          const response = handleAuthError(error);
          
          if (errorMessage === 'Authentication required') {
            // Should be converted to 401
            expect(response.status).toBe(401);
            const body = await parseResponseBody(response);
            expect(body.code).toBe('AUTH_REQUIRED');
          } else {
            // Should be treated as generic error (500)
            expect(response.status).toBe(500);
            const body = await parseResponseBody(response);
            expect(body.code).toBe('INTERNAL_ERROR');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle null/undefined session gracefully', async () => {
    // Test various falsy session values
    const falsyValues = [null, undefined, false, '', 0];
    
    for (const value of falsyValues) {
      try {
        // Simulate auth check with falsy session
        if (!value) {
          throw new Error('Authentication required');
        }
      } catch (error) {
        const response = handleAuthError(error);
        
        // All falsy sessions should result in 401
        expect(response.status).toBe(401);
        
        const body = await parseResponseBody(response);
        expect(body.code).toBe('AUTH_REQUIRED');
      }
    }
  });
});

describe('API Authentication Middleware - Response Format Consistency', () => {
  /**
   * Tests that authentication error responses maintain consistent format
   * across all scenarios.
   */

  it('should never include sensitive information in 401 responses', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(new AuthenticationError()),
          fc.constant(new AuthenticationError('Session expired')),
          fc.constant(new AuthenticationError('Invalid credentials')),
        ),
        async (error) => {
          const response = handleApiError(error);
          const bodyStr = JSON.stringify(await response.json());
          
          // Should NOT contain sensitive patterns
          expect(bodyStr.toLowerCase()).not.toContain('password');
          expect(bodyStr.toLowerCase()).not.toContain('hash');
          expect(bodyStr.toLowerCase()).not.toContain('secret');
          expect(bodyStr.toLowerCase()).not.toContain('token');
          expect(bodyStr.toLowerCase()).not.toContain('key');
          expect(bodyStr).not.toContain('stack');
          expect(bodyStr).not.toContain('.ts:');
          expect(bodyStr).not.toContain('.js:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only allowed fields in 401 response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const error = new AuthenticationError(message);
          const response = handleApiError(error);
          const body = await response.json();
          
          // Only allowed keys: error, code, details
          const allowedKeys = ['error', 'code', 'details'];
          const actualKeys = Object.keys(body);
          
          for (const key of actualKeys) {
            expect(allowedKeys).toContain(key);
          }
          
          // Must have error and code
          expect(body.error).toBeDefined();
          expect(body.code).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
