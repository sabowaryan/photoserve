# Custom Domain Schema Migration

## Overview

This document describes the database schema changes required for the custom domain implementation feature. These changes extend the `profiles.branding` JSONB field to include domain configuration and SSL certificate information.

## Migration Date

**Planned:** TBD  
**Status:** Pending Implementation

## Schema Changes

### Extended ProfileBranding Fields

The `profiles.branding` JSONB column is extended with the following new fields:

| Field Name | Type | Description | Requirement |
|------------|------|-------------|-------------|
| `customDomain` | `string` (optional) | The custom domain configured by the photographer (e.g., photos.example.com) | 7.1 |
| `domainVerified` | `boolean` (optional) | Whether domain ownership has been verified via DNS records | 7.2 |
| `verificationToken` | `string` (optional) | Unique cryptographic token for TXT record verification | 7.3 |
| `domainVerifiedAt` | `string` (optional) | ISO 8601 timestamp when domain was successfully verified | 7.5 |
| `sslCertificateId` | `string` (optional) | SSL certificate identifier from Cloudflare or Let's Encrypt | 7.4 |
| `sslProvider` | `'cloudflare' \| 'letsencrypt'` (optional) | SSL certificate provider used for this domain | 7.4 |
| `sslExpiresAt` | `string` (optional) | ISO 8601 timestamp when SSL certificate expires | 7.6 |
| `cloudflareZoneId` | `string` (optional) | Cloudflare zone ID for DNS management (if using Cloudflare) | 7.4 |

### Example Data Structure

```json
{
  "customLogo": "https://res.cloudinary.com/piksend/image/upload/v1234567890/logos/user123.png",
  "brandColors": {
    "primary": "#3B82F6",
    "secondary": "#10B981",
    "accent": "#F59E0B"
  },
  "profileSlug": "john-photographer",
  "profileBio": "Professional wedding photographer",
  "customDomain": "photos.johnphotography.com",
  "domainVerified": true,
  "verificationToken": "piksend-verify-a1b2c3d4e5f6g7h8i9j0",
  "domainVerifiedAt": "2024-01-15T10:30:00.000Z",
  "sslCertificateId": "cert_abc123xyz789",
  "sslProvider": "cloudflare",
  "sslExpiresAt": "2024-04-15T10:30:00.000Z",
  "cloudflareZoneId": "zone_def456uvw012"
}
```

## Database Indexes

For optimal performance, the following indexes should be created:

### 1. Custom Domain Lookup Index

**Purpose:** Enable fast lookups of photographers by custom domain in middleware routing.

```sql
CREATE INDEX idx_profiles_branding_custom_domain 
ON profiles USING GIN ((branding -> 'customDomain'));
```

**Rationale:** The middleware needs to quickly resolve custom domains to photographer profiles on every request. This GIN index on the JSONB field enables efficient lookups.

**Performance Impact:** Expected to reduce custom domain lookup time from ~50ms to <5ms.

### 2. Verified Domains Index

**Purpose:** Enable fast filtering of verified domains for SSL renewal and monitoring tasks.

```sql
CREATE INDEX idx_profiles_branding_domain_verified 
ON profiles USING GIN ((branding -> 'domainVerified'));
```

**Rationale:** Background jobs need to query all verified domains for SSL certificate renewal checks and monitoring.

**Performance Impact:** Enables efficient batch processing of SSL renewals.

### 3. SSL Expiration Index

**Purpose:** Enable fast queries for certificates expiring soon.

```sql
CREATE INDEX idx_profiles_branding_ssl_expires_at 
ON profiles USING GIN ((branding -> 'sslExpiresAt'));
```

**Rationale:** Automated SSL renewal jobs need to find certificates expiring within 30 days.

**Performance Impact:** Enables efficient identification of certificates requiring renewal.

## Migration Steps

### Step 1: Backup

```sql
-- Create backup of profiles table
CREATE TABLE profiles_backup_custom_domain AS 
SELECT * FROM profiles;
```

### Step 2: Create Indexes

```sql
-- Create GIN indexes for JSONB field lookups
CREATE INDEX CONCURRENTLY idx_profiles_branding_custom_domain 
ON profiles USING GIN ((branding -> 'customDomain'));

CREATE INDEX CONCURRENTLY idx_profiles_branding_domain_verified 
ON profiles USING GIN ((branding -> 'domainVerified'));

CREATE INDEX CONCURRENTLY idx_profiles_branding_ssl_expires_at 
ON profiles USING GIN ((branding -> 'sslExpiresAt'));
```

