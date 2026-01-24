# Fix: SSL Provisioning "column profiles.user_id" Error

## Problem

After successful domain verification, SSL provisioning fails with error:

```
Failed to fetch profile: column profiles.user_id does not exist
```

## Root Cause

The `profiles` table uses `id` as the primary key (which references `auth.users(id)`), but the SSL provisioning service was incorrectly using `user_id` in the database queries.

### Database Schema

```sql
-- profiles table uses 'id' as primary key
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ...
);

-- public_profiles table uses 'user_id' to reference profiles
CREATE TABLE public.public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ...
);
```

## Solution

Changed the database queries in `ssl-provisioning.service.ts` from using `user_id` to `id`:

### Before (Incorrect)

```typescript
const { data: profile, error: fetchError } = await this.supabase
  .from('profiles')
  .select('branding')
  .eq('user_id', userId)  // ❌ Wrong column name
  .single();

const { error: updateError } = await this.supabase
  .from('profiles')
  .update({ branding: { ... } })
  .eq('user_id', userId);  // ❌ Wrong column name
```

### After (Correct)

```typescript
const { data: profile, error: fetchError } = await this.supabase
  .from('profiles')
  .select('branding')
  .eq('id', userId)  // ✅ Correct column name
  .single();

const { error: updateError } = await this.supabase
  .from('profiles')
  .update({ branding: { ... } })
  .eq('id', userId);  // ✅ Correct column name
```

## Files Modified

- `src/lib/services/ssl-provisioning.service.ts`
  - Line 467: Changed `.eq('user_id', userId)` to `.eq('id', userId)` in SELECT query
  - Line 481: Changed `.eq('user_id', userId)` to `.eq('id', userId)` in UPDATE query

## Testing

### Before Fix
1. Verify domain successfully ✅
2. Click "Provision SSL" 
3. Error: "Failed to fetch profile: column profiles.user_id does not exist" ❌

### After Fix
1. Verify domain successfully ✅
2. Click "Provision SSL" ✅
3. SSL certificate provisioned successfully ✅
4. Certificate metadata stored in database ✅

## Related Tables

### profiles
- Primary key: `id` (UUID)
- References: `auth.users(id)`
- Contains: user settings, branding, subscription info

### public_profiles
- Primary key: `id` (UUID)
- Foreign key: `user_id` references `profiles(id)`
- Contains: public profile information

## Prevention

To prevent similar issues:

1. **Always check the database schema** before writing queries
2. **Use consistent naming** - `profiles.id` not `profiles.user_id`
3. **Test with real database** to catch column name errors early
4. **Review migration files** to understand table structure

## Impact

This fix resolves SSL provisioning failures after domain verification. Users can now:
- Successfully provision SSL certificates via Cloudflare
- Fall back to Let's Encrypt if Cloudflare fails
- Store certificate metadata correctly
- Receive push notifications about SSL status

## Related Issues

This same pattern should be checked in other services that query the `profiles` table:
- ✅ Domain verification service (uses `id` correctly)
- ✅ Logo upload service (uses `id` correctly)
- ✅ Branding service (uses `id` correctly)
- ✅ SSL provisioning service (now fixed)
