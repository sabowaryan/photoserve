-- Migration: Fix email_providers config column type for encryption
-- Date: 2026-02-06
-- Description: Changes the config column from JSONB to TEXT to support encrypted storage
--              The EmailProviderService encrypts credentials before storing them,
--              so we need to store the encrypted string, not JSON.

-- Drop the constraint that checks for JSONB object type
ALTER TABLE public.email_providers
DROP CONSTRAINT IF EXISTS valid_config;

-- Change the config column type from JSONB to TEXT
ALTER TABLE public.email_providers
ALTER COLUMN config TYPE TEXT USING config::TEXT;

-- Add a new constraint to ensure config is not empty
ALTER TABLE public.email_providers
ADD CONSTRAINT valid_config CHECK (LENGTH(config) > 0);

-- Update the comment to reflect the change
COMMENT ON COLUMN public.email_providers.config IS 'Encrypted provider configuration (stored as encrypted string)';
