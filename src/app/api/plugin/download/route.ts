/**
 * Plugin Download API Route
 * GET - Download the Lightroom plugin
 * 
 * This endpoint handles plugin downloads for authenticated Pro users.
 * It verifies the user has a Pro plan, records the download, and redirects
 * to the Cloudinary URL for the plugin file with CDN optimization.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.7, 5.8, 5.10, 12.3, 12.4, 14.2
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { pluginVersionService } from '@/lib/services/plugin-version.service';
import { rateLimitMiddleware } from '@/lib/middleware/rate-limit';
import { getCorsHeaders } from '@/lib/middleware/cors';
import { getCacheHeaders, generateVersionedUrl } from '@/lib/config/cdn.config';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * GET /api/plugin/download
 * 
 * Downloads the plugin file for authenticated Pro users
 * 
 * Query Parameters:
 *   version (optional): Specific version to download, defaults to latest stable
 * 
 * Responses:
 *   302 - Redirect to Cloudinary URL
 *   401 - Not authenticated
 *   403 - Not a Pro user
 *   404 - Version not found
 *   500 - Internal server error
 */
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting for downloads
    const rateLimitResponse = rateLimitMiddleware(request, 'download');
    if (rateLimitResponse) {
      // Add CORS headers to rate limit response
      const corsHeaders = getCorsHeaders(request);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        rateLimitResponse.headers.set(key, value);
      });
      
      // Track failed download
      metricsService.trackPluginDownload(false);
      metricsService.trackEndpointError('/api/plugin/download', true);
      
      return rateLimitResponse;
    }
    
    // Require authentication
    const { supabase, userId } = await requireSupabaseClient();
    
    // Verify user has Pro plan
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      console.error('[Plugin Download] Failed to fetch user profile:', profileError);
      return NextResponse.json(
        {
          error: 'User profile not found',
        },
        { status: 404 }
      );
    }
    
    // Return 403 if not Pro user
    if (profile.subscription_plan !== 'pro') {
      return NextResponse.json(
        {
          error: 'Pro plan required to download plugin',
        },
        { status: 403 }
      );
    }
    
    // Get version (from query param or latest stable)
    const searchParams = request.nextUrl.searchParams;
    const versionParam = searchParams.get('version');
    
    let pluginVersion;
    
    if (versionParam) {
      // Get specific version by version string
      const allVersions = await pluginVersionService.getAllVersions(true);
      pluginVersion = allVersions.find(v => v.version === versionParam);
      
      if (!pluginVersion) {
        return NextResponse.json(
          {
            error: `Version ${versionParam} not found`,
          },
          { status: 404 }
        );
      }
    } else {
      // Get latest stable version
      pluginVersion = await pluginVersionService.getLatestStableVersion();
      
      if (!pluginVersion) {
        return NextResponse.json(
          {
            error: 'No stable version available',
          },
          { status: 404 }
        );
      }
    }
    
    // Get client IP and user agent for download tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Call PluginVersionService.recordDownload()
    await pluginVersionService.recordDownload(
      pluginVersion.id,
      userId,
      {
        ipAddress,
        userAgent,
      }
    );
    
    // Track successful download
    metricsService.trackPluginDownload(true);
    metricsService.trackEndpointError('/api/plugin/download', false);
    
    // Proxy the file to control headers and ensure correct filename
    const filename = `PikSend-${pluginVersion.version}.zip`;
    
    // Use versioned URL for cache busting
    const versionedUrl = generateVersionedUrl(pluginVersion.fileUrl, pluginVersion.version);
    
    // Fetch the file from Cloudinary with a longer timeout
    const fileResponse = await fetch(versionedUrl, {
      signal: AbortSignal.timeout(30000), // 30 seconds timeout
    });
    
    if (!fileResponse.ok) {
      console.error('[Plugin Download] Failed to fetch from Cloudinary:', fileResponse.status);
      throw new Error('Failed to fetch file from Cloudinary');
    }
    
    // Get the file as a buffer
    const fileBuffer = await fileResponse.arrayBuffer();
    
    // Get CDN cache headers (1 year cache for immutable plugin files)
    const cacheHeaders = getCacheHeaders('plugin-file');
    
    // Create response with correct headers
    const response = new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pluginVersion.fileSize.toString(),
        'X-Content-Type-Options': 'nosniff',
        ...cacheHeaders,
        ...getCorsHeaders(request),
      },
    });
    
    return response;
    
  } catch (error) {
    // Return 401 if not authenticated
    if (error instanceof Error && error.message === 'Authentication required') {
      // Track failed download
      metricsService.trackPluginDownload(false);
      metricsService.trackEndpointError('/api/plugin/download', true);
      
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }
    
    // Log error for debugging
    console.error('[Plugin Download] Error processing download:', error);
    
    // Track failed download
    metricsService.trackPluginDownload(false);
    metricsService.trackEndpointError('/api/plugin/download', true);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS /api/plugin/download
 * 
 * Handle CORS preflight requests
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}
