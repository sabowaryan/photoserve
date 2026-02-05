# Lightroom Plugin Infrastructure Migration

**Migration File:** `20260204120000_create_plugin_infrastructure.sql`

**Date:** 2026-02-04

## Overview

This migration creates the complete database infrastructure required to support the PikSend Lightroom plugin. It includes tables for API key management, plugin version distribution, download tracking, and usage analytics.

## Tables Created

### 1. api_keys

Stores API keys for Lightroom plugin authentication.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `name` (VARCHAR(100)): User-provided descriptive name
- `key_hash` (TEXT): SHA-256 hash of the complete API key
- `key_prefix` (VARCHAR(12)): First 12 characters for display
- `scopes` (TEXT[]): Permission scopes (default: ['plugin:read', 'plugin:write'])
- `last_used_at` (TIMESTAMPTZ): Last successful authentication timestamp
- `expires_at` (TIMESTAMPTZ): Optional expiration date
- `created_at` (TIMESTAMPTZ): Creation timestamp
- `updated_at` (TIMESTAMPTZ): Last update timestamp
- `is_active` (BOOLEAN): Active status (false = revoked)

**Constraints:**
- Name must be 1-100 characters
- Key prefix must be exactly 12 characters
- Expiration date must be after creation date (if set)

**Indexes:**
- `idx_api_keys_user_id`: On user_id
- `idx_api_keys_key_hash`: On key_hash
- `idx_api_keys_active`: Partial index on is_active (WHERE is_active = TRUE)
- `idx_api_keys_expires_at`: Partial index on expires_at (WHERE expires_at IS NOT NULL)

### 2. plugin_versions

Stores plugin version information and download metadata.

**Columns:**
- `id` (UUID): Primary key
- `version` (VARCHAR(20)): Semantic version string (e.g., "1.0.0")
- `file_url` (TEXT): Cloudinary URL to the .lrplugin file
- `file_size` (BIGINT): File size in bytes
- `changelog` (TEXT): Markdown-formatted changelog
- `is_stable` (BOOLEAN): Production release flag (default: true)
- `min_lightroom_version` (VARCHAR(20)): Minimum Lightroom version required
- `release_date` (TIMESTAMPTZ): Release timestamp
- `download_count` (INTEGER): Number of downloads
- `created_at` (TIMESTAMPTZ): Creation timestamp

**Constraints:**
- Version must match semantic versioning pattern: `^\d+\.\d+\.\d+(-[a-z]+)?$`
- File size must be positive
- Download count must be non-negative

**Indexes:**
- `idx_plugin_versions_version`: On version
- `idx_plugin_versions_stable`: Partial index on is_stable (WHERE is_stable = TRUE)
- `idx_plugin_versions_release_date`: On release_date (DESC)

### 3. plugin_downloads

Tracks plugin download events for analytics.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users (nullable)
- `version_id` (UUID): Foreign key to plugin_versions
- `ip_address` (INET): Downloader's IP address
- `user_agent` (TEXT): Browser/client user agent string
- `downloaded_at` (TIMESTAMPTZ): Download timestamp

**Constraints:**
- User agent must be ≤ 500 characters

**Indexes:**
- `idx_plugin_downloads_user_id`: On user_id
- `idx_plugin_downloads_version_id`: On version_id
- `idx_plugin_downloads_downloaded_at`: On downloaded_at (DESC)

### 4. plugin_usage_logs

Logs plugin actions for analytics and debugging.

**Columns:**
- `id` (UUID): Primary key
- `user_id` (UUID): Foreign key to auth.users
- `api_key_id` (UUID): Foreign key to api_keys (nullable)
- `action` (VARCHAR(50)): Action type (e.g., "auth", "upload")
- `plugin_version` (VARCHAR(20)): Plugin version used
- `lightroom_version` (VARCHAR(20)): Lightroom version
- `os_version` (VARCHAR(50)): Operating system version
- `metadata` (JSONB): Additional action-specific data
- `created_at` (TIMESTAMPTZ): Action timestamp

**Constraints:**
- Action must be 1-50 characters

**Indexes:**
- `idx_plugin_usage_logs_user_id`: On user_id
- `idx_plugin_usage_logs_action`: On action
- `idx_plugin_usage_logs_created_at`: On created_at (DESC)
- `idx_plugin_usage_logs_metadata`: GIN index on metadata JSONB

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### api_keys Policies

- **Users can view own API keys**: Users can SELECT their own keys
- **Users can create own API keys**: Users can INSERT their own keys
- **Users can update own API keys**: Users can UPDATE their own keys
- **Users can delete own API keys**: Users can DELETE their own keys
- **Admin users can view all API keys**: Admins can SELECT all keys
- **Admin users can manage all API keys**: Admins have full access

### plugin_versions Policies

- **Anyone can view stable plugin versions**: Authenticated and anonymous users can SELECT stable versions
- **Admin users can view all plugin versions**: Admins can SELECT all versions (including unstable)
- **Admin users can create plugin versions**: Admins can INSERT versions
- **Admin users can update plugin versions**: Admins can UPDATE versions
- **Admin users can delete plugin versions**: Admins can DELETE versions

### plugin_downloads Policies

- **Users can view own downloads**: Users can SELECT their own download records
- **Authenticated users can create downloads**: Any authenticated user can INSERT download records
- **Admin users can view all downloads**: Admins can SELECT all download records

### plugin_usage_logs Policies

- **Users can view own usage logs**: Users can SELECT their own logs
- **Authenticated users can create usage logs**: Users can INSERT their own logs
- **Admin users can view all usage logs**: Admins can SELECT all logs

## Foreign Key Relationships

```
auth.users (1) ----< (N) api_keys
auth.users (1) ----< (N) plugin_downloads
auth.users (1) ----< (N) plugin_usage_logs
plugin_versions (1) ----< (N) plugin_downloads
api_keys (1) ----< (N) plugin_usage_logs
```

## Cascade Behavior

- **api_keys**: ON DELETE CASCADE from auth.users (when user deleted, keys are deleted)
- **plugin_downloads**: ON DELETE SET NULL from auth.users (preserve download records)
- **plugin_downloads**: ON DELETE CASCADE from plugin_versions (when version deleted, downloads are deleted)
- **plugin_usage_logs**: ON DELETE CASCADE from auth.users (when user deleted, logs are deleted)
- **plugin_usage_logs**: ON DELETE SET NULL from api_keys (preserve logs when key deleted)

## Security Considerations

1. **API Keys**: Never stored in plain text, only SHA-256 hashes are stored
2. **RLS Enforcement**: All tables have RLS enabled to prevent unauthorized access
3. **Admin Access**: Admin users (profiles.is_admin = true) have full access to all records
4. **User Isolation**: Non-admin users can only access their own data

## Usage

This migration should be applied to the Supabase database using:

```bash
supabase db push
```

Or in production:

```bash
supabase migration up
```

## Rollback

To rollback this migration, execute:

```sql
DROP TABLE IF EXISTS public.plugin_usage_logs CASCADE;
DROP TABLE IF EXISTS public.plugin_downloads CASCADE;
DROP TABLE IF EXISTS public.plugin_versions CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
```

## Dependencies

This migration requires:
- `auth.users` table (Supabase Auth)
- `public.profiles` table with `is_admin` column

## Next Steps

After applying this migration:

1. Implement APIKeyService for key generation and validation
2. Implement PluginVersionService for version management
3. Implement UsageTrackingService for analytics
4. Create API endpoints for plugin communication
5. Build dashboard UI for API key management
6. Build admin UI for plugin version management
