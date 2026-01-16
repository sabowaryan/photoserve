# Webhook Documentation

This document provides comprehensive documentation for Stripe webhook handling in the PikSend monetization system.

## Table of Contents

1. [Overview](#overview)
2. [Webhook Endpoints](#webhook-endpoints)
3. [Event Types](#event-types)
4. [Event Processing](#event-processing)
5. [Idempotency](#idempotency)
6. [Error Handling & Retries](#error-handling--retries)
7. [Security](#security)
8. [Testing](#testing)

---

## Overview

PikSend uses two separate webhook endpoints to handle different types of Stripe events:

1. **Gallery Purchase Webhook** (`/api/stripe/webhook/gallery-purchase`)
   - Handles payment-related events for gallery purchases
   - Events: checkout completion, refunds, disputes

2. **Connect Account Webhook** (`/api/stripe/connect/webhook`)
   - Handles Stripe Connect account events for photographers
   - Events: account updates, payouts

### Architecture

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│                 │     │           PikSend Server             │
│     Stripe      │────▶│  ┌────────────────────────────────┐  │
│                 │     │  │    Webhook Rate Limiter        │  │
└─────────────────┘     │  └────────────────────────────────┘  │
                        │                 │                     │
                        │                 ▼                     │
                        │  ┌────────────────────────────────┐  │
                        │  │   Signature Verification       │  │
                        │  └────────────────────────────────┘  │
                        │                 │                     │
                        │                 ▼                     │
                        │  ┌────────────────────────────────┐  │
                        │  │   Idempotency Check            │  │
                        │  │   (webhook_events table)       │  │
                        │  └────────────────────────────────┘  │
                        │                 │                     │
                        │                 ▼                     │
                        │  ┌────────────────────────────────┐  │
                        │  │   Webhook Service              │  │
                        │  │   (Event Processing)           │  │
                        │  └────────────────────────────────┘  │
                        │                 │                     │
                        │                 ▼                     │
                        │  ┌────────────────────────────────┐  │
                        │  │   Domain Services              │  │
                        │  │   - GalleryPurchaseService     │  │
                        │  │   - StripeConnectService       │  │
                        │  │   - NotificationService        │  │
                        │  └────────────────────────────────┘  │
                        └──────────────────────────────────────┘
```

---

## Webhook Endpoints

### Gallery Purchase Webhook

**Endpoint:** `POST /api/stripe/webhook/gallery-purchase`

**Purpose:** Handles all events related to gallery purchases, payments, refunds, and disputes.

**Environment Variable:** `STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE`

**Events Handled:**
- `checkout.session.completed`
- `charge.refunded`
- `charge.dispute.created`
- `charge.dispute.closed`

### Connect Account Webhook

**Endpoint:** `POST /api/stripe/connect/webhook`

**Purpose:** Handles all events related to photographer Stripe Connect accounts and payouts.

**Environment Variable:** `STRIPE_WEBHOOK_SECRET_CONNECT`

**Events Handled:**
- `account.updated`
- `payout.created`
- `payout.paid`
- `payout.failed`

---

## Event Types

### checkout.session.completed

Triggered when a customer completes a gallery purchase checkout.

**Actions:**
1. Record purchase in `gallery_purchases` table
2. Grant access to the buyer
3. Update gallery monetization stats
4. Send in-app notification to photographer
5. Invalidate access cache

**Metadata Expected:**
```json
{
  "type": "gallery_purchase",
  "gallery_id": "uuid",
  "buyer_email": "buyer@example.com",
  "photographer_id": "uuid",
  "buyer_session_id": "optional-session-id"
}
```

**Example Payload:**
```json
{
  "id": "evt_xxx",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_xxx",
      "payment_intent": "pi_xxx",
      "customer_email": "buyer@example.com",
      "amount_total": 2999,
      "currency": "usd",
      "metadata": {
        "type": "gallery_purchase",
        "gallery_id": "uuid",
        "photographer_id": "uuid"
      }
    }
  }
}
```

---

### charge.refunded

Triggered when a refund is processed for a gallery purchase.

**Actions:**
1. Update purchase status to `refunded`
2. Revoke buyer access
3. Send in-app notification to photographer
4. Invalidate access cache

**Example Payload:**
```json
{
  "id": "evt_xxx",
  "type": "charge.refunded",
  "data": {
    "object": {
      "id": "ch_xxx",
      "amount": 2999,
      "amount_refunded": 2999,
      "refunded": true
    }
  }
}
```

---

### charge.dispute.created

Triggered when a customer initiates a dispute/chargeback.

**Actions:**
1. Update purchase status to `disputed`
2. Send urgent in-app notification to photographer
3. Log dispute details

**Example Payload:**
```json
{
  "id": "evt_xxx",
  "type": "charge.dispute.created",
  "data": {
    "object": {
      "id": "dp_xxx",
      "charge": "ch_xxx",
      "amount": 2999,
      "reason": "fraudulent",
      "status": "needs_response",
      "evidence_details": {
        "due_by": 1705708800
      }
    }
  }
}
```

---

### charge.dispute.closed

Triggered when a dispute is resolved (won or lost).

**Actions:**
1. Update purchase status based on outcome:
   - Won: Status returns to `succeeded`
   - Lost: Status set to `refunded`, access revoked
2. Send notification to photographer

---

### account.updated

Triggered when a Connect account's status changes.

**Actions:**
1. Update account status in `stripe_connect_accounts` table
2. Update `charges_enabled`, `payouts_enabled`, `details_submitted`
3. Update requirements arrays

**Example Payload:**
```json
{
  "id": "evt_xxx",
  "type": "account.updated",
  "account": "acct_xxx",
  "data": {
    "object": {
      "id": "acct_xxx",
      "charges_enabled": true,
      "payouts_enabled": true,
      "details_submitted": true,
      "requirements": {
        "currently_due": [],
        "eventually_due": [],
        "past_due": []
      }
    }
  }
}
```

---

### payout.created

Triggered when a payout is initiated.

**Actions:**
1. Create payout record in `photographer_payouts` table
2. Send in-app notification to photographer

---

### payout.paid

Triggered when a payout is successfully deposited.

**Actions:**
1. Update payout status to `paid`
2. Set `paid_at` timestamp
3. Send confirmation notification to photographer

---

### payout.failed

Triggered when a payout fails.

**Actions:**
1. Update payout status to `failed`
2. Set `failed_at` timestamp
3. Store failure code and message
4. Send alert notification to photographer

---

## Event Processing

### Processing Flow

```typescript
async processWebhook(event: Stripe.Event): Promise<WebhookProcessingResult> {
  // 1. Check idempotency
  const existing = await this.getWebhookEvent(event.id);
  if (existing?.status === 'completed') {
    return { success: true, status: 'skipped' };
  }

  // 2. Log event
  const eventId = await this.logWebhookEvent(event);

  // 3. Update status to processing
  await this.updateWebhookStatus(eventId, 'processing');

  // 4. Handle event
  try {
    await this.handleEvent(event);
    await this.updateWebhookStatus(eventId, 'completed');
    return { success: true, status: 'completed' };
  } catch (error) {
    await this.updateWebhookStatus(eventId, 'failed', error.message);
    return { success: false, status: 'failed' };
  }
}
```

### Response Codes

| Status | Meaning | Stripe Behavior |
|--------|---------|-----------------|
| 200 | Success | No retry |
| 400 | Bad request (invalid signature) | No retry |
| 429 | Rate limited | Retry with backoff |
| 500 | Server error | Retry with backoff |

**Important:** Always return 200 for successfully received events, even if processing fails. This prevents unnecessary retries. Failed events are logged and can be retried manually.

---

## Idempotency

### Webhook Events Table

All webhook events are stored in the `webhook_events` table for idempotency and debugging:

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  api_version TEXT,
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'skipped'
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Idempotency Check

Before processing any event:

1. Check if `stripe_event_id` exists in `webhook_events`
2. If exists and `status = 'completed'`, return success without processing
3. If exists and `status = 'failed'`, check retry count before reprocessing
4. If not exists, create new record and process

---

## Error Handling & Retries

### Automatic Retries by Stripe

Stripe automatically retries failed webhooks with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 5 minutes |
| 3 | 30 minutes |
| 4 | 2 hours |
| 5 | 5 hours |
| 6 | 10 hours |
| 7 | 24 hours |

After 7 failed attempts (~3 days), Stripe stops retrying.

### Manual Retry

Failed webhooks can be retried manually:

```typescript
const webhookService = createWebhookService(supabase);
const result = await webhookService.retryFailedWebhook(eventId);
```

### Maximum Retry Attempts

The system limits manual retries to 3 attempts per event:

```typescript
const MAX_RETRY_ATTEMPTS = 3;

if (existing.retry_count >= MAX_RETRY_ATTEMPTS) {
  return { success: false, message: 'Max retry attempts exceeded' };
}
```

### Error Logging

All errors are logged with context:

```typescript
console.error('[WebhookService] Event processing failed:', {
  eventId: event.id,
  eventType: event.type,
  error: error.message,
});
```

---

## Security

### Signature Verification

All webhooks must be verified using Stripe's signature:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response('Invalid signature', { status: 400 });
  }

  // Process event...
}
```

### Rate Limiting

Webhook endpoints are protected by rate limiting:

```typescript
const rateLimitResult = checkWebhookRateLimit(clientIp);

if (!rateLimitResult.allowed) {
  return new Response('Too many requests', {
    status: 429,
    headers: {
      'Retry-After': String(rateLimitResult.retryAfterSeconds),
    },
  });
}
```

**Limits:**
- 1000 requests per minute per IP
- Configurable via environment variables

### IP Whitelisting (Optional)

For additional security, you can whitelist Stripe's IP addresses:

```
Stripe Webhook IPs:
- 3.18.12.63
- 3.130.192.231
- 13.235.14.237
- 13.235.122.149
- 18.211.135.69
- 35.154.171.200
- 52.15.183.38
- 54.88.130.119
- 54.88.130.237
- 54.187.174.169
- 54.187.205.235
- 54.187.216.72
```

---

## Testing

### Using Stripe CLI

#### Install and Login

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login
```

#### Forward Webhooks to Local Server

```bash
# Gallery purchase events
stripe listen \
  --events checkout.session.completed,charge.refunded,charge.dispute.created,charge.dispute.closed \
  --forward-to localhost:3000/api/stripe/webhook/gallery-purchase

# Connect events
stripe listen \
  --events account.updated,payout.created,payout.paid,payout.failed \
  --forward-connect-to localhost:3000/api/stripe/connect/webhook
```

#### Trigger Test Events

```bash
# Checkout completed
stripe trigger checkout.session.completed

# Refund
stripe trigger charge.refunded

# Dispute
stripe trigger charge.dispute.created

# Account updated
stripe trigger account.updated

# Payout events
stripe trigger payout.created
stripe trigger payout.paid
stripe trigger payout.failed
```

### Test Cards

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0259` | Dispute (fraudulent) |

### Querying Webhook Events

```sql
-- Recent events
SELECT id, event_type, status, created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 20;

-- Failed events
SELECT *
FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Events by type
SELECT event_type, COUNT(*), 
       SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM webhook_events
GROUP BY event_type;
```

---

## Configuration Checklist

### Development

- [ ] Install Stripe CLI
- [ ] Run `stripe login`
- [ ] Start webhook listener with `stripe listen`
- [ ] Copy webhook secret to `.env`
- [ ] Test with `stripe trigger` commands

### Staging

- [ ] Create webhook endpoints in Stripe Dashboard (test mode)
- [ ] Configure correct event types
- [ ] Copy webhook secrets to environment
- [ ] Test full purchase flow

### Production

- [ ] Switch to live mode in Stripe Dashboard
- [ ] Create production webhook endpoints
- [ ] Configure correct event types
- [ ] Copy production webhook secrets
- [ ] Verify SSL certificate
- [ ] Test with small real transaction
- [ ] Monitor webhook logs

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Signature verification failed | Wrong webhook secret | Verify environment variable |
| Events not received | Wrong endpoint URL | Check Stripe Dashboard config |
| Duplicate processing | Missing idempotency check | Verify webhook_events table |
| Timeout errors | Long processing time | Return 200 immediately, process async |

### Debug Queries

```sql
-- Find specific event
SELECT * FROM webhook_events
WHERE stripe_event_id = 'evt_xxx';

-- Events with errors
SELECT id, event_type, error_message, created_at
FROM webhook_events
WHERE error_message IS NOT NULL
ORDER BY created_at DESC;

-- Processing time analysis
SELECT event_type,
       AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) as avg_processing_seconds
FROM webhook_events
WHERE status = 'completed'
GROUP BY event_type;
```

---

## Related Documentation

- [Stripe Connect API Documentation](./stripe-connect-api.md)
- [Stripe Webhook Setup Guide](../stripe-webhook-setup.md)
- [Database Schema Documentation](../development/database-schema.md)
