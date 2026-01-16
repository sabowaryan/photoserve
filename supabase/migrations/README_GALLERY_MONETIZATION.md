# Gallery Monetization Migration

## Overview

This migration creates the `gallery_monetization` table, which stores paywall/monetization configuration for galleries, allowing photographers to charge for access to their galleries.

## Migration File

**File**: `20260115120200_create_gallery_monetization.sql`  
**Created**: 2026-01-15  
**Spec**: `.kiro/specs/stripe-connect-monetization/`

## What This Migration Does

1. **Creates Table**: `gallery_monetization` with all required fields
2. **Adds Indexes**: Three indexes for optimal query performance
   - `idx_gallery_monetization_gallery_id` - Fast gallery lookups
   - `idx_gallery_monetization_enabled` - Status filtering
   - `idx_gallery_monetization_enabled_gallery` - Partial index for enabled galleries
3. **Adds Constraints**: 
   - Unique constraint on `gallery_id` (one monetization config per gallery)
   - Price range check: `price_cents >= 500 AND price_cents <= 50000` ($5-$500)
   - Platform fee range check: `platform_fee_percent >= 0 AND platform_fee_percent <= 100`
   - Preview mode check: `preview_mode IN ('full_paywall', 'freemium')`
   - Foreign key to `galleries(id)` with CASCADE delete
4. **Adds Trigger**: Auto-updates `updated_at` timestamp on row changes
5. **Enables RLS**: Row Level Security with 5 policies
6. **Grants Permissions**: Appropriate permissions for authenticated, anon, and service role
7. **Adds Documentation**: Table and column comments for clarity

## Schema Summary

```sql
gallery_monetization (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL,           -- Price in cents ($5-$500 = 500-50000)
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Preview Mode
  preview_mode VARCHAR(20) DEFAULT 'full_paywall',  -- 'full_paywall' | 'freemium'
  watermark_enabled BOOLEAN DEFAULT true,
  
  -- Access Duration
  access_duration_days INTEGER,           -- NULL = unlimited
  
  -- Stripe
  stripe_price_id VARCHAR(255),           -- Stripe Price ID (price_xxx)
  
  -- Platform Fee
  platform_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
```

## Field Details

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key, auto-generated |
| `gallery_id` | UUID | Reference to the gallery being monetized |
| `is_enabled` | BOOLEAN | Whether the paywall is currently active |
| `price_cents` | INTEGER | Price in cents (e.g., 2999 = $29.99). Range: $5-$500 |
| `currency` | VARCHAR(3) | Currency code (usd, eur, cad, etc.) |
| `preview_mode` | VARCHAR(20) | Preview mode: `full_paywall` (blurred) or `freemium` (low-res with watermark) |
| `watermark_enabled` | BOOLEAN | Whether to show watermark in freemium preview mode |
| `access_duration_days` | INTEGER | Days access is valid after purchase. NULL = unlimited |
| `stripe_price_id` | VARCHAR(255) | Stripe Price ID for this gallery |
| `platform_fee_percent` | DECIMAL(5,2) | Platform fee percentage (default 10%) |
| `total_sales` | INTEGER | Total number of purchases for this gallery |
| `total_revenue_cents` | INTEGER | Total revenue in cents for this gallery |
| `conversion_rate` | DECIMAL(5,2) | Conversion rate (purchases / views) as percentage |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp (auto-updated via trigger) |

## Constraints

| Constraint | Description |
|------------|-------------|
| `unique_gallery_monetization` | One monetization config per gallery |
| `check_price_range` | Price must be between $5 (500 cents) and $500 (50000 cents) |
| `check_fee_range` | Platform fee must be between 0% and 100% |
| `check_preview_mode` | Preview mode must be 'full_paywall' or 'freemium' |

## RLS Policies

| Policy | Operation | Description |
|--------|-----------|-------------|
| Gallery owners can view their monetization config | SELECT | Owners can view their own gallery monetization settings |
| Gallery owners can insert their monetization config | INSERT | Owners can create monetization config for their galleries |
| Gallery owners can update their monetization config | UPDATE | Owners can modify their monetization settings |
| Gallery owners can delete their monetization config | DELETE | Owners can remove monetization from their galleries |
| Public can view enabled monetization for galleries | SELECT | Public can view enabled monetization for active galleries (needed for paywall display) |

## Testing the Migration

### Option 1: Using Supabase CLI (Recommended)

