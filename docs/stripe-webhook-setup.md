# Stripe Webhook Setup Guide

This guide provides comprehensive instructions for setting up, testing, and configuring Stripe webhooks for the PikSend platform's Stripe Connect monetization features.

## Table of Contents

1. [Overview](#overview)
2. [Webhook Endpoints](#webhook-endpoints)
3. [Required Events](#required-events)
4. [Environment Variables](#environment-variables)
5. [Stripe Dashboard Configuration](#stripe-dashboard-configuration)
6. [Local Development with Stripe CLI](#local-development-with-stripe-cli)
7. [Testing Guide](#testing-guide)
8. [Production Configuration](#production-configuration)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Overview

PikSend uses two separate webhook endpoints to handle different types of Stripe events:

1. **Gallery Purchase Webhook** - Handles payment-related events for gallery purchases
2. **Connect Account Webhook** - Handles Stripe Connect account events for photographers

This separation allows for:
- Better security with dedicated webhook secrets
- Clearer event routing and handling
- Easier debugging and monitoring
- Independent scaling if needed

---

## Webhook Endpoints

### Gallery Purchase Webhook

**Endpoint:** `/api/stripe/webhook/gallery-purchase`

**Purpose:** Handles all events related to gallery purchases, payments, refunds, and disputes.

**Events Handled:**
- `checkout.session.completed` - When a client completes a gallery purchase
- `charge.refunded` - When a refund is processed
- `charge.dispute.created` - When a dispute/chargeback is initiated
- `charge.dispute.closed` - When a dispute is resolved

### Connect Account Webhook

**Endpoint:** `/api/stripe/connect/webhook`

**Purpose:** Handles all events related to photographer Stripe Connect accounts and payouts.

**Events Handled:**
- `account.updated` - When a Connect account status changes
- `payout.created` - When a payout is initiated
- `payout.paid` - When a payout is successfully deposited
- `payout.failed` - When a payout fails

---

## Required Events

### Gallery Purchase Events

| Event | Description | Action |
|-------|-------------|--------|
| `checkout.session.completed` | Client completes payment | Create purchase record, grant access, send confirmation emails |
| `charge.refunded` | Refund processed | Update purchase status, revoke access, notify photographer |
| `charge.dispute.created` | Dispute initiated | Create dispute record, send urgent alert to photographer |
| `charge.dispute.closed` | Dispute resolved | Update dispute status, adjust balance if lost |

### Connect Account Events

| Event | Description | Action |
|-------|-------------|--------|
| `account.updated` | Account status changed | Update account status in DB, notify if action required |
| `payout.created` | Payout initiated | Create payout record, notify photographer |
| `payout.paid` | Payout deposited | Update payout status, send confirmation |
| `payout.failed` | Payout failed | Update status, send alert with action steps |

---

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_... # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_... # or pk_live_... for production

# Webhook Secrets (obtained from Stripe Dashboard)
STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_...
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...

# For local development with Stripe CLI
# These are automatically provided when using `stripe listen`
# STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_... (from CLI output)
# STRIPE_WEBHOOK_SECRET_CONNECT=whsec_... (from CLI output)
```

### Environment Variable Descriptions

| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret API key |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE` | Webhook signing secret for gallery purchase endpoint |
| `STRIPE_WEBHOOK_SECRET_CONNECT` | Webhook signing secret for Connect account endpoint |

---

## Stripe Dashboard Configuration

### Step 1: Access Webhook Settings

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**

### Step 2: Configure Gallery Purchase Webhook

1. **Endpoint URL:** `https://your-domain.com/api/stripe/webhook/gallery-purchase`
2. **Description:** PikSend Gallery Purchase Events
3. **Listen to:** Events on your account
4. **Select events to listen to:**
   - Click **Select events**
   - Under **Checkout**, select:
     - `checkout.session.completed`
   - Under **Charge**, select:
     - `charge.refunded`
   - Under **Dispute**, select:
     - `charge.dispute.created`
     - `charge.dispute.closed`
5. Click **Add endpoint**
6. **Copy the Signing secret** and save it as `STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE`

### Step 3: Configure Connect Account Webhook

1. Click **Add endpoint** again
2. **Endpoint URL:** `https://your-domain.com/api/stripe/connect/webhook`
3. **Description:** PikSend Connect Account Events
4. **Listen to:** Events on Connected accounts
5. **Select events to listen to:**
   - Under **Account**, select:
     - `account.updated`
   - Under **Payout**, select:
     - `payout.created`
     - `payout.paid`
     - `payout.failed`
6. Click **Add endpoint**
7. **Copy the Signing secret** and save it as `STRIPE_WEBHOOK_SECRET_CONNECT`

### Step 4: Verify Webhook Configuration

After adding both endpoints, verify:
- Both endpoints show **Enabled** status
- The correct events are listed under each endpoint
- API version matches your application's Stripe SDK version

---

## Local Development with Stripe CLI

### Prerequisites

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Log in to your Stripe account:
   ```bash
   stripe login
   ```

### Starting the Webhook Listener

#### Option 1: Listen to All Events (Development)

```bash
# Forward all events to your local server
stripe listen --forward-to localhost:3000/api/stripe/webhook/gallery-purchase
```

#### Option 2: Listen to Specific Events (Recommended)

**Terminal 1 - Gallery Purchase Events:**
```bash
stripe listen \
  --events checkout.session.completed,charge.refunded,charge.dispute.created,charge.dispute.closed \
  --forward-to localhost:3000/api/stripe/webhook/gallery-purchase
```

**Terminal 2 - Connect Account Events:**
```bash
stripe listen \
  --events account.updated,payout.created,payout.paid,payout.failed \
  --forward-connect-to localhost:3000/api/stripe/connect/webhook
```

### Copying the Webhook Secret

When you run `stripe listen`, the CLI outputs a webhook signing secret:

```
Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy this secret and add it to your `.env` file:
- For gallery purchase events: `STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE`
- For connect events: `STRIPE_WEBHOOK_SECRET_CONNECT`

**Note:** The CLI generates a new secret each time you run `stripe listen`. Update your `.env` accordingly.

---

## Testing Guide

### Testing with Stripe CLI

#### Test Checkout Session Completed

```bash
# Trigger a checkout.session.completed event
stripe trigger checkout.session.completed
```

#### Test Charge Refunded

```bash
# Trigger a charge.refunded event
stripe trigger charge.refunded
```

#### Test Dispute Events

```bash
# Trigger dispute created
stripe trigger charge.dispute.created

# Trigger dispute closed
stripe trigger charge.dispute.closed
```

#### Test Account Updated

```bash
# Trigger account.updated event
stripe trigger account.updated
```

#### Test Payout Events

```bash
# Trigger payout events
stripe trigger payout.created
stripe trigger payout.paid
stripe trigger payout.failed
```

### Testing with Custom Payloads

For more realistic testing, create custom event payloads:

```bash
# Create a test checkout session and complete it
stripe checkout sessions create \
  --success-url="http://localhost:3000/success" \
  --cancel-url="http://localhost:3000/cancel" \
  --mode=payment \
  --line-items[0][price_data][currency]=usd \
  --line-items[0][price_data][product_data][name]="Gallery Access" \
  --line-items[0][price_data][unit_amount]=2500 \
  --line-items[0][quantity]=1
```

### Manual Testing Checklist

#### Gallery Purchase Flow

- [ ] Create a test gallery with monetization enabled
- [ ] Initiate checkout as a client
- [ ] Complete payment with test card `4242 4242 4242 4242`
- [ ] Verify `checkout.session.completed` webhook received
- [ ] Verify purchase record created in database
- [ ] Verify client has access to gallery
- [ ] Verify confirmation email sent

#### Refund Flow

- [ ] Process a refund from Stripe Dashboard
- [ ] Verify `charge.refunded` webhook received
- [ ] Verify purchase status updated to 'refunded'
- [ ] Verify client access revoked
- [ ] Verify photographer notified

#### Connect Account Flow

- [ ] Complete Stripe Connect onboarding
- [ ] Verify `account.updated` webhook received
- [ ] Verify account status updated in database
- [ ] Verify photographer can receive payments

#### Payout Flow

- [ ] Wait for automatic payout (or trigger manually in test mode)
- [ ] Verify `payout.created` webhook received
- [ ] Verify `payout.paid` webhook received
- [ ] Verify payout record created in database
- [ ] Verify photographer notified

### Test Cards

Use these test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 0069` | Expired card |
| `4000 0000 0000 0127` | Incorrect CVC |
| `4000 0025 0000 3155` | Requires 3D Secure |

---

## Production Configuration

### Pre-Deployment Checklist

- [ ] Switch to live Stripe API keys
- [ ] Configure production webhook endpoints in Stripe Dashboard
- [ ] Update environment variables with production webhook secrets
- [ ] Verify SSL certificate is valid (HTTPS required)
- [ ] Test webhook endpoints are accessible from internet
- [ ] Configure webhook retry settings

### Configuring Production Webhooks

1. **Switch to Live Mode** in Stripe Dashboard (toggle in top-right)
2. Navigate to **Developers** → **Webhooks**
3. Add both webhook endpoints with production URLs:
   - `https://piksend.com/api/stripe/webhook/gallery-purchase`
   - `https://piksend.com/api/stripe/connect/webhook`
4. Select the same events as staging
5. Copy the new signing secrets to production environment

### Webhook Retry Policy

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

After 7 failed attempts over ~3 days, Stripe stops retrying.

### Monitoring Webhooks

1. **Stripe Dashboard:** View webhook logs at **Developers** → **Webhooks** → Select endpoint → **Logs**
2. **Application Logs:** Check your application logs for webhook processing
3. **Database:** Query `webhook_events` table for event history

---

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failed

**Error:** `Webhook signature verification failed`

**Causes:**
- Wrong webhook secret in environment variables
- Request body modified before verification
- Clock skew between servers

**Solutions:**
```bash
# Verify you're using the correct secret
echo $STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE

# Ensure raw body is used for verification (not parsed JSON)
# In Next.js API routes, disable body parsing:
export const config = {
  api: {
    bodyParser: false,
  },
};
```

#### 2. Webhook Endpoint Returns 404

**Causes:**
- Incorrect endpoint URL
- API route not deployed
- Routing configuration issue

**Solutions:**
- Verify the endpoint URL matches your API route path
- Check deployment logs for errors
- Test endpoint accessibility with curl:
  ```bash
  curl -X POST https://your-domain.com/api/stripe/webhook/gallery-purchase
  ```

#### 3. Webhook Timeout (No Response)

**Causes:**
- Long-running synchronous operations
- Database connection issues
- External API calls blocking response

**Solutions:**
- Return 200 immediately, process asynchronously
- Use background jobs for heavy processing
- Implement proper error handling

#### 4. Duplicate Events

**Causes:**
- Stripe retrying due to non-200 response
- Multiple webhook endpoints configured

**Solutions:**
- Implement idempotency using event ID
- Check `webhook_events` table before processing
- Return 200 even for already-processed events

#### 5. Events Not Received

**Causes:**
- Webhook not enabled in Stripe Dashboard
- Wrong event types selected
- Firewall blocking Stripe IPs

**Solutions:**
- Verify webhook is enabled and events are selected
- Check Stripe Dashboard webhook logs for delivery attempts
- Whitelist Stripe IP addresses if using firewall

### Debugging Commands

```bash
# View recent webhook events in Stripe CLI
stripe events list --limit 10

# Resend a specific event
stripe events resend evt_xxxxxxxxxxxxx

# View webhook endpoint status
stripe webhook_endpoints list

# Test webhook endpoint connectivity
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  https://your-domain.com/api/stripe/webhook/gallery-purchase
```

### Checking Webhook Logs

```sql
-- Query recent webhook events
SELECT 
  id,
  event_type,
  status,
  error_message,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 20;

-- Find failed webhooks
SELECT *
FROM webhook_events
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Check specific event
SELECT *
FROM webhook_events
WHERE stripe_event_id = 'evt_xxxxxxxxxxxxx';
```

---

## Security Best Practices

### 1. Always Verify Webhook Signatures

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }
  
  // Process event...
}
```

### 2. Use HTTPS Only

- Never expose webhook endpoints over HTTP
- Ensure SSL certificate is valid and not expired
- Use TLS 1.2 or higher

### 3. Implement Idempotency

```typescript
// Check if event already processed
const existingEvent = await db.query(
  'SELECT id FROM webhook_events WHERE stripe_event_id = $1',
  [event.id]
);

if (existingEvent.rows.length > 0) {
  // Already processed, return success
  return new Response('OK', { status: 200 });
}

// Process and record event
await db.query(
  'INSERT INTO webhook_events (stripe_event_id, event_type, status) VALUES ($1, $2, $3)',
  [event.id, event.type, 'processing']
);
```

### 4. Return 200 Quickly

```typescript
// Return 200 immediately
const response = new Response('OK', { status: 200 });

// Process asynchronously (fire and forget)
processWebhookAsync(event).catch(console.error);

return response;
```

### 5. Log All Events

```typescript
// Log every webhook for debugging
console.log('Webhook received:', {
  id: event.id,
  type: event.type,
  created: new Date(event.created * 1000).toISOString(),
});
```

### 6. Protect Webhook Secrets

- Never commit webhook secrets to version control
- Use environment variables or secret management
- Rotate secrets periodically
- Use different secrets for staging and production

---

## Quick Reference

### Stripe CLI Commands

```bash
# Login
stripe login

# Listen to webhooks (gallery purchase)
stripe listen --forward-to localhost:3000/api/stripe/webhook/gallery-purchase

# Listen to Connect webhooks
stripe listen --forward-connect-to localhost:3000/api/stripe/connect/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger charge.refunded
stripe trigger account.updated
stripe trigger payout.paid

# View events
stripe events list --limit 10

# Resend event
stripe events resend evt_xxxxxxxxxxxxx
```

### Environment Variables Summary

```bash
# Required for webhooks
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_...
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...
```

### Webhook Endpoints Summary

| Endpoint | Events | Secret Variable |
|----------|--------|-----------------|
| `/api/stripe/webhook/gallery-purchase` | checkout.session.completed, charge.refunded, charge.dispute.created, charge.dispute.closed | `STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE` |
| `/api/stripe/connect/webhook` | account.updated, payout.created, payout.paid, payout.failed | `STRIPE_WEBHOOK_SECRET_CONNECT` |

---

## Additional Resources

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Connect Webhooks](https://stripe.com/docs/connect/webhooks)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
