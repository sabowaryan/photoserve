/**
 * Stripe Webhook Route for Gallery Purchases
 * Handles Stripe webhook events for gallery monetization
 * 
 * @module app/api/stripe/webhook/gallery-purchase/route
 * Requirements: 4.3 - API Routes - Webhooks
 * Requirements: 6.1 - THE Endpoint SHALL have rate limiting protection
 * Requirements: 11.3 - THE Webhook_Endpoint SHALL return 200 OK within 3 seconds
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe/client';
import { createAdminClient } from '@/lib/supabase/server';
import { createWebhookService } from '@/lib/services/webhook.service';
import { 
  checkWebhookRateLimit, 
  getClientIp 
} from '@/lib/services/webhook-rate-limiter.service';
import Stripe from 'stripe';

/**
 * Webhook signing secret from environment
 */
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE;

/**
 * POST /api/stripe/webhook/gallery-purchase
 * Handle Stripe webhook events for gallery purchases
 * 
 * Events handled:
 * - checkout.session.completed: Record purchase and grant access
 * - charge.refunded: Update purchase status
 * - charge.dispute.created: Mark purchase as disputed
 * - charge.dispute.closed: Update based on dispute outcome
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (Requirement 6.1)
    const clientIp = getClientIp(request);
    const rateLimitResult = checkWebhookRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      console.warn('[Webhook] Rate limit exceeded for IP:', clientIp);
      const response = NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: rateLimitResult.retryAfterSeconds,
        },
        { status: 429 }
      );
      response.headers.set('Retry-After', String(rateLimitResult.retryAfterSeconds));
      response.headers.set('X-RateLimit-Limit', String(rateLimitResult.limit));
      response.headers.set('X-RateLimit-Remaining', '0');
      return response;
    }

    // Get the raw body
    const body = await request.text();
    
    // Get the signature header
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[Webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('[Webhook] Missing STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify the webhook signature
    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('[Webhook] Received event:', event.type, event.id);

    // Process the webhook
    const supabase = createAdminClient();
    const webhookService = createWebhookService(supabase);
    const result = await webhookService.processWebhook(event);

    if (result.success) {
      return NextResponse.json({
        received: true,
        eventId: result.eventId,
        status: result.status,
      });
    } else {
      // Return 200 even on processing failure to prevent Stripe retries
      // The event is logged and can be retried manually
      console.error('[Webhook] Processing failed:', result.message);
      return NextResponse.json({
        received: true,
        eventId: result.eventId,
        status: result.status,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('[Webhook] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Route segment config for webhook routes
 * Stripe requires the raw body for signature verification
 * In Next.js App Router, we use request.text() to get raw body instead of config
 */
