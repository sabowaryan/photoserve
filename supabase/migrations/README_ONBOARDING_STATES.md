# Onboarding States Migration

## Overview

This migration creates the `onboarding_states` table to track individual onboarding task completion for users. This is part of the sales-funnel-optimization feature to enhance the onboarding experience with task-based progress tracking.

## Migration File

`20260125120000_create_onboarding_states.sql`

## What This Migration Does

### Tables Created

#### `onboarding_states`
Tracks individual onboarding task completion for each user.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `user_id` (UUID, FK): Reference to auth.users
- `step_id` (TEXT): Task identifier (create_first_gallery, customize_profile, add_logo, invite_test_client)
- `completed` (BOOLEAN): Whether the task is completed
- `completed_at` (TIMESTAMP): When the task was completed
- `skipped` (BOOLEAN): Whether the task was skipped
- `attempts` (INTEGER): Number of attempts
- `created_at` (TIMESTAMP): Record creation time
- `updated_at` (TIMESTAMP): Last update time

**Constraints:**
- UNIQUE(user_id, step_id): One record per user per task

### Indexes Created

1. `idx_onboarding_states_user`: Fast lookups by user_id
2. `idx_onboarding_states_completed`: Fast filtering by completion status

### RLS Policies

1. **Users can view their own onboarding states**: Users can SELECT their own records
2. **Users can insert their own onboarding states**: Users can INSERT their own records
3. **Users can update their own onboarding states**: Users can UPDATE their own records
4. **Admin can view all onboarding states**: Admins can SELECT all records

## How to Apply

### Using Supabase CLI (Recommended)

```bash
# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Using SQL Editor (Supabase Dashboard)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `20260125120000_create_onboarding_states.sql`
4. Paste and click **Run**

### Using psql

```bash
# Apply migration
psql -d your_database -f supabase/migrations/20260125120000_create_onboarding_states.sql
```

## Verification

After applying the migration, verify it was successful:

```sql
-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'onboarding_states'
);

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'onboarding_states';

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'onboarding_states';
```

## Related Files

### Backend
- `src/app/api/onboarding/tasks/route.ts` - API endpoints for task management
- `src/components/dashboard/onboarding-guide.tsx` - Enhanced onboarding component

### Frontend
- `src/app/(dashboard)/dashboard/dashboard-client.tsx` - Dashboard integration
- `src/locales/en.json` - English translations
- `src/locales/fr.json` - French translations

## Requirements

This migration implements:
- **Requirement 7.3**: Task completion tracking with progress bar updates
- **Requirement 7.7**: Database persistence for onboarding completion state

## Testing

After applying the migration, test the onboarding flow:

1. Create a new user account
2. Navigate to the dashboard
3. Complete onboarding tasks
4. Verify tasks are persisted in the database:

```sql
SELECT * FROM onboarding_states WHERE user_id = 'your-user-id';
```

5. Verify progress bar updates correctly
6. Verify confetti animation on completion
7. Verify dismiss and re-show functionality

## Rollback

If you need to rollback this migration:

```sql
-- Drop table and all related objects
DROP TABLE IF EXISTS public.onboarding_states CASCADE;
```

## Notes

- The `onboarding_completed` field in the `profiles` table is automatically updated when all tasks are completed
- Task completion is tracked both in localStorage (for immediate UI updates) and in the database (for persistence)
- The migration includes comprehensive comments for documentation
- RLS policies ensure users can only access their own onboarding data

## Support

For issues or questions:
- Check the implementation notes in `.kiro/specs/sales-funnel-optimization/IMPLEMENTATION_NOTES.md`
- Review the design document in `.kiro/specs/sales-funnel-optimization/design.md`
- Contact the development team
