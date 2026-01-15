# Requirements Document: Stripe Connect & Photographer Monetization

## Introduction

Ce document définit les exigences pour l'implémentation complète de **Stripe Connect** permettant aux photographes de monétiser leurs galeries, gérer leurs revenus, et recevoir des paiements directs. Cette spec consolide et améliore les fonctionnalités décrites dans les documents existants tout en évitant la redondance.

## Glossary

- **Stripe Connect**: Plateforme permettant aux photographes de recevoir des paiements directs
- **Connected Account**: Compte Stripe du photographe lié à PikSend
- **Platform Fee**: Commission prélevée par PikSend (10%)
- **Payout**: Transfert de fonds vers le compte bancaire du photographe
- **Paywall**: Système de paiement pour débloquer l'accès aux galeries
- **Gallery Unlock**: Paiement one-time pour accéder aux photos HD
- **Revenue Dashboard**: Tableau de bord des revenus photographe
- **Webhook**: Notification automatique de Stripe vers PikSend
- **Payment Intent**: Intention de paiement Stripe
- **Checkout Session**: Session de paiement hébergée par Stripe

## Requirements

---

### Pilier 1: Stripe Connect - Configuration Photographe

### Requirement 1.1: Onboarding Stripe Connect

**User Story:** As a photographer with Pro plan, I want to connect my Stripe account, so that I can receive payments directly from my clients.

#### Acceptance Criteria

1. THE Settings SHALL include "Stripe Connect" section (Pro plan only)
2. WHEN photographer clicks "Connect Stripe", THE System SHALL create Stripe Connect account
3. THE System SHALL use Stripe Connect Onboarding flow (hosted)
4. THE Onboarding SHALL collect: Business info, bank account, identity verification
5. WHEN onboarding is complete, THE System SHALL store connected_account_id
6. THE System SHALL display connection status (connected, pending, not_connected)
7. THE Photographer SHALL be able to disconnect and reconnect
8. WHERE plan is not Pro, THE Connect_Button SHALL be disabled with upgrade prompt

### Requirement 1.2: Account Status & Verification

**User Story:** As a photographer, I want to see my Stripe account status, so that I know if I can receive payments.

#### Acceptance Criteria

1. THE Dashboard SHALL display Stripe account status badge
2. THE Status SHALL be: "Verified" (green), "Pending" (yellow), "Action Required" (red)
3. WHEN verification is pending, THE System SHALL display required actions
4. THE System SHALL check account status via Stripe API daily
5. WHEN account is restricted, THE System SHALL notify photographer
6. THE Photographer SHALL be able to access Stripe Dashboard directly


---

### Pilier 2: Gallery Monetization - Paywall

### Requirement 2.1: Gallery Paywall Configuration

**User Story:** As a photographer, I want to set a price for my gallery, so that clients must pay to access HD photos.

#### Acceptance Criteria

1. THE Gallery_Settings SHALL include "Monetization" tab (Pro plan only)
2. THE Photographer SHALL be able to toggle paywall on/off
3. THE Photographer SHALL set price (min $5, max $500)
4. THE Photographer SHALL choose currency (USD, EUR, CAD)
5. THE Photographer SHALL choose preview mode: "Full Paywall" or "Freemium Preview"
6. WHERE preview mode is Freemium, THE System SHALL show low-res images with watermark
7. THE System SHALL calculate and display: Price, Platform Fee (10%), Net Earnings (90%)
8. THE Configuration SHALL be saved in `gallery_monetization` table
9. WHERE Stripe Connect is not configured, THE System SHALL prompt to connect

### Requirement 2.2: Paywall Display (Full Mode)

**User Story:** As a client, I want to see the paywall screen, so that I understand what I'm purchasing.

#### Acceptance Criteria

1. WHEN accessing a paid gallery, THE System SHALL display paywall screen
2. THE Paywall SHALL show: Gallery title, preview images (3-5 blurred), price, features list
3. THE Features SHALL include: Photo count, HD quality, No watermark, Download access
4. THE Paywall SHALL have prominent "Purchase Access" CTA button
5. THE Paywall SHALL display photographer logo (if configured)
6. THE Paywall SHALL show "Secure payment by Stripe" badge
7. THE Paywall SHALL be responsive (mobile-first design)

### Requirement 2.3: Freemium Preview Mode

**User Story:** As a client, I want to preview all photos before buying, so that I can decide if I want to purchase.

#### Acceptance Criteria

1. WHEN preview mode is enabled, THE Gallery SHALL display all images
2. THE Images SHALL be low-resolution (max 800px width)
3. THE Images SHALL have watermark overlay (photographer logo or PikSend)
4. THE Download_Buttons SHALL be disabled
5. THE Gallery SHALL show sticky banner: "Unlock HD for $XX.XX"
6. THE Banner SHALL have "Unlock Now" CTA button
7. WHEN clicking image, THE Lightbox SHALL show low-res with watermark
8. THE Lightbox SHALL have "Unlock HD" button


---

### Pilier 3: Payment Processing

### Requirement 3.1: Stripe Checkout Integration

**User Story:** As a client, I want to pay securely, so that I can access the gallery.

#### Acceptance Criteria

1. WHEN clicking "Purchase Access", THE System SHALL create Stripe Checkout session
2. THE Checkout SHALL use Stripe Connect (destination charge)
3. THE Platform_Fee SHALL be 10% of the total amount
4. THE Photographer SHALL receive 90% directly to their connected account
5. THE Checkout SHALL include metadata: gallery_id, buyer_email, photographer_id
6. THE Checkout SHALL redirect to success_url after payment
7. THE Checkout SHALL redirect to cancel_url if cancelled
8. THE Checkout SHALL support all major payment methods (cards, Apple Pay, Google Pay)

### Requirement 3.2: Payment Confirmation & Access Grant

**User Story:** As a client, I want immediate access after payment, so that I can view and download photos.

#### Acceptance Criteria

1. WHEN payment succeeds, THE Webhook SHALL receive `checkout.session.completed`
2. THE System SHALL verify webhook signature for security
3. THE System SHALL create record in `gallery_purchases` table
4. THE System SHALL mark gallery as unlocked for the buyer (by email or session_id)
5. THE System SHALL send confirmation email to buyer
6. THE System SHALL notify photographer of the sale
7. THE Buyer SHALL be redirected to gallery with success message
8. THE Gallery SHALL now display HD images without watermark
9. THE Download_Buttons SHALL be enabled

### Requirement 3.3: Access Verification

