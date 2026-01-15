-- Migration: Add alt_text column to images table for AI-generated captions
-- Requirements: 10.2.1, 10.2.2
-- Date: 2026-01-15

-- ============================================================================
-- ADD ALT_TEXT COLUMN TO IMAGES
-- ============================================================================

-- Add alt_text column for AI-generated image descriptions
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS alt_text TEXT;

-- Add quality_score column for smart culling
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS quality_score INTEGER CHECK (quality_score >= 0 AND quality_score <= 100);

-- Add quality_flags JSONB column for detailed quality analysis
ALTER TABLE public.images 
ADD COLUMN IF NOT EXISTS quality_flags JSONB DEFAULT '{}'::jsonb;

-- Create index for quality score queries
CREATE INDEX IF NOT EXISTS idx_images_quality_score ON public.images(quality_score) WHERE quality_score IS NOT NULL;

-- Create index for quality flags queries
CREATE INDEX IF NOT EXISTS idx_images_quality_flags ON public.images USING gin(quality_flags);

-- Add comments to document column purposes
COMMENT ON COLUMN public.images.alt_text IS 
'AI-generated alt-text for accessibility and SEO. Can be edited by photographer.';

COMMENT ON COLUMN public.images.quality_score IS 
'AI-generated quality score (0-100) for smart culling. Higher is better.';

COMMENT ON COLUMN public.images.quality_flags IS 
'AI-generated quality analysis flags:
{
  "isBlurry": boolean,
  "hasClosedEyes": boolean,
  "isDuplicate": boolean,
  "duplicateOf": string (image_id),
  "analyzedAt": timestamp
}';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON COLUMN public.images.alt_text IS 'AI Features Migration - Auto-Caption (Req 10.2)';
COMMENT ON COLUMN public.images.quality_score IS 'AI Features Migration - Smart Culling (Req 10.3)';
