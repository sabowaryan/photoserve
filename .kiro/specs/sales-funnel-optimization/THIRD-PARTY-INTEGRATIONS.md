# Third-Party Integrations Guide

This document provides comprehensive documentation for all third-party integrations used in the PikSend sales funnel optimization.

## Requirements Addressed

- **24.1**: Stripe payment integration
- **24.2**: Google Analytics 4 integration
- **24.3**: Mixpanel analytics integration
- **24.4**: Email service integration (Resend/SendGrid)
- **24.5**: Cloudinary CDN integration
- **24.6**: Support chat integration (Intercom/Crisp)
- **24.7**: Review platform integration (Trustpilot/G2)
- **24.8**: Configuration guide with API keys

## Table of Contents

1. [Stripe Payment Integration](#1-stripe-payment-integration)
2. [Google Analytics 4](#2-google-analytics-4)
3. [Mixpanel Analytics](#3-mixpanel-analytics)
4. [Email Service (Resend)](#4-email-service-resend)
5. [Cloudinary CDN](#5-cloudinary-cdn)
6. [Support Chat (Crisp)](#6-support-chat-crisp)
7. [Review Platforms](#7-review-platforms)
8. [Environment Variables](#8-environment-variables)

---

## 1. Stripe Payment Integration

### Purpose
Handle subscription payments, upgrades, and billing for Premium and Pro plans.

### Configuration

**Environment Variables** (`.env.local`):
```bash
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...
```

### Setup Steps

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Complete business verification
   - Enable test mode for development

2. **Create Products and Prices**
   ```bash
   # Premium Monthly
   stripe products create --name="Premium" --description="Premium plan"
   stripe prices create --product=prod_... --unit-amount=999 --currency=usd --recurring[interval]=month
   
   # Premium Yearly
   stripe prices create --product=prod_... --unit-amount=9990 --currency=usd --recurring[interval]=year
   
   # Pro Monthly
   stripe products create --name="Pro" --description="Pro plan"
   stripe prices create --product=prod_... --unit-amount=1999 --currency=usd --recurring[interval]=month
   
   # Pro Yearly
   stripe prices create --product=prod_... --unit-amount=19990 --currency=usd --recurring[interval]=year
   ```

3. **Configure Webhooks**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Test Integration**
   ```bash
   # Use Stripe CLI for local testing
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   
   # Test checkout
   stripe checkout sessions create \
     --mode subscription \
     --line-items[0][price]=price_... \
     --line-items[0][quantity]=1 \
     --success-url="http://localhost:3000/success" \
     --cancel-url="http://localhost:3000/cancel"
   ```

### Usage

**Create Checkout Session**:
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  payment_method_types: ['card'],
  line_items: [
    {
      price: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID,
      quantity: 1,
    },
  ],
  success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_URL}/pricing`,
  customer_email: user.email,
  metadata: {
    userId: user.id,
  },
  subscription_data: {
    trial_period_days: 14,
  },
});
```

### Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## 2. Google Analytics 4

### Purpose
Track website traffic, user behavior, and conversion events.

### Configuration

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Setup in `app/layout.tsx`**:
```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Setup Steps

1. **Create GA4 Property**
   - Go to https://analytics.google.com
   - Create new property
   - Select "Web" as platform
   - Copy Measurement ID (G-XXXXXXXXXX)

2. **Configure Events**
   - Go to Events → Create Event
   - Set up custom events:
     - `quiz_completed`
     - `signup_completed`
     - `first_gallery_created`
     - `upgrade_completed`

3. **Set Up Conversions**
   - Go to Events → Mark as conversion
   - Mark these events as conversions:
     - `signup_completed`
     - `upgrade_completed`

### Usage

**Track Page Views**:
```typescript
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: url,
    });
  }
}
```

**Track Events**:
```typescript
export function trackGAEvent(
  eventName: string,
  eventParams?: Record<string, any>
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
}

// Usage
trackGAEvent('quiz_completed', {
  persona: 'wedding',
  quiz_version: 'v1',
});
```

### Resources
- [GA4 Documentation](https://support.google.com/analytics/answer/10089681)
- [GA4 Events](https://support.google.com/analytics/answer/9322688)

---

## 3. Mixpanel Analytics

### Purpose
Advanced product analytics, user segmentation, and funnel analysis.

### Configuration

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_MIXPANEL_TOKEN=your_mixpanel_token
```

**Installation**:
```bash
npm install mixpanel-browser
```

**Setup** (`lib/analytics/mixpanel.ts`):
```typescript
import mixpanel from 'mixpanel-browser';

// Initialize Mixpanel
if (typeof window !== 'undefined') {
  mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN!, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: true,
    persistence: 'localStorage',
  });
}

export { mixpanel };
```

### Setup Steps

1. **Create Mixpanel Project**
   - Sign up at https://mixpanel.com
   - Create new project
   - Copy project token

2. **Configure Funnels**
   - Go to Funnels → Create Funnel
   - Set up conversion funnel:
     1. Page View
     2. Quiz Completed
     3. Signup Completed
     4. First Gallery Created
     5. Upgrade Completed

3. **Set Up User Profiles**
   - Enable user profiles
   - Configure profile properties:
     - `persona`
     - `signup_date`
     - `plan`
     - `galleries_count`

### Usage

**Track Events**:
```typescript
import { mixpanel } from '@/lib/analytics/mixpanel';

// Track event
mixpanel.track('Quiz Completed', {
  persona: 'wedding',
  quiz_version: 'v1',
  completion_time: 45,
});

// Identify user
mixpanel.identify(user.id);

// Set user properties
mixpanel.people.set({
  $email: user.email,
  $name: user.name,
  persona: user.persona,
  plan: user.plan,
});

// Track revenue
mixpanel.people.track_charge(19.99, {
  plan: 'pro',
  interval: 'monthly',
});
```

### Resources
- [Mixpanel Documentation](https://docs.mixpanel.com/)
- [Mixpanel JavaScript SDK](https://github.com/mixpanel/mixpanel-js)

---

## 4. Email Service (Resend)

### Purpose
Send transactional and marketing emails (welcome, activation, upgrade reminders).

### Configuration

**Environment Variables** (`.env.local`):
```bash
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@piksend.com
```

**Installation**:
```bash
npm install resend
```

### Setup Steps

1. **Create Resend Account**
   - Sign up at https://resend.com
   - Verify your domain
   - Generate API key

2. **Verify Domain**
   - Add DNS records:
     ```
     TXT: resend._domainkey.piksend.com
     CNAME: resend.piksend.com
     ```
   - Wait for verification (up to 48 hours)

3. **Create Email Templates**
   - Use React Email for templates
   - Store in `emails/` directory

### Usage

**Send Email**:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL!,
  to: user.email,
  subject: 'Bienvenue sur PikSend',
  react: WelcomeEmail({ name: user.name }),
});
```

**Email Templates** (`emails/welcome.tsx`):
```tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export function WelcomeEmail({ name }: { name: string }) {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Bonjour {name},</Text>
          <Text>Bienvenue sur PikSend!</Text>
          <Button href="https://piksend.com/dashboard">
            Accéder au dashboard
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
```

### Resources
- [Resend Documentation](https://resend.com/docs)
- [React Email](https://react.email/)

---

## 5. Cloudinary CDN

### Purpose
Image optimization, transformation, and CDN delivery.

### Configuration

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Installation**:
```bash
npm install cloudinary
```

### Setup Steps

1. **Create Cloudinary Account**
   - Sign up at https://cloudinary.com
   - Copy cloud name, API key, and API secret

2. **Configure Upload Presets**
   - Go to Settings → Upload
   - Create preset: `piksend_galleries`
   - Set folder: `galleries`
   - Enable auto-tagging

3. **Configure Transformations**
   - Create named transformations:
     - `thumbnail`: w_300,h_300,c_fill
     - `preview`: w_800,h_600,c_fit
     - `full`: w_1920,h_1080,c_limit

### Usage

**Upload Image**:
```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const result = await cloudinary.uploader.upload(file, {
  folder: 'galleries',
  upload_preset: 'piksend_galleries',
  resource_type: 'image',
});
```

**Display Image**:
```tsx
import Image from 'next/image';

<Image
  src={`https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_600,c_fit/${publicId}`}
  alt="Gallery image"
  width={800}
  height={600}
/>
```

### Resources
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Next.js Integration](https://cloudinary.com/documentation/next_integration)

---

## 6. Support Chat (Crisp)

### Purpose
Provide real-time customer support via chat widget.

### Configuration

**Environment Variables** (`.env.local`):
```bash
NEXT_PUBLIC_CRISP_WEBSITE_ID=your_website_id
```

**Setup in `app/layout.tsx`**:
```tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script id="crisp-chat" strategy="afterInteractive">
          {`
            window.$crisp=[];
            window.CRISP_WEBSITE_ID="${process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID}";
            (function(){
              d=document;
              s=d.createElement("script");
              s.src="https://client.crisp.chat/l.js";
              s.async=1;
              d.getElementsByTagName("head")[0].appendChild(s);
            })();
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### Setup Steps

1. **Create Crisp Account**
   - Sign up at https://crisp.chat
   - Create website
   - Copy website ID

2. **Configure Chat Widget**
   - Customize colors and position
   - Set up automated messages
   - Configure business hours

3. **Set Up User Data**
   ```typescript
   // Set user data when logged in
   if (typeof window !== 'undefined' && window.$crisp) {
     window.$crisp.push(['set', 'user:email', [user.email]]);
     window.$crisp.push(['set', 'user:nickname', [user.name]]);
     window.$crisp.push(['set', 'session:data', [[
       ['plan', user.plan],
       ['galleries', user.galleriesCount],
     ]]]);
   }
   ```

### Resources
- [Crisp Documentation](https://docs.crisp.chat/)
- [Crisp JavaScript SDK](https://docs.crisp.chat/guides/chatbox-sdks/web-sdk/)

---

## 7. Review Platforms

### Purpose
Display social proof through customer reviews and ratings.

### Trustpilot Integration

**Configuration**:
```bash
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID=your_business_id
```

**Widget Code**:
```tsx
<div
  className="trustpilot-widget"
  data-locale="fr-FR"
  data-template-id="5419b6a8b0d04a076446a9ad"
  data-businessunit-id={process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID}
  data-style-height="24px"
  data-style-width="100%"
  data-theme="light"
>
  <a
    href={`https://fr.trustpilot.com/review/${process.env.NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID}`}
    target="_blank"
    rel="noopener"
  >
    Trustpilot
  </a>
</div>

<Script
  src="https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"
  strategy="lazyOnload"
/>
```

### G2 Integration

**Configuration**:
```bash
NEXT_PUBLIC_G2_PRODUCT_ID=your_product_id
```

**Widget Code**:
```tsx
<div
  className="g2-review-widget"
  data-product-id={process.env.NEXT_PUBLIC_G2_PRODUCT_ID}
  data-number-of-reviews="5"
/>

<Script
  src="https://www.g2.com/products/widget.js"
  strategy="lazyOnload"
/>
```

### Resources
- [Trustpilot Widgets](https://support.trustpilot.com/hc/en-us/articles/115011421468)
- [G2 Widgets](https://www.g2.com/products/widgets)

---

## 8. Environment Variables

### Complete `.env.local` Template

```bash
# Database
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_YEARLY_PRICE_ID=price_...
STRIPE_PRO_MONTHLY_PRICE_ID=price_...
STRIPE_PRO_YEARLY_PRICE_ID=price_...

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_MIXPANEL_TOKEN=...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@piksend.com

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Support
NEXT_PUBLIC_CRISP_WEBSITE_ID=...

# Reviews
NEXT_PUBLIC_TRUSTPILOT_BUSINESS_ID=...
NEXT_PUBLIC_G2_PRODUCT_ID=...

# App
NEXT_PUBLIC_URL=http://localhost:3000
```

### Security Best Practices

1. **Never commit `.env.local` to git**
   - Add to `.gitignore`
   - Use `.env.example` for template

2. **Use different keys for development and production**
   - Test keys for development
   - Live keys for production

3. **Rotate keys regularly**
   - Change keys every 90 days
   - Rotate immediately if compromised

4. **Use environment-specific variables**
   - Vercel: Set in project settings
   - Local: Use `.env.local`

5. **Validate environment variables**
   ```typescript
   // lib/env.ts
   const requiredEnvVars = [
     'DATABASE_URL',
     'STRIPE_SECRET_KEY',
     'RESEND_API_KEY',
   ];

   requiredEnvVars.forEach((envVar) => {
     if (!process.env[envVar]) {
       throw new Error(`Missing required environment variable: ${envVar}`);
     }
   });
   ```

---

## Testing Integrations

### Development Testing

```bash
# Test Stripe webhooks locally
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Test email sending
npm run test:email

# Test analytics tracking
npm run test:analytics
```

### Production Testing

1. **Stripe**: Use test mode first, then switch to live mode
2. **Analytics**: Verify events in GA4 and Mixpanel dashboards
3. **Email**: Send test emails to team members
4. **Cloudinary**: Upload test images
5. **Support**: Test chat widget functionality

---

## Troubleshooting

### Common Issues

**Stripe webhook not receiving events**:
- Check webhook URL is correct
- Verify webhook secret matches
- Check firewall/security settings

**Analytics not tracking**:
- Verify measurement ID is correct
- Check ad blockers are disabled
- Verify script is loaded

**Email not sending**:
- Verify domain is verified
- Check API key is valid
- Verify from email is authorized

**Images not loading**:
- Check Cloudinary cloud name
- Verify API credentials
- Check CORS settings

---

## Support

For integration support:
- **Stripe**: https://support.stripe.com
- **Google Analytics**: https://support.google.com/analytics
- **Mixpanel**: https://help.mixpanel.com
- **Resend**: https://resend.com/support
- **Cloudinary**: https://support.cloudinary.com
- **Crisp**: https://help.crisp.chat

---

## Conclusion

All third-party integrations are documented with:
- Configuration instructions
- Setup steps
- Usage examples
- Environment variables
- Testing procedures
- Troubleshooting guides

Refer to this document when setting up new environments or troubleshooting integration issues.
