-- Migration: Create Gallery Purchases Table
-- Description: This table stores purchase records for gallery access,
-- tracking buyer information, payment details, and access status.
-- Created: 2026-01-15
-- Spec: stripe-connect-monetization
-- Task: 3.1 - Database Schema - Purchases

-- ============================================================================
-- TABLE: gallery_purchases
-- ============================================================================
-- Stores all purchase transactions for gallery access. Each record represents
-- a single purchase by a buyer (guest or authenticated) for a specific gallery.
-- 
-- Key relationships:
-- - gallery_id: References the gallery being purchased
-- - photographer_id: References the gallery owner (denormalized for query performance)
-- - buyer_email: Primary identifier for the buyer
-- - buyer_session_id: Secondary identifier for guest purchases
--
-- Payment flow:
-- 1. Buyer initiates checkout → Stripe Checkout Session created
-- 2. Payment succeeds → Webhook creates purchase record (status: 'succeeded')
-- 3. Access granted → access_granted_at timestamp set
-- 4. Optional: Refund/dispute → status updated accordingly
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.gallery_purchases (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Gallery and photographer references
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Buyer information
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_session_id VARCHAR(255), -- For guest purchases (anonymous session tracking)
  
  -- Stripe payment information
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL, -- pi_xxx
  stripe_charge_id VARCHAR(255), -- ch_xxx
  stripe_customer_id VARCHAR(255), -- cus_xxx (if buyer has Stripe account)
  
  -- Amounts (all in cents for precision)
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  photographer_earnings_cents INTEGER NOT NULL,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL, -- 'succeeded' | 'refunded' | 'disputed' | 'failed'
  refund_reason TEXT,
  
  -- Access control
  access_granted_at TIMESTAMP WITH TIME ZONE,
  access_expires_at TIMESTAMP WITH TIME ZONE, -- NULL = unlimited access
  
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
  ),
  CONSTRAINT check_currency_format CHECK (currency ~ '^[a-z]{3}$')
);

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Optimized for common query patterns:
-- 1. Gallery owner viewing their sales
-- 2. Buyer checking their purchase history
-- 3. Access verification by email or session
-- 4. Status-based filtering
-- 5. Date-based reporting

-- Index for gallery owner queries (view all purchases for a gallery)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_gallery_id 
  ON public.gallery_purchases(gallery_id);

-- Index for photographer dashboard (view all sales)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_photographer_id 
  ON public.gallery_purchases(photographer_id);

-- Index for buyer lookup by email (purchase verification)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_buyer_email 
  ON public.gallery_purchases(buyer_email);

-- Index for guest buyer lookup by session ID
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_buyer_session 
  ON public.gallery_purchases(buyer_session_id)
  WHERE buyer_session_id IS NOT NULL;

-- Index for status filtering (refunds, disputes)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_status 
  ON public.gallery_purchases(status);

-- Index for date-based queries (reporting, sorting)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_date 
  ON public.gallery_purchases(purchased_at DESC);

-- Composite index for access verification (most common query)
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_access_check
  ON public.gallery_purchases(gallery_id, buyer_email, status)
  WHERE status = 'succeeded';

-- Composite index for photographer revenue queries
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_photographer_revenue
  ON public.gallery_purchases(photographer_id, status, purchased_at DESC)
  WHERE status = 'succeeded';

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_gallery_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS update_gallery_purchases_updated_at ON public.gallery_purchases;

CREATE TRIGGER update_gallery_purchases_updated_at
  BEFORE UPDATE ON public.gallery_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gallery_purchases_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.gallery_purchases ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Gallery owners can view purchases for their galleries" ON public.gallery_purchases;
DROP POLICY IF EXISTS "Buyers can view their own purchases by email" ON public.gallery_purchases;
DROP POLICY IF EXISTS "Service role has full access to purchases" ON public.gallery_purchases;

-- Policy: Gallery owners can view purchases for their galleries
-- Photographers need to see all purchases for their galleries in the revenue dashboard
CREATE POLICY "Gallery owners can view purchases for their galleries"
  ON public.gallery_purchases
  FOR SELECT
  USING (
    photographer_id = auth.uid()
  );

