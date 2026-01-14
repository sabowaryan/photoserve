-- Migration: Optimize Database Indexes
-- Date: 2026-01-14
-- Fixes: Unindexed foreign keys and removes unused indexes

-- ============================================================================
-- ADD MISSING FOREIGN KEY INDEXES
-- ============================================================================

-- Add index for admin_settings.updated_by foreign key
CREATE INDEX IF NOT EXISTS idx_admin_settings_updated_by 
ON public.admin_settings(updated_by);

-- ============================================================================
-- REMOVE UNUSED INDEXES
-- ============================================================================

-- Note: These indexes were created but are not being used by queries
-- Removing them will improve write performance and reduce storage

-- Drop unused indexes on galleries table
DROP INDEX IF EXISTS public.idx_galleries_guest_session;
DROP INDEX IF EXISTS public.idx_galleries_settings;
DROP INDEX IF EXISTS public.idx_galleries_converted;

-- Drop unused indexes on gallery_payments table
DROP INDEX IF EXISTS public.idx_gallery_payments_gallery;
DROP INDEX IF EXISTS public.idx_gallery_payments_intent;

-- Drop unused indexes on testimonials table
DROP INDEX IF EXISTS public.idx_testimonials_rating;
DROP INDEX IF EXISTS public.idx_testimonials_public;
DROP INDEX IF EXISTS public.idx_testimonials_created;
DROP INDEX IF EXISTS public.idx_testimonials_gallery;

-- Drop unused indexes on profiles table
DROP INDEX IF EXISTS public.idx_profiles_branding;

-- Drop unused indexes on rate_limit_attempts table
DROP INDEX IF EXISTS public.idx_rate_limit_expires;

-- Drop unused indexes on cta_clicks table
DROP INDEX IF EXISTS public.idx_cta_clicks_gallery;
DROP INDEX IF EXISTS public.idx_cta_clicks_clicked;

-- Drop unused indexes on favorites table
DROP INDEX IF EXISTS public.idx_favorites_gallery;
DROP INDEX IF EXISTS public.idx_favorites_image;
DROP INDEX IF EXISTS public.idx_favorites_session;

-- Drop unused indexes on comments table
DROP INDEX IF EXISTS public.idx_comments_image;
DROP INDEX IF EXISTS public.idx_comments_gallery;
DROP INDEX IF EXISTS public.idx_comments_session;
DROP INDEX IF EXISTS public.idx_comments_created;

-- Drop unused indexes on gallery_analytics table
DROP INDEX IF EXISTS public.idx_analytics_gallery;
DROP INDEX IF EXISTS public.idx_analytics_viewed;
DROP INDEX IF EXISTS public.idx_analytics_country;
DROP INDEX IF EXISTS public.idx_analytics_session;

-- Drop unused indexes on lead_captures table
DROP INDEX IF EXISTS public.idx_leads_gallery;
DROP INDEX IF EXISTS public.idx_leads_email;
DROP INDEX IF EXISTS public.idx_leads_captured;

-- Drop unused indexes on audit_logs table
DROP INDEX IF EXISTS public.idx_audit_logs_admin_id;
DROP INDEX IF EXISTS public.idx_audit_logs_action_type;
DROP INDEX IF EXISTS public.idx_audit_logs_entity_type;

-- ============================================================================
-- CREATE ESSENTIAL INDEXES BASED ON ACTUAL QUERY PATTERNS
-- ============================================================================

-- These indexes are created based on common query patterns and RLS policies
-- Only create indexes that will actually be used

-- Index for gallery ownership queries (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_galleries_user_id 
ON public.galleries(user_id);

-- Index for image gallery relationship (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_images_gallery_id 
ON public.images(gallery_id);

-- Index for active gallery access (used frequently)
CREATE INDEX IF NOT EXISTS idx_galleries_slug_active 
ON public.galleries(unique_slug) WHERE is_active = true;

-- Index for profile admin status (used in RLS policies)
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON public.profiles(is_admin) WHERE is_admin = true;

-- Index for gallery analytics by gallery (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_gallery_viewed 
ON public.gallery_analytics(gallery_id, viewed_at DESC);

-- Index for comments by gallery (for display)
CREATE INDEX IF NOT EXISTS idx_comments_gallery_created 
ON public.comments(gallery_id, created_at DESC);

-- Index for favorites by gallery and session (for client features)
CREATE INDEX IF NOT EXISTS idx_favorites_gallery_session 
ON public.favorites(gallery_id, session_id);

-- Index for testimonials public display
CREATE INDEX IF NOT EXISTS idx_testimonials_public_created 
ON public.testimonials(gallery_id, created_at DESC) WHERE is_public = true;

-- Index for lead captures by gallery (for dashboard)
CREATE INDEX IF NOT EXISTS idx_lead_captures_gallery_captured 
ON public.lead_captures(gallery_id, captured_at DESC);

-- ============================================================================
-- OPTIMIZE EXISTING INDEXES
-- ============================================================================

-- Create composite indexes for better query performance

-- Gallery lookup with user verification (common in RLS)
CREATE INDEX IF NOT EXISTS idx_galleries_id_user_id 
ON public.galleries(id, user_id);

-- Image lookup with gallery verification (common in RLS)
CREATE INDEX IF NOT EXISTS idx_images_id_gallery_id 
ON public.images(id, gallery_id);

-- Profile lookup for admin checks (common in RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_id_is_admin 
ON public.profiles(id, is_admin);

-- ============================================================================
-- PARTIAL INDEXES FOR SPECIFIC USE CASES
-- ============================================================================

-- Index only active galleries
CREATE INDEX IF NOT EXISTS idx_galleries_active 
ON public.galleries(created_at DESC) 
WHERE is_active = true;

-- Index only converted galleries (for analytics)
CREATE INDEX IF NOT EXISTS idx_galleries_converted_date 
ON public.galleries(converted_at DESC) 
WHERE converted_at IS NOT NULL;

-- Index only admin users
CREATE INDEX IF NOT EXISTS idx_profiles_admin_users 
ON public.profiles(created_at DESC) 
WHERE is_admin = true;

-- ============================================================================
-- FUNCTION-BASED INDEXES FOR JSON QUERIES
-- ============================================================================

-- Index for gallery settings queries (if needed)
CREATE INDEX IF NOT EXISTS idx_galleries_settings_enabled 
ON public.galleries USING gin(settings) 
WHERE settings IS NOT NULL;

-- Index for profile branding queries (if needed)
CREATE INDEX IF NOT EXISTS idx_profiles_branding_domain 
ON public.profiles USING gin(branding) 
WHERE branding IS NOT NULL;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track index optimization
COMMENT ON SCHEMA public IS 'Index Optimization: Removed unused indexes, added foreign key indexes, and created essential composite indexes for better query performance';

-- Analyze tables to update statistics after index changes
ANALYZE public.galleries;
ANALYZE public.images;
ANALYZE public.profiles;
ANALYZE public.comments;
ANALYZE public.favorites;
ANALYZE public.gallery_analytics;
ANALYZE public.lead_captures;
ANALYZE public.testimonials;
ANALYZE public.admin_settings;