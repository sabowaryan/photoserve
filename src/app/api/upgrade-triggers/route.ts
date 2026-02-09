/**
 * Upgrade Triggers API Route
 * Handles tracking of upgrade trigger events
 * 
 * @module api/upgrade-triggers
 * Requirements: 8.8
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    const body = await request.json();
    const { trigger_type, action, plan_selected } = body;

    // Validate trigger_type
    const validTriggerTypes = ['limit_reached', 'feature_locked', 'time_based', 'behavior_based'];
    if (!validTriggerTypes.includes(trigger_type)) {
      return NextResponse.json(
        { error: 'Invalid trigger type' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['shown', 'dismissed', 'converted'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'shown') {
      // Insert new log entry
      const { data, error } = await supabase
        .from('upgrade_trigger_logs')
        .insert({
          user_id: userId,
          trigger_type,
          shown: true,
          shown_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error inserting upgrade trigger log:', error);
        return NextResponse.json(
          { error: 'Failed to log trigger' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (action === 'dismissed' || action === 'converted') {
      // Find the most recent log entry for this trigger type
      const { data: lastLog, error: fetchError } = await supabase
        .from('upgrade_trigger_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('trigger_type', trigger_type)
        .order('shown_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !lastLog) {
        return NextResponse.json(
          { error: 'No trigger log found' },
          { status: 404 }
        );
      }

      // Update the log entry
      const updateData: Record<string, any> = {};
      
      if (action === 'dismissed') {
        updateData.dismissed = true;
        updateData.dismissed_at = new Date().toISOString();
      }
      
      if (action === 'converted') {
        updateData.converted = true;
        updateData.converted_at = new Date().toISOString();
        if (plan_selected) {
          updateData.plan_selected = plan_selected;
        }
      }

      const { data, error: updateError } = await supabase
        .from('upgrade_trigger_logs')
        .update(updateData)
        .eq('id', lastLog.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating upgrade trigger log:', updateError);
        return NextResponse.json(
          { error: 'Failed to update trigger log' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in upgrade triggers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const triggerType = searchParams.get('trigger_type');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build query
    let query = supabase
      .from('upgrade_trigger_logs')
      .select('*')
      .eq('user_id', userId)
      .order('shown_at', { ascending: false })
      .limit(limit);

    if (triggerType) {
      query = query.eq('trigger_type', triggerType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching upgrade trigger logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in upgrade triggers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
