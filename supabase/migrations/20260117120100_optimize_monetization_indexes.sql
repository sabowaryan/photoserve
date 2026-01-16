-- Migration: Optimize Monetization Indexes
-- Description: Add missing indexes to optimize query performance for the monetization system
-- Created: 2026-01-17
-- Spec: stripe-connect-monetization
-- Task: 10.2 - Database Optimization

-- ============================================================================
-- ANALYSIS SUMMARY
-- ============================================================================
-- This migration adds indexes to optimize the following query patterns:
-- 
-- 1. Revenue Analytics (revenue.service.ts)
--    - Photographer revenue overview with date filtering
--    - Chart data aggregation by date
--    - Cohort analysis by buyer email and purchase date
--    - Top galleries by revenue
--
-- 2. Conversion Funnel (revenue.service.ts)
--    - Gallery events filtered by photographer, event_type, and date
--    - Purchase counts for funnel calculations
--
-- 3. Access Verification (gallery-purchase.service.ts)
--    - Quick lookup by gallery_id + buyer_email + status
--    - Quick lookup by gallery_id + buyer_session_id + status
--
-- 4. Payout History (payout.service.ts)
--    - Photographer payout listing with status and date filters
--    - Related sales lookup for payout details
-- ============================================================================

-- ============================================================================
-- GALLERY_PURCHASES INDEXES
-- ============================================================================

-- Index for revenue analytics: photographer revenue queries with date filtering
-- Optimizes: getOverview(), getChartData(), getRevenueTrends()
-- Query pattern: WHERE photographer_id = ? AND status = 'succeeded' AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_photographer_status_date
  ON public.gallery_purchases(photographer_id, status, created_at DESC)
  WHERE status = 'succeeded';

COMMENT ON INDEX idx_gallery_purchases_photographer_status_date IS 
  'Optimizes revenue analytics queries filtering by photographer, succeeded status, and date range';

-- Index for cohort analysis: buyer email lookups with date ordering
-- Optimizes: getCohortAnalysis()
-- Query pattern: WHERE photographer_id = ? AND status = 'succeeded' ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_cohort_analysis
  ON public.gallery_purchases(photographer_id, buyer_email, created_at)
  WHERE status = 'succeeded';

COMMENT ON INDEX idx_gallery_purchases_cohort_analysis IS 
  'Optimizes cohort analysis queries grouping purchases by buyer email and date';

-- Index for access verification by session ID (complements existing buyer_email index)
-- Optimizes: verifyPurchase(), checkAccess() for guest purchases
-- Query pattern: WHERE gallery_id = ? AND buyer_session_id = ? AND status = 'succeeded'
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_session_access
  ON public.gallery_purchases(gallery_id, buyer_session_id, status)
  WHERE buyer_session_id IS NOT NULL AND status = 'succeeded';

COMMENT ON INDEX idx_gallery_purchases_session_access IS 
  'Optimizes access verification for guest purchases using session ID';

-- Index for currency-based aggregations
-- Optimizes: Revenue reports that group by currency
-- Query pattern: WHERE photographer_id = ? AND status = 'succeeded' GROUP BY currency
CREATE INDEX IF NOT EXISTS idx_gallery_purchases_currency
  ON public.gallery_purchases(photographer_id, currency)
  WHERE status = 'succeeded';

COMMENT ON INDEX idx_gallery_purchases_currency IS 
  'Optimizes revenue aggregation queries that group by currency';

-- ============================================================================
-- GALLERY_MONETIZATION INDEXES
-- ============================================================================

-- Index for top galleries sorting by revenue
-- Optimizes: getTopGalleries(), getRevenueByGallery()
-- Query pattern: WHERE is_enabled = true ORDER BY total_revenue_cents DESC
CREATE INDEX IF NOT EXISTS idx_gallery_monetization_revenue_ranking
  ON public.gallery_monetization(total_revenue_cents DESC)
  WHERE is_enabled = true;

COMMENT ON INDEX idx_gallery_monetization_revenue_ranking IS 
  'Optimizes top galleries queries sorting by total revenue';

-- Index for conversion rate analysis
-- Optimizes: Analytics queries that filter by conversion rate
-- Query pattern: WHERE is_enabled = true ORDER BY conversion_rate DESC
CREATE INDEX IF NOT EXISTS idx_gallery_monetization_conversion
  ON public.gallery_monetization(conversion_rate DESC)
  WHERE is_enabled = true;

COMMENT ON INDEX idx_gallery_monetization_conversion IS 
  'Optimizes analytics queries sorting by conversion rate';

-- ============================================================================
-- GALLERY_EVENTS INDEXES
-- ============================================================================

-- Note: The gallery_events table doesn't have a photographer_id column.
-- The revenue service queries join through galleries table to filter by photographer.
-- We add indexes to optimize the join and event type filtering.

-- Index for funnel analytics: event type with date filtering
-- Optimizes: getConversionFunnel(), getDetailedConversionFunnel()
-- Query pattern: WHERE gallery_id = ? AND event_type = ? AND created_at BETWEEN ? AND ?
CREATE INDEX IF NOT EXISTS idx_gallery_events_funnel_analytics
  ON public.gallery_events(gallery_id, event_type, created_at DESC);

COMMENT ON INDEX idx_gallery_events_funnel_analytics IS 
  'Optimizes conversion funnel queries filtering by gallery, event type, and date range';

-- Index for view counting (most common event type query)
-- Optimizes: getConversionFunnel() view counts
-- Query pattern: WHERE event_type = 'view' AND gallery_id = ?
CREATE INDEX IF NOT EXISTS idx_gallery_events_views
  ON public.gallery_events(gallery_id)
  WHERE event_type = 'view';

