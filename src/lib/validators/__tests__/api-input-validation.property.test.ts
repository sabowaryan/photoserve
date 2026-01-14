/**
 * Property-Based Tests for API Input Validation
 * 
 * Feature: nextjs-migration, Property 22: API Input Validation
 * Validates: Requirements 9.4
 * 
 * Tests that:
 * - For any API request with invalid input data (according to Zod schema),
 *   the response SHALL be HTTP 400 with a consistent error format containing validation details.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ZodError } from 'zod';
import {
  createGallerySchema,
  verifyPasswordSchema,
  galleryIdSchema,
  signUpSchema,
  signInSchema,
  forgotPasswordSchema,
} from '../index';
import { handleApiError, ApiErrorResponse } from '@/lib/api/error-handler';

/**
 * Helper to parse JSON body from NextResponse
 */
async function parseResponseBody(response: Response): Promise<ApiErrorResponse> {
  return await response.json();
}

/**
 * Validates that a response body conforms to the API error format for validation errors
 * Format: { error: string, code: string, details: ZodIssue[] }
 */
function isValidValidationErrorFormat(body: ApiErrorResponse): boolean {
  // 'error' field must be the i18n key for validation failed
  if (body.error !== 'api.errors.validationFailed') {
    return false;
  }
  
  // 'code' field must be 'VALIDATION_ERROR'
  if (body.code !== 'VALIDATION_ERROR') {
    return false;
  }
  
  // 'details' field must be an array of validation issues
  if (!body.details || !Array.isArray(body.details)) {
    return false;
  }
  
  // Each issue should have at least 'message' and 'path' fields
  for (const issue of body.details as Array<{ message?: string; path?: unknown[] }>) {
    if (typeof issue.message !== 'string') {
      return false;
    }
    if (!Array.isArray(issue.path)) {
      return false;
    }
  }
  
  return true;
}

