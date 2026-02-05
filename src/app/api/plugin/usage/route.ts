/**
 * Plugin Usage Tracking API Route
 * POST - Log a plugin usage event
 * 
 * This endpoint is used by the Lightroom plugin to log usage events for
 * analytics and monitoring. It validates the API key, extracts user information,
 * and logs the usage event with metadata.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 12.3, 12.4
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key.service';
import { usageTrackingService } from '@/lib/services/usage-tracking.service';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { logUsageSchema } from '@/lib/validators/plugin.schemas';
import { getCorsHeaders } from '@/lib/middleware/cors';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * POST /api/plugin/usage
 * 
 * Logs a plugin usage event
 * 
 * Headers:
 *   Authorization: Bearer pk_live_<token>
 * 
 * Body:
 *   {
 *     action: string (required)
 *     pluginVersion?: string
 *     lightroomVersion?: string
 *     osVersion?: string
 *     metadata?: Record<string, any>
 *   }
 * 
 * Responses:
 *   200 - Usage logged successfully
 *   400 - Invalid request body or missing Authorization header
 *   401 - Invalid or expired API key
 *   403 - Valid API key but user is not Pro
 *   500 - Internal server error
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = rateLimitMiddleware(request);
    if (rateLimitResponse) {
      // Add CORS headers to rate limit response
      const corsHeaders = getCorsHeaders(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      return rateLimitResponse;
    }
    
    // Extract Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Check if header starts with 'Bearer '
    if (!authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid Authorization header format. Expected: Bearer <token>',
        },
        { status: 400 }
      );
    }
    
    // Extract the token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Empty token in Authorization header',
        },
        { status: 400 }
      );
    }
    
    // Validate API key and get user info
    const validationResult = await apiKeyService.validateAPIKey(token);
    
    // Check if API key is valid
    if (!validationResult.valid) {
      // Return 403 for non-Pro users
      if (validationResult.user && validationResult.user.planType !== 'pro') {
        return NextResponse.json(
          {
            success: false,
            error: 'Pro plan required',
          },
          { status: 403 }
        );
      }
      
      // Return 401 for invalid/expired keys
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error || 'Invalid or expired API key',
        },
        { status: 401 }
      );
    }
    
    // Ensure we have user info
    if (!validationResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User information not available',
        },
        { status: 401 }
      );
    }
    
    // Parse request body (action, pluginVersion, lightroomVersion, osVersion, metadata)
    const body = await request.json();
    
    // Validate request body
    const validationBodyResult = logUsageSchema.safeParse(body);
    
    if (!validationBodyResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body',
          details: validationBodyResult.error.issues,
        },
        { status: 400 }
      );
    }
    
    const { action, pluginVersion, lightroomVersion, osVersion, metadata } = validationBodyResult.data;
    
    // Call UsageTrackingService.logUsage()
    await usageTrackingService.logUsage({
      userId: validationResult.user.id,
      apiKeyId: validationResult.apiKeyId,
      action,
      pluginVersion,
      lightroomVersion,
      osVersion,
      metadata,
    });
    
    // Track successful request
    metricsService.trackEndpointError('/api/plugin/usage', false);
    
    // Return success response (200)
    return NextResponse.json(
      {
        success: true,
      },
      { 
        status: 200,
        headers: getCorsHeaders(request),
      }
    );
    
  } catch (error) {
    // Log error for debugging
    console.error('[Plugin Usage] Error logging usage:', error);
    
    // Track error
    metricsService.trackEndpointError('/api/plugin/usage', true);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/plugin/usage
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
