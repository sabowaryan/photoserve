/**
 * Comprehensive Health Check API Route
 * GET - Check all services
 * 
 * This endpoint checks the health of all critical services:
 * - Application
 * - Database
 * - Cloudinary
 * 
 * Requirements: 14.8, 14.9
 */
import { NextResponse } from 'next/server';

interface ServiceHealth {
  status: 'healthy' | 'unhealthy';
  responseTime?: number;
  error?: string;
}

interface HealthCheckResult {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    application: ServiceHealth;
    database: ServiceHealth;
    cloudinary: ServiceHealth;
  };
  timestamp: string;
}

/**
 * Check a service health endpoint
 */
async function checkService(url: string): Promise<ServiceHealth> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const responseTime = Date.now() - startTime;
    const data = await response.json();
    
    if (response.ok && data.status === 'healthy') {
      return {
        status: 'healthy',
        responseTime,
      };
    } else {
      return {
        status: 'unhealthy',
        responseTime,
        error: data.error || 'Service check failed',
      };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'unhealthy',
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * GET /api/health/all
 * 
 * Comprehensive health check endpoint
 * 
 * Returns:
 *   200 - All services healthy
 *   207 - Some services degraded (partial success)
 *   503 - Critical services unhealthy
 */
export async function GET() {
  try {
    // Get base URL for internal requests
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Check all services in parallel
    const [appHealth, dbHealth, cloudinaryHealth] = await Promise.all([
      checkService(`${baseUrl}/api/health`),
      checkService(`${baseUrl}/api/health/db`),
      checkService(`${baseUrl}/api/health/cloudinary`),
    ]);
    
    // Determine overall health status
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    
    const unhealthyCount = [appHealth, dbHealth, cloudinaryHealth].filter(
      h => h.status === 'unhealthy'
    ).length;
    
    if (unhealthyCount === 0) {
      overall = 'healthy';
    } else if (unhealthyCount === 3 || dbHealth.status === 'unhealthy') {
      // If database is down or all services are down, system is unhealthy
      overall = 'unhealthy';
    } else {
      // Some services are down but database is up - degraded
      overall = 'degraded';
    }
    
    const result: HealthCheckResult = {
      overall,
      services: {
        application: appHealth,
        database: dbHealth,
        cloudinary: cloudinaryHealth,
      },
      timestamp: new Date().toISOString(),
    };
    
    // Return appropriate status code
    let statusCode: number;
    if (overall === 'healthy') {
      statusCode = 200;
    } else if (overall === 'degraded') {
      statusCode = 207; // Multi-Status
    } else {
      statusCode = 503; // Service Unavailable
    }
    
    return NextResponse.json(result, { status: statusCode });
    
  } catch (error) {
    console.error('[Health Check All] Error:', error);
    
    return NextResponse.json(
      {
        overall: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