**User Story:** As a system, I want to verify purchase before granting access, so that only paying clients can access HD photos.

#### Acceptance Criteria

1. THE System SHALL check purchase status on every gallery load
2. THE Verification SHALL check: buyer_email OR buyer_session_id
3. THE Verification SHALL check purchase status is 'succeeded'
4. THE Verification SHALL check access has not expired (if duration set)
5. WHERE purchase is valid, THE System SHALL grant full access
6. WHERE purchase is invalid, THE System SHALL show paywall
7. THE Gallery_Owner SHALL always have full access
8. THE Verification SHALL be cached for performance (5 minutes)


---

### Pilier 4: Revenue Dashboard

### Requirement 4.1: Sales Overview

**User Story:** As a photographer, I want to see my sales metrics, so that I can track my revenue.

#### Acceptance Criteria

1. THE Dashboard SHALL include "Revenue" section
2. THE Overview SHALL display: Total Revenue, Sales Count, Average Sale, Conversion Rate
3. THE Metrics SHALL show comparison with previous period (% change)
4. THE Overview SHALL display revenue for: Today, This Week, This Month, All Time
5. THE Revenue SHALL be displayed in photographer's currency
6. THE Dashboard SHALL be accessible from main navigation

### Requirement 4.2: Revenue Chart

**User Story:** As a photographer, I want to see revenue trends, so that I can understand my business growth.

#### Acceptance Criteria

1. THE Dashboard SHALL display revenue chart (line or bar)
2. THE Chart SHALL support time ranges: 7 days, 30 days, 90 days, 1 year
3. THE Chart SHALL show daily, weekly, or monthly aggregation
4. THE Chart SHALL be interactive (hover to see details)
5. THE Chart SHALL use brand colors for consistency
6. THE Chart SHALL be responsive (mobile-friendly)

### Requirement 4.3: Sales List

**User Story:** As a photographer, I want to see all my sales, so that I can track individual transactions.

#### Acceptance Criteria

1. THE Dashboard SHALL display sales list table
2. THE Table SHALL show: Date, Gallery, Client Email, Amount, Platform Fee, Net Earnings, Status
3. THE Table SHALL support sorting by date, amount, gallery
4. THE Table SHALL support filtering by date range, gallery, status
5. THE Table SHALL support pagination (20 items per page)
6. THE Table SHALL support search by client email or gallery name
7. THE Table SHALL display status badge (Paid, Refunded, Disputed)
8. WHEN clicking a sale, THE System SHALL show detailed view

### Requirement 4.4: Top Galleries

**User Story:** As a photographer, I want to see my best-selling galleries, so that I can understand what works.

#### Acceptance Criteria

1. THE Dashboard SHALL display "Top Galleries" widget
2. THE Widget SHALL show top 5 galleries by revenue
3. THE Widget SHALL display: Gallery name, Sales count, Total revenue
4. THE Widget SHALL be sortable by revenue or sales count
5. THE Widget SHALL link to gallery details


---

### Pilier 5: Payouts & Transfers

### Requirement 5.1: Automatic Payouts (Stripe Connect)

**User Story:** As a photographer, I want to receive payments automatically, so that I don't have to request withdrawals.

#### Acceptance Criteria

1. THE System SHALL use Stripe Connect automatic payouts
2. THE Payouts SHALL be transferred directly to photographer's bank account
3. THE Payout_Schedule SHALL be configurable: Daily, Weekly, Monthly
4. THE Default_Schedule SHALL be Weekly (every Monday)
5. THE Photographer SHALL configure schedule in Stripe Dashboard
6. THE System SHALL track payout status via webhooks
7. THE Dashboard SHALL display next payout date and amount

### Requirement 5.2: Payout History

**User Story:** As a photographer, I want to see my payout history, so that I can track received payments.

#### Acceptance Criteria

1. THE Dashboard SHALL display "Payouts" tab
2. THE Tab SHALL show list of all payouts
3. THE List SHALL display: Date, Amount, Status, Arrival Date, Bank Account (last 4 digits)
4. THE Status SHALL be: Pending, In Transit, Paid, Failed
5. THE List SHALL support filtering by date range and status
6. THE List SHALL support pagination
7. WHEN clicking a payout, THE System SHALL show detailed breakdown (which sales)

### Requirement 5.3: Balance Display

**User Story:** As a photographer, I want to see my available balance, so that I know how much I'll receive.

#### Acceptance Criteria

1. THE Dashboard SHALL display current balance widget
2. THE Balance SHALL show: Available, Pending, Total
3. THE Available SHALL be funds ready for payout
4. THE Pending SHALL be funds in transit or held
5. THE Widget SHALL display next payout date
6. THE Widget SHALL link to Stripe Dashboard for details


---

### Pilier 6: Webhooks & Synchronization

### Requirement 6.1: Webhook Endpoint

**User Story:** As a system, I want to receive Stripe events, so that I can synchronize payment status.

#### Acceptance Criteria

1. THE System SHALL implement `/api/stripe/webhook` endpoint
2. THE Endpoint SHALL verify Stripe signature for security
3. THE Endpoint SHALL handle webhook events asynchronously
4. THE Endpoint SHALL return 200 OK immediately to Stripe
5. THE Endpoint SHALL log all received events
6. THE Endpoint SHALL implement retry logic for failed processing
7. THE Endpoint SHALL have rate limiting protection

### Requirement 6.2: Gallery Purchase Events

**User Story:** As a system, I want to process purchase events, so that galleries are unlocked automatically.

#### Acceptance Criteria

1. THE System SHALL handle `checkout.session.completed` event
2. WHEN event is gallery purchase, THE System SHALL create `gallery_purchases` record
3. THE System SHALL update gallery unlock status
4. THE System SHALL send confirmation email to buyer
5. THE System SHALL send sale notification to photographer
6. THE System SHALL update gallery sales statistics
7. THE System SHALL handle duplicate events (idempotency)

### Requirement 6.3: Connect Account Events

**User Story:** As a system, I want to track Connect account status, so that I can notify photographers of issues.

#### Acceptance Criteria

1. THE System SHALL handle `account.updated` event
2. THE System SHALL update photographer's account status in DB
3. WHEN account requires action, THE System SHALL notify photographer
4. THE System SHALL handle `account.application.deauthorized` event
5. WHEN account is deauthorized, THE System SHALL disable monetization features

### Requirement 6.4: Payout Events

**User Story:** As a system, I want to track payouts, so that photographers can see their payment history.

#### Acceptance Criteria

