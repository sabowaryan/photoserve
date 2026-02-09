/**
 * Email Suppressions API Routes
 * 
 * GET /api/emails/suppressions - List suppressions with filters
 * POST /api/emails/suppressions - Add a new suppression
 * DELETE /api/emails/suppressions - Bulk delete suppressions
 * 
 * Requirements: 8.7, 8.8
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createSuppressionRepository } from '@/lib/repositories/suppression.repository';

/**
 * GET /api/emails/suppressions
 * List suppressions with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sortBy = searchParams.get('sortBy') || 'last_occurred_at';
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';

    // Build filters
    const filters: any = {};
    
    const reason = searchParams.get('reason');
    if (reason) {
      filters.reason = reason;
    }

    const bounceType = searchParams.get('bounceType');
    if (bounceType) {
      filters.bounceType = bounceType;
    }

    const search = searchParams.get('search');
    if (search) {
      filters.search = search;
    }

    // Fetch suppressions
    const result = await repository.listSuppressions(
      filters,
      page,
      pageSize,
      sortBy,
      sortOrder
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching suppressions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppressions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/emails/suppressions
 * Add a new suppression manually
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    const body = await request.json();
    const { email, reason, bounceType } = body;

    // Validate input
    if (!email || !reason) {
      return NextResponse.json(
        { error: 'Email and reason are required' },
        { status: 400 }
      );
    }

    if (!['bounce', 'complaint'].includes(reason)) {
      return NextResponse.json(
        { error: 'Reason must be "bounce" or "complaint"' },
        { status: 400 }
      );
    }

    if (reason === 'bounce' && bounceType && !['hard', 'soft'].includes(bounceType)) {
      return NextResponse.json(
        { error: 'Bounce type must be "hard" or "soft"' },
        { status: 400 }
      );
    }

    // Check if suppression already exists
    const existing = await repository.getSuppressionByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'Email is already suppressed' },
        { status: 409 }
      );
    }

    // Add suppression
    const suppression = await repository.addSuppression({
      email,
      reason,
      bounce_type: bounceType || null,
    });

    return NextResponse.json(suppression, { status: 201 });
  } catch (error) {
    console.error('Error adding suppression:', error);
    return NextResponse.json(
      { error: 'Failed to add suppression' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/emails/suppressions
 * Bulk delete suppressions
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const repository = createSuppressionRepository(supabase);

    const body = await request.json();
    const { ids } = body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      );
    }

    // Remove suppressions
    await repository.removeSuppressions(ids);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing suppressions:', error);
    return NextResponse.json(
      { error: 'Failed to remove suppressions' },
      { status: 500 }
    );
  }
}
