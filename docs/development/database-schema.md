# Database Schema Documentation

This document provides comprehensive documentation for the database schema used in the PikSend Stripe Connect monetization system.

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Tables](#tables)
4. [Indexes](#indexes)
5. [Row Level Security (RLS)](#row-level-security-rls)
6. [Triggers](#triggers)
7. [Migration Files](#migration-files)

---

## Overview

The monetization system uses PostgreSQL (via Supabase) with the following tables:

| Table | Purpose |
|-------|---------|
| `stripe_connect_accounts` | Stripe Connect account information for photographers |
| `gallery_monetization` | Paywall configuration for galleries |
| `gallery_purchases` | Purchase records for gallery access |
| `webhook_events` | Stripe webhook event log for idempotency |
| `photographer_payouts` | Payout records from Stripe to photographers |
| `in_app_notifications` | In-app notifications for users |

---

## Entity Relationship Diagram

```
┌─────────────────────┐       ┌─────────────────────┐
│      profiles       │       │      galleries      │
│  (existing table)   │       │  (existing table)   │
└─────────────────────┘       └─────────────────────┘
         │                              │
         │ 1:1                          │ 1:1
         ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│ stripe_connect_     │       │ gallery_            │
│ accounts            │       │ monetization        │
└─────────────────────┘       └─────────────────────┘
         │                              │
         │ 1:N                          │ 1:N
         ▼                              ▼
┌─────────────────────┐       ┌─────────────────────┐
│ photographer_       │◄──────│ gallery_purchases   │
│ payouts             │       │                     │
└─────────────────────┘       └─────────────────────┘
                                        │
                                        │ triggers
                                        ▼
                              ┌─────────────────────┐
                              │ in_app_             │
                              │ notifications       │
                              └─────────────────────┘

┌─────────────────────┐
│ webhook_events      │  (standalone - for idempotency)
└─────────────────────┘
```

---

## Tables

### stripe_connect_accounts

Stores Stripe Connect account information for photographers.

```sql
CREATE TABLE stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'express' | 'standard'
  
  -- Status
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  
  -- Requirements
  currently_due TEXT[],
  eventually_due TEXT[],
  past_due TEXT[],
  disabled_reason VARCHAR(255),
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_link TEXT,
  onboarding_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_connect UNIQUE(user_id),
  CONSTRAINT unique_stripe_account UNIQUE(stripe_account_id)
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to photographer's profile |
| `stripe_account_id` | VARCHAR(255) | Stripe Connect account ID (acct_xxx) |
| `account_type` | VARCHAR(50) | Account type: 'express' or 'standard' |
| `charges_enabled` | BOOLEAN | Whether account can accept charges |
| `payouts_enabled` | BOOLEAN | Whether account can receive payouts |
| `details_submitted` | BOOLEAN | Whether onboarding details are submitted |
| `currently_due` | TEXT[] | Fields currently required for verification |
| `eventually_due` | TEXT[] | Fields that will be required in the future |
| `past_due` | TEXT[] | Fields that are past due |
| `disabled_reason` | VARCHAR(255) | Reason if account is disabled |
| `onboarding_completed` | BOOLEAN | Whether onboarding is complete |
| `onboarding_link` | TEXT | Current onboarding URL |
| `onboarding_expires_at` | TIMESTAMPTZ | When onboarding link expires |

---

### gallery_monetization

Stores monetization/paywall configuration for galleries.

```sql
CREATE TABLE gallery_monetization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Preview Mode
  preview_mode VARCHAR(20) DEFAULT 'full_paywall',
  watermark_enabled BOOLEAN DEFAULT true,
  
  -- Access Duration
  access_duration_days INTEGER,
  
  -- Stripe
  stripe_price_id VARCHAR(255),
  
  -- Platform Fee
  platform_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_gallery_monetization UNIQUE(gallery_id),
  CONSTRAINT check_price_range CHECK (price_cents >= 500 AND price_cents <= 50000),
  CONSTRAINT check_fee_range CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
  CONSTRAINT check_preview_mode CHECK (preview_mode IN ('full_paywall', 'freemium'))
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `gallery_id` | UUID | Reference to gallery |
| `is_enabled` | BOOLEAN | Whether paywall is active |
| `price_cents` | INTEGER | Price in cents (500-50000) |
| `currency` | VARCHAR(3) | Currency code (usd, eur, cad) |
| `preview_mode` | VARCHAR(20) | 'full_paywall' or 'freemium' |
| `watermark_enabled` | BOOLEAN | Show watermark in freemium mode |
| `access_duration_days` | INTEGER | Days until access expires (NULL = unlimited) |
| `stripe_price_id` | VARCHAR(255) | Stripe Price ID (price_xxx) |
| `platform_fee_percent` | DECIMAL(5,2) | Platform fee percentage |
| `total_sales` | INTEGER | Total number of purchases |
| `total_revenue_cents` | INTEGER | Total revenue in cents |
| `conversion_rate` | DECIMAL(5,2) | Conversion rate percentage |

---

### gallery_purchases

Stores purchase records for gallery access.

```sql
CREATE TABLE gallery_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Buyer Information
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_session_id VARCHAR(255),
  
  -- Stripe Payment
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Amounts (in cents)
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  photographer_earnings_cents INTEGER NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL,
  refund_reason TEXT,
  
  -- Access Control
  access_granted_at TIMESTAMP WITH TIME ZONE,
  access_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('succeeded', 'refunded', 'disputed', 'failed')),
  CONSTRAINT check_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT check_platform_fee_non_negative CHECK (platform_fee_cents >= 0),
  CONSTRAINT check_photographer_earnings_non_negative CHECK (photographer_earnings_cents >= 0),
  CONSTRAINT check_earnings_calculation CHECK (
    photographer_earnings_cents = amount_cents - platform_fee_cents
  )
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `gallery_id` | UUID | Reference to purchased gallery |
| `photographer_id` | UUID | Reference to gallery owner |
| `buyer_email` | VARCHAR(255) | Buyer's email address |
| `buyer_name` | VARCHAR(255) | Buyer's name (optional) |
| `buyer_session_id` | VARCHAR(255) | Session ID for guest purchases |
| `stripe_payment_intent_id` | VARCHAR(255) | Stripe PaymentIntent ID |
| `stripe_charge_id` | VARCHAR(255) | Stripe Charge ID |
| `stripe_customer_id` | VARCHAR(255) | Stripe Customer ID |
| `amount_cents` | INTEGER | Total purchase amount in cents |
| `currency` | VARCHAR(3) | Currency code |
| `platform_fee_cents` | INTEGER | Platform fee in cents |
| `photographer_earnings_cents` | INTEGER | Photographer earnings in cents |
| `status` | VARCHAR(50) | succeeded, refunded, disputed, failed |
| `refund_reason` | TEXT | Reason for refund |
| `access_granted_at` | TIMESTAMPTZ | When access was granted |
| `access_expires_at` | TIMESTAMPTZ | When access expires |
| `purchased_at` | TIMESTAMPTZ | Purchase timestamp |
| `refunded_at` | TIMESTAMPTZ | Refund timestamp |

---

### webhook_events

Stores Stripe webhook events for idempotency and debugging.

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Event
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  api_version TEXT,
  
  -- Processing Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Event Data
  payload JSONB NOT NULL,
  
  -- Processing Metadata
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped'))
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `stripe_event_id` | TEXT | Stripe event ID (evt_xxx) |
| `event_type` | TEXT | Event type (e.g., checkout.session.completed) |
| `api_version` | TEXT | Stripe API version |
| `status` | TEXT | Processing status |
| `payload` | JSONB | Full event payload |
| `processed_at` | TIMESTAMPTZ | When event was processed |
| `error_message` | TEXT | Error message if failed |
| `retry_count` | INTEGER | Number of retry attempts |
| `last_retry_at` | TIMESTAMPTZ | Last retry timestamp |

---

### photographer_payouts

Stores payout records for photographers.

```sql
CREATE TABLE photographer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL,
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Stripe Payout
  stripe_payout_id VARCHAR(255) UNIQUE,
  
  -- Status
  status VARCHAR(50) NOT NULL,
  failure_code VARCHAR(255),
  failure_message TEXT,
  
  -- Dates
  arrival_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Bank Account
  destination_bank_account_last4 VARCHAR(4),
  
  -- Constraints
  CONSTRAINT check_status CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  CONSTRAINT check_amount_positive CHECK (amount_cents > 0)
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `photographer_id` | UUID | Reference to photographer |
| `stripe_account_id` | VARCHAR(255) | Stripe Connect account ID |
| `amount_cents` | INTEGER | Payout amount in cents |
| `currency` | VARCHAR(3) | Currency code |
| `stripe_payout_id` | VARCHAR(255) | Stripe payout ID (po_xxx) |
| `status` | VARCHAR(50) | pending, in_transit, paid, failed, canceled |
| `failure_code` | VARCHAR(255) | Stripe failure code |
| `failure_message` | TEXT | Failure message |
| `arrival_date` | DATE | Expected arrival date |
| `paid_at` | TIMESTAMPTZ | When payout was deposited |
| `failed_at` | TIMESTAMPTZ | When payout failed |
| `destination_bank_account_last4` | VARCHAR(4) | Last 4 digits of bank account |

---

### in_app_notifications

Stores in-app notifications for users.

```sql
CREATE TABLE in_app_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Type
  type VARCHAR(50) NOT NULL,
  
  -- Content
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Entity
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Column Descriptions:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Reference to user |
| `type` | VARCHAR(50) | sale, payout, dispute, refund, account_update |
| `title` | VARCHAR(255) | Notification title |
| `message` | TEXT | Notification message |
| `related_entity_type` | VARCHAR(50) | gallery, purchase, payout, dispute |
| `related_entity_id` | UUID | ID of related entity |
| `metadata` | JSONB | Additional context data |
| `is_read` | BOOLEAN | Whether notification is read |
| `read_at` | TIMESTAMPTZ | When notification was read |

---

## Indexes

### stripe_connect_accounts

```sql
CREATE INDEX idx_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX idx_connect_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX idx_connect_accounts_status ON stripe_connect_accounts(charges_enabled, payouts_enabled);
```

### gallery_monetization

```sql
CREATE INDEX idx_gallery_monetization_gallery_id ON gallery_monetization(gallery_id);
CREATE INDEX idx_gallery_monetization_enabled ON gallery_monetization(is_enabled);
CREATE INDEX idx_gallery_monetization_enabled_gallery ON gallery_monetization(is_enabled, gallery_id) 
  WHERE is_enabled = true;
```

### gallery_purchases

```sql
CREATE INDEX idx_gallery_purchases_gallery_id ON gallery_purchases(gallery_id);
CREATE INDEX idx_gallery_purchases_photographer_id ON gallery_purchases(photographer_id);
CREATE INDEX idx_gallery_purchases_buyer_email ON gallery_purchases(buyer_email);
CREATE INDEX idx_gallery_purchases_buyer_session ON gallery_purchases(buyer_session_id)
  WHERE buyer_session_id IS NOT NULL;
CREATE INDEX idx_gallery_purchases_status ON gallery_purchases(status);
CREATE INDEX idx_gallery_purchases_date ON gallery_purchases(purchased_at DESC);
CREATE INDEX idx_gallery_purchases_access_check ON gallery_purchases(gallery_id, buyer_email, status)
  WHERE status = 'succeeded';
CREATE INDEX idx_gallery_purchases_photographer_revenue ON gallery_purchases(photographer_id, status, purchased_at DESC)
  WHERE status = 'succeeded';
```

### webhook_events

```sql
CREATE INDEX idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at DESC);
CREATE INDEX idx_webhook_events_status_retry ON webhook_events(status, retry_count) 
  WHERE status = 'failed';
```

### photographer_payouts

```sql
CREATE INDEX idx_photographer_payouts_photographer_id ON photographer_payouts(photographer_id);
CREATE INDEX idx_photographer_payouts_status ON photographer_payouts(status);
CREATE INDEX idx_photographer_payouts_date ON photographer_payouts(created_at DESC);
CREATE INDEX idx_photographer_payouts_photographer_status ON photographer_payouts(photographer_id, status, created_at DESC);
CREATE INDEX idx_photographer_payouts_stripe_account ON photographer_payouts(stripe_account_id);
CREATE INDEX idx_photographer_payouts_arrival_date ON photographer_payouts(arrival_date)
  WHERE arrival_date IS NOT NULL;
```

### in_app_notifications

```sql
CREATE INDEX idx_in_app_notifications_user_id ON in_app_notifications(user_id);
CREATE INDEX idx_in_app_notifications_user_unread ON in_app_notifications(user_id, is_read) 
  WHERE is_read = false;
CREATE INDEX idx_in_app_notifications_type ON in_app_notifications(type);
CREATE INDEX idx_in_app_notifications_created_at ON in_app_notifications(created_at DESC);
```

---

## Row Level Security (RLS)

### stripe_connect_accounts

```sql
-- Users can view their own Connect account
CREATE POLICY "Users can view their own Connect account"
  ON stripe_connect_accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own Connect account
CREATE POLICY "Users can insert their own Connect account"
  ON stripe_connect_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own Connect account
CREATE POLICY "Users can update their own Connect account"
  ON stripe_connect_accounts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own Connect account
CREATE POLICY "Users can delete their own Connect account"
  ON stripe_connect_accounts FOR DELETE
  USING (auth.uid() = user_id);
```

### gallery_monetization

```sql
-- Gallery owners can view their monetization config
CREATE POLICY "Gallery owners can view their monetization config"
  ON gallery_monetization FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

-- Public can view enabled monetization for active galleries
CREATE POLICY "Public can view enabled monetization for galleries"
  ON gallery_monetization FOR SELECT
  USING (
    is_enabled = true
    AND EXISTS (
      SELECT 1 FROM galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.is_active = true
    )
  );
```

### gallery_purchases

```sql
-- Gallery owners can view purchases for their galleries
CREATE POLICY "Gallery owners can view purchases for their galleries"
  ON gallery_purchases FOR SELECT
  USING (photographer_id = auth.uid());

-- Buyers can view their own purchases by email
CREATE POLICY "Buyers can view their own purchases by email"
  ON gallery_purchases FOR SELECT
  USING (
    buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
```

### webhook_events

```sql
-- No user access - service role only
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
-- Service role bypasses RLS by default
```

### photographer_payouts

```sql
-- Photographers can view their own payouts
CREATE POLICY "Photographers can view their own payouts"
  ON photographer_payouts FOR SELECT
  USING (photographer_id = auth.uid());
```

### in_app_notifications

```sql
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON in_app_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON in_app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON in_app_notifications FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Triggers

### updated_at Triggers

All tables have triggers to automatically update the `updated_at` column:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Similar triggers for other tables...
```

### Payout Status Timestamps

Automatically sets `paid_at` and `failed_at` when status changes:

```sql
CREATE OR REPLACE FUNCTION update_photographer_payouts_status_timestamps()
RETURNS TRIGGER AS $
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    NEW.paid_at = NOW();
  END IF;
  
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    NEW.failed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_photographer_payouts_status_timestamps
  BEFORE UPDATE ON photographer_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_photographer_payouts_status_timestamps();
```

---

## Migration Files

| Migration | Description |
|-----------|-------------|
| `20260115120100_create_stripe_connect_accounts.sql` | Stripe Connect accounts table |
| `20260115120200_create_gallery_monetization.sql` | Gallery monetization table |
| `20260115120300_create_gallery_purchases.sql` | Gallery purchases table |
| `20260116120000_create_webhook_events.sql` | Webhook events table |
| `20260116120100_create_photographer_payouts.sql` | Photographer payouts table |
| `20260117120000_create_in_app_notifications.sql` | In-app notifications table |
| `20260117120100_optimize_monetization_indexes.sql` | Performance optimization indexes |

### Running Migrations

```bash
# Apply all migrations
supabase db push

# Reset database (development only)
supabase db reset

# Generate types
supabase gen types typescript --local > src/lib/supabase/types.ts
```

---

## Related Documentation

- [Services Architecture](./services-architecture.md)
- [API Documentation](../api/stripe-connect-api.md)
- [Testing Guide](./testing-guide.md)
