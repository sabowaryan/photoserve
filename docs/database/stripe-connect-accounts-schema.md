# Stripe Connect Accounts Schema Documentation

## Overview

The `stripe_connect_accounts` table stores Stripe Connect account information for photographers who want to monetize their galleries and receive direct payments from clients.

## Table: `stripe_connect_accounts`

### Purpose
This table manages the relationship between PikSend photographers and their Stripe Connect accounts, tracking account status, verification requirements, and onboarding progress.

### Schema

```sql
CREATE TABLE public.stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL,
  
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

## Column Descriptions

### Primary Keys & References

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `user_id` | UUID | Foreign key to `profiles.id`, cascades on delete |

### Stripe Connect Information

| Column | Type | Description |
|--------|------|-------------|
| `stripe_account_id` | VARCHAR(255) | Unique Stripe Connect account ID (format: `acct_xxx`) |
| `account_type` | VARCHAR(50) | Type of Connect account: `'express'` or `'standard'` |

### Account Status

| Column | Type | Description |
|--------|------|-------------|
| `charges_enabled` | BOOLEAN | Whether the account can accept charges (default: false) |
| `payouts_enabled` | BOOLEAN | Whether the account can receive payouts (default: false) |
| `details_submitted` | BOOLEAN | Whether required details have been submitted (default: false) |

### Verification Requirements

| Column | Type | Description |
|--------|------|-------------|
| `currently_due` | TEXT[] | Array of fields currently required for verification |
| `eventually_due` | TEXT[] | Array of fields that will be required in the future |
| `past_due` | TEXT[] | Array of fields that are past due for verification |
| `disabled_reason` | VARCHAR(255) | Reason why the account is disabled (if applicable) |

### Onboarding

| Column | Type | Description |
|--------|------|-------------|
| `onboarding_completed` | BOOLEAN | Whether onboarding has been completed (default: false) |
| `onboarding_link` | TEXT | URL for Stripe Connect onboarding flow |
| `onboarding_expires_at` | TIMESTAMP WITH TIME ZONE | Expiration time for the onboarding link |

### Timestamps

| Column | Type | Description |
|--------|------|-------------|
| `created_at` | TIMESTAMP WITH TIME ZONE | When the record was created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | When the record was last updated (auto-updated via trigger) |

## Indexes

The following indexes are created for optimal query performance:

1. **`idx_connect_accounts_user_id`** - Index on `user_id` for fast user lookups
2. **`idx_connect_accounts_stripe_id`** - Index on `stripe_account_id` for Stripe webhook processing
3. **`idx_connect_accounts_status`** - Composite index on `(charges_enabled, payouts_enabled)` for status filtering

## Constraints

1. **`unique_user_connect`** - Ensures one Connect account per user
2. **`unique_stripe_account`** - Ensures Stripe account IDs are unique
3. **Foreign Key** - `user_id` references `profiles(id)` with CASCADE delete

## Row Level Security (RLS)

RLS is enabled with the following policies:

1. **SELECT**: Users can view their own Connect account
2. **INSERT**: Users can insert their own Connect account
3. **UPDATE**: Users can update their own Connect account
4. **DELETE**: Users can delete their own Connect account

All policies verify that `auth.uid() = user_id`.

## Triggers

### `update_stripe_connect_accounts_updated_at`

Automatically updates the `updated_at` timestamp whenever a row is modified.

```sql
CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_connect_accounts_updated_at();
```

## Usage Examples

### Creating a Connect Account

```sql
INSERT INTO stripe_connect_accounts (
  user_id,
  stripe_account_id,
  account_type,
  onboarding_link,
  onboarding_expires_at
) VALUES (
  'user-uuid-here',
  'acct_1234567890',
  'express',
  'https://connect.stripe.com/setup/...',
  NOW() + INTERVAL '24 hours'
);
```

### Checking Account Status

```sql
SELECT 
  charges_enabled,
  payouts_enabled,
  details_submitted,
  currently_due,
  disabled_reason
FROM stripe_connect_accounts
WHERE user_id = 'user-uuid-here';
```

### Finding Accounts Needing Action

```sql
SELECT 
  user_id,
  stripe_account_id,
  currently_due,
  past_due
FROM stripe_connect_accounts
WHERE 
  array_length(currently_due, 1) > 0 
  OR array_length(past_due, 1) > 0;
```

### Updating Account Status (from Webhook)

```sql
UPDATE stripe_connect_accounts
SET 
  charges_enabled = true,
  payouts_enabled = true,
  details_submitted = true,
  onboarding_completed = true,
  currently_due = ARRAY[]::TEXT[],
  past_due = ARRAY[]::TEXT[]
WHERE stripe_account_id = 'acct_1234567890';
```

## Related Tables

This table is part of the Stripe Connect monetization feature and relates to:

- **`profiles`** - User profile information (parent table)
- **`gallery_monetization`** - Gallery paywall configuration (to be created)
- **`gallery_purchases`** - Purchase records (to be created)
- **`photographer_payouts`** - Payout history (to be created)

## Migration File

Location: `supabase/migrations/20260115120100_create_stripe_connect_accounts.sql`

## Security Considerations

1. **RLS Enabled**: All access is controlled through Row Level Security policies
2. **User Isolation**: Users can only access their own Connect account data
3. **Cascade Delete**: When a user is deleted, their Connect account record is automatically removed
4. **Sensitive Data**: The `stripe_account_id` is stored but no sensitive payment information is kept

## Monitoring & Maintenance

### Key Metrics to Track

- Number of connected accounts
- Percentage of accounts with `charges_enabled = true`
- Percentage of accounts with `payouts_enabled = true`
- Accounts with pending requirements (`currently_due` not empty)
- Accounts with past due requirements

### Recommended Queries

```sql
-- Count of active Connect accounts
SELECT COUNT(*) 
FROM stripe_connect_accounts 
WHERE charges_enabled = true AND payouts_enabled = true;

-- Accounts needing attention
SELECT COUNT(*) 
FROM stripe_connect_accounts 
WHERE array_length(currently_due, 1) > 0 OR array_length(past_due, 1) > 0;

-- Recent onboarding activity
SELECT COUNT(*) 
FROM stripe_connect_accounts 
WHERE created_at > NOW() - INTERVAL '7 days';
```

## References

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [Stripe Connect Account Object](https://stripe.com/docs/api/accounts/object)
- [Requirements Specification](../../.kiro/specs/stripe-connect-monetization/requirements.md)
- [Design Document](../../.kiro/specs/stripe-connect-monetization/design.md)

---

**Created**: 2026-01-15  
**Version**: 1.0.0  
**Status**: Implemented  
**Migration**: 20260115120100_create_stripe_connect_accounts.sql
