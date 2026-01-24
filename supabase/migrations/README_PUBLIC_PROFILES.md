# Public Photographer Profiles Migration

## Overview

This migration creates the database schema for the Public Photographer Profile feature, which allows Pro photographers to create and manage public profile pages accessible via custom URLs.

## Migration File

- **File**: `20260122120000_create_public_profiles.sql`
- **Date**: January 22, 2026
- **Feature**: Public Photographer Profile
- **Requirements**: 1.2, 9.1, 9.2

## Tables Created

### 1. public_profiles

Stores public profile information for Pro photographers.

**Key Columns:**
- `id`: Primary key (UUID)
- `user_id`: Foreign key to profiles table (one-to-one relationship)
- `is_enabled`: Whether the profile is active and publicly accessible
- `slug`: Unique URL-friendly identifier (lowercase, numbers, hyphens only)
- `display_name`: Photographer's display name
- `tagline`: Optional tagline/subtitle
- `bio`: Optional biography (max 500 characters)
- `location`: Optional location
- `avatar_url`: URL to avatar image
- `cover_image_url`: URL to cover/hero image
- `specialties`: Array of specialties (max 5)
- `years_of_experience`: Years of professional experience
- `awards`: Array of awards (max 3)
- `public_email`: Public contact email
- `phone`: Public phone number
- `website`: Personal website URL
- `address`: Physical address
- `social_links`: JSONB object with social media URLs
- `cta_button`: JSONB object for call-to-action button configuration
- `testimonials`: JSONB array of client testimonials (max 5)
- `featured_galleries`: Array of gallery UUIDs to display first
- `hidden_galleries`: Array of gallery UUIDs to hide from profile
- `meta_title`: Custom SEO title (max 60 characters)
- `meta_description`: Custom SEO description (max 160 characters)
- `meta_keywords`: Array of SEO keywords
- `views_count`: Total number of profile views
- `last_viewed_at`: Timestamp of last view

**Constraints:**
- `unique_user_profile`: One profile per user
- `unique_slug`: Slugs must be unique across all profiles
- `check_slug_format`: Slug must match pattern `^[a-z0-9-]+$`
- `check_slug_length`: Slug must be 1-100 characters
- `check_tagline_length`: Tagline max 100 characters
- `check_bio_length`: Bio max 500 characters
- `check_specialties_count`: Max 5 specialties
- `check_awards_count`: Max 3 awards
- `check_meta_title_length`: Meta title max 60 characters
- `check_meta_description_length`: Meta description max 160 characters

**Indexes:**
- `idx_public_profiles_slug`: Fast slug lookup
- `idx_public_profiles_user_id`: User lookup
- `idx_public_profiles_enabled`: Enabled profiles only
- `idx_public_profiles_updated_at`: Ordered by update date
- `idx_public_profiles_enabled_updated`: Composite index for enabled profiles by date

### 2. profile_views

Tracks analytics for public profile visits with GDPR-compliant anonymization.

**Key Columns:**
- `id`: Primary key (UUID)
- `profile_id`: Foreign key to public_profiles
- `visitor_ip_hash`: SHA-256 hash of visitor IP (GDPR compliant)
- `user_agent`: Browser user agent string
- `referrer`: Referring URL
- `country`: ISO 3166-1 alpha-2 country code
- `city`: City name
- `galleries_viewed`: Array of gallery UUIDs viewed
- `cta_clicked`: Whether CTA button was clicked
- `social_links_clicked`: Array of social platforms clicked
- `viewed_at`: Timestamp of visit
- `session_duration`: Duration in seconds

**Indexes:**
- `idx_profile_views_profile_id`: Profile lookup
- `idx_profile_views_date`: Date-based queries
- `idx_profile_views_profile_date`: Composite for analytics queries
- `idx_profile_views_ip_hash`: Unique visitor detection
- `idx_profile_views_profile_ip`: Unique visitors per profile

## Functions Created

### increment_profile_views_count()

Automatically increments the `views_count` and updates `last_viewed_at` when a new view is recorded.

**Trigger**: `on_profile_view_created` (AFTER INSERT on profile_views)

