-- Migration: Create upgrade_trigger_logs table
-- Requirements: 8.8
-- Description: Track upgrade trigger effectiveness and user interactions

-- Create upgrade_trigger_logs table
CREATE TABLE IF NOT EXISTS upgrade_trigger_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('limit_reached', 'feature_locked', 'time_based', 'behavior_based')),
  shown BOOLEAN DEFAULT FALSE,
  shown_at TIMESTAMP WITH TIME ZONE,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  converted BOOLEAN DEFAULT FALSE,
  converted_at TIMESTAMP WITH TIME ZONE,
  plan_selected TEXT CHECK (plan_selected IN ('premium', 'pro')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_upgrade_trigger_logs_user_id ON upgrade_trigger_logs(user_id);
CREATE INDEX idx_upgrade_trigger_logs_trigger_type ON upgrade_trigger_logs(trigger_type);
CREATE INDEX idx_upgrade_trigger_logs_shown_at ON upgrade_trigger_logs(shown_at);
CREATE INDEX idx_upgrade_trigger_logs_converted ON upgrade_trigger_logs(converted);
CREATE INDEX idx_upgrade_trigger_logs_user_trigger ON upgrade_trigger_logs(user_id, trigger_type);

-- Add RLS policies
ALTER TABLE upgrade_trigger_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own logs
CREATE POLICY "Users can view their own upgrade trigger logs"
  ON upgrade_trigger_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own logs
CREATE POLICY "Users can insert their own upgrade trigger logs"
  ON upgrade_trigger_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own logs
CREATE POLICY "Users can update their own upgrade trigger logs"
  ON upgrade_trigger_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_upgrade_trigger_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_upgrade_trigger_logs_updated_at
  BEFORE UPDATE ON upgrade_trigger_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_upgrade_trigger_logs_updated_at();

-- Add comment
COMMENT ON TABLE upgrade_trigger_logs IS 'Tracks upgrade trigger effectiveness and user interactions for conversion optimization';
