/**
 * Email Suppressions Stats API Route
 * 
 * GET /api/emails/suppressions/stats - Get suppression statistics
 * 
 * Requirements: 8.7
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSuppressionRepository } from '@/lib/repositories/suppression.repository';

/**
 * GET /api/emails/suppressions/stats
 * Get suppression statistics
 */
export async function GET() {
  try {
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    const stats = await repository.getStats();

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching suppression stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppression stats' },
      { status: 500 }
    );
  }
}
