-- Migration: PikSend Complete Features
-- Requirements: 3.1, 3.2, 3.3, 7.2, 8.3
-- Date: 2026-01-14

-- ============================================================================
-- FAVORITES SYSTEM (Requirement 3.1)
-- ============================================================================

-- Favorites table for client photo selection
CREATE TABLE public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gallery_id, image_id, session_id)
);

-- Indexes for favorites
CREATE INDEX idx_favorites_gallery ON public.favorites(gallery_id);
CREATE INDEX idx_favorites_image ON public.favorites(image_id);
CREATE INDEX idx_favorites_session ON public.favorites(session_id);

-- Enable RLS on favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Anyone can view favorites (public galleries)
CREATE POLICY "Anyone can view favorites"
ON public.favorites FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert favorites (with session_id)
CREATE POLICY "Anyone can insert favorites"
ON public.favorites FOR INSERT
TO anon, authenticated
WITH CHECK (session_id IS NOT NULL);

-- Anyone can delete their own favorites (by session_id)
CREATE POLICY "Anyone can delete their favorites"
ON public.favorites FOR DELETE
TO anon, authenticated
USING (session_id IS NOT NULL);

-- Gallery owners can view all favorites for their galleries
CREATE POLICY "Gallery owners can view all favorites"
ON public.favorites FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = favorites.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- ============================================================================
-- COMMENTS SYSTEM (Requirement 3.2)
-- ============================================================================

-- Comments table for image feedback
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 1000),
  author_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for comments
CREATE INDEX idx_comments_image ON public.comments(image_id);
CREATE INDEX idx_comments_gallery ON public.comments(gallery_id);
CREATE INDEX idx_comments_session ON public.comments(session_id);
CREATE INDEX idx_comments_created ON public.comments(created_at DESC);

-- Enable RLS on comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Anyone can view comments"
ON public.comments FOR SELECT
TO anon, authenticated
USING (true);

-- Anyone can insert comments (with session_id)
CREATE POLICY "Anyone can insert comments"
ON public.comments FOR INSERT
TO anon, authenticated
WITH CHECK (session_id IS NOT NULL AND char_length(content) > 0);

-- Users can delete their own comments (by session_id)
CREATE POLICY "Users can delete their comments"
ON public.comments FOR DELETE
TO anon, authenticated
USING (session_id IS NOT NULL);

-- Gallery owners can delete comments on their galleries
CREATE POLICY "Gallery owners can delete comments"
ON public.comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = comments.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- ============================================================================
-- GALLERY ANALYTICS (Requirement 3.3)
-- ============================================================================

-- Gallery analytics table for tracking views
CREATE TABLE public.gallery_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  visitor_ip VARCHAR(45),
  country_code VARCHAR(2),
  user_agent TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for analytics
CREATE INDEX idx_analytics_gallery ON public.gallery_analytics(gallery_id);
CREATE INDEX idx_analytics_viewed ON public.gallery_analytics(viewed_at DESC);
CREATE INDEX idx_analytics_country ON public.gallery_analytics(country_code);
CREATE INDEX idx_analytics_session ON public.gallery_analytics(session_id);

-- Enable RLS on gallery_analytics
ALTER TABLE public.gallery_analytics ENABLE ROW LEVEL SECURITY;

-- Gallery owners can view analytics for their galleries
CREATE POLICY "Gallery owners can view analytics"
ON public.gallery_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = gallery_analytics.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Service role can insert analytics (for tracking)
CREATE POLICY "Service role can insert analytics"
ON public.gallery_analytics FOR INSERT
TO service_role
WITH CHECK (true);

-- Anyone can insert analytics (for public tracking)
CREATE POLICY "Anyone can insert analytics"
ON public.gallery_analytics FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin can view all analytics
CREATE POLICY "Admin can view all analytics"
ON public.gallery_analytics FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- LEAD CAPTURES (Requirement 7.2)
-- ============================================================================

-- Lead captures table for email collection
CREATE TABLE public.lead_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  session_id VARCHAR(255),
  gdpr_consent BOOLEAN DEFAULT false,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(gallery_id, email)
);

-- Indexes for lead captures
CREATE INDEX idx_leads_gallery ON public.lead_captures(gallery_id);
CREATE INDEX idx_leads_email ON public.lead_captures(email);
CREATE INDEX idx_leads_captured ON public.lead_captures(captured_at DESC);

-- Enable RLS on lead_captures
ALTER TABLE public.lead_captures ENABLE ROW LEVEL SECURITY;

-- Gallery owners can view leads for their galleries
CREATE POLICY "Gallery owners can view leads"
ON public.lead_captures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = lead_captures.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Anyone can insert leads (with GDPR consent)
CREATE POLICY "Anyone can insert leads"
ON public.lead_captures FOR INSERT
TO anon, authenticated
WITH CHECK (gdpr_consent = true);

-- Admin can view all leads
CREATE POLICY "Admin can view all leads"
ON public.lead_captures FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- TESTIMONIALS (Requirement 8.3)
-- ============================================================================

-- Testimonials table for client reviews
CREATE TABLE public.testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 1000),
  author_name VARCHAR(255),
  author_email VARCHAR(255),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for testimonials
CREATE INDEX idx_testimonials_gallery ON public.testimonials(gallery_id);
CREATE INDEX idx_testimonials_rating ON public.testimonials(rating);
CREATE INDEX idx_testimonials_public ON public.testimonials(is_public) WHERE is_public = true;
CREATE INDEX idx_testimonials_created ON public.testimonials(created_at DESC);

-- Enable RLS on testimonials
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Anyone can view public testimonials
CREATE POLICY "Anyone can view public testimonials"
ON public.testimonials FOR SELECT
TO anon, authenticated
USING (is_public = true);

