# Cookie Configuration Documentation

**Project:** PikSend Authentication Flow Optimization  
**Date:** February 8, 2026  
**Version:** 1.0

## Overview

This document explains the cookie configuration decisions for the PikSend authentication system, particularly the use of `sameSite: "none"` in production environments.

## Cookie Settings

### Production Configuration

```typescript
cookies: {
  sessionToken: {
    name: "__Secure-next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "none",  // Required for custom domain functionality
      secure: true,
      path: "/",
      domain: getCookieDomain(),
    },
  },
}
```

### Development Configuration

```typescript
cookies: {
  sessionToken: {
    name: "next-auth.session-token",
    options: {
      httpOnly: true,
      sameSite: "lax",  // More restrictive in development
      secure: false,
      path: "/",
    },
  },
}
```

## SameSite: "none" Rationale

### Why "none" is Required

**Custom Domain Functionality:**
- PikSend supports custom domains for photographer galleries (e.g., `photos.photographer.com`)
- When users access their galleries on custom domains, authentication cookies must be sent cross-site
- `sameSite: "lax"` or `"strict"` would block cookies from being sent to custom domains
- This would break authentication for users accessing galleries on custom domains

**Cross-Site Scenarios:**
1. User logs in on `piksend.com`
2. User navigates to their custom domain `photos.photographer.com`
3. Custom domain needs to verify user's authentication status
4. Cookies must be sent cross-site for this to work

### Security Considerations

**CSRF Protection:**
- NextAuth.js implements CSRF protection via CSRF tokens
- All state-changing requests require a valid CSRF token
- The CSRF token is stored in a separate cookie with `httpOnly: true`
- This provides protection even with `sameSite: "none"`

**Additional Security Measures:**
1. **Secure Flag:** Cookies are only sent over HTTPS in production
2. **HttpOnly Flag:** Cookies cannot be accessed via JavaScript
3. **Domain Restriction:** Cookies are scoped to the PikSend domain
4. **CSRF Tokens:** All mutations require valid CSRF tokens
5. **Rate Limiting:** Authentication endpoints are rate-limited
6. **Security Headers:** CSP, HSTS, X-Frame-Options protect against attacks

### Alternative Approaches Considered

**Option 1: sameSite: "lax"**
- ❌ Would break custom domain authentication
- ❌ Users would need to re-authenticate on custom domains
- ❌ Poor user experience

**Option 2: Separate Authentication for Custom Domains**
- ❌ Complex implementation
- ❌ Requires separate authentication flow
- ❌ Increased maintenance burden

**Option 3: Subdomain-Only Custom Domains**
- ❌ Limits photographer branding options
- ❌ Not all photographers own domains
- ❌ Reduces product value

## Security Audit Results

**Finding S-4: SameSite Cookie Setting**
- **Severity:** Medium
- **Status:** Reviewed and Documented
- **Decision:** Keep `sameSite: "none"` for custom domain support
- **Mitigation:** CSRF protection, rate limiting, security headers

## Monitoring

**Metrics to Track:**
- CSRF token validation failures
- Cross-site authentication attempts
- Custom domain authentication success rate
- Security incidents related to cookies

**Alerts:**
- Spike in CSRF validation failures
- Unusual cross-site authentication patterns
- Security header misconfiguration

## Future Considerations

**If Custom Domain Support is Removed:**
- Change `sameSite` to `"lax"` for improved security
- Update this documentation
- Test thoroughly before deployment

**If Additional Security is Needed:**
- Consider implementing additional CSRF protection layers
- Implement stricter rate limiting
- Add IP-based authentication verification
- Implement device fingerprinting

## References

- **Requirements:** 4.2 (CSRF Protection)
- **Audit Finding:** S-4 (SameSite Cookie Setting)
- **NextAuth.js Documentation:** https://next-auth.js.org/configuration/options#cookies
- **MDN SameSite Documentation:** https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite

---

**Document Information:**
- **Author:** Kiro AI Assistant
- **Date:** February 8, 2026
- **Version:** 1.0
- **Status:** Approved

**Related Documents:**
- Authentication Architecture Audit: `docs/authentication-architecture-audit.md`
- Audit Findings Analysis: `docs/audit-findings-analysis.md`
- Auth Configuration: `src/config/auth.config.ts`
