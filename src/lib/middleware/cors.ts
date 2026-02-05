/**
 * CORS Configuration Middleware
 * 
 * Implements Cross-Origin Resource Sharing (CORS) policies for API endpoints.
 * Different policies for web endpoints vs plugin endpoints.
 * 
 * Requirements: 12.9
 */
import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS configuration for different endpoint types
 */
interface CorsConfig {
  allowedOrigins: string[] | '*';
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge?: number;
}

/**
 * Default CORS configuration for web endpoints
 * Restricts to production and development domains
 */
const WEB_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://piksend.com',
    'https://www.piksend.com',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  allowedMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * CORS configuration for plugin endpoints
 * Allows all origins since plugin makes requests from desktop
 */
const PLUGIN_CORS_CONFIG: CorsConfig = {
  allowedOrigins: '*',
  allowedMethods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'User-Agent', 'X-Requested-With'],
  credentials: false, // Cannot use credentials with wildcard origin
  maxAge: 86400, // 24 hours
};

/**
 * Check if an origin is allowed based on the configuration
 */
function isOriginAllowed(origin: string | null, config: CorsConfig): boolean {
  if (!origin) return false;
  
  if (config.allowedOrigins === '*') {
    return true;
  }
  
  return config.allowedOrigins.includes(origin);
}

/**
 * Get the appropriate CORS configuration based on the request path
 */
function getCorsConfig(pathname: string): CorsConfig {
  // Plugin endpoints get permissive CORS (desktop app)
  if (pathname.startsWith('/api/plugin/')) {
    return PLUGIN_CORS_CONFIG;
  }
  
  // All other endpoints use web CORS (browser)
  return WEB_CORS_CONFIG;
}

/**
 * Apply CORS headers to a response
 */
export function applyCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  config: CorsConfig
): NextResponse {
  const origin = request.headers.get('origin');
  
  // Set Access-Control-Allow-Origin
  if (config.allowedOrigins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else if (origin && isOriginAllowed(origin, config)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Vary', 'Origin');
  }
  
  // Set Access-Control-Allow-Methods
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.allowedMethods.join(', ')
  );
  
  // Set Access-Control-Allow-Headers
  response.headers.set(
    'Access-Control-Allow-Headers',
    config.allowedHeaders.join(', ')
  );
  
  // Set Access-Control-Allow-Credentials
  if (config.credentials && config.allowedOrigins !== '*') {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Set Access-Control-Max-Age
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
  }
  
  return response;
}

/**
 * Handle CORS preflight requests (OPTIONS)
 */
export function handleCorsPreflightRequest(request: NextRequest): NextResponse | null {
  // Only handle OPTIONS requests
  if (request.method !== 'OPTIONS') {
    return null;
  }
  
  const pathname = new URL(request.url).pathname;
  const config = getCorsConfig(pathname);
  const origin = request.headers.get('origin');
  
  // Check if origin is allowed
  if (config.allowedOrigins !== '*' && !isOriginAllowed(origin, config)) {
    return new NextResponse(null, { status: 403 });
  }
  
  // Create preflight response
  const response = new NextResponse(null, { status: 204 });
  
  // Apply CORS headers
  return applyCorsHeaders(response, request, config);
}

/**
 * CORS middleware for Next.js API routes
 * 
 * Handles preflight requests and applies CORS headers to responses.
 * 
 * @param request - Next.js request object
 * @param handler - The actual route handler function
 * @returns Response with CORS headers applied
 */
export async function corsMiddleware(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Handle preflight requests
  const preflightResponse = handleCorsPreflightRequest(request);
  if (preflightResponse) {
    return preflightResponse;
  }
  
  // Get CORS configuration for this endpoint
  const pathname = new URL(request.url).pathname;
  const config = getCorsConfig(pathname);
  
  // Check if origin is allowed for non-OPTIONS requests
  const origin = request.headers.get('origin');
  if (origin && config.allowedOrigins !== '*' && !isOriginAllowed(origin, config)) {
    return new NextResponse(
      JSON.stringify({ error: 'Origin not allowed' }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
  
  // Call the actual handler
  const response = await handler(request);
  
  // Apply CORS headers to the response
  return applyCorsHeaders(response, request, config);
}

/**
 * Simple CORS wrapper for route handlers
 * 
 * Usage:
 * ```typescript
 * export const GET = withCors(async (request: NextRequest) => {
 *   // Your handler logic
 *   return NextResponse.json({ data: 'example' });
 * });
 * ```
 */
export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    return corsMiddleware(request, handler);
  };
}

/**
 * Get CORS headers as a plain object
 * Useful for manually adding CORS headers to responses
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const pathname = new URL(request.url).pathname;
  const config = getCorsConfig(pathname);
  const origin = request.headers.get('origin');
  
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
  };
  
  if (config.allowedOrigins === '*') {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (origin && isOriginAllowed(origin, config)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  
  if (config.credentials && config.allowedOrigins !== '*') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  if (config.maxAge) {
    headers['Access-Control-Max-Age'] = config.maxAge.toString();
  }
  
  return headers;
}
