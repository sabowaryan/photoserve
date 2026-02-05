/**
 * Metrics Middleware
 * 
 * Automatically tracks metrics for API requests including response times,
 * success rates, and error rates.
 * 
 * Requirements: 14.9
 */

import { NextRequest, NextResponse } from 'next/server';
import { metricsService } from '@/lib/services/metrics.service';

/**
 * Wrap an API handler with metrics tracking
 * 
 * @param handler - The API route handler function
 * @param endpoint - The endpoint name for metrics tracking
 * @returns Wrapped handler with metrics tracking
 */
export function withMetrics(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>,
  endpoint: string
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const startTime = Date.now();
    let response: NextResponse;
    let isError = false;
    
    try {
      response = await handler(request, ...args);
      
      // Track errors based on status code
      isError = response.status >= 400;
      
      return response;
    } catch (error) {
      isError = true;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      // Track endpoint error
      metricsService.trackEndpointError(endpoint, isError);
      
      // Track specific metrics based on endpoint
      if (endpoint === '/api/plugin/auth/validate') {
        metricsService.trackApiKeyValidation(duration, !isError);
      } else if (endpoint === '/api/plugin/download') {
        metricsService.trackPluginDownload(!isError);
      }
    }
  };
}

/**
 * Track database query performance
 * 
 * @param queryFn - The database query function
 * @returns Result of the query
 */
export async function withDbMetrics<T>(
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await queryFn();
    return result;
  } finally {
    const duration = Date.now() - startTime;
    metricsService.trackDbQuery(duration);
  }
}
