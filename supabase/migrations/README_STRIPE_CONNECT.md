# Stripe Connect Accounts Migration

## Overview

This migration creates the `stripe_connect_accounts` table, which is the foundation for the Stripe Connect & Photographer Monetization feature.

## Migration File

**File**: `20260115120100_create_stripe_connect_accounts.sql`  
**Created**: 2026-01-15  
**Spec**: `.kiro/specs/stripe-connect-monetization/`

## What This Migration Does

1. **Creates Table**: `stripe_connect_accounts` with all required fields
2. **Adds Indexes**: Three indexes for optimal query performance
   - `idx_connect_accounts_user_id` - Fast user lookups
   - `idx_connect_accounts_stripe_id` - Fast Stripe account lookups
   - `idx_connect_accounts_status` - Status filtering
3. **Adds Constraints**: 
   - Unique constraint on `user_id` (one Connect account per user)
   - Unique constraint on `stripe_account_id` (no duplicate Stripe accounts)
   - Foreign key to `profiles(id)` with CASCADE delete
4. **Adds Trigger**: Auto-updates `updated_at` timestamp on row changes
5. **Enables RLS**: Row Level Security with 4 policies (SELECT, INSERT, UPDATE, DELETE)
6. **Grants Permissions**: Appropriate permissions for authenticated users and service role
7. **Adds Documentation**: Table and column comments for clarity

## Schema Summary

```sql
stripe_connect_accounts (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  stripe_account_id VARCHAR(255) UNIQUE,
  account_type VARCHAR(50),
  charges_enabled BOOLEAN,
  payouts_enabled BOOLEAN,
  details_submitted BOOLEAN,
  currently_due TEXT[],
  eventually_due TEXT[],
  past_due TEXT[],
  disabled_reason VARCHAR(255),
  onboarding_completed BOOLEAN,
  onboarding_link TEXT,
  onboarding_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
```

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
# Test syntax without applying
psql -d your_database -f scripts/test-migration-syntax.sql

# Apply migration
psql -d your_database -f supabase/migrations/20260115120100_create_stripe_connect_accounts.sql
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
  AND table_name = 'stripe_connect_accounts';

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'stripe_connect_accounts';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'stripe_connect_accounts';

-- Check policies
SELECT policyname 
FROM pg_policies 
WHERE tablename = 'stripe_connect_accounts';
```

Expected results:
- ✅ Table `stripe_connect_accounts` exists
- ✅ 3 indexes created
- ✅ RLS enabled (`rowsecurity = true`)
- ✅ 4 policies created

## Rollback

If you need to rollback this migration:

```sql
-- Drop table (will cascade to related records)
DROP TABLE IF EXISTS public.stripe_connect_accounts CASCADE;

-- Drop trigger function
DROP FUNCTION IF EXISTS public.update_stripe_connect_accounts_updated_at() CASCADE;
```

## Dependencies

### Required Tables
- `public.profiles` - Must exist before running this migration

### Required Extensions
- `uuid-ossp` or PostgreSQL 13+ (for `gen_random_uuid()`)

## Next Steps

After this migration is applied, you can proceed with:

1. **Task 1.2**: Stripe Connect Service (`src/lib/services/stripe-connect.service.ts`)
2. **Task 1.3**: API Routes for Connect onboarding
3. **Task 1.4**: UI components for Settings page

## Related Documentation

- [Schema Documentation](../../docs/database/stripe-connect-accounts-schema.md)
- [Requirements](../../.kiro/specs/stripe-connect-monetization/requirements.md)
- [Design Document](../../.kiro/specs/stripe-connect-monetization/design.md)
- [Tasks](../../.kiro/specs/stripe-connect-monetization/tasks.md)

## Security Notes

- ✅ RLS is enabled - users can only access their own data
- ✅ No sensitive payment data is stored (only Stripe IDs)
- ✅ Cascade delete ensures cleanup when users are deleted
- ✅ Service role has SELECT access for admin operations

## Performance Considerations

- Indexes are created on frequently queried columns
- Composite index on status fields for dashboard queries
- `updated_at` trigger has minimal overhead
- Array columns (`currently_due`, etc.) are indexed via GIN if needed

## Troubleshooting

### Error: relation "profiles" does not exist
**Solution**: Ensure the `profiles` table exists before running this migration.

### Error: function gen_random_uuid() does not exist
**Solution**: Use PostgreSQL 13+ or enable the `uuid-ossp` extension:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Error: permission denied for table stripe_connect_accounts
**Solution**: Ensure you're running as a user with sufficient privileges, or use the service role key.

## Support

For issues or questions:
1. Check the [Requirements Document](../../.kiro/specs/stripe-connect-monetization/requirements.md)
2. Review the [Design Document](../../.kiro/specs/stripe-connect-monetization/design.md)
3. Consult the [Schema Documentation](../../docs/database/stripe-connect-accounts-schema.md)

---

**Status**: ✅ Ready for deployment  
**Version**: 1.0.0  
**Last Updated**: 2026-01-15