COMMENT ON INDEX idx_gallery_events_views IS 
  'Optimizes gallery view counting queries';

-- Index for paywall view counting
-- Optimizes: getConversionFunnel() paywall view counts
-- Query pattern: WHERE event_type = 'paywall_view' AND gallery_id = ?
CREATE INDEX IF NOT EXISTS idx_gallery_events_paywall_views
  ON public.gallery_events(gallery_id)
  WHERE event_type = 'paywall_view';

COMMENT ON INDEX idx_gallery_events_paywall_views IS 
  'Optimizes paywall view counting queries';

-- Index for checkout start counting
-- Optimizes: getConversionFunnel() checkout start counts
-- Query pattern: WHERE event_type = 'checkout_start' AND gallery_id = ?
CREATE INDEX IF NOT EXISTS idx_gallery_events_checkout_starts
  ON public.gallery_events(gallery_id)
  WHERE event_type = 'checkout_start';

COMMENT ON INDEX idx_gallery_events_checkout_starts IS 
  'Optimizes checkout start counting queries';

-- ============================================================================
-- PHOTOGRAPHER_PAYOUTS INDEXES
-- ============================================================================

-- Index for paid payouts lookup (for related sales calculation)
-- Optimizes: getPayoutDetails() related sales query
-- Query pattern: WHERE photographer_id = ? AND status = 'paid' ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_photographer_payouts_paid
  ON public.photographer_payouts(photographer_id, created_at DESC)
  WHERE status = 'paid';

COMMENT ON INDEX idx_photographer_payouts_paid IS 
  'Optimizes queries for paid payouts when calculating related sales';

-- ============================================================================
-- WEBHOOK_EVENTS INDEXES
-- ============================================================================

-- Index for failed webhook retry queries
-- Optimizes: Webhook retry logic that finds failed events to retry
-- Query pattern: WHERE status = 'failed' AND retry_count < ? ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_webhook_events_retry_queue
  ON public.webhook_events(created_at ASC, retry_count)
  WHERE status = 'failed';

COMMENT ON INDEX idx_webhook_events_retry_queue IS 
  'Optimizes webhook retry queue queries for failed events';

-- Index for event type filtering with date
-- Optimizes: Admin queries filtering by event type and date
-- Query pattern: WHERE event_type = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_webhook_events_type_date
  ON public.webhook_events(event_type, created_at DESC);

COMMENT ON INDEX idx_webhook_events_type_date IS 
  'Optimizes webhook event queries filtering by type and date';

-- ============================================================================
-- IN_APP_NOTIFICATIONS INDEXES
-- ============================================================================

-- Index for notification listing with type filter
-- Optimizes: getNotifications() with type filter
-- Query pattern: WHERE user_id = ? AND type = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_in_app_notifications_user_type
  ON public.in_app_notifications(user_id, type, created_at DESC);

COMMENT ON INDEX idx_in_app_notifications_user_type IS 
  'Optimizes notification queries filtering by user and type';

-- ============================================================================
-- STRIPE_CONNECT_ACCOUNTS INDEXES
-- ============================================================================

-- Index for active accounts lookup
-- Optimizes: Queries that filter for accounts ready to accept payments
-- Query pattern: WHERE charges_enabled = true AND payouts_enabled = true
CREATE INDEX IF NOT EXISTS idx_connect_accounts_active
  ON public.stripe_connect_accounts(user_id)
  WHERE charges_enabled = true AND payouts_enabled = true;

COMMENT ON INDEX idx_connect_accounts_active IS 
  'Optimizes queries for active Connect accounts that can accept payments';

-- ============================================================================
-- ADD MISSING EVENT TYPES TO GALLERY_EVENTS
-- ============================================================================

-- The revenue service queries for event types that may not be in the original constraint.
-- We need to add 'view', 'paywall_view', and 'checkout_start' event types.

-- First, drop the existing constraint
ALTER TABLE public.gallery_events DROP CONSTRAINT IF EXISTS check_event_type;

-- Add updated constraint with monetization event types
ALTER TABLE public.gallery_events ADD CONSTRAINT check_event_type CHECK (
  event_type IN (
    -- Original event types
    'lightbox_open',
    'download_single',
    'download_all',
    'download_selection',
    'download_favorites',
    'favorite_add',
    'favorite_remove',
    'cta_click',
    'slideshow_start',
    'slideshow_end',
    'session_start',
    'session_end',
    -- Monetization event types (added for funnel analytics)
    'view',
    'paywall_view',
    'checkout_start',
    'purchase_complete'
  )
);

COMMENT ON CONSTRAINT check_event_type ON public.gallery_events IS 
  'Validates event types including monetization funnel events (view, paywall_view, checkout_start, purchase_complete)';

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================
-- Update table statistics for the query planner after adding indexes

ANALYZE public.gallery_purchases;
ANALYZE public.gallery_monetization;
ANALYZE public.gallery_events;
ANALYZE public.photographer_payouts;
ANALYZE public.webhook_events;
ANALYZE public.in_app_notifications;
ANALYZE public.stripe_connect_accounts;

-- ============================================================================
-- VERIFICATION QUERIES (for testing)
-- ============================================================================
-- Run these queries to verify indexes are being used:
--
-- EXPLAIN ANALYZE SELECT * FROM gallery_purchases 
--   WHERE photographer_id = 'uuid' AND status = 'succeeded' AND created_at >= '2026-01-01';
--
-- EXPLAIN ANALYZE SELECT * FROM gallery_monetization 
--   WHERE is_enabled = true ORDER BY total_revenue_cents DESC LIMIT 5;
--
-- EXPLAIN ANALYZE SELECT COUNT(*) FROM gallery_events 
--   WHERE gallery_id = 'uuid' AND event_type = 'view';
-- ============================================================================
