/**
 * API Error Handler for PikSend
 * Provides consistent error response format across all API routes
 * 
 * @module lib/api/error-handler
 * Requirements: 13.1 - Standardized error response format
 * Requirements: 13.2 - Map error types to HTTP status codes
 * Requirements: 13.4 - Field-level validation errors
 * Requirements: 13.5 - Database error handling
 * Requirements: 13.6 - Security error sanitization
 */

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Standard API error response format
 * Format: { error: string, code?: string, details?: object }
 * 
 * Requirements: 13.1 - Standardized JSON error format with status, error message, and optional details
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: object;
  status?: number;
}

/**
 * Patterns that indicate sensitive information that should NOT be exposed to clients
 * Requirements: 13.5 - Do not expose database details in error responses
 * Requirements: 13.6 - Security error sanitization
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /hash/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /auth/i,
  /select\s+/i,
  /insert\s+/i,
  /update\s+/i,
  /delete\s+/i,
  /from\s+/i,
  /where\s+/i,
  /postgresql/i,
  /supabase/i,
  /stripe/i,
  /cloudinary/i,
  /query/i,
  /params/i,
  /connection/i,
  /database/i,
  /constraint/i,
  /violation/i,
  /duplicate/i,
  /foreign key/i,
  /unique/i,
  /null value/i,
  /column/i,
  /table/i,
  /relation/i,
];

/**
 * Checks if an error is a database error (PostgrestError from Supabase)
 * Requirements: 13.5 - Database error handling
 */
function isDatabaseError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  );
}

/**
 * Maps database error codes to user-friendly translation keys
 * Requirements: 13.5 - Catch database errors and return generic error messages
 */
function mapDatabaseError(error: PostgrestError): { message: string; code: string; status: number } {
  // Common PostgreSQL error codes
  const errorCodeMap: Record<string, { message: string; code: string; status: number }> = {
    '23505': { message: 'api.errors.resourceExists', code: 'DUPLICATE_RESOURCE', status: 409 },
    '23503': { message: 'api.errors.invalidReference', code: 'INVALID_REFERENCE', status: 400 },
    '23502': { message: 'api.errors.missingField', code: 'MISSING_FIELD', status: 400 },
    '23514': { message: 'api.errors.invalidData', code: 'INVALID_DATA', status: 400 },
    '42501': { message: 'api.errors.accessDenied', code: 'ACCESS_DENIED', status: 403 },
    '42P01': { message: 'api.errors.notFound', code: 'NOT_FOUND', status: 404 },
    'PGRST116': { message: 'api.errors.notFound', code: 'NOT_FOUND', status: 404 },
    'PGRST301': { message: 'api.errors.multipleFound', code: 'MULTIPLE_FOUND', status: 409 },
  };

  const mapped = errorCodeMap[error.code];
  if (mapped) {
    return mapped;
  }

  // Default database error response
  return {
    message: 'api.errors.databaseError',
    code: 'DATABASE_ERROR',
    status: 500,
  };
}

/**
 * Checks if a value contains sensitive information
 */
function containsSensitiveInfo(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  const stringValue = typeof value === 'string' 
    ? value 
    : JSON.stringify(value);
  
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(stringValue));
}

/**
 * Sanitizes error details by removing sensitive information
 * Only includes details that are safe to expose to clients
 */
function sanitizeDetails(details: object | undefined): object | undefined {
  if (!details) {
    return undefined;
  }

  // Check if the entire details object contains sensitive info
  if (containsSensitiveInfo(details)) {
    return undefined;
  }

  // Recursively check and filter object properties
  const sanitized: Record<string, unknown> = {};
  let hasSafeProperties = false;

  for (const [key, value] of Object.entries(details)) {
    // Skip keys that look sensitive
    if (containsSensitiveInfo(key)) {
      continue;
    }

    // Skip values that contain sensitive info
    if (containsSensitiveInfo(value)) {
      continue;
    }

    // Safe to include
    sanitized[key] = value;
    hasSafeProperties = true;
  }

  return hasSafeProperties ? sanitized : undefined;
}

/**
 * Handles errors in API routes and returns consistent error responses
 * 
 * Requirements: 13.1 - Standardized error response format
 * Requirements: 13.2 - Map different error types to appropriate HTTP status codes
 * Requirements: 13.4 - Field-level validation errors with Zod
 * Requirements: 13.5 - Database error handling without exposing details
 * Requirements: 13.6 - Security error sanitization
 * 
 * Error handling priority:
 * 1. ZodError: Returns 400 with validation details
 * 2. AppError: Returns appropriate status code with sanitized error details
 * 3. PostgrestError: Returns generic message without exposing database details
 * 4. Unknown errors: Returns 500 without exposing internal details
 * 
 * Security: All error responses are sanitized to prevent exposure of:
 * - Stack traces
 * - Internal file paths
 * - Database queries and connection details
 * - API keys and secrets
 * - Password hashes
 * 
 * @param error - The error to handle
 * @returns NextResponse with consistent error format
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  // Log error for debugging (server-side only)
  // Requirements: 13.3 - Log errors with stack trace and context information
  console.error('[API Error]', {
    error,
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });

  // Handle Zod validation errors
  // Requirements: 13.4 - Return specific field-level error messages for validation failures
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'api.errors.validationFailed',
        code: 'VALIDATION_ERROR',
        details: error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code,
        })),
        status: 400,
      },
      { status: 400 }
    );
  }

  // Handle custom application errors
  // Requirements: 13.2 - Map different error types to appropriate HTTP status codes
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      error: error.message,
      code: error.code,
      status: error.statusCode,
    };

    // Only include details if they exist AND are safe to expose
    // Requirements: 13.6 - Security error sanitization
    const sanitizedDetails = sanitizeDetails(error.details);
    if (sanitizedDetails) {
      response.details = sanitizedDetails;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Handle database errors
  // Requirements: 13.5 - Catch database errors and return generic error messages
  if (isDatabaseError(error)) {
    const mapped = mapDatabaseError(error);
    
    // Log full database error details server-side only
    console.error('[Database Error]', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error: mapped.message,
        code: mapped.code,
        status: mapped.status,
      },
      { status: mapped.status }
    );
  }

  // Generic error - don't expose internal details for security
  // Requirements: 13.6 - Security error sanitization
  return NextResponse.json(
    {
      error: 'errors.generic.unexpectedError',
      code: 'INTERNAL_ERROR',
      status: 500,
    },
    { status: 500 }
  );
}

/**
 * Creates a success response with consistent format
 * 
 * @param data - The data to return
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with data
 */
export function createApiResponse<T>(data: T, status: number = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

/**
 * Creates a no-content response (204)
 * 
 * @returns NextResponse with no content
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// Re-export CORS utilities for convenience
export { getCorsHeaders, handleCorsPreflightRequest, addCorsHeaders, withCors, isOriginAllowed } from './cors';

/**
 * Error handler middleware for API routes
 * Wraps an API route handler and automatically catches and handles errors
 * 
 * Requirements: 13.1 - Standardized error response format
 * Requirements: 13.2 - Map different error types to appropriate HTTP status codes
 * 
 * @example
 * export const GET = withErrorHandler(async (request: NextRequest) => {
 *   // Your route logic here
 *   return NextResponse.json({ data: 'success' });
 * });
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error);
    }
  }) as T;
}

/**
 * Type guard to check if a response is an error response
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof response.error === 'string'
  );
}