## Row Level Security (RLS)

### public_profiles Policies

1. **Users can view their own public profile**: Authenticated users can SELECT their own profile
2. **Users can create their own public profile**: Authenticated users can INSERT their own profile
3. **Users can update their own public profile**: Authenticated users can UPDATE their own profile
4. **Users can delete their own public profile**: Authenticated users can DELETE their own profile
5. **Anyone can view enabled public profiles**: Anonymous and authenticated users can SELECT enabled profiles

### profile_views Policies

1. **Users can view their own profile analytics**: Authenticated users can SELECT views for their profiles
2. **Service role can insert profile views**: Authenticated users can INSERT view records (for tracking)
3. **Users can update profile view records**: Authenticated users can UPDATE view records (for session duration)

## JSONB Schema

### social_links

```json
{
  "instagram": "https://instagram.com/username",
  "facebook": "https://facebook.com/username",
  "pinterest": "https://pinterest.com/username",
  "linkedin": "https://linkedin.com/in/username",
  "tiktok": "https://tiktok.com/@username",
  "youtube": "https://youtube.com/@username",
  "other": "https://example.com"
}
```

### cta_button

```json
{
  "text": "Book a Session",
  "url": "https://example.com/booking",
  "style": "primary"
}
```

### testimonials

```json
[
  {
    "id": "uuid",
    "clientName": "John Doe",
    "clientPhoto": "https://example.com/photo.jpg",
    "rating": 5,
    "text": "Amazing photographer!",
    "date": "2026-01-15T10:00:00Z"
  }
]
```

## Usage

### Creating a Public Profile

```sql
INSERT INTO public.public_profiles (
  user_id,
  slug,
  display_name,
  tagline,
  bio,
  is_enabled
) VALUES (
  'user-uuid',
  'john-doe-photography',
  'John Doe',
  'Wedding & Portrait Photographer',
  'Capturing life''s precious moments for over 10 years.',
  true
);
```

### Recording a Profile View

```sql
INSERT INTO public.profile_views (
  profile_id,
  visitor_ip_hash,
  user_agent,
  referrer
) VALUES (
  'profile-uuid',
  'sha256-hash-of-ip',
  'Mozilla/5.0...',
  'https://google.com'
);
```

### Querying Analytics

```sql
-- Get total views for a profile
SELECT views_count FROM public.public_profiles WHERE slug = 'john-doe-photography';

-- Get views by date range
SELECT 
  DATE(viewed_at) as date,
  COUNT(*) as views
FROM public.profile_views
WHERE profile_id = 'profile-uuid'
  AND viewed_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(viewed_at)
ORDER BY date DESC;

-- Get CTA click rate
SELECT 
  COUNT(*) as total_views,
  SUM(CASE WHEN cta_clicked THEN 1 ELSE 0 END) as cta_clicks,
  ROUND(100.0 * SUM(CASE WHEN cta_clicked THEN 1 ELSE 0 END) / COUNT(*), 2) as click_rate
FROM public.profile_views
WHERE profile_id = 'profile-uuid';
```

## Rollback

To rollback this migration:

```sql
-- Drop triggers
DROP TRIGGER IF EXISTS on_profile_view_created ON public.profile_views;
DROP TRIGGER IF EXISTS update_public_profiles_updated_at ON public.public_profiles;

-- Drop function
DROP FUNCTION IF EXISTS public.increment_profile_views_count();

-- Drop tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS public.profile_views CASCADE;
DROP TABLE IF EXISTS public.public_profiles CASCADE;
```

## Notes

- IP addresses are hashed with SHA-256 before storage for GDPR compliance
- The `update_updated_at_column()` function is reused from the base migration
- Slugs are validated at the database level with CHECK constraints
- All text length limits are enforced at the database level
- Array cardinality limits are enforced at the database level
- The trigger automatically increments views_count, so application code doesn't need to manage it

## Related Files

- Design Document: `.kiro/specs/public-photographer-profile/design.md`
- Requirements: `.kiro/specs/public-photographer-profile/requirements.md`
- Tasks: `.kiro/specs/public-photographer-profile/tasks.md`
