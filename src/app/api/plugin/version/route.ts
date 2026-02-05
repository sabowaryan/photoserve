/**
 * Plugin Version API Route
 * GET - Get the latest stable plugin version information
 * 
 * This endpoint is used by the Lightroom plugin to check for updates.
 * It returns version information including download URL, file size, changelog,
 * release date, and minimum Lightroom version required.
 * 
 * No authentication required - this is a public endpoint.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.9, 14.2
 */
import { NextResponse } from 'next/server';
import { pluginVersionService } from '@/lib/services/plugin-version.service';
import { getCacheHeaders, generateVersionedUrl } from '@/lib/config/cdn.config';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * GET /api/plugin/version
 * 
 * Returns the latest stable plugin version information
 * 
 * No authentication required
 * 
 * Responses:
 *   200 - Latest stable version information
 *   404 - No stable version exists
 *   500 - Internal server error
 * 
 * Response caching: 5 minutes (implemented via service layer cache)
 */
export async function GET() {
  try {
    // Call PluginVersionService.getLatestStableVersion()
    // This method implements caching internally (5 minutes TTL)
    const latestVersion = await pluginVersionService.getLatestStableVersion();
    
    // Return 404 if no stable version exists
    if (!latestVersion) {
      metricsService.trackEndpointError('/api/plugin/version', true);
      
      return NextResponse.json(
        {
          error: 'No stable version available',
        },
        { status: 404 }
      );
    }
    
    // Track successful request
    metricsService.trackEndpointError('/api/plugin/version', false);
    
    // Return version info (version, downloadUrl, fileSize, changelog, releaseDate, minLightroomVersion)
    // Use versioned URL for cache busting
    const versionedDownloadUrl = generateVersionedUrl(latestVersion.fileUrl, latestVersion.version);
    
    // Get CDN cache headers for version info (5 minutes)
    const cacheHeaders = getCacheHeaders('version-info');
    
    return NextResponse.json(
      {
        version: latestVersion.version,
        downloadUrl: versionedDownloadUrl,
        fileSize: latestVersion.fileSize,
        changelog: latestVersion.changelog,
        releaseDate: latestVersion.releaseDate,
        minLightroomVersion: latestVersion.minLightroomVersion,
      },
      {
        status: 200,
        headers: {
          ...cacheHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
    
  } catch (error) {
    // Log error for debugging
    console.error('[Plugin Version] Error fetching latest version:', error);
    
    // Track error
    metricsService.trackEndpointError('/api/plugin/version', true);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