1. THE System SHALL handle `payout.created` event
2. THE System SHALL handle `payout.paid` event
3. THE System SHALL handle `payout.failed` event
4. THE System SHALL create records in `photographer_payouts` table
5. THE System SHALL update payout status in real-time
6. WHEN payout fails, THE System SHALL notify photographer

### Requirement 6.5: Refund Events

**User Story:** As a system, I want to handle refunds, so that access is revoked and records are updated.

#### Acceptance Criteria

1. THE System SHALL handle `charge.refunded` event
2. THE System SHALL update purchase status to 'refunded'
3. THE System SHALL revoke gallery access for the buyer
4. THE System SHALL notify photographer of refund
5. THE System SHALL update revenue statistics
6. THE System SHALL handle partial refunds


---

### Pilier 7: Refunds & Disputes

### Requirement 7.1: Refund Management

**User Story:** As a photographer, I want to refund a purchase, so that I can handle customer service issues.

#### Acceptance Criteria

1. THE Sales_List SHALL have "Refund" action button
2. WHEN clicking refund, THE System SHALL show confirmation modal
3. THE Modal SHALL display: Amount, Client, Reason input
4. THE Photographer SHALL choose: Full refund or Partial refund
5. WHEN confirmed, THE System SHALL process refund via Stripe API
6. THE System SHALL update purchase status to 'refunded'
7. THE System SHALL revoke gallery access
8. THE System SHALL send refund confirmation to client
9. THE Refund SHALL be processed within 5-10 business days

### Requirement 7.2: Dispute Handling

**User Story:** As a photographer, I want to be notified of disputes, so that I can respond quickly.

#### Acceptance Criteria

1. THE System SHALL handle `charge.dispute.created` event
2. THE System SHALL notify photographer immediately (email + in-app)
3. THE Dashboard SHALL display dispute alert banner
4. THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
5. THE Photographer SHALL be able to submit evidence
6. THE System SHALL provide link to Stripe Dashboard for full dispute management
7. WHEN dispute is lost, THE System SHALL deduct amount from balance
8. THE System SHALL handle `charge.dispute.closed` event

### Requirement 7.3: Chargeback Protection

**User Story:** As a photographer, I want to minimize chargebacks, so that I don't lose revenue.

#### Acceptance Criteria

1. THE System SHALL use Stripe Radar for fraud detection
2. THE System SHALL require email verification before purchase
3. THE System SHALL log all access attempts for evidence
4. THE System SHALL provide purchase confirmation emails
5. THE System SHALL display clear refund policy
6. THE Photographer SHALL be able to download access logs as evidence


---

### Pilier 8: Notifications & Emails

### Requirement 8.1: Client Notifications

**User Story:** As a client, I want to receive confirmation emails, so that I have proof of purchase.

#### Acceptance Criteria

1. WHEN purchase succeeds, THE System SHALL send confirmation email
2. THE Email SHALL include: Gallery name, Amount paid, Access link, Receipt/Invoice
3. THE Email SHALL be sent within 1 minute of purchase
4. THE Email SHALL use photographer's branding (if configured)
5. THE Email SHALL include support contact information
6. THE System SHALL send reminder email if access expires soon (7 days before)

### Requirement 8.2: Photographer Notifications

**User Story:** As a photographer, I want to be notified of sales, so that I can track my business.

#### Acceptance Criteria

1. WHEN sale occurs, THE System SHALL send notification email
2. THE Email SHALL include: Gallery name, Client email, Amount, Net earnings
3. THE Email SHALL link to sale details in dashboard
4. THE Photographer SHALL be able to configure notification preferences
5. THE Photographer SHALL be able to disable sale notifications
6. THE System SHALL send weekly sales summary email

### Requirement 8.3: Payout Notifications

**User Story:** As a photographer, I want to be notified of payouts, so that I know when to expect funds.

#### Acceptance Criteria

1. WHEN payout is created, THE System SHALL send notification
2. THE Email SHALL include: Amount, Arrival date, Bank account (last 4)
3. WHEN payout is paid, THE System SHALL send confirmation
4. WHEN payout fails, THE System SHALL send alert with action steps
5. THE Notifications SHALL be sent in real-time (via webhook)

### Requirement 8.4: Issue Alerts

**User Story:** As a photographer, I want to be alerted of issues, so that I can take action quickly.

#### Acceptance Criteria

1. WHEN payment fails, THE System SHALL send alert
2. WHEN dispute is created, THE System SHALL send urgent alert
3. WHEN account requires action, THE System SHALL send reminder
4. WHEN account is restricted, THE System SHALL send critical alert
5. THE Alerts SHALL be sent via email and in-app notification
6. THE Alerts SHALL include clear action steps


---

### Pilier 9: Analytics & Reporting

### Requirement 9.1: Revenue Analytics

**User Story:** As a photographer, I want detailed analytics, so that I can optimize my pricing.

#### Acceptance Criteria

1. THE Dashboard SHALL display revenue trends chart
2. THE Analytics SHALL show: Daily, Weekly, Monthly, Yearly views
3. THE System SHALL calculate: Average order value, Conversion rate, Revenue per gallery
4. THE Analytics SHALL support date range selection
5. THE Analytics SHALL support comparison with previous period
6. THE Analytics SHALL be exportable as CSV

### Requirement 9.2: Sales Funnel

**User Story:** As a photographer, I want to see conversion funnel, so that I can improve sales.

#### Acceptance Criteria

1. THE Dashboard SHALL display funnel: Views → Paywall → Checkout → Purchase
2. THE Funnel SHALL show conversion rate at each step
3. THE Funnel SHALL identify drop-off points
4. THE Funnel SHALL support filtering by gallery, date range
5. THE Funnel SHALL provide optimization suggestions

### Requirement 9.3: Export & Reports

**User Story:** As a photographer, I want to export sales data, so that I can use it for accounting.

#### Acceptance Criteria

1. THE Dashboard SHALL have "Export" button
2. THE Export SHALL support formats: CSV, Excel, PDF
3. THE Export SHALL include: Date, Gallery, Client, Amount, Fee, Net, Status
4. THE Export SHALL support date range selection
5. THE Export SHALL support filtering by status, gallery
6. THE System SHALL generate monthly revenue report automatically
7. THE Report SHALL be downloadable from dashboard


---

### Pilier 10: Security & Compliance

### Requirement 10.1: PCI Compliance

**User Story:** As a platform, I want to be PCI compliant, so that customer data is secure.

#### Acceptance Criteria