-- Gallery owners can view all testimonials for their galleries
CREATE POLICY "Gallery owners can view all testimonials"
ON public.testimonials FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Anyone can insert testimonials
CREATE POLICY "Anyone can insert testimonials"
ON public.testimonials FOR INSERT
TO anon, authenticated
WITH CHECK (rating >= 1 AND rating <= 5);

-- Gallery owners can update testimonials (to make public)
CREATE POLICY "Gallery owners can update testimonials"
ON public.testimonials FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Gallery owners can delete testimonials
CREATE POLICY "Gallery owners can delete testimonials"
ON public.testimonials FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = testimonials.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- ============================================================================
-- GALLERY SETTINGS EXTENSION
-- ============================================================================

-- Add settings JSONB column to galleries table
ALTER TABLE public.galleries 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Create index for settings queries
CREATE INDEX idx_galleries_settings ON public.galleries USING gin(settings);

-- Add comment to document settings structure
COMMENT ON COLUMN public.galleries.settings IS 
'Gallery settings JSON structure:
{
  "enableFavorites": boolean,
  "enableComments": boolean,
  "enableDeadline": boolean,
  "deadlineDate": timestamp,
  "enableLeadMagnet": boolean,
  "ctaButton": { "text": string, "url": string, "style": string },
  "videoCoverUrl": string,
  "audioUrl": string,
  "customColors": { "primary": string, "secondary": string, "accent": string },
  "noindex": boolean,
  "watermarkOpacity": number,
  "previewQuality": number
}';

-- ============================================================================
-- PROFILE BRANDING EXTENSION
-- ============================================================================

-- Add branding JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{}'::jsonb;

-- Create index for branding queries
CREATE INDEX idx_profiles_branding ON public.profiles USING gin(branding);

-- Add comment to document branding structure
COMMENT ON COLUMN public.profiles.branding IS 
'Profile branding JSON structure:
{
  "customLogo": string,
  "customDomain": string,
  "brandColors": { "primary": string, "secondary": string, "accent": string },
  "profileSlug": string,
  "profileBio": string,
  "socialLinks": { "instagram": string, "facebook": string, "website": string }
}';

-- ============================================================================
-- ADMIN SETTINGS TABLE
-- ============================================================================

-- Admin settings table for global configuration
CREATE TABLE public.admin_settings (
  key VARCHAR(255) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view settings
CREATE POLICY "Admin can view settings"
ON public.admin_settings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can update settings
CREATE POLICY "Admin can update settings"
ON public.admin_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Only admins can insert settings
CREATE POLICY "Admin can insert settings"
ON public.admin_settings FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Trigger for updated_at on admin_settings
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, description) VALUES
  ('stripe_enabled', 'true'::jsonb, 'Enable/disable Stripe payment processing'),
  ('ai_features_enabled', 'true'::jsonb, 'Enable/disable AI features (face recognition, auto-caption, smart culling)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- CTA CLICK TRACKING
-- ============================================================================

-- CTA clicks table for tracking call-to-action engagement
CREATE TABLE public.cta_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255),
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for CTA clicks
CREATE INDEX idx_cta_clicks_gallery ON public.cta_clicks(gallery_id);
CREATE INDEX idx_cta_clicks_clicked ON public.cta_clicks(clicked_at DESC);

-- Enable RLS on cta_clicks
ALTER TABLE public.cta_clicks ENABLE ROW LEVEL SECURITY;

-- Gallery owners can view CTA clicks for their galleries
CREATE POLICY "Gallery owners can view CTA clicks"
ON public.cta_clicks FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.galleries
    WHERE galleries.id = cta_clicks.gallery_id
    AND galleries.user_id = auth.uid()
  )
);

-- Anyone can insert CTA clicks
CREATE POLICY "Anyone can insert CTA clicks"
ON public.cta_clicks FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get gallery statistics
CREATE OR REPLACE FUNCTION public.get_gallery_stats(p_gallery_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'totalViews', (SELECT COUNT(*) FROM public.gallery_analytics WHERE gallery_id = p_gallery_id),
    'uniqueVisitors', (SELECT COUNT(DISTINCT session_id) FROM public.gallery_analytics WHERE gallery_id = p_gallery_id AND session_id IS NOT NULL),
    'favoritesCount', (SELECT COUNT(*) FROM public.favorites WHERE gallery_id = p_gallery_id),
    'commentsCount', (SELECT COUNT(*) FROM public.comments WHERE gallery_id = p_gallery_id),
    'ctaClicks', (SELECT COUNT(*) FROM public.cta_clicks WHERE gallery_id = p_gallery_id),
    'leadsCount', (SELECT COUNT(*) FROM public.lead_captures WHERE gallery_id = p_gallery_id),
    'testimonialsCount', (SELECT COUNT(*) FROM public.testimonials WHERE gallery_id = p_gallery_id),
    'avgRating', (SELECT COALESCE(AVG(rating), 0) FROM public.testimonials WHERE gallery_id = p_gallery_id)
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_gallery_stats(UUID) TO authenticated, anon;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add comment to track migration
COMMENT ON TABLE public.favorites IS 'PikSend Features Migration - Favorites System (Req 3.1)';
COMMENT ON TABLE public.comments IS 'PikSend Features Migration - Comments System (Req 3.2)';
COMMENT ON TABLE public.gallery_analytics IS 'PikSend Features Migration - Analytics (Req 3.3)';
COMMENT ON TABLE public.lead_captures IS 'PikSend Features Migration - Lead Magnet (Req 7.2)';
COMMENT ON TABLE public.testimonials IS 'PikSend Features Migration - Testimonials (Req 8.3)';
