# Stripe Connect API Routes

This directory contains all API routes for Stripe Connect integration, allowing photographers to connect their Stripe accounts and receive payments directly.

## Routes

### 1. POST `/api/stripe/connect/onboard`
**Purpose:** Create a Stripe Connect account and generate onboarding link

**Requirements:**
- User must be authenticated
- User must have Pro plan
- Creates Connect account if doesn't exist
- Returns onboarding link

**Response:**
```json
{
  "accountId": "acct_123...",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

**Validates:** Requirements 1.1 - Onboarding Stripe Connect

---

### 2. POST `/api/stripe/connect/refresh-link`
**Purpose:** Refresh the onboarding link for an existing Connect account

**Requirements:**
- User must be authenticated
- User must have Pro plan
- Connect account must exist

**Response:**
```json
{
  "accountId": "acct_123...",
  "onboardingUrl": "https://connect.stripe.com/setup/..."
}
```

**Validates:** Requirements 1.1 - Onboarding Stripe Connect

---

### 3. GET `/api/stripe/connect/status`
**Purpose:** Get the status of the user's Stripe Connect account

**Requirements:**
- User must be authenticated
- User must have Pro plan

**Response (Connected):**
```json
{
  "connected": true,
  "accountId": "acct_123...",
  "status": "verified",
  "chargesEnabled": true,
  "payoutsEnabled": true,
  "detailsSubmitted": true,
  "requirements": {
    "currentlyDue": [],
    "eventuallyDue": [],
    "pastDue": []
  }
}
```

**Response (Not Connected):**
```json
{
  "connected": false,
  "status": "not_connected",
  "message": "No Stripe Connect account found"
}
```

**Validates:** Requirements 1.2 - Account Status & Verification

---

### 4. POST `/api/stripe/connect/disconnect`
**Purpose:** Disconnect the user's Stripe Connect account

**Requirements:**
- User must be authenticated
- User must have Pro plan
- Connect account must exist

**Response:**
```json
{
  "success": true,
  "message": "Stripe Connect account disconnected successfully"
}
```

**Validates:** Requirements 1.1 - Onboarding Stripe Connect (disconnect functionality)

---

### 5. POST `/api/stripe/connect/dashboard-link`
**Purpose:** Generate a login link to the Stripe Dashboard for the connected account

**Requirements:**
- User must be authenticated
- User must have Pro plan
- Connect account must exist

**Response:**
```json
{
  "url": "https://dashboard.stripe.com/...",
  "accountId": "acct_123..."
}
```

**Validates:** Requirements 1.2 - Account Status & Verification (access Stripe Dashboard)

---

## Security Features

All routes implement:

1. **Authentication Check:** Uses `requireSupabaseClient()` to ensure user is logged in
2. **Pro Plan Verification:** Checks `subscription_plan === 'pro'` before allowing access
3. **Input Validation:** Uses Zod schemas where applicable
4. **Error Handling:** Consistent error responses with appropriate HTTP status codes
5. **Authorization:** Verifies user owns the Connect account they're accessing

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

### 403 Forbidden
```json
{
  "error": "Pro plan required to use Stripe Connect",
  "code": "ACCESS_DENIED"
}
```

### 404 Not Found
```json
{
  "error": "Stripe Connect account not found",
  "code": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "error": "errors.generic.unexpected",
  "code": "INTERNAL_ERROR"
}
```

## Testing

Comprehensive integration tests are available in `__tests__/routes.integration.test.ts`:

- ✅ Authentication checks
- ✅ Pro plan verification
- ✅ Success scenarios for all routes
- ✅ Error handling (404, 403, 401, 500)
- ✅ Database error handling
- ✅ Stripe service error handling

Run tests:
```bash
npm test -- src/app/api/stripe/connect/__tests__/routes.integration.test.ts
```

## Dependencies

- `@/lib/auth` - Authentication utilities
- `@/lib/services/stripe-connect.service` - Stripe Connect business logic
- `@/lib/api/error-handler` - Consistent error handling
- `@/lib/errors` - Custom error classes

## Related Files

- Service: `src/lib/services/stripe-connect.service.ts`
- Database Schema: `supabase/migrations/*_create_stripe_connect_accounts.sql`
- Requirements: `.kiro/specs/stripe-connect-monetization/requirements.md`
- Design: `.kiro/specs/stripe-connect-monetization/design.md`