1. THE System SHALL never store card numbers, CVV, or sensitive payment data
2. THE System SHALL use Stripe Checkout (hosted) for all payments
3. THE System SHALL use Stripe.js for any card input (if needed)
4. THE System SHALL use HTTPS for all payment-related pages
5. THE System SHALL pass PCI SAQ-A compliance

### Requirement 10.2: Data Protection

**User Story:** As a platform, I want to protect user data, so that we comply with GDPR.

#### Acceptance Criteria

1. THE System SHALL store only necessary payment data (IDs, amounts, status)
2. THE System SHALL anonymize buyer email after 3 years
3. THE System SHALL allow users to request data deletion
4. THE System SHALL provide data export for users
5. THE System SHALL log all access to payment data
6. THE System SHALL encrypt sensitive data at rest

### Requirement 10.3: Fraud Prevention

**User Story:** As a platform, I want to prevent fraud, so that photographers don't lose money.

#### Acceptance Criteria

1. THE System SHALL use Stripe Radar for fraud detection
2. THE System SHALL block high-risk transactions automatically
3. THE System SHALL require 3D Secure for high-value purchases (>$100)
4. THE System SHALL implement rate limiting on checkout attempts
5. THE System SHALL log suspicious activity
6. THE System SHALL notify admin of fraud patterns

### Requirement 10.4: Tax Compliance

**User Story:** As a photographer, I want tax handling, so that I comply with regulations.

#### Acceptance Criteria

1. THE System SHALL support Stripe Tax (optional)
2. THE Photographer SHALL configure tax settings in Stripe Dashboard
3. THE System SHALL display tax-inclusive prices if configured
4. THE System SHALL generate tax reports for photographers
5. THE System SHALL support VAT for European photographers
6. THE System SHALL provide 1099-K forms for US photographers (if applicable)


---

### Pilier 11: Performance & Optimization

### Requirement 11.1: Caching Strategy

**User Story:** As a system, I want to cache data, so that the dashboard loads quickly.

#### Acceptance Criteria

1. THE System SHALL cache gallery monetization config (5 minutes)
2. THE System SHALL cache purchase verification (5 minutes)
3. THE System SHALL cache revenue statistics (15 minutes)
4. THE System SHALL use Redis for caching (if available)
5. THE System SHALL invalidate cache on relevant updates
6. THE System SHALL implement cache warming for popular galleries

### Requirement 11.2: Database Optimization

**User Story:** As a system, I want optimized queries, so that the dashboard is fast.

#### Acceptance Criteria

1. THE System SHALL use database indexes on: gallery_id, buyer_email, status, created_at
2. THE System SHALL use pagination for large result sets
3. THE System SHALL use aggregation queries for statistics
4. THE System SHALL use read replicas for analytics (if available)
5. THE System SHALL implement query result caching
6. THE System SHALL monitor slow queries and optimize

### Requirement 11.3: Webhook Processing

**User Story:** As a system, I want efficient webhook processing, so that Stripe doesn't timeout.

#### Acceptance Criteria

1. THE Webhook_Endpoint SHALL return 200 OK within 3 seconds
2. THE System SHALL process webhooks asynchronously (queue)
3. THE System SHALL implement retry logic with exponential backoff
4. THE System SHALL deduplicate webhook events (idempotency)
5. THE System SHALL log webhook processing time
6. THE System SHALL alert if webhook processing fails repeatedly


---

## Feature Matrix by Plan

| Feature | Free | Premium | Pro |
|---------|------|---------|-----|
| Gallery Paywall | ✗ | ✗ | ✓ |
| Stripe Connect | ✗ | ✗ | ✓ |
| Revenue Dashboard | ✗ | ✗ | ✓ |
| Automatic Payouts | ✗ | ✗ | ✓ |
| Freemium Preview | ✗ | ✗ | ✓ |
| Custom Pricing | ✗ | ✗ | ✓ |
| Sales Analytics | ✗ | ✗ | ✓ |
| Refund Management | ✗ | ✗ | ✓ |
| Export Reports | ✗ | ✗ | ✓ |
| White-Label Checkout | ✗ | ✗ | ✓ |

---

## Technical Architecture

### Database Schema

#### Table: `stripe_connect_accounts`

```sql
CREATE TABLE stripe_connect_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe Connect
  stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- 'express' | 'standard'
  
  -- Status
  charges_enabled BOOLEAN DEFAULT false,
  payouts_enabled BOOLEAN DEFAULT false,
  details_submitted BOOLEAN DEFAULT false,
  
  -- Requirements
  currently_due TEXT[], -- Array of required fields
  eventually_due TEXT[],
  past_due TEXT[],
  disabled_reason VARCHAR(255),
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_link TEXT,
  onboarding_expires_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_connect UNIQUE(user_id),
  CONSTRAINT unique_stripe_account UNIQUE(stripe_account_id)
);

CREATE INDEX idx_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX idx_connect_accounts_stripe_id ON stripe_connect_accounts(stripe_account_id);
CREATE INDEX idx_connect_accounts_status ON stripe_connect_accounts(charges_enabled, payouts_enabled);
```

#### Table: `gallery_monetization`

```sql
CREATE TABLE gallery_monetization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  price_cents INTEGER NOT NULL, -- Prix en centimes
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Preview Mode
  preview_mode VARCHAR(20) DEFAULT 'full_paywall', -- 'full_paywall' | 'freemium'
  watermark_enabled BOOLEAN DEFAULT true,
  
  -- Access Duration
  access_duration_days INTEGER, -- NULL = illimité
  
  -- Stripe
  stripe_price_id VARCHAR(255), -- ID du prix Stripe
  
  -- Platform Fee
  platform_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5, 2) DEFAULT 0.00,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_gallery_monetization UNIQUE(gallery_id),
  CONSTRAINT check_price_range CHECK (price_cents >= 500 AND price_cents <= 50000), -- $5-$500
  CONSTRAINT check_fee_range CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100)
);

CREATE INDEX idx_gallery_monetization_gallery_id ON gallery_monetization(gallery_id);
CREATE INDEX idx_gallery_monetization_enabled ON gallery_monetization(is_enabled);
```


#### Table: `gallery_purchases`

