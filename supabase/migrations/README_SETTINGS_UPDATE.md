# Admin Settings Migration

## Issue
The admin settings feature requires adding `'settings_update'` to the `audit_action_type` enum in the database.

## Solution
Apply the migration `20260114120006_add_settings_update_action.sql` to add the new enum value.

## How to Apply

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following SQL:

```sql
-- Add 'settings_update' to the audit_action_type enum
ALTER TYPE public.audit_action_type ADD VALUE IF NOT EXISTS 'settings_update';
```

### Option 2: Using Supabase CLI
If you have a clean database state (no conflicting migrations):

```bash
npx supabase db push
```

### Option 3: Manual SQL Execution
Connect to your database using psql or any PostgreSQL client and run:

```sql
ALTER TYPE public.audit_action_type ADD VALUE IF NOT EXISTS 'settings_update';
```

## Verification
After applying the migration, verify it worked by running:

```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = 'public.audit_action_type'::regtype 
ORDER BY enumsortorder;
```

You should see `'settings_update'` in the list.

## Note
The API has been updated to gracefully handle the case where this enum value doesn't exist yet. Settings updates will work, but audit logging will be skipped until the migration is applied.
