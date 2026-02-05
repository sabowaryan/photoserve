/**
 * Health Check API Route
 * GET - Basic health check
 * 
 * This endpoint provides a basic health check for the application.
 * Returns 200 if the application is running.
 * 
 * Requirements: 14.8, 14.9
 */
import { NextResponse } from 'next/server';

/**
 * GET /api/health
 * 
 * Basic health check endpoint
 * 
 * Returns:
 *   200 - Application is healthy
 *   500 - Application is unhealthy
 */
export async function GET() {
  try {
    // Basic health check - if we can respond, we're healthy
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || 'unknown',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Health Check] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