```sql
CREATE TABLE gallery_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Acheteur
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_session_id VARCHAR(255), -- Pour guests
  
  -- Paiement Stripe
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Montants (en centimes)
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  photographer_earnings_cents INTEGER NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'succeeded' | 'refunded' | 'disputed' | 'failed'
  refund_reason TEXT,
  
  -- Accès
  access_granted_at TIMESTAMP,
  access_expires_at TIMESTAMP, -- NULL = illimité
  
  -- Timestamps
  purchased_at TIMESTAMP DEFAULT NOW(),
  refunded_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_payment_intent UNIQUE(stripe_payment_intent_id)
);

CREATE INDEX idx_gallery_purchases_gallery_id ON gallery_purchases(gallery_id);
CREATE INDEX idx_gallery_purchases_photographer_id ON gallery_purchases(photographer_id);
CREATE INDEX idx_gallery_purchases_buyer_email ON gallery_purchases(buyer_email);
CREATE INDEX idx_gallery_purchases_buyer_session ON gallery_purchases(buyer_session_id);
CREATE INDEX idx_gallery_purchases_status ON gallery_purchases(status);
CREATE INDEX idx_gallery_purchases_date ON gallery_purchases(purchased_at DESC);
```

#### Table: `photographer_payouts`

```sql
CREATE TABLE photographer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id VARCHAR(255) NOT NULL,
  
  -- Montant
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Stripe Payout
  stripe_payout_id VARCHAR(255) UNIQUE,
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'pending' | 'in_transit' | 'paid' | 'failed' | 'canceled'
  failure_code VARCHAR(255),
  failure_message TEXT,
  
  -- Dates
  arrival_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  failed_at TIMESTAMP,
  
  -- Bank Account
  destination_bank_account_last4 VARCHAR(4),
  
  -- Indexes
  CONSTRAINT unique_stripe_payout UNIQUE(stripe_payout_id)
);

CREATE INDEX idx_photographer_payouts_photographer_id ON photographer_payouts(photographer_id);
CREATE INDEX idx_photographer_payouts_status ON photographer_payouts(status);
CREATE INDEX idx_photographer_payouts_date ON photographer_payouts(created_at DESC);
```

#### Table: `webhook_events`

```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Stripe Event
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  
  -- Processing
  status VARCHAR(50) NOT NULL, -- 'pending' | 'processing' | 'processed' | 'failed'
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Data
  event_data JSONB NOT NULL,
  
  -- Timestamps
  received_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  -- Indexes
  CONSTRAINT unique_stripe_event UNIQUE(stripe_event_id)
);

CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_date ON webhook_events(received_at DESC);
```


---

### API Routes

#### Stripe Connect

- `POST /api/stripe/connect/onboard` - Créer un compte Connect et obtenir le lien d'onboarding
- `GET /api/stripe/connect/status` - Obtenir le statut du compte Connect
- `POST /api/stripe/connect/refresh-link` - Générer un nouveau lien d'onboarding
- `DELETE /api/stripe/connect/disconnect` - Déconnecter le compte Stripe
- `GET /api/stripe/connect/dashboard-link` - Obtenir le lien vers le Stripe Dashboard

#### Gallery Monetization

- `POST /api/galleries/[id]/monetization` - Configurer le paywall
- `GET /api/galleries/[id]/monetization` - Obtenir la configuration
- `PUT /api/galleries/[id]/monetization` - Mettre à jour la configuration
- `DELETE /api/galleries/[id]/monetization` - Désactiver le paywall

#### Checkout & Purchase

- `POST /api/stripe/checkout/gallery-purchase` - Créer une session de paiement
- `GET /api/galleries/[id]/purchase-status` - Vérifier si l'utilisateur a acheté
- `POST /api/galleries/[id]/verify-access` - Vérifier l'accès à la galerie

#### Revenue Dashboard

- `GET /api/photographer/revenue/overview` - Métriques globales
- `GET /api/photographer/revenue/chart` - Données pour le graphique
- `GET /api/photographer/sales` - Liste des ventes
- `GET /api/photographer/sales/[id]` - Détails d'une vente
- `GET /api/photographer/sales/export` - Exporter les ventes (CSV/Excel)
- `GET /api/photographer/top-galleries` - Top galeries par revenus

#### Payouts

- `GET /api/photographer/payouts` - Liste des payouts
- `GET /api/photographer/payouts/[id]` - Détails d'un payout
- `GET /api/photographer/balance` - Balance actuelle

#### Refunds

- `POST /api/photographer/sales/[id]/refund` - Rembourser une vente
- `GET /api/photographer/disputes` - Liste des litiges
- `GET /api/photographer/disputes/[id]` - Détails d'un litige

#### Webhooks

- `POST /api/stripe/webhook` - Endpoint pour les webhooks Stripe
- `POST /api/stripe/connect/webhook` - Endpoint pour les webhooks Connect

---

### Services

#### `stripe-connect.service.ts`

```typescript
class StripeConnectService {
  // Onboarding
  async createConnectAccount(userId: string): Promise<string>
  async getOnboardingLink(accountId: string): Promise<string>
  async refreshOnboardingLink(accountId: string): Promise<string>
  
  // Status
  async getAccountStatus(accountId: string): Promise<ConnectAccountStatus>
  async updateAccountStatus(accountId: string): Promise<void>
  
  // Dashboard
  async createDashboardLink(accountId: string): Promise<string>
  
  // Disconnect
  async disconnectAccount(userId: string): Promise<void>
}
```

#### `gallery-monetization.service.ts`

```typescript
class GalleryMonetizationService {
  // Configuration
  async enablePaywall(galleryId: string, config: MonetizationConfig): Promise<void>
  async updatePaywall(galleryId: string, config: Partial<MonetizationConfig>): Promise<void>
  async disablePaywall(galleryId: string): Promise<void>
  async getConfig(galleryId: string): Promise<MonetizationConfig | null>
  
  // Stripe Price
  async createStripePrice(config: MonetizationConfig): Promise<string>
  async updateStripePrice(priceId: string, config: MonetizationConfig): Promise<void>
  
  // Stats
  async updateSalesStats(galleryId: string): Promise<void>
  async getConversionRate(galleryId: string): Promise<number>
}
```

#### `gallery-purchase.service.ts`

```typescript
class GalleryPurchaseService {
  // Checkout
  async createCheckoutSession(galleryId: string, buyerEmail: string): Promise<string>
  
  // Purchase
  async recordPurchase(paymentIntent: Stripe.PaymentIntent): Promise<void>
  async verifyPurchase(galleryId: string, identifier: string): Promise<boolean>
  async getPurchase(galleryId: string, identifier: string): Promise<Purchase | null>
  
  // Access
  async grantAccess(purchaseId: string): Promise<void>
  async revokeAccess(purchaseId: string): Promise<void>
  async checkAccess(galleryId: string, identifier: string): Promise<AccessStatus>
  
  // Refund
  async refundPurchase(purchaseId: string, reason?: string): Promise<void>
}
```