**Note:** Using `CONCURRENTLY` prevents table locking during index creation.

### Step 3: Verify Indexes

```sql
-- Verify indexes were created successfully
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE 'idx_profiles_branding_%';
```

### Step 4: Test Queries

```sql
-- Test custom domain lookup performance
EXPLAIN ANALYZE
SELECT id, branding
FROM profiles
WHERE branding->>'customDomain' = 'photos.example.com';

-- Test verified domains query performance
EXPLAIN ANALYZE
SELECT id, branding
FROM profiles
WHERE (branding->>'domainVerified')::boolean = true;

-- Test SSL expiration query performance
EXPLAIN ANALYZE
SELECT id, branding
FROM profiles
WHERE (branding->>'sslExpiresAt')::timestamp < NOW() + INTERVAL '30 days'
  AND (branding->>'domainVerified')::boolean = true;
```

## Rollback Plan

If issues are encountered, the migration can be rolled back:

```sql
-- Drop indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_branding_custom_domain;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_branding_domain_verified;
DROP INDEX CONCURRENTLY IF EXISTS idx_profiles_branding_ssl_expires_at;

-- Restore from backup if needed
-- (Only if data corruption occurred, which is unlikely since we're only adding indexes)
```

## Data Validation

After migration, validate the schema:

```sql
-- Check for profiles with custom domains
SELECT 
  COUNT(*) as total_custom_domains,
  COUNT(*) FILTER (WHERE (branding->>'domainVerified')::boolean = true) as verified_domains,
  COUNT(*) FILTER (WHERE branding->>'sslCertificateId' IS NOT NULL) as domains_with_ssl
FROM profiles
WHERE branding->>'customDomain' IS NOT NULL;
```

## Performance Considerations

### Query Performance

- **Before indexes:** Custom domain lookups: ~50ms
- **After indexes:** Custom domain lookups: <5ms
- **Expected improvement:** 10x faster

### Storage Impact

- **Index size:** Approximately 5-10% of table size
- **For 10,000 profiles:** ~500KB-1MB additional storage per index
- **Total additional storage:** ~1.5-3MB for all three indexes

### Write Performance

- **Impact:** Minimal (<5% overhead on profile updates)
- **Rationale:** JSONB updates are already indexed, additional GIN indexes add minimal overhead

## Monitoring

After deployment, monitor:

1. **Query performance:** Track custom domain lookup latency
2. **Index usage:** Verify indexes are being used by query planner
3. **Storage growth:** Monitor index size over time
4. **Write performance:** Ensure profile updates remain fast

### Monitoring Queries

```sql
-- Check index usage statistics
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE 'idx_profiles_branding_%';

-- Check index size
SELECT 
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE tablename = 'profiles'
  AND indexname LIKE 'idx_profiles_branding_%';
```

## Security Considerations

### Data Sensitivity

- **verificationToken:** Contains cryptographic tokens - should not be exposed in public APIs
- **sslCertificateId:** Certificate IDs are not sensitive but should be treated as internal data
- **cloudflareZoneId:** Internal Cloudflare identifiers - should not be exposed

### Access Control

- Only Pro plan users should be able to write to these fields
- API endpoints must validate user authorization before modifying domain configuration
- Middleware should only read these fields, never write

## Testing Checklist

- [ ] Verify indexes are created successfully
- [ ] Test custom domain lookup performance
- [ ] Test verified domains query performance
- [ ] Test SSL expiration query performance
- [ ] Verify index usage in query plans
- [ ] Test profile updates with new fields
- [ ] Verify data validation constraints
- [ ] Test rollback procedure
- [ ] Monitor production performance after deployment

## References

- **Requirements:** 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
- **Design Document:** Section "Data Models - Extended Profile Branding Schema"
- **PostgreSQL JSONB Documentation:** https://www.postgresql.org/docs/current/datatype-json.html
- **PostgreSQL GIN Indexes:** https://www.postgresql.org/docs/current/gin.html

## Notes

- All new fields are optional to maintain backward compatibility
- Existing profiles without custom domains will have `null` or `undefined` for these fields
- The JSONB structure allows for flexible schema evolution without table alterations
- No data migration is required - fields will be populated as users configure custom domains
