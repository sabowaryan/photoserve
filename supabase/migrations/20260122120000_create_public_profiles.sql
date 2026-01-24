-- Migration: Create public_profiles and profile_views tables for public photographer profiles
-- Feature: Public Photographer Profile
-- Requirements: 1.2, 9.1, 9.2

-- ============================================================================
-- Table: public_profiles
-- Description: Stores public profile information for Pro photographers
-- ============================================================================

CREATE TABLE public.public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Activation
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  
  -- Identity
  slug VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  tagline VARCHAR(100),
  bio TEXT,
  location VARCHAR(200),
  
  -- Media
  avatar_url TEXT,
  cover_image_url TEXT,
  
  -- Specialties
  specialties TEXT[],
  years_of_experience INTEGER,
  awards TEXT[],
  
  -- Contact
  public_email VARCHAR(255),
  phone VARCHAR(50),
  website TEXT,
  address TEXT,
  
  -- Social links (stored as JSONB)
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- CTA button (stored as JSONB)
  cta_button JSONB,
  
  -- Testimonials (stored as JSONB array)
  testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- Galleries
  featured_galleries UUID[],
  hidden_galleries UUID[],
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT[],
  
  -- Analytics
  views_count INTEGER DEFAULT 0 NOT NULL,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_user_profile UNIQUE(user_id),
  CONSTRAINT unique_slug UNIQUE(slug),
  CONSTRAINT check_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT check_slug_length CHECK (LENGTH(slug) <= 100 AND LENGTH(slug) > 0),
  CONSTRAINT check_tagline_length CHECK (tagline IS NULL OR LENGTH(tagline) <= 100),
  CONSTRAINT check_bio_length CHECK (bio IS NULL OR LENGTH(bio) <= 500),
  CONSTRAINT check_specialties_count CHECK (specialties IS NULL OR CARDINALITY(specialties) <= 5),
  CONSTRAINT check_awards_count CHECK (awards IS NULL OR CARDINALITY(awards) <= 3),
  CONSTRAINT check_meta_title_length CHECK (meta_title IS NULL OR LENGTH(meta_title) <= 60),
  CONSTRAINT check_meta_description_length CHECK (meta_description IS NULL OR LENGTH(meta_description) <= 160)
);

-- ============================================================================
-- Indexes for public_profiles
-- ============================================================================

-- Index for slug lookup (most common query)
CREATE INDEX idx_public_profiles_slug ON public.public_profiles(slug);

-- Index for user_id lookup
CREATE INDEX idx_public_profiles_user_id ON public.public_profiles(user_id);

-- Index for enabled profiles (for listing active profiles)
CREATE INDEX idx_public_profiles_enabled ON public.public_profiles(is_enabled) WHERE is_enabled = true;

-- Index for updated_at (for sitemap generation and cache invalidation)
CREATE INDEX idx_public_profiles_updated_at ON public.public_profiles(updated_at DESC);

-- Composite index for enabled profiles ordered by update date
CREATE INDEX idx_public_profiles_enabled_updated ON public.public_profiles(is_enabled, updated_at DESC) WHERE is_enabled = true;

-- ============================================================================
-- Trigger for automatic updated_at timestamp
-- ============================================================================

CREATE TRIGGER update_public_profiles_updated_at
  BEFORE UPDATE ON public.public_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- Table: profile_views
-- Description: Tracks analytics for public profile visits
-- ============================================================================

CREATE TABLE public.profile_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.public_profiles(id) ON DELETE CASCADE,
  
  -- Tracking (anonymized data for GDPR compliance)
  visitor_ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash of IP address
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2), -- ISO 3166-1 alpha-2 country code
  city VARCHAR(100),
  
  -- Actions
  galleries_viewed UUID[] DEFAULT ARRAY[]::UUID[],
  cta_clicked BOOLEAN DEFAULT false,
  social_links_clicked TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Session
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  session_duration INTEGER, -- Duration in seconds
  
  -- Constraint
  CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES public.public_profiles(id) ON DELETE CASCADE
);

-- ============================================================================
-- Indexes for profile_views
-- ============================================================================

-- Index for profile_id lookup (most common query for analytics)
CREATE INDEX idx_profile_views_profile_id ON public.profile_views(profile_id);

