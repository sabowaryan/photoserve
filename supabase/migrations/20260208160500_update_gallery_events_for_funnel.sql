-- Migration: Update gallery_events to support funnel events
-- Date: 2026-02-08
-- Description: Add funnel event types and RLS policies for public tracking

-- Drop the old constraint
ALTER TABLE gallery_events DROP CONSTRAINT IF EXISTS check_event_type;

-- Add new constraint with funnel event types
ALTER TABLE gallery_events ADD CONSTRAINT check_event_type CHECK (
  event_type IN (
    -- Gallery events
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
    -- Funnel events
    'page_view',
    'quiz_started',
    'quiz_completed',
    'quiz_skipped',
    'guest_upload_started',
    'guest_upload_completed',
    'signup_started',
    'signup_step_completed',
    'signup_completed',
    'signup_trigger_shown',
    'signup_modal_shown',
    'signup_modal_dismissed',
    'onboarding_started',
    'onboarding_step_completed',
    'onboarding_task_completed',
    'first_gallery_created',
    'upgrade_modal_shown',
    'upgrade_modal_dismissed',
    'upgrade_completed',
    'roi_calculator_used',
    'comparison_table_viewed',
    'testimonial_video_played'
  )
);

-- Make gallery_id nullable to allow funnel events without a gallery
ALTER TABLE gallery_events ALTER COLUMN gallery_id DROP NOT NULL;

-- Drop existing foreign key constraint
ALTER TABLE gallery_events DROP CONSTRAINT IF EXISTS gallery_events_gallery_id_fkey;

-- Add foreign key back but allow NULL for funnel events
ALTER TABLE gallery_events ADD CONSTRAINT gallery_events_gallery_id_fkey
FOREIGN KEY (gallery_id) REFERENCES galleries(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE gallery_events ENABLE ROW LEVEL SECURITY;

-- Allow public (including anonymous) to insert events
CREATE POLICY "allow_public_insert_gallery_events"
ON gallery_events
FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to read events (for analytics dashboards)
CREATE POLICY "allow_public_read_gallery_events"
ON gallery_events
FOR SELECT
TO public
USING (true);

-- Update comment
COMMENT ON TABLE gallery_events IS 'Tracks user interactions and events in galleries and funnel events for conversion tracking. Public access allowed for analytics. Use gallery_id=NULL for funnel events.';
