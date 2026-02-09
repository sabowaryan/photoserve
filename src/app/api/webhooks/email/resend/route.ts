/**
 * Resend Webhook API Route
 * 
 * Handles webhook events from Resend email provider.
 * 
 * Features:
 * - Signature verification
 * - Event processing (delivered, opened, clicked, bounced, complained)
 * - Rate limiting
 * - Error handling and logging
 * 
 * Requirements: 5.5, 5.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { WebhookHandler } from '@/lib/email/webhook-handler';
import type { ResendWebhookEvent } from '@/lib/email/webhook-handler';

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
 * POST /api/webhooks/email/resend
 * 
 * Handle Resend webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';

    // Check rate limit
    if (!checkRateLimit(ip)) {
      console.warn(`[RESEND-WEBHOOK] Rate limit exceeded for IP: ${ip}`);
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get webhook signature
    const signature = request.headers.get('svix-signature') || 
                     request.headers.get('webhook-signature');

    if (!signature) {
      console.error('[RESEND-WEBHOOK] Missing signature header');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Get webhook secret from environment
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[RESEND-WEBHOOK] Webhook secret not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.text();
    const event: ResendWebhookEvent = JSON.parse(body);

    // Initialize Supabase client
    const supabase = await createClient();

    // Initialize webhook handler
    const handler = new WebhookHandler(supabase);

    // Verify signature
    const isValid = handler.verifyResendSignature(body, signature, webhookSecret);

    if (!isValid) {
      console.error('[RESEND-WEBHOOK] Invalid signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Handle webhook event
    console.log(`[RESEND-WEBHOOK] Processing event: ${event.type} for ${event.data.email_id}`);
    
    const result = await handler.handleResendWebhook(event);

    if (!result.success) {
      console.error(`[RESEND-WEBHOOK] Failed to process event: ${result.error}`);
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    console.log(`[RESEND-WEBHOOK] Successfully processed ${event.type} event`);

    return NextResponse.json({
      success: true,
      eventType: result.eventType,
    });
  } catch (error) {
    console.error('[RESEND-WEBHOOK] Error processing webhook:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
