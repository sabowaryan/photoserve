import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    // Use admin client to bypass RLS for public stats
    const supabase = createAdminClient();
    
    // Count non-admin users (real photographers)
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .or('is_admin.is.null,is_admin.eq.false');

    if (error) {
      console.error('[users-count] Error fetching user count:', error);
      return NextResponse.json({ 
        count: 500, 
        isFallback: true,
        error: error.message 
      });
    }

    const actualCount = count || 0;

    // Use fallback if less than 500 users
    const displayCount = actualCount >= 500 ? actualCount : 500;
    const isFallback = actualCount < 500;

    return NextResponse.json({ 
      count: displayCount, 
      isFallback,
      actualCount
    });
  } catch (error) {
    console.error('[users-count] Error in users-count API:', error);
    return NextResponse.json({ 
      count: 500, 
      isFallback: true,
      error: String(error)
    });
  }
}
