# Fix: Domain Verification SSL Certificate Errors

## Problem

When testing domain verification in development, you see these errors:

```
[DomainVerification] Error querying DNS: TypeError: fetch failed
{[cause]: Error: self-signed certificate in certificate chain
  at ignore-listed frames {code: 'SELF_SIGNED_CERT_IN_CHAIN'}}
```

## Root Cause

- Google DNS API (`https://dns.google/resolve`) requires valid SSL certificates
- Development environments often use self-signed certificates
- Node.js fetch enforces strict SSL verification
- This causes DNS queries to fail in local development

## Solution

### Option 1: Enable Simulation Mode (Recommended for Development)

Add to your `.env.local`:

```env
ENABLE_DOMAIN_VERIFICATION_SIMULATION=true
```

**What this does:**
- Bypasses actual DNS queries
- Auto-verifies all valid domain formats
- Perfect for testing UI and flow
- Only works in `NODE_ENV=development`

**Restart your dev server after adding the variable.**

### Option 2: Test in Production

Deploy to production where:
- SSL certificates are properly configured
- Google DNS API works correctly
- Real domain verification occurs

### Option 3: Accept the Errors (Default Behavior)

The errors are **logged but handled gracefully**:
- App continues to work
- Domain verification returns "pending" status
- Users see DNS configuration instructions
- No impact on other features

## Changes Made

### 1. Improved Error Handling (`domain-verification.service.ts`)

```typescript
// Better error messages in development
if (process.env.NODE_ENV === 'development') {
  console.warn('[DomainVerification] DNS query failed in development (this is normal)');
  console.warn('[DomainVerification] To test domain verification, use production or enable simulation');
}
```

### 2. Added Simulation Mode

```typescript
// Auto-verify in development when simulation enabled
if (process.env.NODE_ENV === 'development' && 
    process.env.ENABLE_DOMAIN_VERIFICATION_SIMULATION === 'true') {
  return { status: 'verified', instructions: 'Domain verified (SIMULATION MODE)' };
}
```

### 3. Documentation

- Created `docs/development/domain-verification-testing.md`
- Updated `.env.example` with new variable
- Added testing guidelines

## Testing

### With Simulation Enabled

```bash
# Add to .env.local
ENABLE_DOMAIN_VERIFICATION_SIMULATION=true

# Restart dev server
npm run dev

# Test domain verification
# ✅ Valid domains are immediately verified
# ✅ No SSL errors
# ✅ Perfect for UI testing
```

### With Simulation Disabled (Default)

```bash
# No changes needed

# Test domain verification
# ⚠️ SSL errors appear (expected)
# ✅ App continues working
# ✅ Shows "pending" status
# ✅ Displays DNS instructions
```

## Production Deployment

**Important:** Simulation mode is automatically disabled in production:

```typescript
// Only works in development
if (process.env.NODE_ENV === 'development' && ...)
```

Production always uses real DNS verification regardless of the environment variable.

## Related Files

- `src/lib/services/domain-verification.service.ts` - Main service
- `src/app/api/domain/verify/route.ts` - API endpoint
- `src/components/settings/branding-section.tsx` - UI component
- `docs/development/domain-verification-testing.md` - Full testing guide

## Summary

✅ **Fixed:** Better error messages in development  
✅ **Added:** Simulation mode for testing  
✅ **Documented:** Testing procedures  
✅ **Safe:** Production always uses real verification  

The SSL errors are now properly handled and you have options for testing domain verification in development.
