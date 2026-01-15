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

### Email (Resend)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `RESEND_API_KEY` | Resend API key | `re_xxx` | ✅ |

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
  // ... add all required variables
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(key => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
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
- [.env.example](../.env.example) - Template file

---

**Last Updated:** 2024
