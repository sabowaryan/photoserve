-- Migration: Add visitor_id to gallery_analytics
-- Date: 2026-01-15
-- Description: Add visitor_id field for fingerprinting-based unique visitor tracking

-- Add visitor_id column
ALTER TABLE gallery_analytics 
ADD COLUMN IF NOT EXISTS visitor_id VARCHAR(255);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_visitor_id 
ON gallery_analytics(visitor_id);

-- Create composite index for gallery + visitor queries
CREATE INDEX IF NOT EXISTS idx_gallery_analytics_gallery_visitor 
ON gallery_analytics(gallery_id, visitor_id);

-- Add comment
COMMENT ON COLUMN gallery_analytics.visitor_id IS 'Unique visitor identifier from browser fingerprinting (FingerprintJS)';
