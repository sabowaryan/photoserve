/**
 * Property-Based Tests for API Error Handler
 * 
 * Feature: nextjs-migration, Property 24: Consistent API Error Format
 * Validates: Requirements 9.6
 * 
 * Feature: nextjs-migration, Property 29: Security Error Sanitization
 * Validates: Requirements 11.7
 * 
 * Tests that:
 * - All API error responses follow the format { error: string, code?: string, details?: object }
 * - Security-sensitive operation failures do NOT expose stack traces, internal paths, or database details
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { handleApiError, ApiErrorResponse } from '../error-handler';
import { ZodError, ZodIssue } from 'zod';
import { 
  AppError, 
  AuthenticationError, 
  AuthorizationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  InvalidPasswordError,
  StorageLimitError,
  GalleryLimitError,
  ImageLimitError,
  FileSizeError,
  InvalidFileTypeError,
  GalleryExpiredError
} from '@/lib/errors';

// Patterns that should NEVER appear in client responses
const SENSITIVE_PATTERNS = [
  /at\s+\w+\s+\(/i,                    // Stack trace pattern: "at Function ("
  /\.ts:\d+:\d+/,                       // TypeScript file references
  /\.js:\d+:\d+/,                       // JavaScript file references
  /node_modules/i,                      // Node modules paths
  /\/src\//i,                           // Source directory paths
  /\/lib\//i,                           // Library paths
  /C:\\|\/home\/|\/Users\//i,           // Absolute file paths
  /password_hash/i,                     // Database column names
  /stripe_customer_id/i,                // Sensitive DB fields
  /stripe_subscription_id/i,            // Sensitive DB fields
  /SUPABASE_|STRIPE_|CLOUDINARY_/i,     // Environment variable names
  /postgresql:\/\//i,                   // Database connection strings
  /supabase\.co/i,                      // Supabase URLs in errors
  /Error:\s+.*\n\s+at/,                 // Full error stack
];

/**
 * Helper to check if response contains sensitive information
 */
function containsSensitiveInfo(responseBody: string): boolean {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(responseBody));
}

/**
 * Helper to extract JSON body from NextResponse
 */
async function getResponseBody(response: Response): Promise<string> {
  const json = await response.json();
  return JSON.stringify(json);
}

/**
 * Helper to parse JSON body from NextResponse
 */
async function parseResponseBody(response: Response): Promise<ApiErrorResponse> {
  return await response.json();
}

/**
 * Validates that a response body conforms to the API error format
 * Format: { error: string, code?: string, details?: object }
 */
function isValidApiErrorFormat(body: ApiErrorResponse): boolean {
  // 'error' field must be a non-empty string
  if (typeof body.error !== 'string' || body.error.length === 0) {
    return false;
  }
  
  // 'code' field is optional but must be a string if present
  if (body.code !== undefined && typeof body.code !== 'string') {
    return false;
  }
  
  // 'details' field is optional but must be an object if present
  if (body.details !== undefined && (typeof body.details !== 'object' || body.details === null || Array.isArray(body.details) === false && typeof body.details !== 'object')) {
    return false;
  }
  
  // No extra fields allowed beyond error, code, details
  const allowedKeys = ['error', 'code', 'details'];
  const actualKeys = Object.keys(body);
  for (const key of actualKeys) {
    if (!allowedKeys.includes(key)) {
      return false;
    }
  }
  
  return true;
}

