# Environment Variables Reference

Quick reference guide for all PhotoServe environment variables.

## Quick Start

```bash
# Copy example file
cp .env.example .env

# Edit with your values
nano .env
```

## Required Variables

### Application

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_BASE_URL` | Base URL of application | `https://piksend.com` | ✅ |
| `NEXT_PUBLIC_APP_URL` | Application URL | `https://piksend.com` | ✅ |
| `NEXT_PUBLIC_APP_DOMAIN` | Primary domain (no protocol) | `piksend.com` | ✅ |

### Supabase

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key | `eyJhbGc...` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (secret) | `eyJhbGc...` | ✅ |

### Authentication

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXTAUTH_URL` | NextAuth callback URL | `https://piksend.com` | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret (generate with openssl) | `random_string` | ✅ |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `xxx.apps.googleusercontent.com` | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOCSPX-xxx` | ✅ |

### Payments (Stripe)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_live_xxx` | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key | `pk_live_xxx` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | `whsec_xxx` | ✅ |
| `STRIPE_PREMIUM_MONTHLY_PRICE_ID` | Premium monthly price | `price_xxx` | ✅ |
| `STRIPE_PREMIUM_YEARLY_PRICE_ID` | Premium yearly price | `price_xxx` | ✅ |
| `STRIPE_PRO_MONTHLY_PRICE_ID` | Pro monthly price | `price_xxx` | ✅ |
| `STRIPE_PRO_YEARLY_PRICE_ID` | Pro yearly price | `price_xxx` | ✅ |
| `STRIPE_PREMIUM_PRODUCT_ID` | Premium product ID | `prod_xxx` | ⚠️ Optional |
| `STRIPE_PRO_PRODUCT_ID` | Pro product ID | `prod_xxx` | ⚠️ Optional |

### Image Hosting (Cloudinary)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud` | ✅ |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` | ✅ |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123xyz` | ✅ |

### Custom Domain (Cloudflare)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `xxx` | ⚠️ Pro feature |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `xxx` | ⚠️ Pro feature |
| `CLOUDFLARE_ZONE_ID` | Cloudflare zone ID | `xxx` | ⚠️ Pro feature |

**Note:** Required only if enabling custom domain feature for Pro plan users.

### Email Management System

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RESEND_API_KEY` | Resend API key | `re_xxx` | ✅ (if using Resend) |
| `AWS_ACCESS_KEY_ID` | AWS access key for SES | `AKIAIOSFODNN7EXAMPLE` | ✅ (if using AWS SES) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for SES | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | ✅ (if using AWS SES) |
| `AWS_REGION` | AWS region for SES | `us-east-1` | ✅ (if using AWS SES) |
| `EMAIL_PROVIDER_DEFAULT` | Default email provider | `resend` or `ses` | ✅ |
| `EMAIL_QUEUE_BATCH_SIZE` | Number of emails to process per batch | `10` | ⚠️ Optional (default: 10) |
| `EMAIL_RETRY_MAX_ATTEMPTS` | Maximum retry attempts for failed emails | `5` | ⚠️ Optional (default: 5) |
| `EMAIL_PROVIDER_ENCRYPTION_KEY` | Encryption key for provider credentials | `base64_string` | ✅ |

**Note:** You must configure either Resend OR AWS SES. Both providers are supported, but only one needs to be active at a time.

### AI Translation (Gemini)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIzaSy...` | ✅ |

### PWA Push Notifications

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key | `BOjXtK...` | ✅ |
| `VAPID_PRIVATE_KEY` | VAPID private key | `699d-W...` | ✅ |
| `VAPID_SUBJECT` | Contact email | `mailto:contact@piksend.com` | ✅ |

## How to Get Each Variable

### Supabase