#### `revenue.service.ts`

```typescript
class RevenueService {
  // Overview
  async getOverview(photographerId: string, period: Period): Promise<RevenueOverview>
  async getChartData(photographerId: string, range: DateRange): Promise<ChartData>
  
  // Sales
  async getSales(photographerId: string, filters: SalesFilters): Promise<PaginatedSales>
  async getSaleDetails(saleId: string): Promise<SaleDetails>
  async exportSales(photographerId: string, format: ExportFormat): Promise<Buffer>
  
  // Top Galleries
  async getTopGalleries(photographerId: string, limit: number): Promise<TopGallery[]>
  
  // Analytics
  async getConversionFunnel(photographerId: string): Promise<FunnelData>
  async getRevenueByGallery(photographerId: string): Promise<GalleryRevenue[]>
}
```

#### `payout.service.ts`

```typescript
class PayoutService {
  // Payouts
  async getPayouts(photographerId: string, filters: PayoutFilters): Promise<PaginatedPayouts>
  async getPayoutDetails(payoutId: string): Promise<PayoutDetails>
  
  // Balance
  async getBalance(accountId: string): Promise<Balance>
  async getNextPayoutDate(accountId: string): Promise<Date>
  
  // Sync
  async syncPayouts(accountId: string): Promise<void>
}
```

#### `webhook.service.ts`

```typescript
class WebhookService {
  // Processing
  async processWebhook(event: Stripe.Event): Promise<void>
  async retryFailedWebhook(eventId: string): Promise<void>
  
  // Handlers
  async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>
  async handleAccountUpdated(account: Stripe.Account): Promise<void>
  async handlePayoutCreated(payout: Stripe.Payout): Promise<void>
  async handlePayoutPaid(payout: Stripe.Payout): Promise<void>
  async handlePayoutFailed(payout: Stripe.Payout): Promise<void>
  async handleChargeRefunded(charge: Stripe.Charge): Promise<void>
  async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void>
  
  // Logging
  async logWebhookEvent(event: Stripe.Event): Promise<void>
  async updateWebhookStatus(eventId: string, status: WebhookStatus): Promise<void>
}
```

---

## Implementation Phases

### Phase 1: Stripe Connect Setup (CRITICAL)
**Durée estimée: 5-6 jours**

✅ **Essentiel:**
1. Table `stripe_connect_accounts`
2. Service `stripe-connect.service.ts`
3. Route `/api/stripe/connect/onboard`
4. Route `/api/stripe/connect/status`
5. UI: Settings → Stripe Connect section
6. UI: Connect button + onboarding flow
7. UI: Account status display
8. Tests: Onboarding flow complet

### Phase 2: Gallery Monetization (CRITICAL)
**Durée estimée: 4-5 jours**

✅ **Essentiel:**
1. Table `gallery_monetization`
2. Service `gallery-monetization.service.ts`
3. Route `/api/galleries/[id]/monetization`
4. UI: Gallery Settings → Monetization tab
5. UI: Paywall configuration form
6. UI: Price calculator (with platform fee)
7. Stripe Price creation
8. Tests: Configuration complète

### Phase 3: Paywall & Checkout (CRITICAL)
**Durée estimée: 5-6 jours**

✅ **Essentiel:**
1. Table `gallery_purchases`
2. Service `gallery-purchase.service.ts`
3. Route `/api/stripe/checkout/gallery-purchase`
4. Route `/api/galleries/[id]/verify-access`
5. UI: Paywall screen (full mode)
6. UI: Freemium preview mode
7. Checkout session with Connect (destination charge)
8. Access verification middleware
9. Tests: Purchase flow complet


### Phase 4: Webhooks (CRITICAL)
**Durée estimée: 4-5 jours**

✅ **Essentiel:**
1. Table `webhook_events`
2. Service `webhook.service.ts`
3. Route `/api/stripe/webhook`
4. Route `/api/stripe/connect/webhook`
5. Signature verification
6. Event handlers (8 événements principaux)
7. Async processing avec queue
8. Retry logic avec exponential backoff
9. Idempotency handling
10. Tests: Tous les événements webhook

### Phase 5: Revenue Dashboard (IMPORTANT)
**Durée estimée: 5-6 jours**

✅ **Important:**
1. Service `revenue.service.ts`
2. Routes API revenue
3. UI: Dashboard → Revenue section
4. UI: Overview cards (metrics)
5. UI: Revenue chart (interactive)
6. UI: Sales list table
7. UI: Top galleries widget
8. UI: Filters & search
9. UI: Export functionality
10. Tests: Dashboard complet

### Phase 6: Payouts (IMPORTANT)
**Durée estimée: 3-4 jours**

✅ **Important:**
1. Table `photographer_payouts`
2. Service `payout.service.ts`
3. Routes API payouts
4. UI: Payouts tab
5. UI: Balance widget
6. UI: Payout history list
7. Webhook handlers (payout events)
8. Tests: Payout tracking

### Phase 7: Refunds & Disputes (IMPORTANT)
**Durée estimée: 3-4 jours**

✅ **Important:**
1. Route `/api/photographer/sales/[id]/refund`
2. Routes API disputes
3. UI: Refund modal
4. UI: Dispute alerts
5. UI: Dispute details page
6. Webhook handlers (refund, dispute events)
7. Email notifications
8. Tests: Refund flow

### Phase 8: Notifications & Emails (SOUHAITABLE)
**Durée estimée: 3-4 jours**

✅ **Souhaitable:**
1. Email templates (purchase, sale, payout, dispute)
2. Email service integration
3. In-app notifications
4. Notification preferences
5. Tests: Email delivery

### Phase 9: Analytics & Reporting (SOUHAITABLE)
**Durée estimée: 3-4 jours**

✅ **Souhaitable:**
1. Conversion funnel
2. Advanced analytics
3. Export formats (CSV, Excel, PDF)
4. Monthly reports
5. Tests: Reports generation

### Phase 10: Optimizations (OPTIONNEL)
**Durée estimée: 2-3 jours**

✅ **Optionnel:**
1. Caching strategy
2. Database optimization
3. Query performance
4. Webhook queue optimization
5. Load testing

---

## Estimation Totale

**Temps de développement**: 35-45 jours

