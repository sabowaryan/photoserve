-- Migration: Create Photographer Payouts Table
-- Description: This table stores payout records for photographers receiving payments via Stripe Connect.
-- Tracks when funds are transferred from Stripe to the photographer's bank account.
-- Created: 2026-01-16
-- Spec: stripe-connect-monetization
-- Task: 6.1 - Database Schema - Payouts

-- ============================================================================
-- TABLE: photographer_payouts
-- ============================================================================
-- Tracks all payouts from Stripe to photographer bank accounts.
-- Payouts are created automatically by Stripe based on the payout schedule
-- (daily, weekly, or monthly) and tracked via webhooks.
--
-- Key relationships:
-- - photographer_id: References the photographer receiving the payout
-- - stripe_account_id: The Stripe Connect account ID
--
-- Payout flow:
-- 1. Stripe calculates available balance
-- 2. Stripe creates payout → payout.created webhook → record created (status: 'pending')
-- 3. Payout in transit → payout.updated webhook → status: 'in_transit'
-- 4. Payout arrives → payout.paid webhook → status: 'paid'
-- 5. Or payout fails → payout.failed webhook → status: 'failed' with failure details
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.photographer_payouts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL, -- Stripe Connect account ID (acct_xxx)
  
  -- Amount
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Stripe Payout
  stripe_payout_id VARCHAR(255) UNIQUE, -- Stripe payout ID (po_xxx)
  
  -- Status: 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled'
  status VARCHAR(50) NOT NULL,
  failure_code VARCHAR(255),
  failure_message TEXT,
  
  -- Dates
  arrival_date DATE, -- Expected arrival in bank account
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Bank Account (last 4 digits for display)
  destination_bank_account_last4 VARCHAR(4),
  
  -- Constraints
  CONSTRAINT unique_stripe_payout UNIQUE(stripe_payout_id),
  CONSTRAINT check_status CHECK (status IN ('pending', 'in_transit', 'paid', 'failed', 'canceled')),
  CONSTRAINT check_amount_positive CHECK (amount_cents > 0),
  CONSTRAINT check_currency_format CHECK (currency ~ '^[a-z]{3}$')
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Optimized for common query patterns:
-- 1. Photographer viewing their payout history
-- 2. Status-based filtering
-- 3. Date-based reporting
-- 4. Webhook processing by Stripe account

-- Index for photographer dashboard queries (list payouts by photographer)
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_photographer_id 
  ON public.photographer_payouts(photographer_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_status 
  ON public.photographer_payouts(status);

-- Index for date-based queries (most recent first)
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_date 
  ON public.photographer_payouts(created_at DESC);

-- Composite index for photographer payout history with status filter
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_photographer_status 
  ON public.photographer_payouts(photographer_id, status, created_at DESC);

-- Index for Stripe account lookups (webhook processing)
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_stripe_account 
  ON public.photographer_payouts(stripe_account_id);

-- Index for arrival date queries (upcoming payouts)
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_arrival_date 
  ON public.photographer_payouts(arrival_date)
  WHERE arrival_date IS NOT NULL;

-- ============================================================================
-- STATUS CHANGE TRIGGER
-- ============================================================================
-- Automatically sets paid_at and failed_at timestamps when status changes

CREATE OR REPLACE FUNCTION public.update_photographer_payouts_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Update paid_at when status changes to 'paid'
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    NEW.paid_at = NOW();
  END IF;
  
  -- Update failed_at when status changes to 'failed'
  IF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    NEW.failed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS update_photographer_payouts_status_timestamps ON public.photographer_payouts;

CREATE TRIGGER update_photographer_payouts_status_timestamps
  BEFORE UPDATE ON public.photographer_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_photographer_payouts_status_timestamps();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.photographer_payouts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Photographers can view their own payouts" ON public.photographer_payouts;
DROP POLICY IF EXISTS "Service role has full access to payouts" ON public.photographer_payouts;

-- Policy: Photographers can view their own payouts
-- Photographers need to see all their payout records in the revenue dashboard
CREATE POLICY "Photographers can view their own payouts"
  ON public.photographer_payouts
  FOR SELECT
  USING (
    photographer_id = auth.uid()
  );

-- Policy: Service role has full access (for webhooks and admin operations)
-- The service role bypasses RLS by default, but we add this for clarity
CREATE POLICY "Service role has full access to payouts"
  ON public.photographer_payouts
  FOR ALL
  USING (
    auth.jwt() ->> 'role' = 'service_role'
  )
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
  );

-- ============================================================================
-- TABLE AND COLUMN COMMENTS
-- ============================================================================

COMMENT ON TABLE public.photographer_payouts IS 
  'Stores payout records for photographers receiving payments via Stripe Connect';

-- Primary identifiers
COMMENT ON COLUMN public.photographer_payouts.id IS 
  'Unique identifier for the payout record';

COMMENT ON COLUMN public.photographer_payouts.photographer_id IS 
  'Reference to the photographer (profiles table)';

COMMENT ON COLUMN public.photographer_payouts.stripe_account_id IS 
  'Stripe Connect account ID (acct_xxx)';

-- Amount
COMMENT ON COLUMN public.photographer_payouts.amount_cents IS 
  'Payout amount in cents (e.g., 10000 = $100.00)';

COMMENT ON COLUMN public.photographer_payouts.currency IS 
  'Three-letter ISO currency code in lowercase (usd, eur, cad, etc.)';

-- Stripe Payout
COMMENT ON COLUMN public.photographer_payouts.stripe_payout_id IS 
  'Stripe payout ID (po_xxx) - unique identifier for the payout';

-- Status
COMMENT ON COLUMN public.photographer_payouts.status IS 
  'Payout status: pending (created), in_transit (processing), paid (deposited), failed (error), canceled (stopped)';

COMMENT ON COLUMN public.photographer_payouts.failure_code IS 
  'Stripe failure code if payout failed (e.g., account_closed, insufficient_funds)';

COMMENT ON COLUMN public.photographer_payouts.failure_message IS 
  'Human-readable failure message from Stripe';

-- Dates
COMMENT ON COLUMN public.photographer_payouts.arrival_date IS 
  'Expected arrival date in bank account (estimate from Stripe)';

COMMENT ON COLUMN public.photographer_payouts.created_at IS 
  'When the payout was created in Stripe';

COMMENT ON COLUMN public.photographer_payouts.paid_at IS 
  'When the payout was marked as paid (auto-set by trigger)';

COMMENT ON COLUMN public.photographer_payouts.failed_at IS 
  'When the payout failed (auto-set by trigger)';

-- Bank Account
COMMENT ON COLUMN public.photographer_payouts.destination_bank_account_last4 IS 
  'Last 4 digits of destination bank account for display';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Authenticated users can read (subject to RLS policies)
GRANT SELECT ON public.photographer_payouts TO authenticated;

-- Service role has full access (for webhooks and admin operations)
GRANT ALL ON public.photographer_payouts TO service_role;

-- Anonymous users cannot access payouts directly
