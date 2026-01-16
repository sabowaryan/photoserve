# Photographer Payouts Database Schema

## Overview

The `photographer_payouts` table stores all payout records for photographers receiving payments via Stripe Connect. This is part of the Stripe Connect monetization feature that tracks when funds are transferred from Stripe to the photographer's bank account.

## Table: `photographer_payouts`

### Purpose

Records each payout transaction when Stripe transfers funds to a photographer's bank account. Tracks:
- Payout amounts and currency
- Stripe payout identifiers
- Payout status lifecycle (pending → in_transit → paid/failed)
- Arrival dates and bank account information
- Failure details when payouts fail

### Schema

```sql
photographer_payouts (
  -- Primary key
  id UUID PRIMARY KEY

  -- References
  photographer_id UUID NOT NULL → profiles(id)
  stripe_account_id VARCHAR(255) NOT NULL  -- Stripe Connect account ID

  -- Amount
  amount_cents INTEGER NOT NULL
  currency VARCHAR(3) DEFAULT 'usd'

  -- Stripe Payout
  stripe_payout_id VARCHAR(255) UNIQUE  -- Stripe payout ID (po_xxx)

  -- Status
  status VARCHAR(50) NOT NULL  -- 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled'
  failure_code VARCHAR(255)
  failure_message TEXT

  -- Dates
  arrival_date DATE  -- Expected arrival in bank account
  created_at TIMESTAMP DEFAULT NOW()
  paid_at TIMESTAMP
  failed_at TIMESTAMP

  -- Bank Account
  destination_bank_account_last4 VARCHAR(4)  -- Last 4 digits for display
)
```

### Status Values

| Status | Description |
|--------|-------------|
| `pending` | Payout has been created but not yet processed |
| `in_transit` | Payout is being transferred to the bank |
| `paid` | Payout has been deposited in the bank account |
| `failed` | Payout failed (see failure_code and failure_message) |
| `canceled` | Payout was canceled before completion |

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_photographer_payouts_photographer_id` | `photographer_id` | Photographer dashboard queries |
| `idx_photographer_payouts_status` | `status` | Status filtering |
| `idx_photographer_payouts_date` | `created_at DESC` | Date-based reporting |
| `idx_photographer_payouts_photographer_status` | `photographer_id, status, created_at DESC` | Payout history with status filter (composite) |
| `idx_photographer_payouts_stripe_account` | `stripe_account_id` | Webhook processing |
| `idx_photographer_payouts_arrival_date` | `arrival_date` (partial) | Upcoming payouts |

### Constraints

| Constraint | Description |
|------------|-------------|
| `unique_stripe_payout` | Stripe payout ID must be unique |
| `check_status` | Status must be one of: 'pending', 'in_transit', 'paid', 'failed', 'canceled' |
| `check_amount_positive` | Amount must be greater than 0 |
| `check_currency_format` | Currency must be 3 lowercase letters |

### Row Level Security (RLS) Policies

| Policy | Operation | Description |
|--------|-----------|-------------|
| Photographers can view their own payouts | SELECT | Photographers can see all their payout records |
| Service role has full access | ALL | For webhooks and admin operations |

### Triggers

| Trigger | Event | Description |
|---------|-------|-------------|
| `trigger_photographer_payouts_status_change` | BEFORE UPDATE | Auto-sets `paid_at` when status changes to 'paid', `failed_at` when status changes to 'failed' |

## Usage Examples

### Creating a Payout Record (via webhook)

```typescript
// After receiving payout.created webhook
const payout = await supabase
  .from('photographer_payouts')
  .insert({
    photographer_id: photographerId,
    stripe_account_id: stripeAccountId,
    stripe_payout_id: stripePayout.id,
    amount_cents: stripePayout.amount,
    currency: stripePayout.currency,
    status: stripePayout.status,
    arrival_date: new Date(stripePayout.arrival_date * 1000).toISOString().split('T')[0],
    destination_bank_account_last4: stripePayout.destination?.last4
  });
