/**
 * CORS Configuration for Piksend API Routes
 * Validates allowed origins and provides CORS headers
 * 
 * @module lib/api/cors
 * Requirements: 11.2 - CORS Protection for API Routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed origins for CORS
 * Uses regex patterns to prevent subdomain spoofing attacks
 */
const ALLOWED_ORIGIN_PATTERNS: RegExp[] = [
  // Production domain
  /^https:\/\/piksend\.com$/,
  /^https:\/\/www\.piksend\.com$/,

  // Vercel preview deployments
  /^https:\/\/piksend-[a-z0-9-]+\.vercel\.app$/,

  // Local development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

/**
 * Environment-based allowed origins
 * Allows configuration via environment variable
 */
function getAllowedOrigins(): RegExp[] {
  const patterns = [...ALLOWED_ORIGIN_PATTERNS];
  
  // Add custom allowed origins from environment
  const customOrigins = process.env.CORS_ALLOWED_ORIGINS;
  if (customOrigins) {
    const origins = customOrigins.split(',').map(o => o.trim());
    for (const origin of origins) {
      // Escape special regex characters and create exact match pattern
      const escaped = origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      patterns.push(new RegExp(`^${escaped}$`));
    }
  }
  
  return patterns;
}

/**
 * Validates if an origin is allowed
 * Uses regex patterns to prevent subdomain spoofing
 * 
 * @param origin - The origin to validate
 * @returns true if the origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return false;
  }
  
  const patterns = getAllowedOrigins();
  return patterns.some(pattern => pattern.test(origin));
}

/**
 * CORS headers configuration
 */
export type CorsHeaders = Record<string, string>;

/**
 * Gets CORS headers for a request
 * Only returns the origin if it's in the allowed list
 * 
 * @param request - The incoming request
 * @returns CORS headers object
 */
export function getCorsHeaders(request: NextRequest): CorsHeaders {
  const origin = request.headers.get('origin');
  const allowedOrigin = isOriginAllowed(origin) ? origin! : '';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Handles CORS preflight (OPTIONS) requests
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

/**
 * Adds CORS headers to an existing response
 */
export function addCorsHeaders(
  response: NextResponse,
  request: NextRequest
): NextResponse {
  const corsHeaders = getCorsHeaders(request);
  
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value);
  }
  
  return response;
}

/**
 * CORS middleware wrapper for API route handlers
 */
export function withCors<T>(
  handler: (request: NextRequest) => Promise<NextResponse<T>>
): (request: NextRequest) => Promise<NextResponse<T | null>> {
  return async (request: NextRequest): Promise<NextResponse<T | null>> => {
    if (request.method === 'OPTIONS') {
      return handleCorsPreflightRequest(request) as NextResponse<T | null>;
    }
    
    const response = await handler(request);
    return addCorsHeaders(response, request) as NextResponse<T>;
  };
}