**Répartition**:
- Phase 1 (Connect Setup): 5-6 jours
- Phase 2 (Monetization): 4-5 jours
- Phase 3 (Paywall): 5-6 jours
- Phase 4 (Webhooks): 4-5 jours
- Phase 5 (Revenue Dashboard): 5-6 jours
- Phase 6 (Payouts): 3-4 jours
- Phase 7 (Refunds): 3-4 jours
- Phase 8 (Notifications): 3-4 jours
- Phase 9 (Analytics): 3-4 jours
- Phase 10 (Optimizations): 2-3 jours


---

## Design System Integration

### Composants UI (Réutilisation du design existant)

#### Revenue Dashboard
- Utiliser les mêmes cards que le dashboard admin
- Utiliser les mêmes graphiques (recharts)
- Utiliser les mêmes tables que les galeries
- Utiliser les mêmes badges de statut
- Utiliser les mêmes couleurs de marque

#### Paywall Screen
- Utiliser le même style que les modals existants
- Utiliser les mêmes boutons CTA
- Utiliser les mêmes gradients de fond
- Utiliser la même typographie (Plus Jakarta Sans)
- Utiliser les mêmes animations (fadeIn, scaleIn)

#### Settings Section
- Utiliser le même layout que Settings → Profile
- Utiliser les mêmes form inputs
- Utiliser les mêmes toggles
- Utiliser les mêmes sections avec séparateurs
- Utiliser les mêmes boutons de sauvegarde

### Palette de Couleurs

```css
/* Revenue Dashboard */
--revenue-positive: rgb(34 197 94); /* green-500 */
--revenue-negative: rgb(239 68 68); /* red-500 */
--revenue-neutral: rgb(148 163 184); /* slate-400 */

/* Status Badges */
--status-paid: rgb(34 197 94); /* green-500 */
--status-pending: rgb(251 191 36); /* amber-400 */
--status-failed: rgb(239 68 68); /* red-500 */
--status-refunded: rgb(148 163 184); /* slate-400 */

/* Paywall */
--paywall-primary: var(--brand-primary, rgb(99 102 241)); /* indigo-500 */
--paywall-secondary: var(--brand-secondary, rgb(139 92 246)); /* violet-500 */
--paywall-accent: var(--brand-accent, rgb(236 72 153)); /* pink-500 */
```

### Responsive Breakpoints

```css
/* Mobile First */
sm: 640px   /* Tablettes portrait */
md: 768px   /* Tablettes landscape */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

---

## Testing Strategy

### Unit Tests

**Services:**
- `stripe-connect.service.test.ts`
- `gallery-monetization.service.test.ts`
- `gallery-purchase.service.test.ts`
- `revenue.service.test.ts`
- `payout.service.test.ts`
- `webhook.service.test.ts`

**Coverage Target:** 80%+

### Integration Tests

**API Routes:**
- Stripe Connect onboarding flow
- Gallery monetization configuration
- Checkout session creation
- Purchase verification
- Webhook processing
- Revenue data retrieval

**Coverage Target:** 70%+

### E2E Tests

**User Flows:**
1. Photographer connects Stripe account
2. Photographer configures gallery paywall
3. Client purchases gallery access
4. Photographer views sale in dashboard
5. Photographer receives payout
6. Photographer refunds a purchase

**Tools:** Playwright or Cypress

### Webhook Tests

**Stripe CLI:**
```bash
# Listen to webhooks locally
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger specific events
stripe trigger checkout.session.completed
stripe trigger payout.paid
stripe trigger charge.refunded
```

**Test Coverage:**
- All 8 main webhook events
- Signature verification
- Idempotency
- Retry logic
- Error handling


---

## Monitoring & Observability

### Metrics to Track

**Business Metrics:**
- Total revenue (daily, weekly, monthly)
- Number of purchases
- Average order value
- Conversion rate (views → purchases)
- Refund rate
- Dispute rate
- Active photographers with Connect
- Payout success rate

**Technical Metrics:**
- Webhook processing time
- Webhook failure rate
- API response time
- Database query performance
- Cache hit rate
- Error rate by endpoint

### Logging

**Log Levels:**
- ERROR: Webhook failures, payment errors, critical issues
- WARN: Retry attempts, slow queries, rate limits
- INFO: Purchases, refunds, payouts, account updates
- DEBUG: Webhook events, API calls, cache operations

**Log Structure:**
```json
{
  "timestamp": "2026-01-15T10:30:00Z",
  "level": "INFO",
  "service": "webhook",
  "event": "checkout.session.completed",
  "gallery_id": "uuid",
  "photographer_id": "uuid",
  "amount_cents": 2999,
  "duration_ms": 150
}
```

### Alerts

**Critical Alerts:**
- Webhook processing failure rate > 5%
- Payment failure rate > 10%
- Payout failure rate > 5%
- API error rate > 1%
- Database connection issues

**Warning Alerts:**
- Webhook processing time > 5s
- API response time > 2s
- Cache miss rate > 50%
- Dispute rate > 2%

### Dashboards

**Admin Dashboard:**
- Platform revenue overview
- Active photographers
- Purchase volume
- Webhook health
- Error rates
- Performance metrics

**Photographer Dashboard:**
- Personal revenue
- Sales trends
- Top galleries
- Payout history
- Conversion funnel

---

## Security Considerations

### API Security

**Authentication:**
- All photographer endpoints require authentication
- Use JWT tokens from Supabase Auth
- Verify user owns the resource (gallery, sale, etc.)

**Authorization:**
- Check Pro plan before allowing Connect onboarding
- Check gallery ownership before configuration
- Check photographer ownership before refunds

**Rate Limiting:**
- Checkout endpoint: 10 requests/minute per IP
- Webhook endpoint: 100 requests/minute
- Dashboard API: 60 requests/minute per user

### Data Security

**Encryption:**
- All payment data encrypted at rest
- Use HTTPS for all API calls
- Encrypt sensitive webhook data

**PII Protection:**
- Anonymize buyer emails after 3 years
- Hash session IDs
- Redact card numbers in logs
- Comply with GDPR data retention

### Webhook Security

**Signature Verification:**
```typescript
const sig = request.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(
  body,
  sig,
  webhookSecret
);
```

**Replay Protection:**
- Check event timestamp (reject if > 5 minutes old)
- Store processed event IDs
- Implement idempotency keys


---

## Migration Strategy

### Existing Data

**Current State:**
- ✅ `profiles` table has `stripe_customer_id`, `stripe_subscription_id`
- ✅ Gallery unlock system exists (one-time $2.99 payment)
- ✅ Stripe checkout routes exist
- ⚠️ No Connect accounts
- ⚠️ No photographer revenue tracking
- ⚠️ No webhook processing

### Migration Steps

**Step 1: Database Migration**
```sql
-- Add new tables
CREATE TABLE stripe_connect_accounts (...);
CREATE TABLE gallery_monetization (...);
CREATE TABLE gallery_purchases (...);
CREATE TABLE photographer_payouts (...);
CREATE TABLE webhook_events (...);

