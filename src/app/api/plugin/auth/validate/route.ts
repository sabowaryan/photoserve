/**
 * Plugin Authentication Validation API Route
 * POST - Validate an API key and return user information
 * 
 * This endpoint is used by the Lightroom plugin to authenticate API requests.
 * It validates the API key, checks if it's active and not expired, and verifies
 * the user has an active Pro plan.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 12.3, 12.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { getCorsHeaders } from '@/lib/middleware/cors';
import { SecurityLogger, extractRequestMetadata } from '@/lib/utils/security-logger';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * POST /api/plugin/auth/validate
 * 
 * Validates an API key from the Authorization header
 * 
 * Headers:
 *   Authorization: Bearer pk_live_<token>
 * 
 * Responses:
 *   200 - Valid API key with Pro user
 *   401 - Invalid, expired, or revoked API key
 *   403 - Valid API key but user is not Pro
 *   400 - Missing or malformed Authorization header
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      // Add CORS headers to rate limit response
      const corsHeaders = getCorsHeaders(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      
      // Track metrics
      const duration = Date.now() - startTime;
      metricsService.trackApiKeyValidation(duration, false);
      metricsService.trackEndpointError('/api/plugin/auth/validate', true);
      
      return rateLimitResponse;
    }
    
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      // Log failed authentication attempt
      const requestMetadata = extractRequestMetadata(request);
      SecurityLogger.logAuthFailure('missing_key', requestMetadata);
      
      return NextResponse.json(
        {
          valid: false,
          error: 'Missing Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      // Log failed authentication attempt
      const requestMetadata = extractRequestMetadata(request);
      SecurityLogger.logAuthFailure('invalid_key', requestMetadata);
      
      return NextResponse.json(
        {
          valid: false,
          error: 'Invalid Authorization header format. Expected: Bearer <token>',
        },
        { status: 400 }
      );
    }
    
    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      // Log failed authentication attempt
      const requestMetadata = extractRequestMetadata(request);
      SecurityLogger.logAuthFailure('missing_key', requestMetadata);
      
      return NextResponse.json(
        {
          valid: false,
          error: 'Empty token in Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Call APIKeyService.validateAPIKey()
    const validationResult = await apiKeyService.validateAPIKey(token);
    
    // Return user info on success (200)
    if (validationResult.valid && validationResult.user) {
      // Log successful authentication
      const requestMetadata = extractRequestMetadata(request);
      SecurityLogger.logAuthSuccess(
        validationResult.user.id,
        validationResult.apiKeyId || 'unknown',
        requestMetadata
      );
      
      // Track successful validation
      const duration = Date.now() - startTime;
      metricsService.trackApiKeyValidation(duration, true);
      metricsService.trackEndpointError('/api/plugin/auth/validate', false);
      
      return NextResponse.json(
        {
          valid: true,
          user: validationResult.user,
        },
        { 
          status: 200,
          headers: getCorsHeaders(request),
        }
      );
    }
    
    // Return 403 for non-Pro users
    if (validationResult.user && validationResult.user.planType !== 'pro') {
      // Log failed authentication attempt
      const requestMetadata = extractRequestMetadata(request);
      SecurityLogger.logAuthFailure('non_pro_user', {
        ...requestMetadata,
        userId: validationResult.user.id,
      });
      
      // Track failed validation
      const duration = Date.now() - startTime;
      metricsService.trackApiKeyValidation(duration, false);
      metricsService.trackEndpointError('/api/plugin/auth/validate', true);
      
      return NextResponse.json(
        {
          valid: false,
          error: 'Pro plan required',
          user: validationResult.user,
        },
        { status: 403 }
      );
    }
    
    // Return 401 for invalid/expired keys
    // Log failed authentication attempt
    const requestMetadata = extractRequestMetadata(request);
    const reason = validationResult.error?.includes('expired') ? 'expired_key' :
                   validationResult.error?.includes('revoked') ? 'revoked_key' : 'invalid_key';
    SecurityLogger.logAuthFailure(reason, requestMetadata);
    
    // Track failed validation
    const duration = Date.now() - startTime;
    metricsService.trackApiKeyValidation(duration, false);
    metricsService.trackEndpointError('/api/plugin/auth/validate', true);
    
    return NextResponse.json(
      {
        valid: false,
        error: validationResult.error || 'Invalid or expired API key',
      },
      { status: 401 }
    );
    
  } catch (error) {
    // Log error for debugging
    console.error('[Plugin Auth] Error validating API key:', error);
    
    // Log failed authentication attempt
    console.warn('[Plugin Auth] Authentication error occurred');
    
    // Track error
    const duration = Date.now() - startTime;
    metricsService.trackApiKeyValidation(duration, false);
    metricsService.trackEndpointError('/api/plugin/auth/validate', true);
    
    return NextResponse.json(
      {
        valid: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/plugin/auth/validate
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