describe('API Error Handler - Consistent API Error Format (Property 24)', () => {
  /**
   * Feature: nextjs-migration, Property 24: Consistent API Error Format
   * Validates: Requirements 9.6
   * 
   * For any API error response, the format SHALL be { error: string, code?: string, details?: object }
   */
  
  it('should return consistent format for generic Error objects', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }),
        async (message) => {
          const error = new Error(message);
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // Must have valid API error format
          expect(isValidApiErrorFormat(body)).toBe(true);
          
          // Generic errors should return 500
          expect(response.status).toBe(500);
          
          // Must have error and code fields (returns i18n key)
          expect(body.error).toBe('errors.generic.unexpected');
          expect(body.code).toBe('INTERNAL_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent format for AppError with various status codes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 400, max: 599 }),
        async (message, code, statusCode) => {
          const error = new AppError(message, code, statusCode);
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // Must have valid API error format
          expect(isValidApiErrorFormat(body)).toBe(true);
          
          // Should return the correct status code
          expect(response.status).toBe(statusCode);
          
          // Should have error and code fields
          expect(body.error).toBe(message);
          expect(body.code).toBe(code);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent format for AppError with details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 400, max: 599 }),
        fc.record({
          field: fc.string({ minLength: 1, maxLength: 30 }),
          value: fc.oneof(fc.string(), fc.integer(), fc.boolean()),
        }),
        async (message, code, statusCode, details) => {
          const error = new AppError(message, code, statusCode, details);
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // Must have valid API error format
          expect(isValidApiErrorFormat(body)).toBe(true);
          
          // Should return the correct status code
          expect(response.status).toBe(statusCode);
          
          // Should have error and code fields
          expect(body.error).toBe(message);
          expect(body.code).toBe(code);
          
          // Details should be present if not sanitized
          // (details may be sanitized if they contain sensitive info)
          if (body.details) {
            expect(typeof body.details).toBe('object');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent format for all custom error types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(new AuthenticationError()),
          fc.constant(new AuthenticationError('Custom auth message')),
          fc.constant(new AuthorizationError()),
          fc.constant(new AuthorizationError('Custom authz message')),
          fc.constant(new ValidationError('Validation failed', { field: 'email' })),
          fc.constant(new NotFoundError('Gallery')),
          fc.constant(new NotFoundError('User')),
          fc.constant(new RateLimitError(60)),
          fc.constant(new RateLimitError(900)),
          fc.constant(new InvalidPasswordError()),
          fc.constant(new StorageLimitError(100, 50)),
          fc.constant(new GalleryLimitError(10, 5)),
          fc.constant(new ImageLimitError(100, 50)),
          fc.constant(new FileSizeError(10, 5)),
          fc.constant(new InvalidFileTypeError('application/pdf', ['image/jpeg', 'image/png'])),
          fc.constant(new GalleryExpiredError('gallery-123')),
        ),
        async (error) => {
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // Must have valid API error format
          expect(isValidApiErrorFormat(body)).toBe(true);
          
          // Must have error field (non-empty string)
          expect(typeof body.error).toBe('string');
          expect(body.error.length).toBeGreaterThan(0);
          
          // Must have code field (string)
          expect(typeof body.code).toBe('string');
          expect(body.code!.length).toBeGreaterThan(0);
          
          // Status code should be appropriate (4xx or 5xx)
          expect(response.status).toBeGreaterThanOrEqual(400);
          expect(response.status).toBeLessThan(600);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent format for ZodError validation errors', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            code: fc.constant('invalid_type' as const),
            expected: fc.string({ minLength: 1, maxLength: 20 }),
            received: fc.string({ minLength: 1, maxLength: 20 }),
            path: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
            message: fc.string({ minLength: 1, maxLength: 100 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (issues) => {
          // Create a ZodError with the generated issues
          const zodError = new ZodError(issues as ZodIssue[]);
          const response = handleApiError(zodError);
          const body = await parseResponseBody(response);
          
          // Must have valid API error format
          expect(isValidApiErrorFormat(body)).toBe(true);
          
          // Should return 400 for validation errors
          expect(response.status).toBe(400);
          
          // Should have proper error message and code (returns i18n key)
          expect(body.error).toBe('api.errors.validationFailed');
          expect(body.code).toBe('VALIDATION_ERROR');
          
          // Should have details with validation issues
          expect(body.details).toBeDefined();
          expect(Array.isArray(body.details)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return consistent format with correct HTTP status codes for each error type', async () => {
    const errorStatusMap: Array<[AppError, number]> = [
      [new AuthenticationError(), 401],
      [new AuthorizationError(), 403],
      [new ValidationError('Invalid input'), 400],
      [new NotFoundError('Resource'), 404],
      [new RateLimitError(60), 429],
      [new InvalidPasswordError(), 401],
      [new StorageLimitError(100, 50), 400],
      [new GalleryLimitError(10, 5), 400],
      [new ImageLimitError(100, 50), 400],
      [new FileSizeError(10, 5), 400],
      [new InvalidFileTypeError('text/plain', ['image/jpeg']), 400],
      [new GalleryExpiredError('gallery-123'), 410],
    ];

    for (const [error, expectedStatus] of errorStatusMap) {
      const response = handleApiError(error);
      const body = await parseResponseBody(response);
      
      // Must have valid API error format
      expect(isValidApiErrorFormat(body)).toBe(true);
      
      // Should return correct status code
      expect(response.status).toBe(expectedStatus);
    }
  });

  it('should never include unexpected fields in error response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.string({ minLength: 1, maxLength: 100 }).map(msg => new Error(msg)),
          fc.string({ minLength: 1, maxLength: 100 }).map(msg => new AppError(msg, 'TEST_ERROR', 400)),
          fc.constant(new AuthenticationError()),
          fc.constant(new NotFoundError('Test')),
          fc.constant(new RateLimitError(60)),
        ),
        async (error) => {
          const response = handleApiError(error);
          const body = await parseResponseBody(response);
          
          // Only allowed keys
          const allowedKeys = ['error', 'code', 'details'];
          const actualKeys = Object.keys(body);
          
          for (const key of actualKeys) {
            expect(allowedKeys).toContain(key);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('API Error Handler - Security Error Sanitization', () => {
  /**
   * Feature: nextjs-migration, Property 29: Security Error Sanitization
   * Validates: Requirements 11.7
   * 
   * For any security-sensitive operation failure (auth, password verification),
   * the client response SHALL NOT contain stack traces, internal paths, or database details.
   */
  it('should sanitize generic Error objects and not expose internal details', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random error messages that might contain sensitive info
        fc.oneof(
          fc.constant(new Error('Connection to postgresql://user:pass@localhost:5432/db failed')),
          fc.constant(new Error('Error at /home/user/project/src/lib/auth.ts:42:15')),
          fc.constant(new Error('SUPABASE_SERVICE_ROLE_KEY is invalid')),
          fc.constant(new Error('password_hash column not found in profiles table')),
          fc.constant(new Error('stripe_customer_id validation failed')),
          fc.constant(new Error('Error in node_modules/@supabase/supabase-js/dist/main.js')),
          fc.string({ minLength: 1, maxLength: 200 }).map(msg => new Error(msg)),
        ),
        async (error) => {
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Response should NOT contain sensitive information
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Response should have generic error message (i18n key)
          expect(response.status).toBe(500);
          const json = JSON.parse(body);
          expect(json.error).toBe('errors.generic.unexpected');
          expect(json.code).toBe('INTERNAL_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should sanitize Error objects with stack traces', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 100 }),
        async (message) => {
          const error = new Error(message);
          // Simulate a real stack trace
          error.stack = `Error: ${message}
    at AuthService.authenticate (C:\\Users\\dev\\project\\src\\lib\\services\\auth.service.ts:42:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async POST (C:\\Users\\dev\\project\\src\\app\\api\\auth\\route.ts:15:20)`;
          
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Response should NOT contain stack trace
          expect(containsSensitiveInfo(body)).toBe(false);
          expect(body).not.toContain('at AuthService');
          expect(body).not.toContain('.ts:');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle AuthenticationError without exposing sensitive details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('Authentication required'),
          fc.constant('Invalid credentials'),
          fc.constant('Session expired'),
          fc.string({ minLength: 1, maxLength: 100 }),
        ),
        async (message) => {
          const error = new AuthenticationError(message);
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should return 401 status
          expect(response.status).toBe(401);
          
          // Should have proper error format
          const json = JSON.parse(body);
          expect(json.code).toBe('AUTH_REQUIRED');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle AuthorizationError without exposing sensitive details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('Access denied'),
          fc.constant('Insufficient permissions'),
          fc.string({ minLength: 1, maxLength: 100 }),
        ),
        async (message) => {
          const error = new AuthorizationError(message);
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should return 403 status
          expect(response.status).toBe(403);
          
          // Should have proper error format
          const json = JSON.parse(body);
          expect(json.code).toBe('ACCESS_DENIED');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle InvalidPasswordError without exposing password details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(new InvalidPasswordError()),
        async (error) => {
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should NOT contain actual password or hash
          expect(body.toLowerCase()).not.toContain('hash');
          expect(body.toLowerCase()).not.toContain('bcrypt');
          
          // Should return 401 status
          expect(response.status).toBe(401);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle ValidationError with safe details only', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          field: fc.string({ minLength: 1, maxLength: 50 }),
          message: fc.string({ minLength: 1, maxLength: 100 }),
        }),
        async (details) => {
          const error = new ValidationError('Validation failed', details);
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should return 400 status
          expect(response.status).toBe(400);
          
          // Should have proper error format
          const json = JSON.parse(body);
          expect(json.code).toBe('VALIDATION_ERROR');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle RateLimitError without exposing internal rate limit implementation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3600 }),
        async (retryAfterSeconds) => {
          const error = new RateLimitError(retryAfterSeconds);
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should return 429 status
          expect(response.status).toBe(429);
          
          // Should have proper error format with retry info
          const json = JSON.parse(body);
          expect(json.code).toBe('RATE_LIMIT_EXCEEDED');
          expect(json.details?.retryAfterSeconds).toBe(retryAfterSeconds);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle NotFoundError without exposing database structure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant('Gallery'),
          fc.constant('User'),
          fc.constant('Image'),
          fc.constant('Profile'),
          fc.string({ minLength: 1, maxLength: 50 }),
        ),
        async (resource) => {
          const error = new NotFoundError(resource);
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain sensitive patterns
          expect(containsSensitiveInfo(body)).toBe(false);
          
          // Should return 404 status
          expect(response.status).toBe(404);
          
          // Should have proper error format
          const json = JSON.parse(body);
          expect(json.code).toBe('NOT_FOUND');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should never expose database connection details in any error response', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          // Simulate various database-related errors
          fc.constant(new Error('FATAL: password authentication failed for user "postgres"')),
          fc.constant(new Error('connection to server at "db.supabase.co" failed')),
          fc.constant(new Error('relation "profiles" does not exist')),
          fc.constant(new Error('column "password_hash" of relation "profiles" does not exist')),
          fc.constant(new AppError('DB Error', 'DB_ERROR', 500, { 
            query: 'SELECT * FROM profiles WHERE id = $1',
            params: ['user-123']
          })),
        ),
        async (error) => {
          const response = handleApiError(error);
          const body = await getResponseBody(response);
          
          // Should NOT contain database-related sensitive info
          expect(body.toLowerCase()).not.toContain('postgres');
          expect(body.toLowerCase()).not.toContain('supabase.co');
          expect(body.toLowerCase()).not.toContain('select');
          expect(body.toLowerCase()).not.toContain('relation');
        }
      ),
      { numRuns: 100 }
    );
  });
});
