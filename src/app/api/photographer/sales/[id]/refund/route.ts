/**
 * Refund API Route
 * Handles refund requests for gallery purchases
 * 
 * @module app/api/photographer/sales/[id]/refund/route
 * Requirements: 7.1 - Refund Management
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createGalleryPurchaseService } from '@/lib/services/gallery-purchase.service';
import { createApiResponse, ApiErrorResponse, handleApiError } from '@/lib/api/error-handler';
import { z } from 'zod';
import { ValidationError, NotFoundError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Refund request schema
 * Validates refund type and amount for partial refunds
 */
const refundRequestSchema = z.object({
  type: z.enum(['full', 'partial']).default('full'),
  amountCents: z.number().int().positive().optional(),
  reason: z.string().max(500).optional(),
}).refine(
  (data) => {
    // If partial refund, amount is required
    if (data.type === 'partial' && !data.amountCents) {
      return false;
    }
    return true;
  },
  {
    message: 'Amount is required for partial refunds',
    path: ['amountCents'],
  }
);

/**
 * GET /api/photographer/sales/[id]/refund
 * Get refundable amount for a sale
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Verify ownership - check if the sale belongs to this photographer
    const { data: purchase, error: purchaseError } = await supabase
      .from('gallery_purchases')
      .select('id, photographer_id, status')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Sale not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (purchase.photographer_id !== user.id) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Sale not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const purchaseService = createGalleryPurchaseService(supabase);
    const refundableAmount = await purchaseService.getRefundableAmount(id);

    return createApiResponse(refundableAmount);
  } catch (error) {
    console.error('[Refund GET] Error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/photographer/sales/[id]/refund
 * Process a refund for a sale
 * 
 * Body:
 * - type: 'full' | 'partial' (default: 'full')
 * - amountCents: number (required for partial refunds)
 * - reason: string (optional, max 500 chars)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const validationResult = refundRequestSchema.safeParse(body);
    if (!validationResult.success) {
      throw validationResult.error;
    }

    const { type, amountCents, reason } = validationResult.data;

    // Verify ownership - check if the sale belongs to this photographer
    const { data: purchase, error: purchaseError } = await supabase
      .from('gallery_purchases')
      .select('id, photographer_id, status, amount_cents')
      .eq('id', id)
      .single();

    if (purchaseError || !purchase) {
      throw new NotFoundError('Sale');
    }

    if (purchase.photographer_id !== user.id) {
      throw new NotFoundError('Sale');
    }

    // Check if purchase can be refunded
    if (purchase.status === 'refunded') {
      throw new ValidationError('This sale has already been refunded', { purchaseId: id });
    }

    if (purchase.status !== 'succeeded') {
      throw new ValidationError(`Cannot refund a sale with status: ${purchase.status}`, {
        purchaseId: id,
        currentStatus: purchase.status,
      });
    }

    const purchaseService = createGalleryPurchaseService(supabase);

    // Process refund based on type
    if (type === 'full') {
      const refundedPurchase = await purchaseService.refundPurchase(id, reason);
      
      return createApiResponse({
        success: true,
        message: 'Full refund processed successfully',
        purchase: refundedPurchase,
        refundedAmountCents: purchase.amount_cents,
        isFullyRefunded: true,
      });
    } else {
      // Partial refund
      if (!amountCents) {
        throw new ValidationError('Amount is required for partial refunds', { type });
      }

      const result = await purchaseService.processPartialRefund(id, amountCents, reason);
      
      return createApiResponse({
        success: true,
        message: result.isFullyRefunded 
          ? 'Partial refund completed the full refund'
          : 'Partial refund processed successfully',
        purchase: result.purchase,
        refundId: result.refundId,
        refundedAmountCents: result.refundedAmountCents,
        remainingAmountCents: result.remainingAmountCents,
        isFullyRefunded: result.isFullyRefunded,
      });
    }
  } catch (error) {
    console.error('[Refund POST] Error:', error);
    return handleApiError(error);
  }
}