-- Policy: Buyers can view their own purchases by email
-- Note: This requires the buyer to be authenticated and their email to match
-- For guest purchases, access verification is done via API with session_id
CREATE POLICY "Buyers can view their own purchases by email"
  ON public.gallery_purchases
  FOR SELECT
  USING (
    buyer_email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Policy: Service role has full access (for webhooks and admin operations)
-- The service role bypasses RLS by default, but we add this for clarity
CREATE POLICY "Service role has full access to purchases"
  ON public.gallery_purchases
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

COMMENT ON TABLE public.gallery_purchases IS 
  'Stores purchase records for gallery access, tracking buyer information, payment details, and access status';

-- Primary identifiers
COMMENT ON COLUMN public.gallery_purchases.id IS 
  'Unique identifier for the purchase record';

COMMENT ON COLUMN public.gallery_purchases.gallery_id IS 
  'Reference to the gallery being purchased';

COMMENT ON COLUMN public.gallery_purchases.photographer_id IS 
  'Reference to the gallery owner (denormalized for query performance)';

-- Buyer information
COMMENT ON COLUMN public.gallery_purchases.buyer_email IS 
  'Email address of the buyer (primary identifier for access verification)';

COMMENT ON COLUMN public.gallery_purchases.buyer_name IS 
  'Optional name of the buyer';

COMMENT ON COLUMN public.gallery_purchases.buyer_session_id IS 
  'Session ID for guest purchases (used for access verification without authentication)';

-- Stripe payment information
COMMENT ON COLUMN public.gallery_purchases.stripe_payment_intent_id IS 
  'Stripe PaymentIntent ID (pi_xxx) - unique identifier for the payment';

COMMENT ON COLUMN public.gallery_purchases.stripe_charge_id IS 
  'Stripe Charge ID (ch_xxx) - created after successful payment';

COMMENT ON COLUMN public.gallery_purchases.stripe_customer_id IS 
  'Stripe Customer ID (cus_xxx) - if buyer has a Stripe account';

-- Amounts
COMMENT ON COLUMN public.gallery_purchases.amount_cents IS 
  'Total purchase amount in cents (e.g., 2999 = $29.99)';

COMMENT ON COLUMN public.gallery_purchases.currency IS 
  'Currency code in lowercase (usd, eur, cad, etc.)';

COMMENT ON COLUMN public.gallery_purchases.platform_fee_cents IS 
  'Platform fee amount in cents (typically 10% of amount)';

COMMENT ON COLUMN public.gallery_purchases.photographer_earnings_cents IS 
  'Photographer earnings in cents (amount - platform_fee)';

-- Status
COMMENT ON COLUMN public.gallery_purchases.status IS 
  'Purchase status: succeeded (payment complete), refunded (money returned), disputed (chargeback), failed (payment failed)';

COMMENT ON COLUMN public.gallery_purchases.refund_reason IS 
  'Reason for refund if status is refunded';

-- Access control
COMMENT ON COLUMN public.gallery_purchases.access_granted_at IS 
  'Timestamp when gallery access was granted to the buyer';

COMMENT ON COLUMN public.gallery_purchases.access_expires_at IS 
  'Timestamp when access expires. NULL means unlimited access';

-- Timestamps
COMMENT ON COLUMN public.gallery_purchases.purchased_at IS 
  'Timestamp of the purchase (when payment succeeded)';

COMMENT ON COLUMN public.gallery_purchases.refunded_at IS 
  'Timestamp when refund was processed (if applicable)';

COMMENT ON COLUMN public.gallery_purchases.created_at IS 
  'Record creation timestamp';

COMMENT ON COLUMN public.gallery_purchases.updated_at IS 
  'Record last update timestamp';

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

-- Authenticated users can read (subject to RLS policies)
GRANT SELECT ON public.gallery_purchases TO authenticated;

-- Service role has full access (for webhooks and admin operations)
GRANT ALL ON public.gallery_purchases TO service_role;

-- Anonymous users cannot access purchases directly
-- Access verification for guests is done via API endpoints