-- Index for date-based queries (analytics by period)
CREATE INDEX idx_profile_views_date ON public.profile_views(viewed_at DESC);

-- Composite index for profile + date queries (most common analytics query)
CREATE INDEX idx_profile_views_profile_date ON public.profile_views(profile_id, viewed_at DESC);

-- Index for IP hash (to detect unique visitors)
CREATE INDEX idx_profile_views_ip_hash ON public.profile_views(visitor_ip_hash);

-- Composite index for unique visitor counting per profile
CREATE INDEX idx_profile_views_profile_ip ON public.profile_views(profile_id, visitor_ip_hash);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for public_profiles
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view their own public profile"
ON public.public_profiles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create their own profile
CREATE POLICY "Users can create their own public profile"
ON public.public_profiles FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Users can update their own profile
CREATE POLICY "Users can update their own public profile"
ON public.public_profiles FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete their own public profile"
ON public.public_profiles FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Policy: Anyone can view enabled public profiles
CREATE POLICY "Anyone can view enabled public profiles"
ON public.public_profiles FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

-- ============================================================================
-- RLS Policies for profile_views
-- ============================================================================

-- Policy: Users can view analytics for their own profiles
CREATE POLICY "Users can view their own profile analytics"
ON public.profile_views FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.public_profiles
    WHERE public_profiles.id = profile_views.profile_id
    AND public_profiles.user_id = auth.uid()
  )
);

-- Policy: System can insert view records (for tracking)
-- Note: This will be handled by service role in the application
CREATE POLICY "Service role can insert profile views"
ON public.profile_views FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Users can update their own profile view records (for session duration)
CREATE POLICY "Users can update profile view records"
ON public.profile_views FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.public_profiles
    WHERE public_profiles.id = profile_views.profile_id
    AND public_profiles.user_id = auth.uid()
  )
);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to increment views_count when a new view is recorded
CREATE OR REPLACE FUNCTION public.increment_profile_views_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.public_profiles
  SET 
    views_count = views_count + 1,
    last_viewed_at = NEW.viewed_at
  WHERE id = NEW.profile_id;
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically increment views_count
CREATE TRIGGER on_profile_view_created
  AFTER INSERT ON public.profile_views
  FOR EACH ROW EXECUTE FUNCTION public.increment_profile_views_count();

-- ============================================================================
-- Comments for documentation
-- ============================================================================

COMMENT ON TABLE public.public_profiles IS 'Public profiles for Pro photographers to showcase their portfolio';
COMMENT ON TABLE public.profile_views IS 'Analytics tracking for public profile visits with GDPR-compliant anonymization';

COMMENT ON COLUMN public.public_profiles.slug IS 'Unique URL-friendly identifier for the profile (lowercase, numbers, hyphens only)';
COMMENT ON COLUMN public.public_profiles.is_enabled IS 'Whether the public profile is active and accessible';
COMMENT ON COLUMN public.public_profiles.social_links IS 'JSON object containing social media URLs (instagram, facebook, pinterest, etc.)';
COMMENT ON COLUMN public.public_profiles.cta_button IS 'JSON object for call-to-action button configuration (text, url, style)';
COMMENT ON COLUMN public.public_profiles.testimonials IS 'JSON array of client testimonials (max 5)';
COMMENT ON COLUMN public.public_profiles.featured_galleries IS 'Array of gallery UUIDs to display first';
COMMENT ON COLUMN public.public_profiles.hidden_galleries IS 'Array of gallery UUIDs to hide from public profile';

COMMENT ON COLUMN public.profile_views.visitor_ip_hash IS 'SHA-256 hash of visitor IP address for GDPR compliance';
COMMENT ON COLUMN public.profile_views.galleries_viewed IS 'Array of gallery UUIDs viewed during this session';
COMMENT ON COLUMN public.profile_views.cta_clicked IS 'Whether the visitor clicked the CTA button';
COMMENT ON COLUMN public.profile_views.social_links_clicked IS 'Array of social platform names clicked during this session';
COMMENT ON COLUMN public.profile_views.session_duration IS 'Duration of the visit in seconds';
