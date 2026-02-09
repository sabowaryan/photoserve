/**
 * Email Suppression Detail API Routes
 * 
 * GET /api/emails/suppressions/[id] - Get suppression details
 * DELETE /api/emails/suppressions/[id] - Remove a suppression
 * 
 * Requirements: 8.7, 8.8
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSuppressionRepository } from '@/lib/repositories/suppression.repository';

/**
 * GET /api/emails/suppressions/[id]
 * Get suppression details
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    const suppression = await repository.getSuppressionById(id);

    if (!suppression) {
      return NextResponse.json(
        { error: 'Suppression not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(suppression);
  } catch (error) {
    console.error('Error fetching suppression:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppression' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/suppressions/[id]
 * Remove a suppression
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    await repository.removeSuppression(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing suppression:', error);
    return NextResponse.json(
      { error: 'Failed to remove suppression' },
      { status: 500 }
    );
  }
}
