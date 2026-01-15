# Design Document: Stripe Connect & Photographer Monetization

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         PikSend Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    │
│  │  Photographer │───▶│   Gallery    │───▶│    Client    │    │
│  │   Dashboard   │    │   Paywall    │    │   Purchase   │    │
│  └──────────────┘    └──────────────┘    └──────────────┘    │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐     │
│  │              Stripe Connect Integration              │     │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │     │
│  │  │ Onboarding │  │  Checkout  │  │  Webhooks  │    │     │
│  │  └────────────┘  └────────────┘  └────────────┘    │     │
│  └──────────────────────────────────────────────────────┘     │
│         │                    │                    │            │
│         ▼                    ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐     │
│  │                  Supabase Database                   │     │
│  │  • stripe_connect_accounts                           │     │
│  │  • gallery_monetization                              │     │
│  │  • gallery_purchases                                 │     │
│  │  • photographer_payouts                              │     │
│  │  • webhook_events                                    │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Stripe Platform │
                    │  • Connect API   │
                    │  • Checkout API  │
                    │  • Webhooks      │
                    │  • Payouts       │
                    └──────────────────┘
```

## Data Flow

### 1. Photographer Onboarding Flow

```
Photographer → Settings → Connect Stripe
                    │
                    ▼
        POST /api/stripe/connect/onboard
                    │
                    ▼
        Create Stripe Connect Account
                    │
                    ▼
        Generate Onboarding Link
                    │
                    ▼
        Redirect to Stripe Onboarding
                    │
                    ▼
        Photographer completes onboarding
                    │
                    ▼
        Stripe sends account.updated webhook
                    │
                    ▼
        Update stripe_connect_accounts table
                    │
                    ▼
        Redirect back to PikSend
                    │
                    ▼
        Display "Connected" status
```


### 2. Gallery Monetization Configuration Flow

```
Photographer → Gallery Settings → Monetization Tab
                    │
                    ▼
        Enable Paywall Toggle
                    │
                    ▼
        Set Price ($5-$500)
                    │
                    ▼
        Choose Preview Mode (Full/Freemium)
                    │
                    ▼
        POST /api/galleries/[id]/monetization
                    │
                    ▼
        Create Stripe Price (if needed)
                    │
                    ▼
        Save to gallery_monetization table
                    │
                    ▼
        Display success message
```

### 3. Client Purchase Flow

```
Client → Gallery URL
        │
        ▼
    Check if paywall enabled
        │
        ├─ No → Show gallery normally
        │
        └─ Yes → Check if already purchased
                │
                ├─ Yes → Show gallery (HD, no watermark)
                │
                └─ No → Show paywall screen
                        │
                        ▼
                Client clicks "Purchase Access"
                        │
                        ▼
        POST /api/stripe/checkout/gallery-purchase
                        │
                        ▼
        Create Stripe Checkout Session
        (Destination Charge to photographer)
                        │
                        ▼
        Redirect to Stripe Checkout
                        │
                        ▼
        Client enters payment info
                        │
                        ▼
        Payment processed by Stripe
                        │
                        ├─ Success → Redirect to success_url
                        │            │
                        │            ▼
                        │   Stripe sends checkout.session.completed
                        │            │
                        │            ▼
                        │   POST /api/stripe/webhook
                        │            │
                        │            ▼
                        │   Create gallery_purchases record
                        │            │
                        │            ▼
                        │   Send confirmation email
                        │            │
                        │            ▼
                        │   Notify photographer
                        │            │
                        │            ▼
                        │   Client sees gallery (HD)
                        │
                        └─ Failure → Redirect to cancel_url
                                    │
                                    ▼
                            Show error message
```


### 4. Revenue Dashboard Data Flow

```
Photographer → Dashboard → Revenue
                    │
                    ▼
        GET /api/photographer/revenue/overview
                    │
                    ▼
        Query gallery_purchases table
        WHERE photographer_id = current_user
                    │
                    ▼
        Calculate metrics:
        • Total revenue
        • Sales count
        • Average order value
        • Conversion rate
                    │
                    ▼
        GET /api/photographer/revenue/chart
                    │
                    ▼
        Aggregate sales by date
                    │
                    ▼
        Return chart data
                    │
                    ▼
        GET /api/photographer/sales
                    │
                    ▼
        Query gallery_purchases with pagination
                    │
                    ▼
        Return sales list
                    │
                    ▼
        Display dashboard with all data
```

### 5. Payout Flow

```
Stripe → Automatic Payout Schedule (Daily/Weekly/Monthly)
        │
        ▼
    Calculate available balance
        │
        ▼
    Create payout to photographer's bank
        │
        ▼
    Send payout.created webhook
        │
        ▼
    POST /api/stripe/webhook
        │
        ▼
    Create photographer_payouts record
    (status: pending)
        │
        ▼
    Payout processes (2-5 business days)
        │
        ▼
    Send payout.paid webhook
        │
        ▼
    Update photographer_payouts
    (status: paid)
        │
        ▼
    Send notification email to photographer
        │
        ▼
    Photographer sees payout in dashboard
```

