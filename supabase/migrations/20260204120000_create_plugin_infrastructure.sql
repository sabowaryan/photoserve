-- Migration: Lightroom Plugin Infrastructure
-- Date: 2026-02-04
-- Description: Creates tables for API key management, plugin version distribution,
--              download tracking, and usage analytics for the PikSend Lightroom plugin

-- ============================================================================
-- TABLE: api_keys
-- Description: Stores API keys for Lightroom plugin authentication
-- ============================================================================

CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['plugin:read', 'plugin:write'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT valid_name CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
  CONSTRAINT valid_prefix CHECK (LENGTH(key_prefix) = 12),
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Indexes for api_keys table
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX idx_api_keys_active ON public.api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_api_keys_expires_at ON public.api_keys(expires_at) WHERE expires_at IS NOT NULL;

-- Comments for documentation
COMMENT ON TABLE public.api_keys IS 'API keys for Lightroom plugin authentication. Keys are hashed with SHA-256 and never stored in plain text.';
COMMENT ON COLUMN public.api_keys.key_hash IS 'SHA-256 hash of the complete API key';
COMMENT ON COLUMN public.api_keys.key_prefix IS 'First 12 characters of the API key for display purposes';
COMMENT ON COLUMN public.api_keys.last_used_at IS 'Timestamp of most recent successful authentication';
COMMENT ON COLUMN public.api_keys.expires_at IS 'Optional expiration date, null means no expiration';
COMMENT ON COLUMN public.api_keys.is_active IS 'Boolean flag, false means key is revoked';


-- ============================================================================
-- TABLE: plugin_versions
-- Description: Stores plugin version information and download metadata
-- ============================================================================

CREATE TABLE public.plugin_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version VARCHAR(20) NOT NULL UNIQUE,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  changelog TEXT,
  is_stable BOOLEAN DEFAULT TRUE,
  min_lightroom_version VARCHAR(20) DEFAULT '11.0',
  release_date TIMESTAMPTZ DEFAULT NOW(),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_version CHECK (version ~ '^\d+\.\d+\.\d+(-[a-z]+)?$'),
  CONSTRAINT valid_file_size CHECK (file_size > 0),
  CONSTRAINT valid_download_count CHECK (download_count >= 0)
);

-- Indexes for plugin_versions table
CREATE INDEX idx_plugin_versions_version ON public.plugin_versions(version);
CREATE INDEX idx_plugin_versions_stable ON public.plugin_versions(is_stable) WHERE is_stable = TRUE;
CREATE INDEX idx_plugin_versions_release_date ON public.plugin_versions(release_date DESC);

-- Comments for documentation
COMMENT ON TABLE public.plugin_versions IS 'Plugin version information for distribution and update checking';
COMMENT ON COLUMN public.plugin_versions.version IS 'Semantic version string (e.g., "1.0.0", "1.1.0-beta")';
COMMENT ON COLUMN public.plugin_versions.file_url IS 'Cloudinary URL to the .lrplugin file';
COMMENT ON COLUMN public.plugin_versions.is_stable IS 'True for production releases, false for beta/alpha';
COMMENT ON COLUMN public.plugin_versions.min_lightroom_version IS 'Minimum Lightroom version required';
COMMENT ON COLUMN public.plugin_versions.download_count IS 'Number of times this version has been downloaded';


-- ============================================================================
-- TABLE: plugin_downloads
-- Description: Tracks plugin download events for analytics
-- ============================================================================

CREATE TABLE public.plugin_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  version_id UUID NOT NULL REFERENCES public.plugin_versions(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_user_agent CHECK (LENGTH(user_agent) <= 500)
);

-- Indexes for plugin_downloads table
CREATE INDEX idx_plugin_downloads_user_id ON public.plugin_downloads(user_id);
CREATE INDEX idx_plugin_downloads_version_id ON public.plugin_downloads(version_id);
CREATE INDEX idx_plugin_downloads_downloaded_at ON public.plugin_downloads(downloaded_at DESC);

