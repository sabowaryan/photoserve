-- Migration: Optimize RLS Performance
-- Date: 2026-01-14
-- Fixes: Auth RLS Initialization Plan warnings and Multiple Permissive Policies

-- ============================================================================
-- OPTIMIZE AUTH.UID() CALLS IN RLS POLICIES
-- ============================================================================

-- The issue: auth.uid() is re-evaluated for each row, causing performance problems
-- The solution: Replace auth.uid() with (SELECT auth.uid()) to evaluate once per query

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can update any profile" ON public.profiles;

-- Recreate with optimized auth calls
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Allow profile creation for new users"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- Combined admin policy for profiles (reduces multiple permissive policies)
CREATE POLICY "Admin users can manage all profiles"
ON public.profiles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- GALLERIES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can create galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can update their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can delete their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Admin users can view all galleries" ON public.galleries;
DROP POLICY IF EXISTS "Admin users can update any gallery" ON public.galleries;
DROP POLICY IF EXISTS "Admin users can delete any gallery" ON public.galleries;

-- Recreate with optimized auth calls and combined admin policies
CREATE POLICY "Users can view their own galleries"
ON public.galleries FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can create galleries"
ON public.galleries FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own galleries"
ON public.galleries FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own galleries"
ON public.galleries FOR DELETE
TO authenticated
USING (user_id = (SELECT auth.uid()));

-- Combined admin policy for galleries (reduces multiple permissive policies)
CREATE POLICY "Admin users can manage all galleries"
ON public.galleries FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- IMAGES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Users can insert images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Users can delete images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Admin users can view all images" ON public.images;
DROP POLICY IF EXISTS "Admin users can delete any image" ON public.images;

-- Recreate with optimized auth calls
CREATE POLICY "Users can view images in their galleries"
ON public.images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can insert images in their galleries"
ON public.images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Users can delete images in their galleries"
ON public.images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- Combined admin policy for images (reduces multiple permissive policies)
CREATE POLICY "Admin users can manage all images"
ON public.images FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- AUDIT LOGS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Admin users can insert audit logs" ON public.audit_logs;

-- Recreate with optimized auth calls
CREATE POLICY "Admin users can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RATE LIMIT ATTEMPTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Service role only access" ON public.rate_limit_attempts;

-- Recreate with optimized auth calls
CREATE POLICY "Service role only access"
ON public.rate_limit_attempts FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- GALLERY PAYMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their gallery payments" ON public.gallery_payments;
DROP POLICY IF EXISTS "Admin can view all payments" ON public.gallery_payments;

-- Recreate with optimized auth calls and combined admin policy
CREATE POLICY "Users can view their gallery payments"
ON public.gallery_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_payments.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin can manage all payments"
ON public.gallery_payments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- FAVORITES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view all favorites" ON public.favorites;

-- Recreate with optimized auth calls
-- Note: Keep "Anyone can view favorites" as it doesn't use auth.uid()
CREATE POLICY "Gallery owners can view all favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = favorites.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can delete comments" ON public.comments;

-- Recreate with optimized auth calls
-- Note: Keep other comment policies as they don't use auth.uid()
CREATE POLICY "Gallery owners can delete comments"
ON public.comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = comments.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- GALLERY ANALYTICS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view analytics" ON public.gallery_analytics;
DROP POLICY IF EXISTS "Admin can view all analytics" ON public.gallery_analytics;

-- Recreate with optimized auth calls and combined admin policy
CREATE POLICY "Gallery owners can view analytics"
ON public.gallery_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_analytics.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin can manage all analytics"
ON public.gallery_analytics FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- LEAD CAPTURES TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view leads" ON public.lead_captures;
DROP POLICY IF EXISTS "Admin can view all leads" ON public.lead_captures;

-- Recreate with optimized auth calls and combined admin policy
CREATE POLICY "Gallery owners can view leads"
ON public.lead_captures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = lead_captures.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Admin can manage all leads"
ON public.lead_captures FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- TESTIMONIALS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Gallery owners can update testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Gallery owners can delete testimonials" ON public.testimonials;

-- Recreate with optimized auth calls
-- Note: Keep "Anyone can view public testimonials" as it doesn't use auth.uid()
CREATE POLICY "Gallery owners can manage testimonials"
ON public.testimonials FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- ADMIN SETTINGS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can view settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin can update settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Admin can insert settings" ON public.admin_settings;

-- Recreate with optimized auth calls and combined policy
CREATE POLICY "Admin can manage settings"
ON public.admin_settings FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- CTA CLICKS TABLE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view CTA clicks" ON public.cta_clicks;

-- Recreate with optimized auth calls
-- Note: Keep "Anyone can insert CTA clicks" as it was already fixed in previous migration
CREATE POLICY "Gallery owners can view CTA clicks"
ON public.cta_clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = cta_clicks.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- OPTIMIZE FUNCTIONS WITH AUTH CALLS
-- ============================================================================

-- Update functions that might use auth.uid() in storage operations
CREATE OR REPLACE FUNCTION public.update_user_storage_usage(user_id UUID, size_delta BIGINT)
RETURNS void AS $$
DECLARE
  current_user_id UUID := (SELECT auth.uid());
BEGIN
  -- Only allow service role or the user themselves
  IF current_user_id IS NOT NULL AND current_user_id != user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify storage for other users';
  END IF;
  
  UPDATE public.profiles 
  SET storage_used = GREATEST(0, storage_used + size_delta)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

CREATE OR REPLACE FUNCTION public.delete_user_storage_usage(user_id UUID, size_to_remove BIGINT)
RETURNS void AS $$
DECLARE
  current_user_id UUID := (SELECT auth.uid());
BEGIN
  -- Only allow service role or the user themselves
  IF current_user_id IS NOT NULL AND current_user_id != user_id THEN
    RAISE EXCEPTION 'Unauthorized: cannot modify storage for other users';
  END IF;
  
  UPDATE public.profiles 
  SET storage_used = GREATEST(0, storage_used - size_to_remove)
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track performance optimization
COMMENT ON SCHEMA public IS 'RLS Performance Optimization: Replaced auth.uid() with (SELECT auth.uid()) and consolidated multiple permissive policies';