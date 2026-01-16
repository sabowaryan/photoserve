/**
 * Stripe Connect Webhook Route
 * Handles Stripe webhook events for Connect accounts
 * 
 * @module app/api/stripe/connect/webhook/route
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
 * Webhook signing secret for Connect events
 */
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CONNECT;

/**
 * POST /api/stripe/connect/webhook
 * Handle Stripe webhook events for Connect accounts
 * 
 * Events handled:
 * - account.updated: Update Connect account status
 * - payout.created: Log payout creation
 * - payout.paid: Update payout status
 * - payout.failed: Handle payout failure
 * - capability.updated: Track capability changes
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check (Requirement 6.1)
    const clientIp = getClientIp(request);
    const rateLimitResult = checkWebhookRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      console.warn('[ConnectWebhook] Rate limit exceeded for IP:', clientIp);
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
      console.error('[ConnectWebhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    if (!webhookSecret) {
      console.error('[ConnectWebhook] Missing STRIPE_WEBHOOK_SECRET_CONNECT');
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
      console.error('[ConnectWebhook] Signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    console.log('[ConnectWebhook] Received event:', event.type, event.id);

    // Verify this is a Connect event (has account field)
    if (!event.account) {
      console.log('[ConnectWebhook] Not a Connect event, skipping');
      return NextResponse.json({
        received: true,
        skipped: true,
        reason: 'Not a Connect event',
      });
    }

    // Process the webhook
    const supabase = createAdminClient();
    const webhookService = createWebhookService(supabase);
    const result = await webhookService.processWebhook(event);

    if (result.success) {
      return NextResponse.json({
        received: true,
        eventId: result.eventId,
        status: result.status,
        account: event.account,
      });
    } else {
      // Return 200 even on processing failure to prevent Stripe retries
      // The event is logged and can be retried manually
      console.error('[ConnectWebhook] Processing failed:', result.message);
      return NextResponse.json({
        received: true,
        eventId: result.eventId,
        status: result.status,
        error: result.message,
      });
    }
  } catch (error) {
    console.error('[ConnectWebhook] Unexpected error:', error);
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
