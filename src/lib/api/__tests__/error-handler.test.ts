/**
 * Tests for API Error Handler
 * 
 * Requirements: 13.1 - Standardized error response format
 * Requirements: 13.2 - Map error types to HTTP status codes
 * Requirements: 13.4 - Field-level validation errors
 * Requirements: 13.5 - Database error handling
 * Requirements: 13.6 - Security error sanitization
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  handleApiError, 
  ApiErrorResponse,
  withErrorHandler,
  isErrorResponse,
} from '../error-handler';
import { 
  AppError, 
  AuthenticationError, 
  AuthorizationError, 
  ValidationError,
  NotFoundError,
  RateLimitError,
} from '@/lib/errors';

describe('handleApiError', () => {
  beforeEach(() => {
    // Clear console mocks
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Zod validation errors', () => {
    it('should return 400 with field-level error details', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ name: '', email: 'invalid', age: 15 });
      } catch (error) {
        const response = handleApiError(error);
        const json = await response.json();

        expect(response.status).toBe(400);
        expect(json.error).toBe('Validation failed');
        expect(json.code).toBe('VALIDATION_ERROR');
        expect(json.status).toBe(400);
        expect(json.details).toBeInstanceOf(Array);
        expect(json.details.length).toBeGreaterThan(0);
        
        // Check field-level error format
        const firstError = json.details[0];
        expect(firstError).toHaveProperty('field');
        expect(firstError).toHaveProperty('message');
        expect(firstError).toHaveProperty('code');
      }
    });

    it('should format nested field paths correctly', async () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      try {
        schema.parse({ user: { profile: { name: '' } } });
      } catch (error) {
        const response = handleApiError(error);
        const json = await response.json();

        const nameError = json.details.find((e: any) => e.field === 'user.profile.name');
        expect(nameError).toBeDefined();
      }
    });
  });

  describe('AppError handling', () => {
    it('should return correct status code for AuthenticationError', async () => {
      const error = new AuthenticationError('Invalid credentials');
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Invalid credentials');
      expect(json.code).toBe('AUTH_REQUIRED');
      expect(json.status).toBe(401);
    });

    it('should return correct status code for AuthorizationError', async () => {
      const error = new AuthorizationError('Insufficient permissions');
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Insufficient permissions');
      expect(json.code).toBe('ACCESS_DENIED');
      expect(json.status).toBe(403);
    });

    it('should return correct status code for NotFoundError', async () => {
      const error = new NotFoundError('User');
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(404);
      expect(json.error).toBe('User not found');
      expect(json.code).toBe('NOT_FOUND');
      expect(json.status).toBe(404);
    });

    it('should return correct status code for RateLimitError', async () => {
      const error = new RateLimitError(60);
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(429);
      expect(json.error).toBe('Too many requests');
      expect(json.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(json.status).toBe(429);
      expect(json.details).toEqual({ retryAfterSeconds: 60 });
    });

    it('should include sanitized details when safe', async () => {
      const error = new ValidationError('Invalid input', {
        field: 'email',
        reason: 'invalid format',
      });
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.details).toBeDefined();
      expect(json.details.field).toBe('email');
      expect(json.details.reason).toBe('invalid format');
    });

    it('should sanitize sensitive details', async () => {
      const error = new AppError('Error', 'ERROR', 500, {
        password: 'secret123',
        apiKey: 'pk_live_abc123',
        query: 'SELECT * FROM users',
      });
      const response = handleApiError(error);
      const json = await response.json();

      // Sensitive details should be removed
      expect(json.details).toBeUndefined();
    });
  });

  describe('Database error handling', () => {
    it('should handle duplicate key error (23505)', async () => {
      const dbError = {
        code: '23505',
        message: 'duplicate key value violates unique constraint',
        details: 'Key (email)=(test@example.com) already exists.',
        hint: 'Use a different email',
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(409);
      expect(json.error).toBe('Resource already exists');
      expect(json.code).toBe('DUPLICATE_RESOURCE');
      expect(json.status).toBe(409);
      // Should not expose database details
      expect(json.details).toBeUndefined();
    });

    it('should handle foreign key violation (23503)', async () => {
      const dbError = {
        code: '23503',
        message: 'insert or update on table violates foreign key constraint',
        details: 'Key (user_id)=(123) is not present in table "users".',
        hint: null,
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Referenced resource not found');
      expect(json.code).toBe('INVALID_REFERENCE');
    });

    it('should handle not null violation (23502)', async () => {
      const dbError = {
        code: '23502',
        message: 'null value in column "name" violates not-null constraint',
        details: 'Failing row contains (123, null, ...).',
        hint: null,
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Required field missing');
      expect(json.code).toBe('MISSING_FIELD');
    });

    it('should handle check constraint violation (23514)', async () => {
      const dbError = {
        code: '23514',
        message: 'new row for relation violates check constraint',
        details: 'Failing row contains (...).',
        hint: null,
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBe('Invalid data format');
      expect(json.code).toBe('INVALID_DATA');
    });

    it('should handle permission denied (42501)', async () => {
      const dbError = {
        code: '42501',
        message: 'permission denied for table users',
        details: null,
        hint: null,
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(403);
      expect(json.error).toBe('Access denied');
      expect(json.code).toBe('ACCESS_DENIED');
    });

    it('should handle unknown database errors generically', async () => {
      const dbError = {
        code: '99999',
        message: 'unknown database error',
        details: 'Some internal database error',
        hint: null,
      };

      const response = handleApiError(dbError);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('Database operation failed');
      expect(json.code).toBe('DATABASE_ERROR');
    });

    it('should log full database error details server-side', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      
      const dbError = {
        code: '23505',
        message: 'duplicate key',
        details: 'sensitive database details',
        hint: 'some hint',
      };

      handleApiError(dbError);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[Database Error]',
        expect.objectContaining({
          code: '23505',
          message: 'duplicate key',
          details: 'sensitive database details',
          hint: 'some hint',
        })
      );
    });
  });

  describe('Generic error handling', () => {
    it('should handle unknown errors without exposing details', async () => {
      const error = new Error('Internal server error with sensitive info');
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('An unexpected error occurred');
      expect(json.code).toBe('INTERNAL_ERROR');
      expect(json.status).toBe(500);
      expect(json.details).toBeUndefined();
    });

    it('should handle non-Error objects', async () => {
      const error = 'String error';
      const response = handleApiError(error);
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.error).toBe('An unexpected error occurred');
      expect(json.code).toBe('INTERNAL_ERROR');
    });

    it('should log errors with stack trace', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error');
      const error = new Error('Test error');
      
      handleApiError(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[API Error]',
        expect.objectContaining({
          error,
          stack: expect.any(String),
          timestamp: expect.any(String),
        })
      );
    });
  });

  describe('Security sanitization', () => {
    it('should not expose sensitive patterns in error details', async () => {
      const sensitivePatterns = [
        { password: 'secret123' },
        { apiKey: 'pk_live_abc' },
        { token: 'bearer_token' },
        { hash: 'sha256hash' },
        { secret: 'my_secret' },
        { query: 'SELECT * FROM users' },
        { connection: 'postgresql://...' },
      ];

      for (const details of sensitivePatterns) {
        const error = new AppError('Error', 'ERROR', 500, details);
        const response = handleApiError(error);
        const json = await response.json();

        expect(json.details).toBeUndefined();
      }
    });

    it('should allow safe details to pass through', async () => {
      const safeDetails = {
        userId: '123',
        count: 5,
        status: 'active',
        message: 'Operation completed',
      };

      const error = new AppError('Error', 'ERROR', 500, safeDetails);
      const response = handleApiError(error);
      const json = await response.json();

      expect(json.details).toBeDefined();
      expect(json.details).toEqual(safeDetails);
    });
  });
});

describe('withErrorHandler', () => {
  it('should catch and handle errors from wrapped handler', async () => {
    const handler = withErrorHandler<(request: any) => Promise<NextResponse>>(async (_request: any) => {
      throw new AuthenticationError('Not authenticated');
    });

    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe('Not authenticated');
    expect(json.code).toBe('AUTH_REQUIRED');
  });

  it('should pass through successful responses', async () => {
    const handler = withErrorHandler<(request: any) => Promise<NextResponse>>(async (_request: any) => {
      return NextResponse.json({ success: true });
    });

    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
  });

  it('should handle validation errors', async () => {
    const schema = z.object({ name: z.string().min(1) });
    
    const handler = withErrorHandler<(request: any) => Promise<NextResponse>>(async (_request: any) => {
      schema.parse({ name: '' });
      return NextResponse.json({ success: true });
    });

    const request = new Request('http://localhost/api/test');
    const response = await handler(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.code).toBe('VALIDATION_ERROR');
  });
});

describe('isErrorResponse', () => {
  it('should identify error responses', () => {
    const errorResponse: ApiErrorResponse = {
      error: 'Test error',
      code: 'TEST_ERROR',
      status: 400,
    };

    expect(isErrorResponse(errorResponse)).toBe(true);
  });

  it('should reject non-error responses', () => {
    expect(isErrorResponse({ success: true })).toBe(false);
    expect(isErrorResponse(null)).toBe(false);
    expect(isErrorResponse(undefined)).toBe(false);
    expect(isErrorResponse('string')).toBe(false);
    expect(isErrorResponse(123)).toBe(false);
  });

  it('should require error field to be a string', () => {
    expect(isErrorResponse({ error: 123 })).toBe(false);
    expect(isErrorResponse({ error: null })).toBe(false);
    expect(isErrorResponse({ error: {} })).toBe(false);
  });
});
