-- Migration: Create Gallery Monetization Table
-- Description: This table stores monetization/paywall configuration for galleries,
-- allowing photographers to set prices and control access to their galleries.
-- Created: 2026-01-15
-- Spec: stripe-connect-monetization

-- Create gallery_monetization table
CREATE TABLE IF NOT EXISTS public.gallery_monetization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL, -- Price in cents
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Preview Mode
  preview_mode VARCHAR(20) DEFAULT 'full_paywall', -- 'full_paywall' | 'freemium'
  watermark_enabled BOOLEAN DEFAULT true,
  
  -- Access Duration
  access_duration_days INTEGER, -- NULL = unlimited
  
  -- Stripe
  stripe_price_id VARCHAR(255), -- Stripe Price ID
  
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
  CONSTRAINT check_price_range CHECK (price_cents >= 500 AND price_cents <= 50000), -- $5-$500
  CONSTRAINT check_fee_range CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
  CONSTRAINT check_preview_mode CHECK (preview_mode IN ('full_paywall', 'freemium'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_gallery_monetization_gallery_id 
  ON public.gallery_monetization(gallery_id);

CREATE INDEX IF NOT EXISTS idx_gallery_monetization_enabled 
  ON public.gallery_monetization(is_enabled);

CREATE INDEX IF NOT EXISTS idx_gallery_monetization_enabled_gallery 
  ON public.gallery_monetization(is_enabled, gallery_id) 
  WHERE is_enabled = true;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.update_gallery_monetization_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS update_gallery_monetization_updated_at ON public.gallery_monetization;

CREATE TRIGGER update_gallery_monetization_updated_at
  BEFORE UPDATE ON public.gallery_monetization
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gallery_monetization_updated_at();

-- Add Row Level Security (RLS)
ALTER TABLE public.gallery_monetization ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Gallery owners can view their monetization config" ON public.gallery_monetization;
DROP POLICY IF EXISTS "Gallery owners can insert their monetization config" ON public.gallery_monetization;
DROP POLICY IF EXISTS "Gallery owners can update their monetization config" ON public.gallery_monetization;
DROP POLICY IF EXISTS "Gallery owners can delete their monetization config" ON public.gallery_monetization;
DROP POLICY IF EXISTS "Public can view enabled monetization for galleries" ON public.gallery_monetization;

-- Policy: Gallery owners can view their monetization config
CREATE POLICY "Gallery owners can view their monetization config"
  ON public.gallery_monetization
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

-- Policy: Gallery owners can insert their monetization config
CREATE POLICY "Gallery owners can insert their monetization config"
  ON public.gallery_monetization
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

-- Policy: Gallery owners can update their monetization config
CREATE POLICY "Gallery owners can update their monetization config"
  ON public.gallery_monetization
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

-- Policy: Gallery owners can delete their monetization config
CREATE POLICY "Gallery owners can delete their monetization config"
  ON public.gallery_monetization
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.user_id = auth.uid()
    )
  );

-- Policy: Public can view enabled monetization for galleries (needed for paywall display)
-- Note: Galleries are accessible via unique slug, so we allow viewing enabled monetization
CREATE POLICY "Public can view enabled monetization for galleries"
  ON public.gallery_monetization
  FOR SELECT
  USING (
    is_enabled = true
    AND EXISTS (
      SELECT 1 FROM public.galleries
      WHERE galleries.id = gallery_monetization.gallery_id
      AND galleries.is_active = true
    )
  );

-- Add comments to table
COMMENT ON TABLE public.gallery_monetization IS 
  'Stores monetization/paywall configuration for galleries, allowing photographers to charge for access';

-- Add comments to important columns
COMMENT ON COLUMN public.gallery_monetization.gallery_id IS 
  'Reference to the gallery being monetized';

COMMENT ON COLUMN public.gallery_monetization.is_enabled IS 
  'Whether the paywall is currently active for this gallery';

COMMENT ON COLUMN public.gallery_monetization.price_cents IS 
  'Price in cents (e.g., 2999 = $29.99). Must be between $5 and $500';

COMMENT ON COLUMN public.gallery_monetization.currency IS 
  'Currency code (usd, eur, cad, etc.)';

COMMENT ON COLUMN public.gallery_monetization.preview_mode IS 
  'Preview mode: full_paywall (blurred preview) or freemium (low-res with watermark)';

COMMENT ON COLUMN public.gallery_monetization.watermark_enabled IS 
  'Whether to show watermark in freemium preview mode';

COMMENT ON COLUMN public.gallery_monetization.access_duration_days IS 
  'Number of days access is valid after purchase. NULL = unlimited';

COMMENT ON COLUMN public.gallery_monetization.stripe_price_id IS 
  'Stripe Price ID for this gallery (price_xxx)';

COMMENT ON COLUMN public.gallery_monetization.platform_fee_percent IS 
  'Platform fee percentage (default 10%)';

COMMENT ON COLUMN public.gallery_monetization.total_sales IS 
  'Total number of purchases for this gallery';

COMMENT ON COLUMN public.gallery_monetization.total_revenue_cents IS 
  'Total revenue in cents for this gallery';

COMMENT ON COLUMN public.gallery_monetization.conversion_rate IS 
  'Conversion rate (purchases / views) as percentage';

-- Grant permissions
GRANT ALL ON public.gallery_monetization TO authenticated;
GRANT SELECT ON public.gallery_monetization TO anon;
GRANT SELECT ON public.gallery_monetization TO service_role;