1. Go to [supabase.com](https://supabase.com)
2. Create/select project
3. Settings > API
4. Copy URL and keys

### NextAuth Secret

Generate with OpenSSL:
```bash
openssl rand -base64 32
```

### Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com)
2. Create project
3. Enable Google+ API
4. Credentials > Create OAuth 2.0 Client ID
5. Add redirect URIs

### Stripe

1. [stripe.com](https://stripe.com)
2. Developers > API keys
3. Create products in Dashboard
4. Get price IDs from products
5. Webhooks > Add endpoint

### Cloudinary

1. [cloudinary.com](https://cloudinary.com)
2. Dashboard > Account Details
3. Copy cloud name, API key, and secret

### Cloudflare

1. [cloudflare.com](https://cloudflare.com)
2. Add domain
3. My Profile > API Tokens > Create Token
4. Use "Edit zone DNS" template
5. Get Account ID and Zone ID from domain overview

### Resend

1. [resend.com](https://resend.com)
2. Dashboard > API Keys
3. Create new key

### AWS SES (Alternative to Resend)

1. [AWS Console](https://console.aws.amazon.com/ses/)
2. Navigate to Amazon SES
3. Create IAM user with SES permissions:
   - Go to IAM > Users > Create User
   - Attach policy: `AmazonSESFullAccess`
   - Create access key (Access Key ID and Secret Access Key)
4. Verify your domain or email address in SES
5. Request production access (if needed) to remove sending limits
6. Choose your AWS region (e.g., `us-east-1`, `eu-west-1`)

**Note:** AWS SES requires domain verification and may start in sandbox mode with sending limits.

### Email Provider Encryption Key

Generate a secure encryption key for storing provider credentials:

```bash
openssl rand -base64 32
```

This key is used to encrypt sensitive email provider credentials (API keys, AWS secrets) in the database.

### Gemini AI

1. [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key

### VAPID Keys

Generate with web-push:
```bash
npx web-push generate-vapid-keys
```

## Environment-Specific Configuration

### Development (.env.local)

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DOMAIN=localhost:3000
NEXTAUTH_URL=http://localhost:3000
```

### Production (.env.production)

```env
NEXT_PUBLIC_BASE_URL=https://piksend.com
NEXT_PUBLIC_APP_URL=https://piksend.com
NEXT_PUBLIC_APP_DOMAIN=piksend.com
NEXTAUTH_URL=https://piksend.com
```

## Security Best Practices

### ✅ DO

- Use `.env.local` for local development
- Add `.env*` to `.gitignore`
- Use environment variables in hosting platform (Vercel, etc.)
- Rotate secrets regularly
- Use different keys for development and production
- Keep service role keys secret (never expose to client)

### ❌ DON'T

- Commit `.env` files to version control
- Share secrets in chat/email
- Use production keys in development
- Expose service role keys to client-side code
- Hardcode secrets in source code

## Validation

Check if all required variables are set:

```bash
# Create a validation script
node scripts/validate-env.js
```

Example validation script:

```javascript
// scripts/validate-env.js
const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_SECRET',
  'STRIPE_SECRET_KEY',
  'EMAIL_PROVIDER_DEFAULT',
  'EMAIL_PROVIDER_ENCRYPTION_KEY',
  // Add provider-specific requirements based on EMAIL_PROVIDER_DEFAULT
];

// Check provider-specific requirements
const provider = process.env.EMAIL_PROVIDER_DEFAULT;
if (provider === 'resend') {
  required.push('RESEND_API_KEY');
} else if (provider === 'ses') {
  required.push('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION');
}

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
console.log(`📧 Email provider: ${provider}`);
```

## Troubleshooting

### Variable Not Loading

1. Check file name (`.env`, `.env.local`, etc.)
2. Restart development server
3. Verify no typos in variable names
4. Check if variable needs `NEXT_PUBLIC_` prefix for client-side access

### Client-Side Access

Only variables prefixed with `NEXT_PUBLIC_` are accessible in browser:

```typescript
// ✅ Works in browser
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// ❌ Undefined in browser (server-only)
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

### Vercel Deployment

Add variables in Vercel dashboard:
1. Project Settings > Environment Variables
2. Add each variable
3. Select environments (Production, Preview, Development)
4. Redeploy

## Related Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [custom-domain-implementation.md](./custom-domain-implementation.md) - Custom domain setup
- [email-integration.md](./development/email-integration.md) - Email system integration guide
- [resend-setup.md](./deployment/resend-setup.md) - Resend provider setup
- [aws-ses-setup.md](./deployment/aws-ses-setup.md) - AWS SES provider setup
- [.env.example](../.env.example) - Template file

## Email Management System Configuration

### Overview

The email management system supports two providers:
- **Resend** (recommended for simplicity)
- **AWS SES** (recommended for high volume and cost optimization)

You only need to configure ONE provider, though both can be configured for flexibility.

### Provider Selection

Set `EMAIL_PROVIDER_DEFAULT` to choose your active provider:
- `resend` - Use Resend as the email provider
- `ses` - Use AWS SES as the email provider

### Resend Configuration (Recommended)

**Pros:**
- Simple setup (just API key)
- No domain verification required initially
- Great developer experience
- Built-in analytics

**Cons:**
- Higher cost at scale
- Less control over infrastructure

**Setup:**
1. Sign up at [resend.com](https://resend.com)
2. Create API key in dashboard
3. Set `RESEND_API_KEY` in your environment
4. Set `EMAIL_PROVIDER_DEFAULT=resend`

### AWS SES Configuration (For Scale)

**Pros:**
- Very cost-effective at scale
- High sending limits
- Full control over infrastructure
- Integrates with AWS ecosystem

**Cons:**
- More complex setup
- Requires domain verification
- Starts in sandbox mode (requires production access request)
- Manual webhook setup via SNS

**Setup:**
1. Create AWS account
2. Navigate to Amazon SES
3. Verify your domain (add DNS records)
4. Create IAM user with SES permissions
5. Generate access keys
6. Request production access (to remove sandbox limits)
7. Set environment variables:
   ```env
   AWS_ACCESS_KEY_ID=your_access_key
   AWS_SECRET_ACCESS_KEY=your_secret_key
   AWS_REGION=us-east-1
   EMAIL_PROVIDER_DEFAULT=ses
   ```

### Queue Configuration

**EMAIL_QUEUE_BATCH_SIZE**
- Controls how many emails are processed in each batch
- Default: `10`
- Increase for higher throughput (e.g., `50` or `100`)
- Decrease if experiencing rate limits

**EMAIL_RETRY_MAX_ATTEMPTS**
- Maximum number of retry attempts for failed emails
- Default: `5`
- Retries use exponential backoff (1min, 5min, 15min, 30min, 60min)
- Set to `3` for faster failure detection
- Set to `10` for maximum resilience

### Security Best Practices

1. **Encryption Key**
   - Generate unique key: `openssl rand -base64 32`
   - Never commit to version control
   - Rotate periodically (requires re-encrypting stored credentials)

2. **Provider Credentials**
   - Use separate keys for development and production
   - Restrict IAM permissions (AWS) to minimum required
   - Monitor API usage for anomalies
   - Rotate keys regularly

3. **Access Control**
   - Email management UI is admin-only
   - API routes require authentication
   - Rate limiting prevents abuse

### Testing Your Configuration

After setting up environment variables, test your email configuration:

```bash
# Start development server
npm run dev

# Navigate to admin panel
# http://localhost:3000/admin/emails/providers

# Test provider connection
# Click "Test Connection" button for your configured provider
```

### Switching Providers

You can switch between providers without losing data:

1. Configure both providers in environment variables
2. Go to Admin > Emails > Providers
3. Select the provider you want to use
4. Click "Set as Active"
5. Test the connection

All email templates, logs, and queue items are provider-agnostic.

### Troubleshooting

**Resend Issues:**
- Verify API key is correct
- Check API key permissions
- Ensure domain is verified (for production sending)
- Check Resend dashboard for errors

**AWS SES Issues:**
- Verify IAM permissions include SES access
- Check if account is in sandbox mode
- Verify domain/email addresses in SES console
- Ensure region matches your SES setup
- Check AWS CloudWatch logs for errors

**Queue Issues:**
- Check Supabase Edge Function logs
- Verify cron trigger is enabled
- Check database for queued emails: `SELECT * FROM email_queue WHERE status = 'pending'`
- Monitor queue depth in admin dashboard

**General Issues:**
- Restart development server after changing environment variables
- Clear Next.js cache: `rm -rf .next`
- Check application logs for detailed error messages
- Verify all required environment variables are set

---

**Last Updated:** 2024
