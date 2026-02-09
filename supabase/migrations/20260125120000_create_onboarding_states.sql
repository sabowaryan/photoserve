-- Migration: Create onboarding_states table for tracking individual task completion
-- Feature: sales-funnel-optimization
-- Requirements: 7.3, 7.7

-- Create onboarding_states table
CREATE TABLE IF NOT EXISTS public.onboarding_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, step_id)
);

-- Create indexes for efficient lookups
CREATE INDEX idx_onboarding_states_user ON public.onboarding_states(user_id);
CREATE INDEX idx_onboarding_states_completed ON public.onboarding_states(user_id, completed);

-- Enable RLS
ALTER TABLE public.onboarding_states ENABLE ROW LEVEL SECURITY;

-- Users can view their own onboarding states
CREATE POLICY "Users can view their own onboarding states"
ON public.onboarding_states FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own onboarding states
CREATE POLICY "Users can insert their own onboarding states"
ON public.onboarding_states FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Users can update their own onboarding states
CREATE POLICY "Users can update their own onboarding states"
ON public.onboarding_states FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Admin can view all onboarding states
CREATE POLICY "Admin can view all onboarding states"
ON public.onboarding_states FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Trigger for updated_at
CREATE TRIGGER update_onboarding_states_updated_at
  BEFORE UPDATE ON public.onboarding_states
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.onboarding_states IS 
  'Tracks individual onboarding task completion for users';

COMMENT ON COLUMN public.onboarding_states.step_id IS 
  'Task identifier (create_first_gallery, customize_profile, add_logo, invite_test_client)';

COMMENT ON COLUMN public.onboarding_states.completed IS 
  'Whether the task has been completed';

COMMENT ON COLUMN public.onboarding_states.skipped IS 
  'Whether the task was skipped by the user';

COMMENT ON COLUMN public.onboarding_states.attempts IS 
  'Number of times the user attempted this task';
