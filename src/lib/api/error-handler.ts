/**
 * API Error Handler for PhotoServe
 * Provides consistent error response format across all API routes
 * 
 * @module lib/api/error-handler
 * Requirements: 9.6 - Consistent API Error Format
 * Requirements: 11.7 - Security Error Sanitization
 */

import { NextResponse } from 'next/server';
import { AppError } from '@/lib/errors';
import { ZodError } from 'zod';

/**
 * Standard API error response format
 * Format: { error: string, code?: string, details?: object }
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: object;
}

/**
 * Patterns that indicate sensitive information that should NOT be exposed to clients
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
];

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
 * - ZodError: Returns 400 with validation details
 * - AppError: Returns appropriate status code with sanitized error details
 * - Unknown errors: Returns 500 without exposing internal details
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
  console.error('[API Error]', error);

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Handle custom application errors
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      error: error.message,
      code: error.code,
    };

    // Only include details if they exist AND are safe to expose
    // Validates: Requirements 11.7 - Security Error Sanitization
    const sanitizedDetails = sanitizeDetails(error.details);
    if (sanitizedDetails) {
      response.details = sanitizedDetails;
    }

    return NextResponse.json(response, { status: error.statusCode });
  }

  // Generic error - don't expose internal details for security
  // Validates: Requirements 11.7 - Security Error Sanitization
  return NextResponse.json(
    {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
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