describe('API Input Validation - Property 22', () => {
  /**
   * Feature: nextjs-migration, Property 22: API Input Validation
   * Validates: Requirements 9.4
   * 
   * For any API request with invalid input data (according to Zod schema),
   * the response SHALL be HTTP 400 with a consistent error format containing validation details.
   */

  describe('createGallerySchema validation', () => {
    it('should return 400 with validation details for invalid title (empty)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.constant(''), // Empty title is invalid
            password: fc.string({ minLength: 4, maxLength: 50 }),
            expirationDays: fc.integer({ min: 1, max: 365 }),
          }),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
              expect(body.details).toBeDefined();
              
              // Should have an issue for the title field
              const issues = body.details as Array<{ path: string[]; message: string }>;
              const titleIssue = issues.find(i => i.path.includes('title'));
              expect(titleIssue).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for title exceeding max length', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 101, maxLength: 200 }).filter(s => s.trim().length > 100), // Exceeds 100 char limit after trim
            password: fc.string({ minLength: 4, maxLength: 50 }).filter(s => s.trim().length >= 4),
            expirationDays: fc.integer({ min: 1, max: 365 }),
          }),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for password too short', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            password: fc.string({ minLength: 1, maxLength: 3 }).filter(s => {
              const trimmed = s.trim();
              // Password must be non-empty after trim and less than 4 chars (invalid)
              // Empty string is allowed for galleries without password
              return trimmed.length > 0 && trimmed.length < 4;
            }),
            expirationDays: fc.integer({ min: 1, max: 365 }),
          }),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
              
              const issues = body.details as Array<{ path: string[]; message: string }>;
              const passwordIssue = issues.find(i => i.path.includes('password'));
              expect(passwordIssue).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for expirationDays out of range', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // Below minimum (0 or negative)
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              password: fc.string({ minLength: 4, maxLength: 50 }),
              expirationDays: fc.integer({ min: -100, max: 0 }),
            }),
            // Above maximum (> 365)
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              password: fc.string({ minLength: 4, maxLength: 50 }),
              expirationDays: fc.integer({ min: 366, max: 1000 }),
            })
          ),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for non-integer expirationDays', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            password: fc.string({ minLength: 4, maxLength: 50 }),
            expirationDays: fc.double({ min: 1.1, max: 364.9, noNaN: true }),
          }),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for wrong types', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            // title as number
            fc.record({
              title: fc.integer() as fc.Arbitrary<unknown>,
              password: fc.string({ minLength: 4, maxLength: 50 }),
              expirationDays: fc.integer({ min: 1, max: 365 }),
            }),
            // password as number
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              password: fc.integer() as fc.Arbitrary<unknown>,
              expirationDays: fc.integer({ min: 1, max: 365 }),
            }),
            // expirationDays as string
            fc.record({
              title: fc.string({ minLength: 1, maxLength: 100 }),
              password: fc.string({ minLength: 4, maxLength: 50 }),
              expirationDays: fc.string() as fc.Arbitrary<unknown>,
            })
          ),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('verifyPasswordSchema validation', () => {
    it('should return 400 with validation details for empty slug', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            slug: fc.oneof(
              fc.constant(''),
              fc.constant('   '), // whitespace-only
              fc.constant('  \t  ') // whitespace with tabs
            ),
            password: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          }),
          async (input) => {
            const result = verifyPasswordSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for empty password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            slug: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            password: fc.oneof(
              fc.constant(''),
              fc.constant('   '), // whitespace-only
              fc.constant('  \t  ') // whitespace with tabs
            ),
          }),
          async (input) => {
            const result = verifyPasswordSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for missing fields', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.record({ slug: fc.string({ minLength: 1 }) }), // Missing password
            fc.record({ password: fc.string({ minLength: 1 }) }), // Missing slug
            fc.constant({}) // Missing both
          ),
          async (input) => {
            const result = verifyPasswordSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('galleryIdSchema validation', () => {
    it('should return 400 with validation details for invalid UUID', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({ id: 'not-a-uuid' }),
            fc.constant({ id: '12345' }),
            fc.constant({ id: '' }),
            fc.record({ id: fc.string({ minLength: 1, maxLength: 30 }) })
              .filter(obj => {
                const trimmed = obj.id.trim();
                // Filter out valid UUIDs and ensure we have non-empty strings after trim
                return trimmed.length > 0 && !trimmed.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
              })
          ),
          async (input) => {
            const result = galleryIdSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('signUpSchema validation', () => {
    it('should return 400 with validation details for invalid email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.constant(''),
              fc.constant('   '), // whitespace-only
              fc.constant('invalid'),
              fc.constant('no-at-sign.com')
            ),
            password: fc.string({ minLength: 8, maxLength: 50 }).filter(s => s.trim().length >= 8),
          }),
          async (input) => {
            const result = signUpSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for password too short', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.oneof(
              fc.constant(''),
              fc.constant('   '), // whitespace-only
              fc.string({ minLength: 1, maxLength: 7 }).filter(s => {
                const trimmed = s.trim();
                return trimmed.length > 0 && trimmed.length < 8;
              })
            ),
          }),
          async (input) => {
            const result = signUpSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('signInSchema validation', () => {
    it('should return 400 with validation details for invalid email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.constant('invalid-email'), // Invalid email format
            password: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          }),
          async (input) => {
            const result = signInSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return 400 with validation details for empty password', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.oneof(
              fc.constant(''),
              fc.constant('   '), // whitespace-only
              fc.constant('  \t  ') // whitespace with tabs
            ),
          }),
          async (input) => {
            const result = signInSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('forgotPasswordSchema validation', () => {
    it('should return 400 with validation details for invalid email', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.oneof(
            fc.constant({ email: '' }),
            fc.constant({ email: '   ' }), // whitespace-only
            fc.constant({ email: 'missing-at-sign.com' }),
            fc.constant({ email: 'no-domain@' })
          ),
          async (input) => {
            const result = forgotPasswordSchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('General validation properties', () => {
    it('should always return HTTP 400 for any ZodError', async () => {
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
            const zodError = new ZodError(issues as any);
            const response = handleApiError(zodError);
            const body = await parseResponseBody(response);
            
            // Must return 400 status
            expect(response.status).toBe(400);
            
            // Must have consistent error format (i18n key)
            expect(body.error).toBe('api.errors.validationFailed');
            expect(body.code).toBe('VALIDATION_ERROR');
            expect(Array.isArray(body.details)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include validation details with path and message for each issue', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              code: fc.constant('invalid_type' as const),
              expected: fc.constantFrom('string', 'number', 'boolean'),
              received: fc.constantFrom('undefined', 'null', 'object'),
              path: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 3 }),
              message: fc.string({ minLength: 1, maxLength: 100 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (issues) => {
            const zodError = new ZodError(issues as any);
            const response = handleApiError(zodError);
            const body = await parseResponseBody(response);
            
            expect(Array.isArray(body.details)).toBe(true);
            
            const details = body.details as Array<{ path: string[]; message: string }>;
            expect(details.length).toBe(issues.length);
            
            // Each detail should have path and message
            for (const detail of details) {
              expect(Array.isArray(detail.path)).toBe(true);
              expect(typeof detail.message).toBe('string');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple validation errors in a single request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.constant(''), // Invalid: empty
            password: fc.oneof(
              fc.constant('!'), // 1 char - too short
              fc.constant('ab'), // 2 chars - too short
              fc.constant('xyz') // 3 chars - too short
            ),
            expirationDays: fc.integer({ min: 366, max: 1000 }), // Invalid: too large
          }),
          async (input) => {
            const result = createGallerySchema.safeParse(input);
            expect(result.success).toBe(false);
            
            if (!result.success) {
              const response = handleApiError(result.error);
              const body = await parseResponseBody(response);
              
              expect(response.status).toBe(400);
              expect(isValidValidationErrorFormat(body)).toBe(true);
              
              // Should have multiple validation issues (title empty, password too short, expirationDays too large)
              const details = body.details as Array<{ path: string[]; message: string }>;
              expect(details.length).toBeGreaterThanOrEqual(2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
