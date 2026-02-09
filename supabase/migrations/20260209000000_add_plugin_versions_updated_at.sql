-- Migration: Add updated_at column to plugin_versions table
-- This column tracks when a version record was last modified

-- Add updated_at column
ALTER TABLE public.plugin_versions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_plugin_versions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_plugin_versions_updated_at ON public.plugin_versions;

-- Create trigger
CREATE TRIGGER trigger_update_plugin_versions_updated_at
  BEFORE UPDATE ON public.plugin_versions
  FOR EACH ROW
  EXECUTE FUNCTION update_plugin_versions_updated_at();

-- Add comment
COMMENT ON COLUMN public.plugin_versions.updated_at IS 'Timestamp of last update to this version record';
