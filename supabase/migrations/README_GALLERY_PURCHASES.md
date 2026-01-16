# Gallery Purchases Database Schema

## Overview

The `gallery_purchases` table stores all purchase transactions for gallery access in the PikSend platform. This is part of the Stripe Connect monetization feature that allows photographers to sell access to their galleries.

## Table: `gallery_purchases`

### Purpose

Records each purchase transaction when a buyer pays to access a photographer's gallery. Tracks:
- Buyer information (email, name, session ID for guests)
- Payment details (Stripe IDs, amounts, fees)
- Access status and expiration
- Purchase lifecycle (succeeded, refunded, disputed)

### Schema

```sql
gallery_purchases (
  -- Primary key
  id UUID PRIMARY KEY

  -- References
  gallery_id UUID NOT NULL → galleries(id)
  photographer_id UUID NOT NULL → profiles(id)

  -- Buyer info
  buyer_email VARCHAR(255) NOT NULL
  buyer_name VARCHAR(255)
  buyer_session_id VARCHAR(255)  -- For guest purchases

  -- Stripe payment info
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL
  stripe_charge_id VARCHAR(255)
  stripe_customer_id VARCHAR(255)

  -- Amounts (in cents)
  amount_cents INTEGER NOT NULL
  currency VARCHAR(3) DEFAULT 'usd'
  platform_fee_cents INTEGER NOT NULL
  photographer_earnings_cents INTEGER NOT NULL

  -- Status
  status VARCHAR(50) NOT NULL  -- 'succeeded' | 'refunded' | 'disputed' | 'failed'
  refund_reason TEXT

  -- Access
  access_granted_at TIMESTAMP
  access_expires_at TIMESTAMP  -- NULL = unlimited

  -- Timestamps
  purchased_at TIMESTAMP DEFAULT NOW()
  refunded_at TIMESTAMP
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

### Indexes

| Index Name | Columns | Purpose |
|------------|---------|---------|
| `idx_gallery_purchases_gallery_id` | `gallery_id` | Gallery owner viewing purchases |
| `idx_gallery_purchases_photographer_id` | `photographer_id` | Photographer dashboard queries |
| `idx_gallery_purchases_buyer_email` | `buyer_email` | Buyer purchase lookup |
| `idx_gallery_purchases_buyer_session` | `buyer_session_id` | Guest purchase verification |
| `idx_gallery_purchases_status` | `status` | Status filtering |
| `idx_gallery_purchases_date` | `purchased_at DESC` | Date-based reporting |
| `idx_gallery_purchases_access_check` | `gallery_id, buyer_email, status` | Access verification (composite) |
| `idx_gallery_purchases_photographer_revenue` | `photographer_id, status, purchased_at` | Revenue queries (composite) |

### Constraints

| Constraint | Description |
|------------|-------------|
| `check_status` | Status must be one of: 'succeeded', 'refunded', 'disputed', 'failed' |
| `check_amount_positive` | Amount must be greater than 0 |
| `check_platform_fee_non_negative` | Platform fee must be >= 0 |
| `check_photographer_earnings_non_negative` | Earnings must be >= 0 |
| `check_earnings_calculation` | Earnings = amount - platform_fee |
| `check_currency_format` | Currency must be 3 lowercase letters |

### Row Level Security (RLS) Policies

| Policy | Operation | Description |
|--------|-----------|-------------|
| Gallery owners can view purchases | SELECT | Photographers can see all purchases for their galleries |
| Buyers can view their own purchases | SELECT | Authenticated buyers can see purchases matching their email |
| Service role has full access | ALL | For webhooks and admin operations |

## Usage Examples

### Creating a Purchase Record (via webhook)

```typescript
// After successful Stripe checkout
const purchase = await supabase
  .from('gallery_purchases')
  .insert({
    gallery_id: galleryId,
    photographer_id: photographerId,
    buyer_email: session.customer_email,
    buyer_name: session.customer_details?.name,
    buyer_session_id: session.client_reference_id,
    stripe_payment_intent_id: session.payment_intent,
    stripe_charge_id: chargeId,
    stripe_customer_id: session.customer,
    amount_cents: session.amount_total,
    currency: session.currency,
    platform_fee_cents: platformFee,
    photographer_earnings_cents: session.amount_total - platformFee,
    status: 'succeeded',
    access_granted_at: new Date().toISOString(),
    access_expires_at: accessDuration ? calculateExpiry(accessDuration) : null
  });
```

### Verifying Purchase Access

```typescript
// Check if buyer has access to gallery
const { data: purchase } = await supabase
  .from('gallery_purchases')
  .select('id, access_granted_at, access_expires_at')
  .eq('gallery_id', galleryId)
  .eq('buyer_email', buyerEmail)
  .eq('status', 'succeeded')
  .single();

const hasAccess = purchase && 
  purchase.access_granted_at && 
  (!purchase.access_expires_at || new Date(purchase.access_expires_at) > new Date());
```

### Getting Photographer Revenue

```typescript
// Get total revenue for photographer
const { data: revenue } = await supabase
  .from('gallery_purchases')
  .select('photographer_earnings_cents')
  .eq('photographer_id', photographerId)
  .eq('status', 'succeeded');

const totalRevenue = revenue?.reduce((sum, p) => sum + p.photographer_earnings_cents, 0) || 0;
```

### Processing a Refund

```typescript
// Update purchase status to refunded
await supabase
  .from('gallery_purchases')
  .update({
    status: 'refunded',
    refund_reason: 'Customer requested refund',
    refunded_at: new Date().toISOString()
  })
  .eq('id', purchaseId);
```

## Related Tables

- `galleries` - The gallery being purchased
- `profiles` - The photographer (gallery owner)
- `gallery_monetization` - Paywall configuration for the gallery
- `stripe_connect_accounts` - Photographer's Stripe Connect account

## Migration File

- `20260115120300_create_gallery_purchases.sql`

## Notes

1. **Denormalized photographer_id**: While `photographer_id` could be derived from `gallery_id`, it's stored directly for query performance in revenue dashboards.

2. **Guest Purchases**: Buyers don't need to be authenticated. Access is verified via `buyer_email` or `buyer_session_id`.

3. **Amount Precision**: All monetary values are stored in cents (integers) to avoid floating-point precision issues.

4. **Access Expiration**: `access_expires_at = NULL` means unlimited access. This is the default behavior.

5. **Earnings Calculation**: The constraint ensures `photographer_earnings_cents = amount_cents - platform_fee_cents` is always true.