```bash
# Check migration status
supabase migration list

# Apply migration to local database
supabase db reset

# Or apply specific migration
supabase migration up
```

### Option 2: Using PostgreSQL directly

```bash
# Apply migration
psql -d your_database -f supabase/migrations/20260115120200_create_gallery_monetization.sql
```

### Option 3: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the migration SQL
4. Execute the query

## Verification

After applying the migration, verify it was successful:

```sql
-- Check table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'gallery_monetization';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'gallery_monetization';

-- Check constraints
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.gallery_monetization'::regclass;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'gallery_monetization';

-- Check policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'gallery_monetization';
```

Expected results:
- ✅ Table `gallery_monetization` exists
- ✅ 3 indexes created
- ✅ 4 constraints (unique, price range, fee range, preview mode)
- ✅ RLS enabled (`rowsecurity = true`)
- ✅ 5 policies created

## Rollback

If you need to rollback this migration:

```sql
-- Drop table (will cascade to related records)
DROP TABLE IF EXISTS public.gallery_monetization CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.update_gallery_monetization_updated_at() CASCADE;
```

## Dependencies

### Required Tables
- `public.galleries` - Must exist before running this migration

### Required Extensions
- PostgreSQL 13+ (for `gen_random_uuid()`)

## Usage Examples

### Create monetization config for a gallery

```sql
INSERT INTO gallery_monetization (gallery_id, price_cents, currency, preview_mode)
VALUES ('gallery-uuid-here', 2999, 'usd', 'freemium');
```

### Enable paywall for a gallery

```sql
UPDATE gallery_monetization 
SET is_enabled = true 
WHERE gallery_id = 'gallery-uuid-here';
```

### Get monetization config for a gallery

```sql
SELECT * FROM gallery_monetization 
WHERE gallery_id = 'gallery-uuid-here';
```

### Get all enabled paywalls

```sql
SELECT gm.*, g.title as gallery_title
FROM gallery_monetization gm
JOIN galleries g ON g.id = gm.gallery_id
WHERE gm.is_enabled = true;
```

## Next Steps

After this migration is applied, you can proceed with:

1. **Task 2.2**: Gallery Monetization Service (`src/lib/services/gallery-monetization.service.ts`)
2. **Task 2.3**: API Routes for monetization
3. **Task 2.4**: UI components for Gallery Monetization Tab

## Related Documentation

- [Requirements](../../.kiro/specs/stripe-connect-monetization/requirements.md) - See Requirement 2.1
- [Design Document](../../.kiro/specs/stripe-connect-monetization/design.md)
- [Tasks](../../.kiro/specs/stripe-connect-monetization/tasks.md)
- [Stripe Connect README](./README_STRIPE_CONNECT.md)

## Security Notes

- ✅ RLS is enabled - users can only access their own gallery monetization data
- ✅ Public can only view enabled monetization for active galleries (needed for paywall display)
- ✅ No sensitive payment data is stored (only Stripe Price IDs)
- ✅ Cascade delete ensures cleanup when galleries are deleted
- ✅ Service role has SELECT access for admin operations

## Performance Considerations

- Indexes are created on frequently queried columns (`gallery_id`, `is_enabled`)
- Partial index on `is_enabled = true` for efficient paywall queries
- `updated_at` trigger has minimal overhead
- Stats columns (`total_sales`, `total_revenue_cents`, `conversion_rate`) are denormalized for fast dashboard queries

## Troubleshooting

### Error: relation "galleries" does not exist
**Solution**: Ensure the `galleries` table exists before running this migration.

### Error: new row violates check constraint "check_price_range"
**Solution**: Ensure price is between 500 and 50000 cents ($5-$500).

### Error: duplicate key value violates unique constraint "unique_gallery_monetization"
**Solution**: A monetization config already exists for this gallery. Use UPDATE instead of INSERT.

### Error: permission denied for table gallery_monetization
**Solution**: Ensure you're running as a user with sufficient privileges, or use the service role key.

## Support

For issues or questions:
1. Check the [Requirements Document](../../.kiro/specs/stripe-connect-monetization/requirements.md)
2. Review the [Design Document](../../.kiro/specs/stripe-connect-monetization/design.md)
3. Consult related migration READMEs

---

**Status**: ✅ Ready for deployment  
**Version**: 1.0.0  
**Last Updated**: 2026-01-15
