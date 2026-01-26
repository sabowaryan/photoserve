/**
 * Disputes API Route
 * Returns list of disputes for the authenticated photographer
 * 
 * @module app/api/photographer/disputes/route
 * Requirements: 7.2 - Dispute Handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSupabaseClient } from '@/lib/auth';
import { getStripe } from '@/lib/stripe/client';
import { createApiResponse, ApiErrorResponse, handleApiError } from '@/lib/api/error-handler';
import { AppError } from '@/lib/errors';
import Stripe from 'stripe';

/**
 * Dispute summary for list view
 */
interface DisputeSummary {
  id: string;
  chargeId: string;
  purchaseId?: string;
  galleryId?: string;
  galleryTitle?: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
  evidenceDueBy: string | null;
  createdAt: string;
  buyerEmail?: string;
}

/**
 * Disputes list response
 */
interface DisputesListResponse {
  disputes: DisputeSummary[];
  hasMore: boolean;
  totalCount: number;
}

/**
 * GET /api/photographer/disputes
 * Get list of disputes for the authenticated photographer
 * 
 * Query params:
 * - status: Filter by status (needs_response, under_review, won, lost)
 * - limit: Number of disputes to return (default: 20, max: 100)
 * - startingAfter: Cursor for pagination (dispute ID)
 */
export async function GET(request: NextRequest) {
  try {
    const { supabase, userId } = await requireSupabaseClient();
    const stripe = getStripe();

    // Check if user has a Stripe Connect account
    const { data: connectAccount, error: connectError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id, charges_enabled')
      .eq('user_id', userId)
      .single();

    if (connectError || !connectAccount) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Stripe Connect account not found. Please connect your Stripe account first.', code: 'CONNECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const startingAfter = searchParams.get('startingAfter') || undefined;

    // Validate status filter
    const validStatuses = ['needs_response', 'under_review', 'won', 'lost', 'warning_needs_response', 'warning_under_review', 'warning_closed', 'charge_refunded'];
    if (statusFilter && !validStatuses.includes(statusFilter)) {
      return NextResponse.json<ApiErrorResponse>(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, code: 'INVALID_STATUS' },
        { status: 400 }
      );
    }

    // Get disputes from Stripe for this connected account
    // Note: We need to get disputes from the platform account that are related to this connected account
    const disputeParams: Stripe.DisputeListParams = {
      limit,
    };

    if (startingAfter) {
      disputeParams.starting_after = startingAfter;
    }

    // Fetch disputes from Stripe
    let stripeDisputes: Stripe.Dispute[] = [];
    let hasMore = false;

    try {
      const disputesList = await stripe.disputes.list(disputeParams);
      stripeDisputes = disputesList.data;
      hasMore = disputesList.has_more;
    } catch (stripeError) {
      console.error('[Disputes] Stripe API error:', stripeError);
      throw new AppError('Failed to fetch disputes from Stripe', 'STRIPE_ERROR', 500);
    }

    // Get all purchases for this photographer to match with disputes
    const { data: purchases } = await supabase
      .from('gallery_purchases')
      .select('id, stripe_charge_id, gallery_id, buyer_email')
      .eq('photographer_id', userId);

    const purchasesByChargeId = new Map(
      (purchases || []).map(p => [p.stripe_charge_id, p])
    );

    // Get gallery titles
    const galleryIds = [...new Set((purchases || []).map(p => p.gallery_id).filter(Boolean))];
    const { data: galleries } = await supabase
      .from('galleries')
      .select('id, title')
      .in('id', galleryIds);

    const galleriesById = new Map(
      (galleries || []).map(g => [g.id, g])
    );

    // Filter disputes to only those related to this photographer's charges
    const photographerDisputes = stripeDisputes.filter(dispute => {
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
      return chargeId && purchasesByChargeId.has(chargeId);
    });

    // Apply status filter if provided
    const filteredDisputes = statusFilter
      ? photographerDisputes.filter(d => d.status === statusFilter)
      : photographerDisputes;

    // Map to summary format
    const disputes: DisputeSummary[] = filteredDisputes.map(dispute => {
      const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id || '';
      const purchase = purchasesByChargeId.get(chargeId);
      const gallery = purchase?.gallery_id ? galleriesById.get(purchase.gallery_id) : null;

      return {
        id: dispute.id,
        chargeId,
        purchaseId: purchase?.id,
        galleryId: purchase?.gallery_id,
        galleryTitle: gallery?.title || undefined,
        amount: dispute.amount,
        currency: dispute.currency,
        reason: dispute.reason || 'unknown',
        status: dispute.status,
        evidenceDueBy: dispute.evidence_details?.due_by 
          ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
          : null,
        createdAt: new Date(dispute.created * 1000).toISOString(),
        buyerEmail: purchase?.buyer_email,
      };
    });

    const response: DisputesListResponse = {
      disputes,
      hasMore,
      totalCount: disputes.length,
    };

    return createApiResponse(response);
  } catch (error) {
    console.error('[Disputes] Error:', error);
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }
    return handleApiError(error);
  }
}
