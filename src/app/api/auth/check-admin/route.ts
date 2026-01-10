/**
 * Check Admin Status API Route
 * GET - Check if the current user is an admin
 */
import { NextResponse } from 'next/server';
import { getSession, requireSupabaseClient } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ isAdmin: false });
    }

    const { supabase } = await requireSupabaseClient();
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .maybeSingle();

    return NextResponse.json({ 
      isAdmin: profile?.is_admin === true 
    });
  } catch (error) {
    console.error('Error checking admin status:', error);
    return NextResponse.json({ isAdmin: false });
  }
}
