-- Migration: Consolidate Multiple Permissive Policies
-- Date: 2026-01-14
-- Fixes: Multiple Permissive Policies warnings by consolidating into single policies per action

-- ============================================================================
-- CONSOLIDATE MULTIPLE PERMISSIVE POLICIES
-- ============================================================================

-- The issue: Multiple permissive policies for the same role and action cause performance problems
-- The solution: Combine multiple conditions into single policies using OR logic

-- ============================================================================
-- PROFILES TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile creation for new users" ON public.profiles;
DROP POLICY IF EXISTS "Admin users can manage all profiles" ON public.profiles;

-- Create consolidated policies with OR conditions
CREATE POLICY "Consolidated profile select"
ON public.profiles FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated profile update"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated profile insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
  id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- GALLERIES TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can create galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can update their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Users can delete their own galleries" ON public.galleries;
DROP POLICY IF EXISTS "Admin users can manage all galleries" ON public.galleries;

-- Create consolidated policies
CREATE POLICY "Consolidated gallery select"
ON public.galleries FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated gallery insert"
ON public.galleries FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated gallery update"
ON public.galleries FOR UPDATE
TO authenticated
USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated gallery delete"
ON public.galleries FOR DELETE
TO authenticated
USING (
  user_id = (SELECT auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- IMAGES TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Users can insert images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Users can delete images in their galleries" ON public.images;
DROP POLICY IF EXISTS "Admin users can manage all images" ON public.images;

-- Create consolidated policies
CREATE POLICY "Consolidated image select"
ON public.images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated image insert"
ON public.images FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated image delete"
ON public.images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- COMMENTS TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing delete policies
DROP POLICY IF EXISTS "Users can delete their comments" ON public.comments;
DROP POLICY IF EXISTS "Gallery owners can delete comments" ON public.comments;

-- Create consolidated delete policy
CREATE POLICY "Consolidated comment delete"
ON public.comments FOR DELETE
TO anon, authenticated
USING (
  session_id IS NOT NULL OR
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = comments.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- FAVORITES TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing select policies
DROP POLICY IF EXISTS "Anyone can view favorites" ON public.favorites;
DROP POLICY IF EXISTS "Gallery owners can view all favorites" ON public.favorites;

-- Create consolidated select policy
CREATE POLICY "Consolidated favorites select"
ON public.favorites FOR SELECT
TO anon, authenticated
USING (
  true OR
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = favorites.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- GALLERY ANALYTICS TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view analytics" ON public.gallery_analytics;
DROP POLICY IF EXISTS "Admin can manage all analytics" ON public.gallery_analytics;
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.gallery_analytics;

-- Create consolidated policies
CREATE POLICY "Consolidated analytics select"
ON public.gallery_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_analytics.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated analytics insert"
ON public.gallery_analytics FOR INSERT
TO anon, authenticated
WITH CHECK (
  gallery_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE galleries.id = gallery_id
  )
);

-- ============================================================================
-- GALLERY PAYMENTS TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their gallery payments" ON public.gallery_payments;
DROP POLICY IF EXISTS "Admin can manage all payments" ON public.gallery_payments;

-- Create consolidated policy
CREATE POLICY "Consolidated payments select"
ON public.gallery_payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_payments.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- LEAD CAPTURES TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Gallery owners can view leads" ON public.lead_captures;
DROP POLICY IF EXISTS "Admin can manage all leads" ON public.lead_captures;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.lead_captures;

-- Create consolidated policies
CREATE POLICY "Consolidated leads select"
ON public.lead_captures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = lead_captures.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Consolidated leads insert"
ON public.lead_captures FOR INSERT
TO anon, authenticated
WITH CHECK (gdpr_consent = true);

-- ============================================================================
-- TESTIMONIALS TABLE - CONSOLIDATE POLICIES
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view public testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Gallery owners can manage testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Anyone can insert testimonials" ON public.testimonials;

-- Create consolidated policies
CREATE POLICY "Consolidated testimonials select"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (
  is_public = true OR
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Consolidated testimonials insert"
ON public.testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (rating >= 1 AND rating <= 5);

CREATE POLICY "Consolidated testimonials update"
ON public.testimonials FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "Consolidated testimonials delete"
ON public.testimonials FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = (SELECT auth.uid())
  )
);

-- ============================================================================
-- KEEP EXISTING SINGLE POLICIES (NO CONFLICTS)
-- ============================================================================

-- These policies don't have conflicts, so we keep them as-is:
-- - public.audit_logs policies
-- - public.rate_limit_attempts policies  
-- - public.admin_settings policies
-- - public.cta_clicks policies
-- - Service role policies
-- - Public access policies for galleries and images

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track consolidation
COMMENT ON SCHEMA public IS 'Multiple Permissive Policies Consolidated: Combined multiple policies per action into single policies with OR conditions';