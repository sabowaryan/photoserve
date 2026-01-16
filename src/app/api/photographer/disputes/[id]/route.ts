/**
 * Dispute Details API Route
 * Returns details for a specific dispute
 * 
 * @module app/api/photographer/disputes/[id]/route
 * Requirements: 7.2 - Dispute Handling
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe/client';
import { createApiResponse, ApiErrorResponse, handleApiError } from '@/lib/api/error-handler';
import { NotFoundError, AppError } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Detailed dispute information
 */
interface DisputeDetails {
  id: string;
  chargeId: string;
  purchaseId?: string;
  galleryId?: string;
  galleryTitle?: string;
  
  // Amount details
  amount: number;
  currency: string;
  
  // Dispute info
  reason: string;
  reasonDescription: string;
  status: string;
  
  // Evidence details
  evidenceDueBy: string | null;
  hasEvidence: boolean;
  evidenceSubmissionCount: number;
  
  // Required evidence
  evidenceRequired: string[];
  
  // Timestamps
  createdAt: string;
  
  // Buyer info
  buyerEmail?: string;
  buyerName?: string;
  
  // Stripe Dashboard link
  stripeDashboardUrl: string;
  
  // Network details
  networkReasonCode?: string;
  
  // Balance impact
  balanceTransactionId?: string;
  isRefundable: boolean;
}

/**
 * Map Stripe dispute reason to human-readable description
 */
function getReasonDescription(reason: string): string {
  const reasonDescriptions: Record<string, string> = {
    'bank_cannot_process': 'The bank cannot process this payment.',
    'check_returned': 'The check was returned.',
    'credit_not_processed': 'The customer claims a credit was not processed.',
    'customer_initiated': 'The customer initiated the dispute.',
    'debit_not_authorized': 'The debit was not authorized.',
    'duplicate': 'The customer claims this is a duplicate charge.',
    'fraudulent': 'The customer claims this charge is fraudulent.',
    'general': 'General dispute.',
    'incorrect_account_details': 'Incorrect account details were provided.',
    'insufficient_funds': 'There were insufficient funds.',
    'product_not_received': 'The customer claims the product was not received.',
    'product_unacceptable': 'The customer claims the product is unacceptable.',
    'subscription_canceled': 'The subscription was canceled.',
    'unrecognized': 'The customer does not recognize this charge.',
  };

  return reasonDescriptions[reason] || 'Unknown dispute reason.';
}

/**
 * Get required evidence based on dispute reason
 */
function getRequiredEvidence(reason: string): string[] {
  const baseEvidence = [
    'Customer communication',
    'Receipt or proof of purchase',
    'Service documentation',
  ];

  const reasonSpecificEvidence: Record<string, string[]> = {
    'product_not_received': [
      ...baseEvidence,
      'Delivery confirmation',
      'Tracking information',
    ],
    'product_unacceptable': [
      ...baseEvidence,
      'Product description',
      'Refund policy',
    ],
    'fraudulent': [
      ...baseEvidence,
      'Customer signature',
      'IP address and device info',
      'Previous successful transactions',
    ],
    'duplicate': [
      ...baseEvidence,
      'Proof that charges are separate',
      'Itemized receipts',
    ],
    'subscription_canceled': [
      ...baseEvidence,
      'Cancellation policy',
      'Proof of service delivery',
    ],
    'credit_not_processed': [
      ...baseEvidence,
      'Refund policy',
      'Proof of refund if applicable',
    ],
    'unrecognized': [
      ...baseEvidence,
      'Customer identification',
      'Transaction details',
    ],
  };

  return reasonSpecificEvidence[reason] || baseEvidence;
}

/**
 * GET /api/photographer/disputes/[id]
 * Get details for a specific dispute
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const stripe = getStripe();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    // Check if user has a Stripe Connect account
    const { data: connectAccount, error: connectError } = await supabase
      .from('stripe_connect_accounts')
      .select('stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (connectError || !connectAccount) {
      return NextResponse.json<ApiErrorResponse>(
        { error: 'Stripe Connect account not found', code: 'CONNECT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch dispute from Stripe
    let dispute: Stripe.Dispute;
    try {
      dispute = await stripe.disputes.retrieve(id);
    } catch (stripeError: unknown) {
      if (stripeError instanceof Error && 'statusCode' in stripeError && (stripeError as { statusCode: number }).statusCode === 404) {
        throw new NotFoundError('Dispute');
      }
      console.error('[DisputeDetails] Stripe API error:', stripeError);
      throw new AppError('Failed to fetch dispute from Stripe', 'STRIPE_ERROR', 500);
    }

    // Get the charge ID
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    if (!chargeId) {
      throw new NotFoundError('Dispute');
    }

    // Verify this dispute belongs to the photographer
    const { data: purchase, error: purchaseError } = await supabase
      .from('gallery_purchases')
      .select('id, gallery_id, buyer_email, buyer_name, photographer_id')
      .eq('stripe_charge_id', chargeId)
      .single();

    if (purchaseError || !purchase) {
      throw new NotFoundError('Dispute');
    }

    // Verify ownership
    if (purchase.photographer_id !== user.id) {
      throw new NotFoundError('Dispute');
    }

    // Get gallery info
    let galleryTitle: string | undefined;
    if (purchase.gallery_id) {
      const { data: gallery } = await supabase
        .from('galleries')
        .select('title')
        .eq('id', purchase.gallery_id)
        .single();
      
      galleryTitle = gallery?.title || undefined;
    }

    // Build response
    const disputeDetails: DisputeDetails = {
      id: dispute.id,
      chargeId,
      purchaseId: purchase.id,
      galleryId: purchase.gallery_id,
      galleryTitle,
      
      amount: dispute.amount,
      currency: dispute.currency,
      
      reason: dispute.reason || 'unknown',
      reasonDescription: getReasonDescription(dispute.reason || 'general'),
      status: dispute.status,
      
      evidenceDueBy: dispute.evidence_details?.due_by 
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : null,
      hasEvidence: dispute.evidence_details?.has_evidence || false,
      evidenceSubmissionCount: dispute.evidence_details?.submission_count || 0,
      
      evidenceRequired: getRequiredEvidence(dispute.reason || 'general'),
      
      createdAt: new Date(dispute.created * 1000).toISOString(),
      
      buyerEmail: purchase.buyer_email,
      buyerName: purchase.buyer_name || undefined,
      
      // Link to Stripe Dashboard for full dispute management
      stripeDashboardUrl: `https://dashboard.stripe.com/disputes/${dispute.id}`,
      
      networkReasonCode: dispute.network_reason_code || undefined,
      
      balanceTransactionId: dispute.balance_transactions && dispute.balance_transactions.length > 0
        ? (typeof dispute.balance_transactions[0] === 'string' 
            ? dispute.balance_transactions[0] 
            : dispute.balance_transactions[0]?.id)
        : undefined,
      isRefundable: dispute.is_charge_refundable,
    };

    return createApiResponse(disputeDetails);
  } catch (error) {
    console.error('[DisputeDetails] Error:', error);
    return handleApiError(error);
  }
}

// Import Stripe type for the dispute
import Stripe from 'stripe';