-- Comments for documentation
COMMENT ON TABLE public.plugin_downloads IS 'Download tracking for plugin distribution analytics';
COMMENT ON COLUMN public.plugin_downloads.user_id IS 'Foreign key to auth.users, null if unauthenticated';
COMMENT ON COLUMN public.plugin_downloads.version_id IS 'Foreign key to plugin_versions';
COMMENT ON COLUMN public.plugin_downloads.ip_address IS 'IP address of the downloader';
COMMENT ON COLUMN public.plugin_downloads.user_agent IS 'Browser/client user agent string';


-- ============================================================================
-- TABLE: plugin_usage_logs
-- Description: Logs plugin actions for analytics and debugging
-- ============================================================================

CREATE TABLE public.plugin_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  plugin_version VARCHAR(20),
  lightroom_version VARCHAR(20),
  os_version VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_action CHECK (LENGTH(action) >= 1 AND LENGTH(action) <= 50)
);

-- Indexes for plugin_usage_logs table
CREATE INDEX idx_plugin_usage_logs_user_id ON public.plugin_usage_logs(user_id);
CREATE INDEX idx_plugin_usage_logs_action ON public.plugin_usage_logs(action);
CREATE INDEX idx_plugin_usage_logs_created_at ON public.plugin_usage_logs(created_at DESC);
CREATE INDEX idx_plugin_usage_logs_metadata ON public.plugin_usage_logs USING GIN (metadata);

-- Comments for documentation
COMMENT ON TABLE public.plugin_usage_logs IS 'Usage tracking for plugin actions and analytics';
COMMENT ON COLUMN public.plugin_usage_logs.action IS 'Type of action performed (e.g., "auth", "upload", "create_gallery")';
COMMENT ON COLUMN public.plugin_usage_logs.plugin_version IS 'Version of the plugin that performed the action';
COMMENT ON COLUMN public.plugin_usage_logs.lightroom_version IS 'Version of Lightroom being used';
COMMENT ON COLUMN public.plugin_usage_logs.os_version IS 'Operating system version';
COMMENT ON COLUMN public.plugin_usage_logs.metadata IS 'Additional JSON data specific to the action';


-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- Description: Enforce data access controls for plugin infrastructure tables
-- ============================================================================

-- Enable RLS on all plugin tables
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plugin_usage_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: api_keys
-- ============================================================================

-- Users can view their own API keys
CREATE POLICY "Users can view own API keys"
ON public.api_keys FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can create their own API keys
CREATE POLICY "Users can create own API keys"
ON public.api_keys FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update own API keys"
ON public.api_keys FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete own API keys"
ON public.api_keys FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Admin users can view all API keys
CREATE POLICY "Admin users can view all API keys"
ON public.api_keys FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can manage all API keys
CREATE POLICY "Admin users can manage all API keys"
ON public.api_keys FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: plugin_versions
-- ============================================================================

-- Anyone (authenticated or anonymous) can view stable plugin versions
CREATE POLICY "Anyone can view stable plugin versions"
ON public.plugin_versions FOR SELECT
TO authenticated, anon
USING (is_stable = true);

-- Admin users can view all plugin versions (including unstable)
CREATE POLICY "Admin users can view all plugin versions"
ON public.plugin_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can create plugin versions
CREATE POLICY "Admin users can create plugin versions"
ON public.plugin_versions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can update plugin versions
CREATE POLICY "Admin users can update plugin versions"
ON public.plugin_versions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Admin users can delete plugin versions
CREATE POLICY "Admin users can delete plugin versions"
ON public.plugin_versions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: plugin_downloads
-- ============================================================================

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads"
ON public.plugin_downloads FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can create download records
CREATE POLICY "Authenticated users can create downloads"
ON public.plugin_downloads FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admin users can view all downloads
CREATE POLICY "Admin users can view all downloads"
ON public.plugin_downloads FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- RLS POLICIES: plugin_usage_logs
-- ============================================================================

-- Users can view their own usage logs
CREATE POLICY "Users can view own usage logs"
ON public.plugin_usage_logs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can create usage logs
CREATE POLICY "Authenticated users can create usage logs"
ON public.plugin_usage_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Admin users can view all usage logs
CREATE POLICY "Admin users can view all usage logs"
ON public.plugin_usage_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add final comment
COMMENT ON SCHEMA public IS 'Lightroom Plugin Infrastructure tables created successfully';
