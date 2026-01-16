-- Migration: Create Stripe Connect Accounts Table
-- Description: This table stores Stripe Connect account information for photographers
-- who want to monetize their galleries and receive direct payments.
-- Created: 2026-01-15
-- Spec: stripe-connect-monetization

-- Create stripe_connect_accounts table
CREATE TABLE IF NOT EXISTS public.stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'express' | 'standard'
  
  -- Status
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  
  -- Requirements
  currently_due TEXT[], -- Array of required fields
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connect_accounts_user_id 
  ON public.stripe_connect_accounts(user_id);

CREATE INDEX IF NOT EXISTS idx_connect_accounts_stripe_id 
  ON public.stripe_connect_accounts(stripe_account_id);

CREATE INDEX IF NOT EXISTS idx_connect_accounts_status 
  ON public.stripe_connect_accounts(charges_enabled, payouts_enabled);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_stripe_connect_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS update_stripe_connect_accounts_updated_at ON public.stripe_connect_accounts;

CREATE TRIGGER update_stripe_connect_accounts_updated_at
  BEFORE UPDATE ON public.stripe_connect_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_connect_accounts_updated_at();

-- Add Row Level Security (RLS)
ALTER TABLE public.stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own Connect account" ON public.stripe_connect_accounts;
DROP POLICY IF EXISTS "Users can insert their own Connect account" ON public.stripe_connect_accounts;
DROP POLICY IF EXISTS "Users can update their own Connect account" ON public.stripe_connect_accounts;
DROP POLICY IF EXISTS "Users can delete their own Connect account" ON public.stripe_connect_accounts;

-- Policy: Users can view their own Connect account
CREATE POLICY "Users can view their own Connect account"
  ON public.stripe_connect_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own Connect account
CREATE POLICY "Users can insert their own Connect account"
  ON public.stripe_connect_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own Connect account
CREATE POLICY "Users can update their own Connect account"
  ON public.stripe_connect_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own Connect account
CREATE POLICY "Users can delete their own Connect account"
  ON public.stripe_connect_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE public.stripe_connect_accounts IS 
  'Stores Stripe Connect account information for photographers to receive direct payments';

-- Add comments to important columns
COMMENT ON COLUMN public.stripe_connect_accounts.stripe_account_id IS 
  'Unique Stripe Connect account ID (acct_xxx)';

COMMENT ON COLUMN public.stripe_connect_accounts.account_type IS 
  'Type of Stripe Connect account: express or standard';

COMMENT ON COLUMN public.stripe_connect_accounts.charges_enabled IS 
  'Whether the account can accept charges';

COMMENT ON COLUMN public.stripe_connect_accounts.payouts_enabled IS 
  'Whether the account can receive payouts';

COMMENT ON COLUMN public.stripe_connect_accounts.currently_due IS 
  'Array of fields currently required for verification';

COMMENT ON COLUMN public.stripe_connect_accounts.eventually_due IS 
  'Array of fields that will be required in the future';

COMMENT ON COLUMN public.stripe_connect_accounts.past_due IS 
  'Array of fields that are past due for verification';

-- Grant permissions
GRANT ALL ON public.stripe_connect_accounts TO authenticated;
GRANT SELECT ON public.stripe_connect_accounts TO service_role;
