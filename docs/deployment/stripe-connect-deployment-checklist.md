# Stripe Connect Monetization - Deployment Checklist

This checklist guides the deployment of the Stripe Connect monetization system to production.

## Pre-Deployment Checklist

### Environment Variables

Ensure the following environment variables are configured in production:

```bash
# Stripe (Live Mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET_GALLERY_PURCHASE=whsec_...
STRIPE_WEBHOOK_SECRET_CONNECT=whsec_...

# Platform Configuration
STRIPE_PLATFORM_FEE_PERCENT=10.0

# Redis (for caching)
REDIS_URL=redis://...
```

### Stripe Dashboard Configuration

- [ ] Switch to Live mode in Stripe Dashboard
- [ ] Verify Connect settings are configured
- [ ] Set up branding for Connect onboarding

---

## Deployment Steps

### Step 1: Configure Production Webhooks

1. Go to [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"

**Gallery Purchase Webhook:**
- URL: `https://your-domain.com/api/stripe/webhook/gallery-purchase`
- Events to listen for:
  - `checkout.session.completed`
  - `charge.refunded`
  - `charge.dispute.created`
  - `charge.dispute.closed`

**Connect Webhook:**
- URL: `https://your-domain.com/api/stripe/connect/webhook`
- Events to listen for:
  - `account.updated`
  - `payout.created`
  - `payout.paid`
  - `payout.failed`

3. Copy the webhook signing secrets to environment variables

### Step 2: Database Migration

Run the following migrations in order:

```bash
# Connect to production database
supabase db push --db-url $PRODUCTION_DATABASE_URL

# Or run migrations manually:
# 1. 20260115120100_create_stripe_connect_accounts.sql
# 2. 20260115120200_create_gallery_monetization.sql
# 3. 20260115120300_create_gallery_purchases.sql
# 4. 20260116120000_create_webhook_events.sql
# 5. 20260116120100_create_photographer_payouts.sql
# 6. 20260117120000_create_in_app_notifications.sql
# 7. 20260117120100_optimize_monetization_indexes.sql
```

**Verification:**
```sql
-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'stripe_connect_accounts',
  'gallery_monetization',
  'gallery_purchases',
  'webhook_events',
  'photographer_payouts',
  'in_app_notifications'
);

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE '%monetization%' OR indexname LIKE '%purchase%';
```

### Step 3: Deploy Code

```bash
# Deploy to production
git push production main

# Or via CI/CD pipeline
# Ensure all tests pass before deployment
```

### Step 4: Post-Deployment Testing

**Test Stripe Connect:**
1. Create a test Pro user account
2. Navigate to Settings > Stripe Connect
3. Click "Connect with Stripe"
4. Complete onboarding with test data
5. Verify account status shows "Connected"

**Test Gallery Monetization:**
1. Create a test gallery
2. Enable paywall with $5.00 price
3. Verify paywall displays correctly
4. Test purchase flow with test card

**Test Webhooks:**
```bash
# Use Stripe CLI to test webhooks
stripe trigger checkout.session.completed --live
stripe trigger account.updated --live
```

### Step 5: Monitor Production

**Logs to Monitor:**
- Application logs for errors
- Stripe webhook delivery status
- Database query performance

**Key Metrics:**
- Webhook success rate (target: >99%)
- Checkout completion rate
- API response times

**Alerts to Configure:**
- Failed webhook deliveries
- High error rates
- Database connection issues

### Step 6: User Communication

**Announcement Template:**

```
Subject: New Feature: Monetize Your Galleries with Stripe Connect

Hi [Name],

We're excited to announce a new feature for Pro users: Gallery Monetization!

You can now:
✅ Connect your Stripe account to receive payments
✅ Set up paywalls on your galleries
✅ Track revenue and sales in your dashboard
✅ Receive automatic payouts to your bank

Get started:
1. Go to Settings > Stripe Connect
2. Click "Connect with Stripe"
3. Complete the quick setup
4. Enable paywalls on your galleries

Learn more: [Link to documentation]

Questions? Reply to this email or visit our Help Center.

Best,
The PikSend Team
```

---

## Rollback Plan

If issues are detected:

1. **Disable monetization features:**
   ```sql
   UPDATE gallery_monetization SET is_enabled = false;
   ```

2. **Revert code deployment:**
   ```bash
   git revert HEAD
   git push production main
   ```

3. **Disable webhooks in Stripe Dashboard**

4. **Communicate with affected users**

---

## Post-Launch Monitoring (First 48 Hours)

- [ ] Monitor error rates
- [ ] Check webhook delivery success
- [ ] Review first purchases for issues
- [ ] Monitor payout processing
- [ ] Respond to user feedback

---

## Support Escalation

For issues during deployment:

1. **Stripe Issues:** Contact Stripe Support
2. **Database Issues:** Check Supabase status
3. **Application Issues:** Review error logs

---

*Last updated: January 2025*
