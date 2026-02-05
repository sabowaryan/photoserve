-- Migration: Add comment_add event type to gallery_events
-- Date: 2026-01-19
-- Description: Adds support for tracking comment events in gallery analytics

-- Drop existing constraint
ALTER TABLE public.gallery_events DROP CONSTRAINT IF EXISTS check_event_type;

-- Add updated constraint with comment event type
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
    'comment_add',  -- NEW: Comment tracking
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
  'Validates event types including comment tracking, monetization funnel events, and user interactions';
