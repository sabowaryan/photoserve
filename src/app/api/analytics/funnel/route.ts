/**
 * Funnel Analytics API Route
 * 
 * Tracks funnel events for conversion optimization
 * Requirements: 16.1, 16.2 (sales-funnel-optimization spec)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAnalyticsService } from '@/lib/services/analytics.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventType, eventData, visitorId } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: 'Event type is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Create analytics service
    const analyticsService = createAnalyticsService(supabase);

    // Track the funnel event
    await analyticsService.trackFunnelEvent(
      eventType,
      eventData || {},
      visitorId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Funnel Analytics] Error:', error);
    return NextResponse.json(
      { error: 'Failed to track event' },
      { status: 500 }
    );
  }
}
