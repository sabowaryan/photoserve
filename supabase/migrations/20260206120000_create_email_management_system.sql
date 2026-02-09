-- Migration: Email Management System
-- Date: 2026-02-06
-- Description: Creates comprehensive email management infrastructure including:
--              - Email provider configuration (Resend, AWS SES)
--              - Sender address management with verification
--              - Email templates with versioning support
--              - Email queue with priority and retry logic
--              - Email logs and event tracking
--              - Bounce/complaint suppression management
--              - Unsubscribe management for marketing emails

-- ============================================================================
-- TABLE: email_providers
-- Description: Stores email service provider configurations (Resend, AWS SES)
-- ============================================================================

CREATE TABLE public.email_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT FALSE,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_provider_name CHECK (name IN ('resend', 'aws-ses')),
  CONSTRAINT valid_config CHECK (jsonb_typeof(config) = 'object')
);

-- Indexes for email_providers table
CREATE INDEX idx_email_providers_active ON public.email_providers(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_email_providers_name ON public.email_providers(name);

-- Comments for documentation
COMMENT ON TABLE public.email_providers IS 'Email service provider configurations with encrypted credentials';
COMMENT ON COLUMN public.email_providers.name IS 'Provider name: "resend" or "aws-ses"';
COMMENT ON COLUMN public.email_providers.is_active IS 'Only one provider can be active at a time';
COMMENT ON COLUMN public.email_providers.config IS 'Encrypted provider configuration (API keys, region, etc.)';


-- ============================================================================
-- TABLE: sender_addresses
-- Description: Manages verified sender email addresses
-- ============================================================================

CREATE TABLE public.sender_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255),
  is_verified BOOLEAN DEFAULT FALSE,
  is_default BOOLEAN DEFAULT FALSE,
  domain_records JSONB,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_name CHECK (name IS NULL OR LENGTH(name) >= 1),
  CONSTRAINT verified_timestamp CHECK (
    (is_verified = TRUE AND verified_at IS NOT NULL) OR
    (is_verified = FALSE AND verified_at IS NULL)
  )
);

-- Indexes for sender_addresses table
CREATE INDEX idx_sender_addresses_email ON public.sender_addresses(email);
CREATE INDEX idx_sender_addresses_verified ON public.sender_addresses(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_sender_addresses_default ON public.sender_addresses(is_default) WHERE is_default = TRUE;

-- Comments for documentation
COMMENT ON TABLE public.sender_addresses IS 'Verified sender email addresses for sending emails';
COMMENT ON COLUMN public.sender_addresses.email IS 'Sender email address (must be verified)';
COMMENT ON COLUMN public.sender_addresses.name IS 'Display name for the sender';
COMMENT ON COLUMN public.sender_addresses.is_verified IS 'Whether the email/domain has been verified';
COMMENT ON COLUMN public.sender_addresses.is_default IS 'Default sender address for the system';
COMMENT ON COLUMN public.sender_addresses.domain_records IS 'DKIM, SPF, and DMARC records for domain verification';


-- ============================================================================
-- TABLE: email_templates
-- Description: Stores email templates (React Email and custom WYSIWYG)
-- ============================================================================

CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  source VARCHAR(50) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content JSONB NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  active_version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_type CHECK (type IN ('transactional', 'marketing')),
  CONSTRAINT valid_source CHECK (source IN ('react-email', 'custom')),
  CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9-]+$'),
  CONSTRAINT valid_name CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
  CONSTRAINT valid_subject CHECK (LENGTH(subject) >= 1 AND LENGTH(subject) <= 500),
  CONSTRAINT valid_active_version CHECK (active_version >= 1)
);

