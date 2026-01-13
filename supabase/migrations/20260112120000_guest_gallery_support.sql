-- Migration: Guest Gallery Support
-- Requirements: 9.1, 9.2, 9.3, 9.4, 9.5

-- Add guest_session_id to galleries table (Requirement 9.1)
ALTER TABLE public.galleries 
ADD COLUMN guest_session_id VARCHAR(255);

-- Add is_unlocked to galleries table (Requirement 9.2)
ALTER TABLE public.galleries 
ADD COLUMN is_unlocked BOOLEAN DEFAULT false;

-- Add payment_type to galleries table (Requirement 9.3)
ALTER TABLE public.galleries 
ADD COLUMN payment_type VARCHAR(20) DEFAULT 'free' 
  CHECK (payment_type IN ('free', 'one_time', 'subscription'));

-- Make user_id nullable for guest galleries (Requirement 9.4)
ALTER TABLE public.galleries 
ALTER COLUMN user_id DROP NOT NULL;

-- Create index for guest session lookups
CREATE INDEX idx_galleries_guest_session ON public.galleries(guest_session_id);

-- Create gallery_payments table for one-time payments (Requirement 9.5)
CREATE TABLE public.gallery_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255) NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payment lookups
CREATE INDEX idx_gallery_payments_gallery ON public.gallery_payments(gallery_id);
CREATE INDEX idx_gallery_payments_intent ON public.gallery_payments(stripe_payment_intent_id);

-- Enable RLS on gallery_payments
ALTER TABLE public.gallery_payments ENABLE ROW LEVEL SECURITY;

-- Users can view payments for their galleries
CREATE POLICY "Users can view their gallery payments"
ON public.gallery_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_payments.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Admin can view all payments
CREATE POLICY "Admin can view all payments"
ON public.gallery_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Service role can insert payments (for webhook handling)
CREATE POLICY "Service role can insert payments"
ON public.gallery_payments FOR INSERT
TO service_role
WITH CHECK (true);

-- Service role can update payments (for webhook handling)
CREATE POLICY "Service role can update payments"
ON public.gallery_payments FOR UPDATE
TO service_role
USING (true);

-- Add onboarding_completed to profiles
ALTER TABLE public.profiles
ADD COLUMN onboarding_completed BOOLEAN DEFAULT false;

-- Update galleries RLS for guest access (Requirement 9.4)
-- Guest can view their galleries by guest_session_id
CREATE POLICY "Guest can view their galleries"
ON public.galleries FOR SELECT
TO anon
USING (
  guest_session_id IS NOT NULL 
  AND is_active = true
);

-- Guest can create galleries (with guest_session_id)
CREATE POLICY "Guest can create galleries"
ON public.galleries FOR INSERT
TO anon
WITH CHECK (
  guest_session_id IS NOT NULL
  AND user_id IS NULL
);

-- Guest can update their galleries
CREATE POLICY "Guest can update their galleries"
ON public.galleries FOR UPDATE
TO anon
USING (
  guest_session_id IS NOT NULL
  AND user_id IS NULL
);

-- Guest can insert images in their galleries
CREATE POLICY "Guest can insert images in their galleries"
ON public.images FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.guest_session_id IS NOT NULL
    AND galleries.user_id IS NULL
  )
);

-- Trigger for updated_at on gallery_payments
CREATE TRIGGER update_gallery_payments_updated_at
  BEFORE UPDATE ON public.gallery_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add converted_at column to track when a guest gallery was converted to user gallery
ALTER TABLE public.galleries
ADD COLUMN converted_at TIMESTAMP WITH TIME ZONE;

-- Create index for converted galleries
CREATE INDEX idx_galleries_converted ON public.galleries(converted_at) WHERE converted_at IS NOT NULL;
