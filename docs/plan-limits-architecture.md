# Plan Limits Architecture

## Overview

The application uses a **configuration-first approach** for plan limits. This means that plan limits are defined in the application configuration and used directly by the frontend and backend, rather than relying on database values.

## Architecture

### Source of Truth

**Primary Source:** `src/config/plans.ts`

This file contains the `PLAN_LIMITS` configuration that defines all limits for each subscription plan:
- Free: 500 MB, 2 galleries, 50 images/gallery
- Premium: 100 GB, 100 galleries, 500 images/gallery  
- Pro: 1 TB, unlimited galleries (9999), 2000 images/gallery

### How It Works

1. **User Profile** stores only `subscription_plan` field ('free', 'premium', or 'pro')
2. **Application Code** reads `subscription_plan` and looks up limits from `PLAN_LIMITS[plan]`
3. **Stripe Webhook** updates `subscription_plan` when subscription changes

### Database Schema

The `profiles` table contains these fields:
- `subscription_plan`: 'free' | 'premium' | 'pro' (REQUIRED - source of truth)
- `storage_limit_mb`: number (LEGACY - kept for backward compatibility)
- `max_galleries`: number (LEGACY - kept for backward compatibility)
- `max_images_per_gallery`: number (LEGACY - kept for backward compatibility)
- `max_image_size_mb`: number (LEGACY - kept for backward compatibility)

**Note:** The legacy limit fields are still updated by the Stripe webhook for backward compatibility, but the application code now uses `PLAN_LIMITS` from the configuration instead.

## Benefits

1. **Single Source of Truth**: All limits defined in one place
2. **No Sync Issues**: No risk of database values being out of sync
3. **Easy Updates**: Change limits in config file, no database migration needed
4. **Consistent**: Same limits everywhere in the app

## Implementation

### Frontend (Dashboard)

```typescript
import { PLAN_LIMITS } from '@/config/plans';

const userPlan = profile?.subscription_plan || 'free';
const planLimits = PLAN_LIMITS[userPlan];

// Use planLimits.storage_limit_mb, planLimits.max_galleries, etc.
```

### Backend (API Routes)

```typescript
import { PLAN_LIMITS } from '@/config/plans';

const planLimits = PLAN_LIMITS[profile.subscription_plan];

if (currentStorage + fileSize > planLimits.storage_limit_mb) {
  throw new Error('Storage limit exceeded');
}
```

### Stripe Webhook

The webhook updates the `subscription_plan` field when:
- User subscribes to a plan
- Subscription is renewed
- Subscription is cancelled (downgrade to 'free')

```typescript
// In supabase/functions/stripe-webhook/index.ts
updateData.subscription_plan = planName; // 'premium' or 'pro'
```

## Migration Notes

If you need to update plan limits:

1. Update `src/config/plans.ts` with new limits
2. Update `supabase/functions/stripe-webhook/index.ts` PLAN_LIMITS to match
3. No database migration needed!
4. Existing users will automatically get new limits on next page load

## Testing

When testing plan limits:
1. Ensure user has correct `subscription_plan` value in database
2. Application will automatically use limits from `PLAN_LIMITS[subscription_plan]`
3. No need to manually update limit columns in database
