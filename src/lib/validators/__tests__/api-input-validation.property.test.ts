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
  // 'error' field must be 'Validation failed'
  if (body.error !== 'Validation failed') {
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
            title: fc.string({ minLength: 101, maxLength: 200 }), // Exceeds 100 char limit
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
            title: fc.string({ minLength: 1, maxLength: 100 }),
            password: fc.string({ minLength: 1, maxLength: 3 }), // Less than 4 chars
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
            slug: fc.constant(''), // Empty slug is invalid
            password: fc.string({ minLength: 1, maxLength: 50 }),
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
            slug: fc.string({ minLength: 1, maxLength: 50 }),
            password: fc.constant(''), // Empty password is invalid
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
              .filter(obj => !obj.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i))
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
            email: fc.string({ minLength: 1, maxLength: 50 })
              .filter(s => !s.includes('@') || !s.includes('.')), // Invalid email format
            password: fc.string({ minLength: 8, maxLength: 50 }),
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
            password: fc.string({ minLength: 1, maxLength: 7 }), // Less than 8 chars
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
            password: fc.string({ minLength: 1, maxLength: 50 }),
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
            password: fc.constant(''), // Empty password
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
            fc.constant({ email: 'not-an-email' }),
            fc.constant({ email: 'missing@domain' }),
            fc.record({ email: fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('@')) })
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
            
            // Must have consistent error format
            expect(body.error).toBe('Validation failed');
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
            password: fc.string({ minLength: 1, maxLength: 3 }), // Invalid: too short
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
              
              // Should have multiple validation issues
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
