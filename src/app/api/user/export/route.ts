/**
 * User Data Export API Route
 * RGPD right to data portability
 * 
 * @module api/user/export
 * Requirement: 23.5 - Allow users to export their data
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient, getSession } from '@/lib/auth';

export async function GET(_request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // Fetch galleries
    const { data: galleries } = await supabase
      .from('galleries')
      .select('*')
      .eq('user_id', userId);

    // Fetch images
    const { data: images } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', userId);

    // Fetch gallery analytics
    let galleryAnalytics = null;
    if (galleries && galleries.length > 0) {
      const galleryIds = galleries.map(g => g.id);
      const { data } = await supabase
        .from('gallery_analytics')
        .select('*')
        .in('gallery_id', galleryIds)
        .order('viewed_at', { ascending: false })
        .limit(1000); // Limit to last 1000 events
      galleryAnalytics = data;
    }

    // Fetch upgrade trigger logs
    const { data: upgradeLogs } = await supabase
      .from('upgrade_trigger_logs')
      .select('*')
      .eq('user_id', userId);

    // Fetch onboarding state
    const { data: onboardingState } = await supabase
      .from('onboarding_states')
      .select('*')
      .eq('user_id', userId);

    // Compile all data
    const userData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: userId,
        format: 'JSON',
        version: '1.0',
      },
      account: {
        email: session.user.email,
        user_id: userId,
        name: session.user.name,
      },
      profile: profile || null,
      galleries: galleries || [],
      images: images || [],
      analytics: {
        gallery_views: galleryAnalytics || [],
        total_views: galleryAnalytics?.length || 0,
      },
      upgrade_logs: upgradeLogs || [],
      onboarding: onboardingState || [],
      statistics: {
        total_galleries: galleries?.length || 0,
        total_images: images?.length || 0,
        storage_used_mb: profile?.storage_used_mb || 0,
        subscription_plan: profile?.subscription_plan || 'free',
      },
    };

    // Return as JSON download
    const filename = `piksend-data-${userId}-${Date.now()}.json`;
    
    return new NextResponse(JSON.stringify(userData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
