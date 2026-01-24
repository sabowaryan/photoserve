# Domain Verification Testing Guide

## Development Environment Issues

### SSL Certificate Errors

When testing domain verification in development, you may encounter SSL certificate errors:

```
Error: self-signed certificate in certificate chain
code: 'SELF_SIGNED_CERT_IN_CHAIN'
```

This is **normal** in development environments and occurs because:
- Local development uses self-signed certificates
- Google DNS API requires valid SSL certificates
- Node.js fetch enforces strict SSL verification

### Solution: Simulation Mode

For development and testing, you can enable **simulation mode** which bypasses actual DNS verification.

#### Enable Simulation Mode

Add this to your `.env.local` file:

```env
ENABLE_DOMAIN_VERIFICATION_SIMULATION=true
```

When enabled:
- Domain format validation still occurs
- Rate limiting is still enforced
- DNS queries are skipped
- All valid domains are automatically verified
- A warning is logged to the console

#### Testing Flow

1. **With Simulation Disabled** (default):
   - DNS queries will fail with SSL errors
   - Domain verification will return "pending" status
   - You'll see error logs but the app continues working
   - Users will see DNS configuration instructions

2. **With Simulation Enabled**:
   - DNS queries are skipped
   - Valid domains are immediately verified
   - Perfect for testing the UI and flow
   - Console shows: `[DomainVerification] Running in SIMULATION mode`

## Production Environment

In production:
- Simulation mode is **always disabled**
- Real DNS verification occurs
- SSL certificates are properly configured
- Google DNS API works correctly

## Testing Checklist

### Without Simulation (Realistic Testing)
- [ ] Enter invalid domain format → See error message
- [ ] Enter valid domain → See "pending" status
- [ ] View DNS configuration instructions
- [ ] Copy CNAME/TXT records
- [ ] See SSL errors in console (expected)

### With Simulation (UI/Flow Testing)
- [ ] Enter invalid domain format → See error message
- [ ] Enter valid domain → Immediately verified
- [ ] Test rate limiting (10 attempts per hour)
- [ ] Test domain removal
- [ ] Test SSL provisioning flow

## Common Issues

### Issue: "Too many verification attempts"
**Solution**: Wait 1 hour or clear rate limit in database:
```sql
DELETE FROM domain_verification_attempts WHERE user_id = 'your-user-id';
```

### Issue: DNS queries always fail
**Solution**: This is expected in development. Enable simulation mode or test in production.

### Issue: Domain shows as verified but SSL fails
**Solution**: SSL provisioning is separate from domain verification. Check SSL provider configuration.

## Environment Variables

```env
# Enable domain verification simulation (development only)
ENABLE_DOMAIN_VERIFICATION_SIMULATION=true

# Primary domain for CNAME verification
NEXT_PUBLIC_APP_DOMAIN=piksend.com

# Node environment
NODE_ENV=development
```

## API Endpoints

- `POST /api/domain/verify` - Verify domain ownership
- `POST /api/domain/provision-ssl` - Provision SSL certificate
- `DELETE /api/domain/remove` - Remove custom domain

## Logs to Monitor

```
[DomainVerification] Running in SIMULATION mode
[DomainVerification] DNS query failed in development (this is normal)
[DomainVerification] Domain verified successfully
```
