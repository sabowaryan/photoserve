# PhotoServe Deployment Guide

This guide covers the complete deployment process for PhotoServe, including environment configuration, service setup, and custom domain implementation.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Service Configuration](#service-configuration)
4. [Deployment Steps](#deployment-steps)
5. [Custom Domain Setup](#custom-domain-setup)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying PhotoServe, ensure you have:

- Node.js 18+ installed
- A Supabase project
- A Vercel account (or other Next.js hosting)
- Stripe account for payments
- Cloudinary account for image hosting
- Cloudflare account (for custom domain feature)
- Google OAuth credentials
- Resend account for emails
- Gemini API key for translations

## Environment Variables

Copy `.env.example` to `.env` and configure all variables:

```bash
cp .env.example .env
```

### Application Configuration

```env
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_APP_DOMAIN=your-domain.com
```

**Notes:**
- `NEXT_PUBLIC_APP_DOMAIN` is critical for custom domain routing
- In production, set this to your primary domain (e.g., `piksend.com`)
- Do not include protocol (http/https) in `NEXT_PUBLIC_APP_DOMAIN`

### Supabase Configuration

1. Create a project at [supabase.com](https://supabase.com)
2. Get your project URL and keys from Settings > API

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Security Notes:**
- Never commit the service role key to version control
- Use environment variables in production
- Enable Row Level Security (RLS) on all tables

### NextAuth Configuration

Generate a secure secret:

```bash
openssl rand -base64 32
```

```env
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your_generated_secret
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)

```env
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
```

### Stripe Configuration

1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers > API keys
3. Create products and prices in Dashboard > Products
4. Set up webhook endpoint at Developers > Webhooks

```env
STRIPE_SECRET_KEY=sk_live_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**Product Configuration:**

Create two products (Premium and Pro) with monthly and yearly pricing:

```env
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_xxx
STRIPE_PRO_MONTHLY_PRICE_ID=price_xxx
STRIPE_PRO_YEARLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_PRODUCT_ID=prod_xxx
STRIPE_PRO_PRODUCT_ID=prod_xxx
```

**Webhook Setup:**
- Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### Cloudinary Configuration

1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Usage:**
- Logo uploads for Pro plan photographers
- Image optimization and transformations
- Automatic format conversion (WebP)

### Cloudflare Configuration (Custom Domain Feature)

**Required for Pro plan custom domain feature**

1. Create account at [cloudflare.com](https://cloudflare.com)
2. Add your primary domain to Cloudflare
3. Get API token from My Profile > API Tokens

**Creating API Token:**
- Template: "Edit zone DNS"
- Permissions:
  - Zone - DNS - Edit
  - Zone - Zone - Read
  - Zone - SSL and Certificates - Edit
- Zone Resources: Include - All zones

```env
CLOUDFLARE_API_TOKEN=your_api_token
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ZONE_ID=your_zone_id
```

**Finding IDs:**
- Account ID: Dashboard > Overview (right sidebar)
- Zone ID: Select your domain > Overview (right sidebar)

**Important Notes:**
- These credentials enable automatic SSL provisioning
- Custom domains are verified via DNS records
- SSL certificates are automatically managed
- Without these, custom domain feature will not work

### Resend Configuration

1. Create account at [resend.com](https://resend.com)
2. Get API key from Dashboard

```env
RESEND_API_KEY=re_your_api_key
```

**Email Templates:**
- Gallery share notifications
- Subscription confirmations
- Domain verification instructions

### Gemini AI Configuration

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

```env
GEMINI_API_KEY=your_gemini_api_key
```

**Usage:**
- Automatic translation of UI strings
- Multi-language support

### Web Push Notifications (PWA)

Generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
VAPID_SUBJECT=mailto:contact@your-domain.com
```

## Service Configuration

### Database Setup (Supabase)

1. Run migrations in order:
   ```sql
   -- See docs/database-migrations/ for migration files
   ```

2. Enable Row Level Security on all tables

3. Create indexes for performance:
   ```sql
   CREATE INDEX idx_profiles_custom_domain ON profiles ((branding->>'customDomain'));
   CREATE INDEX idx_galleries_user_id ON galleries (user_id);
   CREATE INDEX idx_galleries_slug ON galleries (unique_slug);
   ```

### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Link project:
   ```bash
   vercel link
   ```

3. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... add all other variables
   ```

4. Deploy:
   ```bash
   vercel --prod
   ```

### Custom Domain on Vercel

1. Go to Project Settings > Domains
2. Add your domain (e.g., `piksend.com`)
3. Configure DNS records as instructed
4. Wait for SSL certificate provisioning

## Deployment Steps

### 1. Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/photoserve.git
cd photoserve

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values
```

### 2. Database Setup

```bash
# Run migrations in Supabase SQL Editor
# See docs/database-migrations/
```

### 3. Build and Test

```bash
# Build application
npm run build

# Test production build locally
npm start
```

### 4. Deploy to Vercel

```bash
# Deploy to production
vercel --prod
```

### 5. Post-Deployment

1. Verify all environment variables are set
2. Test authentication flow
3. Test Stripe webhooks
4. Test image uploads
5. Test custom domain feature (if applicable)

## Custom Domain Setup

### For Platform Administrators

1. **Configure Cloudflare:**
   - Add primary domain to Cloudflare
   - Enable SSL/TLS encryption (Full or Full Strict)
   - Set up API token with DNS edit permissions

2. **Set Environment Variables:**
   ```env
   CLOUDFLARE_API_TOKEN=your_token
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_ZONE_ID=your_zone_id
   NEXT_PUBLIC_APP_DOMAIN=piksend.com
   ```

3. **Deploy Middleware:**
   - Middleware automatically handles custom domain routing
   - No additional configuration needed

### For Pro Plan Photographers

**Step 1: Configure DNS**

Add a CNAME record pointing to your primary domain:

```
Type: CNAME
Name: photos (or your subdomain)
Value: piksend.com
TTL: Auto
```

**Step 2: Add Domain in Settings**

1. Go to Settings > Branding
2. Enter custom domain (e.g., `photos.yoursite.com`)
3. Click "Verify Domain"

**Step 3: Wait for Verification**

- DNS propagation: 5 minutes to 48 hours
- System checks CNAME records automatically
- Fallback: TXT record verification available

**Step 4: SSL Provisioning**

- Automatic after domain verification
- Uses Cloudflare for SSL certificates
- Fallback to Let's Encrypt if needed
- Takes 5-10 minutes

**Step 5: Access Galleries**

Your galleries are now accessible via:
- `https://photos.yoursite.com/g/gallery-slug`
- Original URL still works: `https://piksend.com/g/gallery-slug`

### Custom Domain Architecture

```
Client Request
    ↓
[Next.js Middleware]
    ↓
Check hostname
    ↓
Is custom domain? → Yes → Lookup photographer
    ↓                          ↓
    No                    Verify gallery ownership
    ↓                          ↓
Normal routing            Rewrite to /g/[slug]
                               ↓
                          Apply branding
                               ↓
                          Render gallery
```

### DNS Verification Methods

**Method 1: CNAME Record (Recommended)**
```
CNAME photos.yoursite.com → piksend.com
```

**Method 2: A Record (Root Domain)**
```
A yoursite.com → [PikSend IP]
```

**Method 3: TXT Record (Fallback)**
```
TXT yoursite.com → piksend-verify-[token]
```

## Troubleshooting

### Custom Domain Not Working

**Issue:** Domain verification fails

**Solutions:**
1. Check DNS propagation: `dig photos.yoursite.com`
2. Verify CNAME points to correct domain
3. Wait up to 48 hours for DNS propagation
4. Try TXT record verification method

**Issue:** SSL certificate not provisioning

**Solutions:**
1. Verify Cloudflare API credentials
2. Check Cloudflare account has available zones
3. Review Cloudflare API logs
4. Try manual SSL provisioning via Cloudflare dashboard

**Issue:** 404 on custom domain

**Solutions:**
1. Verify domain is marked as verified in database
2. Check middleware is deployed
3. Clear cache: `profiles.branding->customDomain`
4. Verify gallery belongs to photographer

### Image Upload Failures

**Issue:** Logo upload fails

**Solutions:**
1. Verify Cloudinary credentials
2. Check file size (max 2MB)
3. Check file type (PNG, JPG, WebP only)
4. Review Cloudinary upload logs

### Authentication Issues

**Issue:** Google OAuth not working

**Solutions:**
1. Verify redirect URIs in Google Console
2. Check NEXTAUTH_URL matches deployment URL
3. Verify NEXTAUTH_SECRET is set
4. Clear browser cookies and try again

### Stripe Webhook Failures

**Issue:** Webhooks not received

**Solutions:**
1. Verify webhook endpoint URL
2. Check STRIPE_WEBHOOK_SECRET matches
3. Test webhook in Stripe Dashboard
4. Review webhook logs in Stripe

### Performance Issues

**Issue:** Slow middleware response

**Solutions:**
1. Enable caching for domain lookups
2. Add database indexes
3. Use CDN for static assets
4. Monitor middleware latency

## Security Checklist

- [ ] All environment variables set in production
- [ ] Service role key not exposed to client
- [ ] CSRF protection enabled
- [ ] Rate limiting configured
- [ ] Input sanitization implemented
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection enabled
- [ ] HTTPS enforced
- [ ] Secure headers configured
- [ ] API authentication required

## Monitoring

### Key Metrics to Track

1. **Custom Domain:**
   - Verification success rate
   - SSL provisioning time
   - Middleware latency (<50ms target)
   - Domain lookup cache hit rate (>80% target)

2. **Application:**
   - API response times
   - Error rates
   - User authentication success rate
   - Image upload success rate

3. **Business:**
   - Subscription conversions
   - Gallery views
   - Custom domain adoption (Pro users)

### Logging

All critical operations are logged:
- Domain verification attempts
- SSL provisioning status
- Middleware errors
- API errors with context
- Authentication failures

## Support

For deployment issues:
1. Check logs in Vercel dashboard
2. Review Supabase logs
3. Check service status pages (Cloudflare, Stripe, etc.)
4. Contact support with error details

## Additional Resources

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Cloudflare API Documentation](https://developers.cloudflare.com/api/)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)

---

**Last Updated:** 2024
**Version:** 1.0.0