-- Indexes for email_templates table
CREATE INDEX idx_email_templates_slug ON public.email_templates(slug);
CREATE INDEX idx_email_templates_type ON public.email_templates(type);
CREATE INDEX idx_email_templates_source ON public.email_templates(source);
CREATE INDEX idx_email_templates_active ON public.email_templates(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_email_templates_created_at ON public.email_templates(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.email_templates IS 'Email templates with support for React Email and custom WYSIWYG templates';
COMMENT ON COLUMN public.email_templates.name IS 'Human-readable template name';
COMMENT ON COLUMN public.email_templates.slug IS 'URL-safe identifier (e.g., "purchase-confirmation")';
COMMENT ON COLUMN public.email_templates.type IS 'Template type: "transactional" or "marketing"';
COMMENT ON COLUMN public.email_templates.source IS 'Template source: "react-email" or "custom"';
COMMENT ON COLUMN public.email_templates.subject IS 'Email subject line (supports variables)';
COMMENT ON COLUMN public.email_templates.content IS 'Template content (HTML for custom, component path for React Email)';
COMMENT ON COLUMN public.email_templates.variables IS 'Array of required variable names';
COMMENT ON COLUMN public.email_templates.active_version IS 'Currently active version number';


-- ============================================================================
-- TABLE: template_versions
-- Description: Stores version history for email templates
-- ============================================================================

CREATE TABLE public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.email_templates(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  subject VARCHAR(500) NOT NULL,
  content JSONB NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_version CHECK (version >= 1),
  CONSTRAINT valid_subject_length CHECK (LENGTH(subject) >= 1 AND LENGTH(subject) <= 500),
  UNIQUE(template_id, version)
);

-- Indexes for template_versions table
CREATE INDEX idx_template_versions_template_id ON public.template_versions(template_id);
CREATE INDEX idx_template_versions_version ON public.template_versions(template_id, version DESC);
CREATE INDEX idx_template_versions_created_by ON public.template_versions(created_by);
CREATE INDEX idx_template_versions_created_at ON public.template_versions(created_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.template_versions IS 'Version history for email templates';
COMMENT ON COLUMN public.template_versions.template_id IS 'Foreign key to email_templates';
COMMENT ON COLUMN public.template_versions.version IS 'Version number (incremental)';
COMMENT ON COLUMN public.template_versions.created_by IS 'Admin user who created this version';


-- ============================================================================
-- TABLE: email_queue
-- Description: Queue for pending and scheduled emails
-- ============================================================================

CREATE TABLE public.email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  variables JSONB,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  priority VARCHAR(20) DEFAULT 'normal',
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_from_address CHECK (from_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_to_address CHECK (to_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'normal', 'low')),
  CONSTRAINT valid_type CHECK (type IN ('transactional', 'marketing')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries),
  CONSTRAINT valid_max_retries CHECK (max_retries >= 0 AND max_retries <= 10),
  CONSTRAINT valid_subject CHECK (LENGTH(subject) >= 1 AND LENGTH(subject) <= 500)
);

-- Indexes for email_queue table
CREATE INDEX idx_email_queue_status ON public.email_queue(status, scheduled_at) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_email_queue_priority ON public.email_queue(priority, created_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_scheduled ON public.email_queue(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'pending';
CREATE INDEX idx_email_queue_template_id ON public.email_queue(template_id);
CREATE INDEX idx_email_queue_created_at ON public.email_queue(created_at DESC);
CREATE INDEX idx_email_queue_to_address ON public.email_queue(to_address);

-- Comments for documentation
COMMENT ON TABLE public.email_queue IS 'Queue for pending and scheduled emails with retry logic';
COMMENT ON COLUMN public.email_queue.priority IS 'Email priority: "high", "normal", or "low"';
COMMENT ON COLUMN public.email_queue.type IS 'Email type: "transactional" or "marketing"';
COMMENT ON COLUMN public.email_queue.status IS 'Queue status: "pending", "processing", "sent", "failed", or "cancelled"';
COMMENT ON COLUMN public.email_queue.scheduled_at IS 'When to send the email (null for immediate)';
COMMENT ON COLUMN public.email_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN public.email_queue.max_retries IS 'Maximum number of retry attempts allowed';


-- ============================================================================
-- TABLE: email_logs
-- Description: Comprehensive log of all email sending attempts
-- ============================================================================

CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES public.email_queue(id) ON DELETE SET NULL,
  provider VARCHAR(50) NOT NULL,
  provider_message_id VARCHAR(255),
  from_address VARCHAR(255) NOT NULL,
  to_address VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_id UUID REFERENCES public.email_templates(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_provider CHECK (provider IN ('resend', 'aws-ses')),
  CONSTRAINT valid_status CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  CONSTRAINT valid_from_address CHECK (from_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_to_address CHECK (to_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Indexes for email_logs table
CREATE INDEX idx_email_logs_queue_id ON public.email_logs(queue_id);
CREATE INDEX idx_email_logs_provider_message_id ON public.email_logs(provider_message_id);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_template_id ON public.email_logs(template_id);
CREATE INDEX idx_email_logs_to_address ON public.email_logs(to_address);
CREATE INDEX idx_email_logs_created_at ON public.email_logs(created_at DESC);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at DESC) WHERE sent_at IS NOT NULL;
CREATE INDEX idx_email_logs_metadata ON public.email_logs USING GIN (metadata);

-- Comments for documentation
COMMENT ON TABLE public.email_logs IS 'Comprehensive log of all email sending attempts and delivery events';
COMMENT ON COLUMN public.email_logs.provider IS 'Email provider used: "resend" or "aws-ses"';
COMMENT ON COLUMN public.email_logs.provider_message_id IS 'Unique message ID from the email provider';
COMMENT ON COLUMN public.email_logs.status IS 'Current email status';
COMMENT ON COLUMN public.email_logs.metadata IS 'Additional JSON data (tags, custom headers, etc.)';


-- ============================================================================
-- TABLE: email_events
-- Description: Detailed tracking of email events (opens, clicks, etc.)
-- ============================================================================

CREATE TABLE public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID NOT NULL REFERENCES public.email_logs(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_event_type CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  CONSTRAINT valid_user_agent CHECK (user_agent IS NULL OR LENGTH(user_agent) <= 1000)
);

-- Indexes for email_events table
CREATE INDEX idx_email_events_log_id ON public.email_events(log_id);
CREATE INDEX idx_email_events_type ON public.email_events(event_type);
CREATE INDEX idx_email_events_created_at ON public.email_events(created_at DESC);
CREATE INDEX idx_email_events_data ON public.email_events USING GIN (event_data);

-- Comments for documentation
COMMENT ON TABLE public.email_events IS 'Detailed tracking of email events for analytics';
COMMENT ON COLUMN public.email_events.event_type IS 'Type of event: "sent", "delivered", "opened", "clicked", "bounced", "complained", or "failed"';
COMMENT ON COLUMN public.email_events.event_data IS 'Additional event data (clicked URL, bounce reason, etc.)';
COMMENT ON COLUMN public.email_events.ip_address IS 'IP address of the recipient (for opens/clicks)';
COMMENT ON COLUMN public.email_events.user_agent IS 'User agent string (for opens/clicks)';


-- ============================================================================
-- TABLE: email_suppressions
-- Description: Tracks bounced and complained email addresses
-- ============================================================================

CREATE TABLE public.email_suppressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  reason VARCHAR(50) NOT NULL,
  bounce_type VARCHAR(50),
  count INTEGER DEFAULT 1,
  first_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  last_occurred_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_reason CHECK (reason IN ('bounce', 'complaint')),
  CONSTRAINT valid_bounce_type CHECK (bounce_type IS NULL OR bounce_type IN ('hard', 'soft')),
  CONSTRAINT valid_count CHECK (count >= 1)
);

-- Indexes for email_suppressions table
CREATE INDEX idx_email_suppressions_email ON public.email_suppressions(email);
CREATE INDEX idx_email_suppressions_reason ON public.email_suppressions(reason);
CREATE INDEX idx_email_suppressions_bounce_type ON public.email_suppressions(bounce_type) WHERE bounce_type IS NOT NULL;
CREATE INDEX idx_email_suppressions_last_occurred ON public.email_suppressions(last_occurred_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.email_suppressions IS 'Suppression list for bounced and complained email addresses';
COMMENT ON COLUMN public.email_suppressions.email IS 'Suppressed email address';
COMMENT ON COLUMN public.email_suppressions.reason IS 'Suppression reason: "bounce" or "complaint"';
COMMENT ON COLUMN public.email_suppressions.bounce_type IS 'Bounce type: "hard" or "soft" (null for complaints)';
COMMENT ON COLUMN public.email_suppressions.count IS 'Number of times this email has bounced/complained';


-- ============================================================================
-- TABLE: email_unsubscribes
-- Description: Manages unsubscribes from marketing emails
-- ============================================================================

CREATE TABLE public.email_unsubscribes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  reason TEXT,
  unsubscribed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_reason CHECK (reason IS NULL OR LENGTH(reason) <= 1000)
);

-- Indexes for email_unsubscribes table
CREATE INDEX idx_email_unsubscribes_email ON public.email_unsubscribes(email);
CREATE INDEX idx_email_unsubscribes_unsubscribed_at ON public.email_unsubscribes(unsubscribed_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.email_unsubscribes IS 'Unsubscribe list for marketing emails';
COMMENT ON COLUMN public.email_unsubscribes.email IS 'Unsubscribed email address';
COMMENT ON COLUMN public.email_unsubscribes.reason IS 'Optional reason for unsubscribing';


-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Description: Enforce admin-only access to email management tables
-- ============================================================================

-- Enable RLS on all email management tables
ALTER TABLE public.email_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sender_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: email_providers (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email providers"
ON public.email_providers FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email providers"
ON public.email_providers FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: sender_addresses (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view sender addresses"
ON public.sender_addresses FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage sender addresses"
ON public.sender_addresses FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_templates (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email templates"
ON public.email_templates FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email templates"
ON public.email_templates FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: template_versions (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view template versions"
ON public.template_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage template versions"
ON public.template_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_queue (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email queue"
ON public.email_queue FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email queue"
ON public.email_queue FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_logs (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email logs"
ON public.email_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email logs"
ON public.email_logs FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_events (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email events"
ON public.email_events FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email events"
ON public.email_events FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_suppressions (Admin only)
-- ============================================================================

CREATE POLICY "Admin users can view email suppressions"
ON public.email_suppressions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email suppressions"
ON public.email_suppressions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: email_unsubscribes (Admin only for management, public for insert)
-- ============================================================================

CREATE POLICY "Admin users can view email unsubscribes"
ON public.email_unsubscribes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

CREATE POLICY "Admin users can manage email unsubscribes"
ON public.email_unsubscribes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Allow anyone to unsubscribe (for unsubscribe links in emails)
CREATE POLICY "Anyone can unsubscribe from marketing emails"
ON public.email_unsubscribes FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- Description: Automated functions for email management
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_email_providers_updated_at
  BEFORE UPDATE ON public.email_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sender_addresses_updated_at
  BEFORE UPDATE ON public.sender_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at
  BEFORE UPDATE ON public.email_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON public.email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one provider is active
CREATE OR REPLACE FUNCTION ensure_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE public.email_providers
    SET is_active = FALSE
    WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_active_provider_trigger
  BEFORE INSERT OR UPDATE ON public.email_providers
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION ensure_single_active_provider();

-- Function to ensure only one default sender
CREATE OR REPLACE FUNCTION ensure_single_default_sender()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE public.sender_addresses
    SET is_default = FALSE
    WHERE id != NEW.id AND is_default = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_sender_trigger
  BEFORE INSERT OR UPDATE ON public.sender_addresses
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_sender();

-- Function to automatically update email log status based on events
CREATE OR REPLACE FUNCTION update_email_log_from_event()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.email_logs
  SET 
    status = NEW.event_type,
    opened_at = CASE WHEN NEW.event_type = 'opened' THEN NEW.created_at ELSE opened_at END,
    clicked_at = CASE WHEN NEW.event_type = 'clicked' THEN NEW.created_at ELSE clicked_at END,
    bounced_at = CASE WHEN NEW.event_type = 'bounced' THEN NEW.created_at ELSE bounced_at END,
    complained_at = CASE WHEN NEW.event_type = 'complained' THEN NEW.created_at ELSE complained_at END,
    failed_at = CASE WHEN NEW.event_type = 'failed' THEN NEW.created_at ELSE failed_at END,
    delivered_at = CASE WHEN NEW.event_type = 'delivered' THEN NEW.created_at ELSE delivered_at END,
    updated_at = NOW()
  WHERE id = NEW.log_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_log_from_event_trigger
  AFTER INSERT ON public.email_events
  FOR EACH ROW
  EXECUTE FUNCTION update_email_log_from_event();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add final comment
COMMENT ON SCHEMA public IS 'Email Management System tables created successfully';
