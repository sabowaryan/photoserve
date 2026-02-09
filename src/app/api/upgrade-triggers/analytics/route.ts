/**
 * Upgrade Triggers Analytics API Route
 * Provides analytics on trigger effectiveness
 * 
 * @module api/upgrade-triggers/analytics
 * Requirements: 8.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireSupabaseClient();

    // Check if user is admin (you may want to add an admin check here)
    // For now, we'll allow any authenticated user to see their own analytics

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    // Build base query
    let query = supabase
      .from('upgrade_trigger_logs')
      .select('*');

    // Add date filters if provided
    if (startDate) {
      query = query.gte('shown_at', startDate);
    }
    if (endDate) {
      query = query.lte('shown_at', endDate);
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Error fetching upgrade trigger analytics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      );
    }

    // Calculate analytics by trigger type
    const analytics = {
      overall: {
        total_shown: logs.filter(l => l.shown).length,
        total_dismissed: logs.filter(l => l.dismissed).length,
        total_converted: logs.filter(l => l.converted).length,
        conversion_rate: 0,
        dismiss_rate: 0,
      },
      by_trigger_type: {} as Record<string, {
        shown: number;
        dismissed: number;
        converted: number;
        conversion_rate: number;
        dismiss_rate: number;
      }>,
    };

    // Calculate overall rates
    if (analytics.overall.total_shown > 0) {
      analytics.overall.conversion_rate = 
        (analytics.overall.total_converted / analytics.overall.total_shown) * 100;
      analytics.overall.dismiss_rate = 
        (analytics.overall.total_dismissed / analytics.overall.total_shown) * 100;
    }

    // Calculate by trigger type
    const triggerTypes = ['limit_reached', 'feature_locked', 'time_based', 'behavior_based'];
    
    for (const triggerType of triggerTypes) {
      const typeLogs = logs.filter(l => l.trigger_type === triggerType);
      const shown = typeLogs.filter(l => l.shown).length;
      const dismissed = typeLogs.filter(l => l.dismissed).length;
      const converted = typeLogs.filter(l => l.converted).length;

      analytics.by_trigger_type[triggerType] = {
        shown,
        dismissed,
        converted,
        conversion_rate: shown > 0 ? (converted / shown) * 100 : 0,
        dismiss_rate: shown > 0 ? (dismissed / shown) * 100 : 0,
      };
    }

    // Calculate plan selection distribution
    const planDistribution = logs
      .filter(l => l.converted && l.plan_selected)
      .reduce((acc, log) => {
        const plan = log.plan_selected as string;
        acc[plan] = (acc[plan] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      data: {
        analytics,
        plan_distribution: planDistribution,
        total_logs: logs.length,
      },
    });
  } catch (error) {
    console.error('Error in upgrade triggers analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
