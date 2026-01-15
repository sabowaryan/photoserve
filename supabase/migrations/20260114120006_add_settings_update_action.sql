-- Migration: Add settings_update to audit_action_type enum
-- Date: 2026-01-14
-- Requirements: A.1.5 - Admin settings audit logging

-- ============================================================================
-- ADD SETTINGS_UPDATE TO AUDIT ACTION TYPE ENUM
-- ============================================================================

-- Add 'settings_update' to the audit_action_type enum
ALTER TYPE public.audit_action_type ADD VALUE IF NOT EXISTS 'settings_update';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TYPE public.audit_action_type IS 'Audit action types including settings_update (added 2026-01-14)';