-- Migrate existing gallery unlocks to purchases
INSERT INTO gallery_purchases (
  gallery_id,
  photographer_id,
  buyer_email,
  amount_cents,
  status,
  purchased_at
)
SELECT 
  g.id,
  g.user_id,
  'migrated@piksend.com', -- Placeholder
  299, -- $2.99
  'succeeded',
  g.unlocked_at
FROM galleries g
WHERE g.is_unlocked = true;
```

**Step 2: Feature Flag**
```typescript
// Enable gradually
const STRIPE_CONNECT_ENABLED = process.env.STRIPE_CONNECT_ENABLED === 'true';

// Show Connect UI only if enabled
if (STRIPE_CONNECT_ENABLED && userPlan === 'pro') {
  // Show Connect section
}
```

**Step 3: Gradual Rollout**
1. Deploy to staging
2. Test with internal accounts
3. Beta test with 5-10 Pro photographers
4. Monitor for 1 week
5. Full rollout to all Pro users

**Step 4: Communication**
- Email announcement to Pro users
- In-app notification
- Documentation update
- Tutorial video

---

## Documentation

### User Documentation

**For Photographers:**
1. **Getting Started with Stripe Connect**
   - How to connect your Stripe account
   - What information is required
   - How long verification takes

2. **Setting Up Gallery Paywall**
   - How to enable paywall
   - How to set pricing
   - Preview modes explained
   - Platform fee breakdown

3. **Understanding Your Revenue**
   - How to read the dashboard
   - When you get paid
   - How to export reports

4. **Managing Refunds**
   - How to issue a refund
   - Refund policy
   - Impact on revenue

5. **Handling Disputes**
   - What is a dispute
   - How to respond
   - Providing evidence

**For Clients:**
1. **Purchasing Gallery Access**
   - How to pay for a gallery
   - Payment methods accepted
   - What you get after purchase

2. **Accessing Your Photos**
   - How to download photos
   - Access duration
   - What if I lose access

3. **Requesting a Refund**
   - Refund policy
   - How to contact photographer
   - Processing time

### Developer Documentation

**API Documentation:**
- OpenAPI/Swagger spec for all endpoints
- Request/response examples
- Error codes and handling
- Rate limits

**Webhook Documentation:**
- Event types and payloads
- Signature verification
- Retry behavior
- Testing with Stripe CLI

**Service Documentation:**
- Architecture overview
- Service responsibilities
- Data flow diagrams
- Database schema

---

## Success Metrics

### KPIs

**Adoption:**
- % of Pro users who connect Stripe (Target: 60% in 3 months)
- % of Pro users who enable paywall (Target: 40% in 3 months)
- Average time to first sale (Target: < 7 days)

**Revenue:**
- Total platform revenue from fees (Target: $10k/month in 6 months)
- Average photographer revenue (Target: $500/month)
- Average gallery price (Target: $25-50)

**Conversion:**
- Gallery view → purchase rate (Target: 15%+)
- Paywall → checkout rate (Target: 30%+)
- Checkout → purchase rate (Target: 80%+)

**Quality:**
- Refund rate (Target: < 5%)
- Dispute rate (Target: < 2%)
- Payout success rate (Target: > 98%)
- Webhook processing success rate (Target: > 99%)

### Monitoring Dashboard

**Real-time Metrics:**
- Active purchases (last 24h)
- Revenue (last 24h)
- Conversion rate (last 7 days)
- Error rate (last 1h)

**Weekly Reports:**
- New Connect accounts
- Total sales
- Top photographers
- Top galleries
- Issues and resolutions

---

## Risks & Mitigation

### Technical Risks

**Risk 1: Webhook Failures**
- **Impact:** High - Purchases not recorded, access not granted
- **Probability:** Medium
- **Mitigation:** 
  - Implement robust retry logic
  - Queue-based processing
  - Manual reconciliation tool
  - Monitoring and alerts

**Risk 2: Payment Disputes**
- **Impact:** Medium - Revenue loss, photographer frustration
- **Probability:** Low-Medium
- **Mitigation:**
  - Clear refund policy
  - Purchase confirmation emails
  - Access logs for evidence
  - Stripe Radar for fraud prevention

**Risk 3: Connect Account Issues**
- **Impact:** High - Photographers can't receive payments
- **Probability:** Low
- **Mitigation:**
  - Clear onboarding instructions
  - Status monitoring
  - Proactive notifications
  - Support documentation

### Business Risks

**Risk 1: Low Adoption**
- **Impact:** High - Feature doesn't generate revenue
- **Probability:** Medium
- **Mitigation:**
  - Clear value proposition
  - Tutorial videos
  - Success stories
  - Promotional pricing

**Risk 2: High Refund Rate**
- **Impact:** Medium - Photographer dissatisfaction
- **Probability:** Low
- **Mitigation:**
  - Preview mode to reduce buyer's remorse
  - Clear pricing and features
  - Quality guidelines for photographers

**Risk 3: Compliance Issues**
- **Impact:** Critical - Legal/regulatory problems
- **Probability:** Low
- **Mitigation:**
  - PCI compliance via Stripe
  - GDPR compliance
  - Tax handling via Stripe Tax
  - Legal review of terms

---

## Resources

### Stripe Documentation
- [Stripe Connect](https://stripe.com/docs/connect)
- [Connect Onboarding](https://stripe.com/docs/connect/onboarding)
- [Destination Charges](https://stripe.com/docs/connect/destination-charges)
- [Webhooks](https://stripe.com/docs/webhooks)
- [Testing](https://stripe.com/docs/testing)

### Internal Documentation
- [Stripe Implementation Gaps](../../../docs/stripe-implementation-gaps.md)
- [Photographer Gallery Monetization](../../../docs/photographer-gallery-monetization.md)
- [Public Profile Specification](../../../docs/public-profile-specification.md)

### Tools
- Stripe CLI for webhook testing
- Stripe Dashboard for account management
- Postman collection for API testing

---

**Document créé le**: Janvier 2026  
**Version**: 1.0.0  
**Statut**: Spécification complète - Prêt pour implémentation  
**Auteur**: Équipe PikSend  
**Révision**: Consolidation des 3 documents sources + amélioration performance + design cohérent
