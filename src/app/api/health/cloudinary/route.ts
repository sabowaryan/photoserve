/**
 * Cloudinary Health Check API Route
 * GET - Check Cloudinary connectivity
 * 
 * This endpoint checks if Cloudinary is accessible and responsive.
 * Tests connection by pinging the Cloudinary API.
 * 
 * Requirements: 14.8, 14.9
 */
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

/**
 * GET /api/health/cloudinary
 * 
 * Cloudinary health check endpoint
 * 
 * Returns:
 *   200 - Cloudinary is healthy
 *   503 - Cloudinary is unavailable
 *   500 - Internal server error
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check Cloudinary configuration
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Cloudinary configuration missing',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    
    // Test Cloudinary connectivity by pinging the API
    // We'll use the ping endpoint which is lightweight
    const result = await cloudinary.api.ping();
    
    const responseTime = Date.now() - startTime;
    
    if (result.status !== 'ok') {
      console.error('[Health Check Cloudinary] Ping failed:', result);
      
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Cloudinary ping failed',
          responseTime,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    // Cloudinary is healthy
    return NextResponse.json(
      {
        status: 'healthy',
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('[Health Check Cloudinary] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Cloudinary connection failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
