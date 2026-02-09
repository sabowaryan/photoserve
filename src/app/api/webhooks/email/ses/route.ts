/**
 * AWS SES Webhook API Route
 * 
 * Handles SNS notifications from AWS SES for email events.
 * 
 * Features:
 * - SNS signature verification
 * - Subscription confirmation handling
 * - Event processing (delivery, bounce, complaint, open, click)
 * - Rate limiting
 * - Error handling and logging
 * 
 * Requirements: 5.5, 5.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookHandler } from '@/lib/email/webhook-handler';
import type { SESWebhookEvent } from '@/lib/email/webhook-handler';

// Rate limiting (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Clean up expired rate limit records
 */
function cleanupRateLimits() {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}

// Clean up every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

/**
 * Handle SNS subscription confirmation
 */
async function handleSubscriptionConfirmation(event: SESWebhookEvent): Promise<boolean> {
  try {
    const subscribeURL = event.UnsubscribeURL || (event as any).SubscribeURL;
    
    if (!subscribeURL) {
      console.error('[SES-WEBHOOK] Missing SubscribeURL in confirmation');
      return false;
    }

    console.log('[SES-WEBHOOK] Confirming SNS subscription');
    
    // Confirm subscription by visiting the URL
    const response = await fetch(subscribeURL);
    
    if (!response.ok) {
      console.error('[SES-WEBHOOK] Failed to confirm subscription:', response.status);
      return false;
    }

    console.log('[SES-WEBHOOK] SNS subscription confirmed successfully');
    return true;
  } catch (error) {
    console.error('[SES-WEBHOOK] Error confirming subscription:', error);
    return false;
  }
}

/**
 * POST /api/webhooks/email/ses
 * 
 * Handle AWS SES SNS notifications
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      console.warn(`[SES-WEBHOOK] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.text();
    const event: SESWebhookEvent = JSON.parse(body);

    // Handle subscription confirmation
    if (event.Type === 'SubscriptionConfirmation') {
      const confirmed = await handleSubscriptionConfirmation(event);
      
      if (!confirmed) {
        return NextResponse.json(
          { error: 'Failed to confirm subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription confirmed',
      });
    }

    // Handle unsubscribe confirmation
    if (event.Type === 'UnsubscribeConfirmation') {
      console.log('[SES-WEBHOOK] Unsubscribe confirmation received');
      return NextResponse.json({
        success: true,
        message: 'Unsubscribe confirmed',
      });
    }

    // Handle notification
    if (event.Type !== 'Notification') {
      console.warn(`[SES-WEBHOOK] Unknown message type: ${event.Type}`);
      return NextResponse.json(
        { error: 'Unknown message type' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await createClient();

    // Initialize webhook handler
    const handler = new WebhookHandler(supabase);

    // Verify SNS signature
    const isValid = await handler.verifySNSSignature(event);

    if (!isValid) {
      console.error('[SES-WEBHOOK] Invalid SNS signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle webhook event
    const notification = JSON.parse(event.Message);
    console.log(`[SES-WEBHOOK] Processing ${notification.notificationType} notification`);
    
    const result = await handler.handleSESWebhook(event);

    if (!result.success) {
      console.error(`[SES-WEBHOOK] Failed to process event: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log(`[SES-WEBHOOK] Successfully processed ${notification.notificationType} notification`);

    return NextResponse.json({
      success: true,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error('[SES-WEBHOOK] Error processing webhook:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
