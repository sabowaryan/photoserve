-- Migration: Create gallery_events table
-- Date: 2026-01-15
-- Description: Track user interactions and events in galleries (Phase 3)

-- Create gallery_events table
CREATE TABLE IF NOT EXISTS gallery_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Visitor identification
  visitor_id VARCHAR(255), -- From fingerprinting
  visitor_ip VARCHAR(45),  -- Fallback
  
  -- Event details
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_event_type CHECK (
    event_type IN (
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
      'session_end'
    )
  )
);

-- Indexes for performance
CREATE INDEX idx_gallery_events_gallery_id ON gallery_events(gallery_id);
CREATE INDEX idx_gallery_events_visitor_id ON gallery_events(visitor_id);
CREATE INDEX idx_gallery_events_event_type ON gallery_events(event_type);
CREATE INDEX idx_gallery_events_created_at ON gallery_events(created_at);

-- Composite index for common queries
CREATE INDEX idx_gallery_events_gallery_type ON gallery_events(gallery_id, event_type);
CREATE INDEX idx_gallery_events_gallery_visitor ON gallery_events(gallery_id, visitor_id);

-- Comments
COMMENT ON TABLE gallery_events IS 'Tracks user interactions and events in galleries';
COMMENT ON COLUMN gallery_events.event_type IS 'Type of event: lightbox_open, download_*, favorite_*, cta_click, slideshow_*, session_*';
COMMENT ON COLUMN gallery_events.event_data IS 'Additional event data in JSON format (e.g., {imageId, duration, count})';

-- Example event_data structures:
-- lightbox_open: {"imageId": "uuid", "imageIndex": 0}
-- download_single: {"imageId": "uuid", "quality": "hd"}
-- download_all: {"imageCount": 150, "format": "zip"}
-- download_selection: {"imageIds": ["uuid1", "uuid2"], "count": 5}
-- download_favorites: {"imageIds": ["uuid1", "uuid2"], "count": 10}
-- favorite_add: {"imageId": "uuid"}
-- favorite_remove: {"imageId": "uuid"}
-- cta_click: {"ctaType": "contact", "ctaUrl": "mailto:..."}
-- slideshow_start: {"imageCount": 150, "interval": 5000}
-- slideshow_end: {"duration": 120, "imagesViewed": 24}
-- session_start: {"referrer": "https://...", "userAgent": "..."}
-- session_end: {"duration": 300, "eventsCount": 15}
