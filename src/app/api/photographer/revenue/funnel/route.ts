/**
 * Revenue Funnel API Route
 * Returns detailed conversion funnel data for the photographer
 * 
 * @module app/api/photographer/revenue/funnel
 * Requirements: 9.2 - Sales Funnel (Views → Paywall → Checkout → Purchase)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { createRevenueService } from '@/lib/services/revenue.service';

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const galleryId = searchParams.get('galleryId') || undefined;

    // Create revenue service and fetch funnel data
    const revenueService = createRevenueService(supabase);
    const funnelData = await revenueService.getDetailedConversionFunnel(userId, {
      startDate,
      endDate,
      galleryId,
    });

    return NextResponse.json(funnelData);
  } catch (error) {
    console.error('[API] Error fetching conversion funnel:', error);
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch conversion funnel' },
      { status: 500 }
    );
  }
}
