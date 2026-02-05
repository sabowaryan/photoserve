/**
 * Database Health Check API Route
 * GET - Check database connectivity
 * 
 * This endpoint checks if the database is accessible and responsive.
 * Tests connection by running a simple query.
 * 
 * Requirements: 14.8, 14.9
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/health/db
 * 
 * Database health check endpoint
 * 
 * Returns:
 *   200 - Database is healthy
 *   503 - Database is unavailable
 *   500 - Internal server error
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Database configuration missing',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test database connectivity with a simple query
    // Query the profiles table to check if we can read data
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      console.error('[Health Check DB] Database query failed:', error);
      
      return NextResponse.json(
        {
          status: 'unhealthy',
          error: 'Database query failed',
          details: error.message,
          responseTime,
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    // Database is healthy
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
    console.error('[Health Check DB] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Database connection failed',
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
