-- Migration: Admin Dashboard Schema Extension
-- Adds admin role to profiles and creates audit_logs table for admin actions

-- Add is_admin column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add is_suspended column to profiles table for user suspension feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE;

-- Create audit action type enum
CREATE TYPE public.audit_action_type AS ENUM (
  'user_view',
  'user_update',
  'user_suspend',
  'user_reactivate',
  'gallery_view',
  'gallery_deactivate',
  'gallery_delete',
  'subscription_update',
  'subscription_cancel',
  'admin_login'
);

-- Create audit entity type enum
CREATE TYPE public.audit_entity_type AS ENUM (
  'user',
  'gallery',
  'subscription',
  'system'
);

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action_type public.audit_action_type NOT NULL,
  entity_type public.audit_entity_type NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON public.audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX idx_audit_logs_entity_type ON public.audit_logs(entity_type);

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs - only admin users can access

-- Admin users can view all audit logs
CREATE POLICY "Admin users can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can insert audit logs
CREATE POLICY "Admin users can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Prevent updates to audit logs (immutability)
-- No UPDATE policy means no one can update audit logs

-- Prevent deletes from audit logs (immutability)
-- No DELETE policy means no one can delete audit logs

-- Update profiles RLS to allow admin users to view all profiles
CREATE POLICY "Admin users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.is_admin = true
  )
);

-- Admin users can update any profile
CREATE POLICY "Admin users can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles AS admin_profile
    WHERE admin_profile.id = auth.uid()
    AND admin_profile.is_admin = true
  )
);

-- Update galleries RLS to allow admin users to view all galleries
CREATE POLICY "Admin users can view all galleries"
ON public.galleries FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can update any gallery
CREATE POLICY "Admin users can update any gallery"
ON public.galleries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can delete any gallery
CREATE POLICY "Admin users can delete any gallery"
ON public.galleries FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Update images RLS to allow admin users to view all images
CREATE POLICY "Admin users can view all images"
ON public.images FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = images.gallery_id
    AND galleries.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can delete any image
CREATE POLICY "Admin users can delete any image"
ON public.images FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Add comment for documentation
COMMENT ON TABLE public.audit_logs IS 'Immutable audit log for all administrative actions. Entries cannot be modified or deleted.';
COMMENT ON COLUMN public.profiles.is_admin IS 'Flag indicating if the user has administrator privileges';
COMMENT ON COLUMN public.profiles.is_suspended IS 'Flag indicating if the user account is suspended';
