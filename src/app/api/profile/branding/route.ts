/**
 * Profile Branding API
 * Handles updating photographer branding settings
 * 
 * Requirements:
 * - 5.1: White-Label (Custom Logo)
 * - 5.2: Custom Domain
 * - 5.3: Brand Colors
 */
import { NextResponse } from 'next/server';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { hasFeatureAccess } from '@/config/plan-features';
import type { ProfileBranding } from '@/types';

export async function PUT(request: Request) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const branding: ProfileBranding = await request.json();
    const { supabase } = await requireSupabaseClient();

    // Get user's current plan
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', session.user.id)
      .single();

    const userPlan = profile?.subscription_plan || 'free';

    // Validate feature access
    if (branding.customLogo && !hasFeatureAccess(userPlan, 'whiteLabel')) {
      return NextResponse.json(
        { error: 'Custom logo requires Pro plan' },
        { status: 403 }
      );
    }

    if (branding.customDomain && !hasFeatureAccess(userPlan, 'customDomain')) {
      return NextResponse.json(
        { error: 'Custom domain requires Pro plan' },
        { status: 403 }
      );
    }

    if (branding.brandColors && !hasFeatureAccess(userPlan, 'brandColors')) {
      return NextResponse.json(
        { error: 'Brand colors require Pro plan' },
        { status: 403 }
      );
    }

    // Update branding
    const { error } = await supabase
      .from('profiles')
      .update({ branding } as any)
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating branding:', error);
      return NextResponse.json(
        { error: 'Failed to update branding' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Branding update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { supabase } = await requireSupabaseClient();

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('branding, subscription_plan')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching branding:', error);
      return NextResponse.json(
        { error: 'Failed to fetch branding' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      branding: (profile as any).branding || {},
      plan: (profile as any).subscription_plan || 'free',
    });
  } catch (error) {
    console.error('Branding fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
