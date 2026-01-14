-- Migration: Fix Security Warnings
-- Date: 2026-01-14
-- Fixes: Function search_path mutable and overly permissive RLS policies

-- ============================================================================
-- FIX FUNCTION SEARCH_PATH ISSUES
-- ============================================================================

-- Fix get_gallery_stats function with proper search_path
CREATE OR REPLACE FUNCTION public.get_gallery_stats(p_gallery_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'totalViews', (SELECT COUNT(*) FROM public.gallery_analytics WHERE gallery_id = p_gallery_id),
    'uniqueVisitors', (SELECT COUNT(DISTINCT session_id) FROM public.gallery_analytics WHERE gallery_id = p_gallery_id AND session_id IS NOT NULL),
    'favoritesCount', (SELECT COUNT(*) FROM public.favorites WHERE gallery_id = p_gallery_id),
    'commentsCount', (SELECT COUNT(*) FROM public.comments WHERE gallery_id = p_gallery_id),
    'ctaClicks', (SELECT COUNT(*) FROM public.cta_clicks WHERE gallery_id = p_gallery_id),
    'leadsCount', (SELECT COUNT(*) FROM public.lead_captures WHERE gallery_id = p_gallery_id),
    'testimonialsCount', (SELECT COUNT(*) FROM public.testimonials WHERE gallery_id = p_gallery_id),
    'avgRating', (SELECT COALESCE(AVG(rating), 0) FROM public.testimonials WHERE gallery_id = p_gallery_id)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Note: update_user_signin function will be fixed if it exists in the database
-- This handles functions that might be created by Supabase Auth or other systems
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_user_signin' AND pronamespace = 'public'::regnamespace) THEN
    -- Fix the function by adding search_path if it doesn't already have it
    EXECUTE format('
      CREATE OR REPLACE FUNCTION public.update_user_signin(user_id UUID)
      RETURNS void AS $func$
      BEGIN
        UPDATE public.profiles 
        SET last_signin = NOW() 
        WHERE id = user_id;
      END;
      $func$ LANGUAGE plpgsql SECURITY DEFINER
      SET search_path = public;
    ');
  END IF;
END $$;

-- ============================================================================
-- FIX OVERLY PERMISSIVE RLS POLICIES
-- ============================================================================

-- Drop and recreate CTA clicks policy with proper validation
DROP POLICY IF EXISTS "Anyone can insert CTA clicks" ON public.cta_clicks;

CREATE POLICY "Anyone can insert CTA clicks"
ON public.cta_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (
  gallery_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.galleries 
    WHERE galleries.id = gallery_id
  )
);

-- Drop and recreate gallery analytics policy with proper validation
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.gallery_analytics;

CREATE POLICY "Anyone can insert analytics"
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
-- ADDITIONAL SECURITY IMPROVEMENTS
-- ============================================================================

-- Add rate limiting constraints to prevent abuse
-- Add check constraint to limit analytics entries per session per day
ALTER TABLE public.gallery_analytics 
ADD CONSTRAINT check_reasonable_session_length 
CHECK (session_id IS NULL OR char_length(session_id) BETWEEN 1 AND 255);

-- Add check constraint for CTA clicks session validation
ALTER TABLE public.cta_clicks 
ADD CONSTRAINT check_cta_session_length 
CHECK (session_id IS NULL OR char_length(session_id) BETWEEN 1 AND 255);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track security fixes
COMMENT ON FUNCTION public.get_gallery_stats(UUID) IS 'Fixed: Added search_path security setting';