```

### Updating Payout Status (via webhook)

```typescript
// After receiving payout.paid webhook
await supabase
  .from('photographer_payouts')
  .update({
    status: 'paid'
    // paid_at is automatically set by trigger
  })
  .eq('stripe_payout_id', stripePayoutId);

// After receiving payout.failed webhook
await supabase
  .from('photographer_payouts')
  .update({
    status: 'failed',
    failure_code: stripePayout.failure_code,
    failure_message: stripePayout.failure_message
    // failed_at is automatically set by trigger
  })
  .eq('stripe_payout_id', stripePayoutId);
```

### Getting Photographer Payout History

```typescript
// Get all payouts for a photographer
const { data: payouts } = await supabase
  .from('photographer_payouts')
  .select('*')
  .eq('photographer_id', photographerId)
  .order('created_at', { ascending: false });
```

### Getting Payouts by Status

```typescript
// Get pending payouts
const { data: pendingPayouts } = await supabase
  .from('photographer_payouts')
  .select('*')
  .eq('photographer_id', photographerId)
  .in('status', ['pending', 'in_transit'])
  .order('arrival_date', { ascending: true });
```

### Getting Total Paid Out

```typescript
// Calculate total amount paid to photographer
const { data: paidPayouts } = await supabase
  .from('photographer_payouts')
  .select('amount_cents')
  .eq('photographer_id', photographerId)
  .eq('status', 'paid');

const totalPaid = paidPayouts?.reduce((sum, p) => sum + p.amount_cents, 0) || 0;
```

### Getting Upcoming Payouts

```typescript
// Get payouts arriving in the next 7 days
const today = new Date();
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

const { data: upcomingPayouts } = await supabase
  .from('photographer_payouts')
  .select('*')
  .eq('photographer_id', photographerId)
  .in('status', ['pending', 'in_transit'])
  .gte('arrival_date', today.toISOString().split('T')[0])
  .lte('arrival_date', nextWeek.toISOString().split('T')[0])
  .order('arrival_date', { ascending: true });
```

## Related Tables

- `profiles` - The photographer receiving the payout
- `stripe_connect_accounts` - Photographer's Stripe Connect account configuration
- `gallery_purchases` - Sales that contribute to the payout balance
- `webhook_events` - Webhook events that create/update payout records

## Webhook Events

The following Stripe webhook events affect this table:

| Event | Action |
|-------|--------|
| `payout.created` | Creates new payout record with status 'pending' |
| `payout.updated` | Updates payout status and details |
| `payout.paid` | Updates status to 'paid', sets paid_at |
| `payout.failed` | Updates status to 'failed', sets failure details |
| `payout.canceled` | Updates status to 'canceled' |

## Migration File

- `20260116120100_create_photographer_payouts.sql`

## Notes

1. **Automatic Payouts**: Stripe Connect handles automatic payouts based on the photographer's payout schedule (daily, weekly, monthly). PikSend tracks these via webhooks.

2. **Amount Precision**: All monetary values are stored in cents (integers) to avoid floating-point precision issues.

3. **Bank Account Privacy**: Only the last 4 digits of the bank account are stored for display purposes. Full bank details are managed by Stripe.

4. **Failure Handling**: When a payout fails, the `failure_code` and `failure_message` fields contain details from Stripe. Common failure codes include:
   - `account_closed` - Bank account was closed
   - `account_frozen` - Bank account is frozen
   - `bank_account_restricted` - Bank account has restrictions
   - `insufficient_funds` - Insufficient funds in Stripe balance

5. **Arrival Date**: The `arrival_date` is an estimate provided by Stripe. Actual arrival may vary by 1-2 business days depending on the bank.

6. **Status Timestamps**: The `paid_at` and `failed_at` timestamps are automatically set by a database trigger when the status changes.
