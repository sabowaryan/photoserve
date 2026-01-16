# Tasks: Stripe Connect & Photographer Monetization

## Phase 1: Stripe Connect Setup (5-6 jours)

### Task 1.1: Database Schema - Connect Accounts
**Estimation:** 0.5 jour

- [x] 1.1.1 Créer migration create_stripe_connect_accounts_table.sql
- [x] 1.1.2 Ajouter table stripe_connect_accounts avec tous les champs
- [x] 1.1.3 Ajouter indexes (user_id, stripe_account_id, status)
- [x] 1.1.4 Ajouter contraintes (unique, foreign keys)
- [x] 1.1.5 Tester la migration en local
- [x] 1.1.6 Documenter le schéma Connect Accounts

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_stripe_connect_accounts.sql`

---

### Task 1.2: Stripe Connect Service
**Estimation:** 1.5 jours

- [x] 1.2.1 Créer src/lib/services/stripe-connect.service.ts
- [x] 1.2.2 Implémenter createConnectAccount(userId)
- [x] 1.2.3 Implémenter getOnboardingLink(accountId)
- [x] 1.2.4 Implémenter refreshOnboardingLink(accountId)
- [x] 1.2.5 Implémenter getAccountStatus(accountId)
- [x] 1.2.6 Implémenter updateAccountStatus(accountId)
- [x] 1.2.7 Implémenter createDashboardLink(accountId)
- [x] 1.2.8 Implémenter disconnectAccount(userId)
- [x] 1.2.9 Ajouter gestion d'erreurs Connect Service
- [x] 1.2.10 Ajouter logging Connect Service
- [x] 1.2.11 Écrire tests unitaires Connect Service

**Fichiers:**
- `src/lib/services/stripe-connect.service.ts`
- `src/lib/services/__tests__/stripe-connect.service.test.ts`

---

### Task 1.3: API Routes - Connect
**Estimation:** 1 jour

- [x] 1.3.1 Créer src/app/api/stripe/connect/onboard/route.ts
- [x] 1.3.2 Créer src/app/api/stripe/connect/status/route.ts
- [x] 1.3.3 Créer src/app/api/stripe/connect/refresh-link/route.ts
- [x] 1.3.4 Créer src/app/api/stripe/connect/disconnect/route.ts
- [x] 1.3.5 Créer src/app/api/stripe/connect/dashboard-link/route.ts
- [x] 1.3.6 Ajouter validation des inputs Connect API
- [x] 1.3.7 Ajouter vérification Pro plan Connect API
- [x] 1.3.8 Ajouter gestion d'erreurs Connect API
- [x] 1.3.9 Écrire tests d'intégration Connect API

**Fichiers:**
- `src/app/api/stripe/connect/onboard/route.ts`
- `src/app/api/stripe/connect/status/route.ts`
- `src/app/api/stripe/connect/refresh-link/route.ts`
- `src/app/api/stripe/connect/disconnect/route.ts`
- `src/app/api/stripe/connect/dashboard-link/route.ts`

---

### Task 1.4: UI - Settings Stripe Connect Section
**Estimation:** 2 jours

- [x] 1.4.1 Créer src/components/settings/stripe-connect-section.tsx
- [x] 1.4.2 Ajouter section dans settings page
- [x] 1.4.3 Implémenter bouton Connect Stripe
- [x] 1.4.4 Implémenter affichage du statut (badge)
- [x] 1.4.5 Implémenter bouton Disconnect
- [x] 1.4.6 Implémenter bouton View Dashboard
- [x] 1.4.7 Ajouter loading states Connect UI
- [x] 1.4.8 Ajouter error handling Connect UI
- [x] 1.4.9 Ajouter confirmation modals Connect UI
- [x] 1.4.10 Rendre responsive Connect UI
- [x] 1.4.11 Ajouter tests E2E Connect UI

**Fichiers:**
- `src/components/settings/stripe-connect-section.tsx`
- `src/app/(dashboard)/settings/page.tsx`

---

## Phase 2: Gallery Monetization (4-5 jours)

### Task 2.1: Database Schema - Monetization
**Estimation:** 0.5 jour

- [x] 2.1.1 Créer migration create_gallery_monetization_table.sql
- [x] 2.1.2 Ajouter table gallery_monetization
- [x] 2.1.3 Ajouter indexes monetization (gallery_id, is_enabled)
- [x] 2.1.4 Ajouter contraintes monetization (price range, unique gallery)
- [x] 2.1.5 Tester la migration monetization
- [x] 2.1.6 Documenter le schéma monetization

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_gallery_monetization.sql`

---

### Task 2.2: Gallery Monetization Service
**Estimation:** 1.5 jours

- [x] 2.2.1 Créer src/lib/services/gallery-monetization.service.ts
- [x] 2.2.2 Implémenter enablePaywall(galleryId, config)
- [x] 2.2.3 Implémenter updatePaywall(galleryId, config)
- [x] 2.2.4 Implémenter disablePaywall(galleryId)
- [x] 2.2.5 Implémenter getConfig(galleryId)
- [x] 2.2.6 Implémenter createStripePrice(config)
- [x] 2.2.7 Implémenter updateSalesStats(galleryId)
- [x] 2.2.8 Implémenter getConversionRate(galleryId)
- [x] 2.2.9 Ajouter validation monetization service
- [x] 2.2.10 Écrire tests unitaires monetization service

**Fichiers:**
- `src/lib/services/gallery-monetization.service.ts`
- `src/lib/services/__tests__/gallery-monetization.service.test.ts`

---

### Task 2.3: API Routes - Monetization
**Estimation:** 0.5 jour

- [x] 2.3.1 Créer src/app/api/galleries/[id]/monetization/route.ts
- [x] 2.3.2 Implémenter POST monetization (create/enable)
- [x] 2.3.3 Implémenter GET monetization (retrieve config)
- [x] 2.3.4 Implémenter PUT monetization (update)
- [x] 2.3.5 Implémenter DELETE monetization (disable)
- [x] 2.3.6 Ajouter validation monetization API
- [x] 2.3.7 Ajouter vérification ownership monetization API
- [x] 2.3.8 Écrire tests monetization API

**Fichiers:**
- `src/app/api/galleries/[id]/monetization/route.ts`

---

### Task 2.4: UI - Gallery Monetization Tab
**Estimation:** 2 jours

- [x] 2.4.1 Créer src/components/gallery-detail/monetization-tab.tsx
- [x] 2.4.2 Ajouter onglet Monetization dans gallery settings
- [x] 2.4.3 Implémenter toggle Enable Paywall
- [x] 2.4.4 Implémenter input prix (avec validation $5-$500)
- [x] 2.4.5 Implémenter sélecteur devise (USD, EUR, CAD)
- [x] 2.4.6 Implémenter sélecteur preview mode
- [x] 2.4.7 Implémenter calculateur de revenus (avec platform fee)
- [x] 2.4.8 Ajouter preview du paywall
- [x] 2.4.9 Ajouter loading states monetization UI
- [x] 2.4.10 Rendre responsive monetization UI
- [x] 2.4.11 Écrire tests monetization UI

**Fichiers:**
- `src/components/gallery-detail/monetization-tab.tsx`
- `src/app/(dashboard)/dashboard/gallery/[id]/page.tsx`

---

## Phase 3: Paywall & Checkout (5-6 jours)

### Task 3.1: Database Schema - Purchases
**Estimation:** 0.5 jour

- [x] 3.1.1 Créer migration create_gallery_purchases_table.sql
- [x] 3.1.2 Ajouter table gallery_purchases
- [x] 3.1.3 Ajouter indexes purchases (gallery_id, photographer_id, buyer_email, status, date)
- [x] 3.1.4 Ajouter contraintes purchases
- [x] 3.1.5 Tester la migration purchases
- [x] 3.1.6 Documenter le schéma purchases

**Fichiers:**
- `supabase/migrations/20260115120300_create_gallery_purchases.sql`
- `supabase/migrations/README_GALLERY_PURCHASES.md`

---

### Task 3.2: Gallery Purchase Service
**Estimation:** 2 jours

- [x] 3.2.1 Créer src/lib/services/gallery-purchase.service.ts
- [x] 3.2.2 Implémenter createCheckoutSession(galleryId, buyerEmail)
- [x] 3.2.3 Implémenter recordPurchase(paymentIntent)
- [x] 3.2.4 Implémenter verifyPurchase(galleryId, identifier)
- [x] 3.2.5 Implémenter getPurchase(galleryId, identifier)
- [x] 3.2.6 Implémenter grantAccess(purchaseId)
- [x] 3.2.7 Implémenter revokeAccess(purchaseId)
- [x] 3.2.8 Implémenter checkAccess(galleryId, identifier)
- [x] 3.2.9 Implémenter refundPurchase(purchaseId, reason)
- [x] 3.2.10 Ajouter caching purchase service (5 minutes)
- [x] 3.2.11 Écrire tests unitaires purchase service

**Fichiers:**
- `src/lib/services/gallery-purchase.service.ts`
- `src/lib/services/__tests__/gallery-purchase.service.test.ts`

---

### Task 3.3: API Routes - Checkout & Purchase
**Estimation:** 1 jour

- [x] 3.3.1 Créer src/app/api/stripe/checkout/gallery-purchase/route.ts
- [x] 3.3.2 Créer src/app/api/galleries/[id]/purchase-status/route.ts
- [x] 3.3.3 Créer src/app/api/galleries/[id]/verify-access/route.ts
- [x] 3.3.4 Implémenter création de Checkout Session (destination charge)
- [x] 3.3.5 Implémenter vérification de purchase
- [x] 3.3.6 Implémenter vérification d'accès
- [x] 3.3.7 Ajouter validation checkout API
- [x] 3.3.8 Ajouter rate limiting checkout API
- [x] 3.3.9 Écrire tests checkout API

**Fichiers:**
- `src/app/api/stripe/checkout/gallery-purchase/route.ts`
- `src/app/api/galleries/[id]/purchase-status/route.ts`
- `src/app/api/galleries/[id]/verify-access/route.ts`

---

### Task 3.4: UI - Paywall Screen (Full Mode)
**Estimation:** 1.5 jours

- [x] 3.4.1 Créer src/components/gallery-view/gallery-paywall.tsx
- [x] 3.4.2 Implémenter écran de paywall
- [x] 3.4.3 Afficher preview images (3-5 blurred)
- [x] 3.4.4 Afficher prix et features
- [x] 3.4.5 Implémenter bouton Purchase Access
- [x] 3.4.6 Ajouter logo photographe paywall
- [x] 3.4.7 Ajouter badge Secure payment by Stripe
- [x] 3.4.8 Rendre responsive paywall
- [x] 3.4.9 Ajouter animations paywall
- [x] 3.4.10 Écrire tests paywall

**Fichiers:**
- `src/components/gallery-view/gallery-paywall.tsx`

---

### Task 3.5: UI - Freemium Preview Mode
**Estimation:** 1 jour

- [x] 3.5.1 Modifier src/app/g/[slug]/gallery-view-client.tsx
- [x] 3.5.2 Implémenter affichage low-res images (800px)
- [x] 3.5.3 Ajouter watermark overlay
- [x] 3.5.4 Désactiver downloads freemium
- [x] 3.5.5 Ajouter sticky banner Unlock HD
- [x] 3.5.6 Modifier lightbox pour preview mode
- [x] 3.5.7 Ajouter bouton Unlock HD dans lightbox
- [x] 3.5.8 Rendre responsive freemium
- [x] 3.5.9 Écrire tests freemium preview

**Fichiers:**
- `src/app/g/[slug]/gallery-view-client.tsx`
- `src/components/gallery-view/gallery-header.tsx`
- `src/components/gallery-view/lightbox.tsx`
- `src/components/gallery-view/unlock-banner.tsx`
- `src/hooks/use-gallery-access.ts`

---

## Phase 4: Webhooks (4-5 jours)

### Task 4.1: Database Schema - Webhook Events
**Estimation:** 0.5 jour

- [x] 4.1.1 Créer migration create_webhook_events_table.sql
- [x] 4.1.2 Ajouter table webhook_events
- [x] 4.1.3 Ajouter indexes webhook (event_type, status, date)
- [x] 4.1.4 Tester la migration webhook
- [x] 4.1.5 Documenter le schéma webhook

**Fichiers:**
- `supabase/migrations/20260116120000_create_webhook_events.sql`

---

### Task 4.2: Webhook Service
**Estimation:** 2 jours

- [x] 4.2.1 Créer src/lib/services/webhook.service.ts
- [x] 4.2.2 Implémenter processWebhook(event)
- [x] 4.2.3 Implémenter retryFailedWebhook(eventId)
- [x] 4.2.4 Implémenter handleCheckoutCompleted(session)
- [x] 4.2.5 Implémenter handleAccountUpdated(account)
- [x] 4.2.6 Implémenter handlePayoutCreated(payout)
- [x] 4.2.7 Implémenter handlePayoutPaid(payout)
- [x] 4.2.8 Implémenter handlePayoutFailed(payout)
- [x] 4.2.9 Implémenter handleChargeRefunded(charge)
- [x] 4.2.10 Implémenter handleDisputeCreated(dispute)
- [x] 4.2.11 Implémenter logWebhookEvent(event)
- [x] 4.2.12 Implémenter updateWebhookStatus(eventId, status)
- [x] 4.2.13 Ajouter idempotency handling webhook
- [x] 4.2.14 Écrire tests unitaires webhook service

**Fichiers:**
- `src/lib/services/webhook.service.ts`
- `src/lib/services/__tests__/webhook.service.test.ts`

---

### Task 4.3: API Routes - Webhooks
**Estimation:** 1.5 jours

- [x] 4.3.1 Créer src/app/api/stripe/webhook/gallery-purchase/route.ts
- [x] 4.3.2 Créer src/app/api/stripe/connect/webhook/route.ts
- [x] 4.3.3 Implémenter signature verification webhook
- [x] 4.3.4 Implémenter async processing webhook
- [x] 4.3.5 Implémenter retry logic avec exponential backoff
- [x] 4.3.6 Ajouter logging détaillé webhook
- [x] 4.3.7 Ajouter rate limiting webhook
- [x] 4.3.8 Tester avec Stripe CLI
- [x] 4.3.9 Écrire tests d'intégration webhook

**Fichiers:**
- `src/app/api/stripe/webhook/gallery-purchase/route.ts`
- `src/app/api/stripe/connect/webhook/route.ts`

---

### Task 4.4: Webhook Testing & Configuration
**Estimation:** 0.5 jour

- [x] 4.4.1 Configurer webhooks dans Stripe Dashboard staging
- [x] 4.4.2 Tester tous les événements avec Stripe CLI
- [x] 4.4.3 Documenter la configuration webhook
- [x] 4.4.4 Créer guide de test webhook
- [x] 4.4.5 Configurer webhooks en production

**Documentation:**
- `docs/stripe-webhook-setup.md`

---

## Phase 5: Revenue Dashboard (5-6 jours)

### Task 5.1: Revenue Service
**Estimation:** 2 jours

- [x] 5.1.1 Créer src/lib/services/revenue.service.ts
- [x] 5.1.2 Implémenter getOverview(photographerId, period)
- [x] 5.1.3 Implémenter getChartData(photographerId, range)
- [x] 5.1.4 Implémenter getSales(photographerId, filters)
- [x] 5.1.5 Implémenter getSaleDetails(saleId)
- [x] 5.1.6 Implémenter exportSales(photographerId, format)
- [x] 5.1.7 Implémenter getTopGalleries(photographerId, limit)
- [x] 5.1.8 Implémenter getConversionFunnel(photographerId)
- [x] 5.1.9 Implémenter getRevenueByGallery(photographerId)
- [x] 5.1.10 Ajouter caching revenue service (15 minutes)
- [x] 5.1.11 Optimiser queries revenue service
- [x] 5.1.12 Écrire tests unitaires revenue service

**Fichiers:**
- `src/lib/services/revenue.service.ts`
- `src/lib/services/__tests__/revenue.service.test.ts`

---

### Task 5.2: API Routes - Revenue
**Estimation:** 1 jour

- [x] 5.2.1 Créer src/app/api/photographer/revenue/overview/route.ts
- [x] 5.2.2 Créer src/app/api/photographer/revenue/chart/route.ts
- [x] 5.2.3 Créer src/app/api/photographer/sales/route.ts
- [x] 5.2.4 Créer src/app/api/photographer/sales/[id]/route.ts
- [x] 5.2.5 Créer src/app/api/photographer/sales/export/route.ts
- [x] 5.2.6 Créer src/app/api/photographer/top-galleries/route.ts
- [x] 5.2.7 Ajouter validation revenue API
- [x] 5.2.8 Ajouter pagination revenue API
- [x] 5.2.9 Ajouter filtering revenue API
- [x] 5.2.10 Écrire tests revenue API

**Fichiers:**
- `src/app/api/photographer/revenue/overview/route.ts`
- `src/app/api/photographer/revenue/chart/route.ts`
- `src/app/api/photographer/sales/route.ts`
- `src/app/api/photographer/sales/[id]/route.ts`
- `src/app/api/photographer/sales/export/route.ts`
- `src/app/api/photographer/top-galleries/route.ts`

---

### Task 5.3: UI - Revenue Dashboard Page
**Estimation:** 2.5 jours

- [x] 5.3.1 Créer src/app/(dashboard)/revenue/page.tsx
- [x] 5.3.2 Créer src/components/revenue/revenue-overview.tsx
- [x] 5.3.3 Créer src/components/revenue/revenue-chart.tsx
- [x] 5.3.4 Créer src/components/revenue/sales-table.tsx
- [x] 5.3.5 Créer src/components/revenue/top-galleries-widget.tsx
- [x] 5.3.6 Implémenter overview cards (metrics)
- [x] 5.3.7 Implémenter revenue chart (custom bar chart)
- [x] 5.3.8 Implémenter sales table avec pagination
- [x] 5.3.9 Implémenter filters & search revenue
- [x] 5.3.10 Implémenter export button revenue
- [x] 5.3.11 Ajouter loading states revenue UI
- [x] 5.3.12 Rendre responsive revenue UI
- [x] 5.3.13 Ajouter au navigation revenue
- [x] 5.3.14 Design cohérent avec gallery-detail et settings
- [x] 5.3.15 Écrire tests E2E revenue dashboard

**Fichiers:**
- `src/app/(dashboard)/revenue/page.tsx`
- `src/components/revenue/revenue-overview.tsx`
- `src/components/revenue/revenue-chart.tsx`
- `src/components/revenue/sales-table.tsx`
- `src/components/revenue/top-galleries-widget.tsx`

---

## Phase 6: Payouts (3-4 jours)

### Task 6.1: Database Schema - Payouts
**Estimation:** 0.5 jour

- [x] 6.1.1 Créer migration create_photographer_payouts_table.sql
- [x] 6.1.2 Ajouter table photographer_payouts
- [x] 6.1.3 Ajouter indexes payouts
- [x] 6.1.4 Tester la migration payouts
- [x] 6.1.5 Documenter le schéma payouts

**Fichiers:**
- `supabase/migrations/20260116120100_create_photographer_payouts.sql`
- `supabase/migrations/README_PHOTOGRAPHER_PAYOUTS.md`

---

### Task 6.2: Payout Service
**Estimation:** 1 jour

- [x] 6.2.1 Créer src/lib/services/payout.service.ts
- [x] 6.2.2 Implémenter getPayouts(photographerId, filters)
- [x] 6.2.3 Implémenter getPayoutDetails(payoutId)
- [x] 6.2.4 Implémenter getBalance(accountId)
- [x] 6.2.5 Implémenter getNextPayoutDate(accountId)
- [x] 6.2.6 Implémenter syncPayouts(accountId)
- [x] 6.2.7 Écrire tests unitaires payout service

**Fichiers:**
- `src/lib/services/payout.service.ts`
- `src/lib/services/__tests__/payout.service.test.ts`

---

### Task 6.3: API Routes - Payouts
**Estimation:** 0.5 jour

- [x] 6.3.1 Créer src/app/api/photographer/payouts/route.ts
- [x] 6.3.2 Créer src/app/api/photographer/payouts/[id]/route.ts
- [x] 6.3.3 Créer src/app/api/photographer/balance/route.ts
- [x] 6.3.4 Ajouter validation payouts API
- [x] 6.3.5 Écrire tests payouts API

**Fichiers:**
- `src/app/api/photographer/payouts/route.ts`
- `src/app/api/photographer/payouts/[id]/route.ts`
- `src/app/api/photographer/balance/route.ts`

---

### Task 6.4: UI - Payouts Tab
**Estimation:** 1.5 jours

- [x] 6.4.1 Créer src/components/revenue/payouts-tab.tsx
- [x] 6.4.2 Créer src/components/revenue/balance-widget.tsx
- [x] 6.4.3 Créer src/components/revenue/payout-list.tsx
- [x] 6.4.4 Implémenter balance widget
- [x] 6.4.5 Implémenter payout history list
- [x] 6.4.6 Implémenter filters payouts
- [x] 6.4.7 Ajouter loading states payouts UI
- [x] 6.4.8 Rendre responsive payouts UI
- [x] 6.4.9 Écrire tests payouts UI

**Fichiers:**
- `src/components/revenue/payouts-tab.tsx`
- `src/components/revenue/balance-widget.tsx`
- `src/components/revenue/payout-list.tsx`

---

## Phase 7: Refunds & Disputes (3-4 jours)

### Task 7.1: Refund Service
**Estimation:** 1 jour

- [x] 7.1.1 Ajouter méthodes refund dans gallery-purchase.service.ts
- [x] 7.1.2 Implémenter refundPurchase(purchaseId, reason)
- [x] 7.1.3 Implémenter getRefundableAmount(purchaseId)
- [x] 7.1.4 Implémenter processPartialRefund(purchaseId, amount)
- [x] 7.1.5 Écrire tests refund service

**Fichiers:**
- `src/lib/services/gallery-purchase.service.ts`

---

### Task 7.2: API Routes - Refunds & Disputes
**Estimation:** 0.5 jour

- [x] 7.2.1 Créer src/app/api/photographer/sales/[id]/refund/route.ts
- [x] 7.2.2 Créer src/app/api/photographer/disputes/route.ts
- [x] 7.2.3 Créer src/app/api/photographer/disputes/[id]/route.ts
- [x] 7.2.4 Ajouter validation refunds API
- [x] 7.2.5 Écrire tests refunds API

**Fichiers:**
- `src/app/api/photographer/sales/[id]/refund/route.ts`
- `src/app/api/photographer/disputes/route.ts`
- `src/app/api/photographer/disputes/[id]/route.ts`

---

### Task 7.3: UI - Refund Modal
**Estimation:** 1 jour

- [x] 7.3.1 Créer src/components/revenue/refund-modal.tsx
- [x] 7.3.2 Implémenter modal de confirmation refund
- [x] 7.3.3 Implémenter sélection full/partial refund
- [x] 7.3.4 Implémenter input reason refund
- [x] 7.3.5 Ajouter validation refund modal
- [x] 7.3.6 Ajouter loading states refund modal
- [x] 7.3.7 Écrire tests refund modal

**Fichiers:**
- `src/components/revenue/refund-modal.tsx`

---

### Task 7.4: UI - Disputes Page
**Estimation:** 1 jour

- [x] 7.4.1 Créer src/app/(dashboard)/revenue/disputes/page.tsx
- [x] 7.4.2 Créer src/components/revenue/dispute-alert.tsx
- [x] 7.4.3 Créer src/components/revenue/dispute-list.tsx
- [x] 7.4.4 Créer src/components/revenue/dispute-details.tsx
- [x] 7.4.5 Implémenter liste des disputes
- [x] 7.4.6 Implémenter détails dispute
- [x] 7.4.7 Implémenter alert banner disputes
- [x] 7.4.8 Ajouter link vers Stripe Dashboard disputes
- [x] 7.4.9 Rendre responsive disputes UI
- [x] 7.4.10 Écrire tests disputes UI

**Fichiers:**
- `src/app/(dashboard)/revenue/disputes/page.tsx`
- `src/components/revenue/dispute-alert.tsx`
- `src/components/revenue/dispute-list.tsx`
- `src/components/revenue/dispute-details.tsx`

---

## Phase 8: Notifications & Emails (3-4 jours)

### Task 8.1: Email Service Setup
**Estimation:** 1 jour

- [-] 8.1.1 Choisir service email (Resend)
- [-] 8.1.2 Configurer service email
- [-] 8.1.3 Créer src/lib/services/email.service.ts
- [-] 8.1.4 Implémenter sendEmail(to, template, data)
- [-] 8.1.5 Implémenter sendPurchaseConfirmation(purchase)
- [-] 8.1.6 Implémenter sendSaleNotification(sale)
- [-] 8.1.7 Implémenter sendPayoutNotification(payout)
- [-] 8.1.8 Implémenter sendDisputeAlert(dispute)
- [-] 8.1.9 Écrire tests email service

**Fichiers:**
- `src/lib/services/email.service.ts`
- `src/lib/services/__tests__/email.service.test.ts`

---

### Task 8.2: Email Templates
**Estimation:** 1.5 jours

- [x] 8.2.1 Créer src/emails/purchase-confirmation.tsx
- [x] 8.2.2 Créer src/emails/sale-notification.tsx
- [x] 8.2.3 Créer src/emails/payout-notification.tsx
- [x] 8.2.4 Créer src/emails/dispute-alert.tsx
- [x] 8.2.5 Créer src/emails/refund-confirmation.tsx
- [x] 8.2.6 Utiliser React Email ou MJML
- [x] 8.2.7 Rendre responsive email templates
- [x] 8.2.8 Tester rendu email templates

**Fichiers:**
- `src/emails/purchase-confirmation.tsx`
- `src/emails/sale-notification.tsx`
- `src/emails/payout-notification.tsx`
- `src/emails/dispute-alert.tsx`
- `src/emails/refund-confirmation.tsx`

---

### Task 8.3: In-App Notifications
**Estimation:** 1 jour

- [x] 8.3.1 Créer src/components/notifications/notification-bell.tsx
- [x] 8.3.2 Créer src/components/notifications/notification-list.tsx
- [x] 8.3.3 Implémenter système de notifications
- [x] 8.3.4 Ajouter au header notifications
- [x] 8.3.5 Implémenter mark as read notifications
- [x] 8.3.6 Ajouter au webhook handlers notifications
- [x] 8.3.7 Écrire tests notifications

**Fichiers:**
- `src/components/notifications/notification-bell.tsx`
- `src/components/notifications/notification-list.tsx`

---

## Phase 9: Analytics & Reporting (3-4 jours)

### Task 9.1: Advanced Analytics
**Estimation:** 1.5 jours

- [ ] 9.1.1 Ajouter méthodes analytics dans revenue.service.ts
- [ ] 9.1.2 Implémenter conversion funnel analytics
- [ ] 9.1.3 Implémenter revenue by gallery analytics
- [ ] 9.1.4 Implémenter cohort analysis
- [ ] 9.1.5 Optimiser queries analytics
- [ ] 9.1.6 Écrire tests analytics

**Fichiers:**
- `src/lib/services/revenue.service.ts`

---

### Task 9.2: Export Functionality
**Estimation:** 1 jour

- [ ] 9.2.1 Créer src/lib/utils/export.ts
- [ ] 9.2.2 Implémenter export CSV
- [ ] 9.2.3 Implémenter export Excel
- [ ] 9.2.4 Implémenter export PDF
- [ ] 9.2.5 Ajouter au revenue service export
- [ ] 9.2.6 Écrire tests export

**Fichiers:**
- `src/lib/utils/export.ts`

---

### Task 9.3: UI - Analytics Tab
**Estimation:** 1 jour

- [ ] 9.3.1 Créer src/components/revenue/analytics-tab.tsx
- [ ] 9.3.2 Créer src/components/revenue/conversion-funnel.tsx
- [ ] 9.3.3 Implémenter funnel visualization
- [ ] 9.3.4 Implémenter advanced charts analytics
- [ ] 9.3.5 Rendre responsive analytics UI
- [ ] 9.3.6 Écrire tests analytics UI

**Fichiers:**
- `src/components/revenue/analytics-tab.tsx`
- `src/components/revenue/conversion-funnel.tsx`

---

## Phase 10: Optimizations (2-3 jours)

### Task 10.1: Caching Implementation
**Estimation:** 1 jour
###import { createClient } from 'redis';
import { NextResponse } from 'next/server';

const redis = await createClient().connect();

export const POST = async () => {
  // Fetch data from Redis
  const result = await redis.get("item");
  
  // Return the result in the response
  return new NextResponse(JSON.stringify({ result }), { status: 200 });

}
;###

- [ ] 10.1.1 Implémenter Redis avec npm install redis caching service
- [ ] 10.1.2 Ajouter cache pour monetization config
- [ ] 10.1.3 Ajouter cache pour purchase verification
- [ ] 10.1.4 Ajouter cache pour revenue stats
- [ ] 10.1.5 Implémenter cache invalidation
- [ ] 10.1.6 Tester performance caching

---

### Task 10.2: Database Optimization
**Estimation:** 0.5 jour

- [ ] 10.2.1 Analyser slow queries
- [ ] 10.2.2 Ajouter indexes manquants
- [ ] 10.2.3 Optimiser aggregation queries
- [ ] 10.2.4 Tester performance database

---

### Task 10.3: Load Testing
**Estimation:** 1 jour

- [ ] 10.3.1 Créer scripts de load testing
- [ ] 10.3.2 Tester webhook endpoint load
- [ ] 10.3.3 Tester checkout flow load
- [ ] 10.3.4 Tester dashboard queries load
- [ ] 10.3.5 Identifier bottlenecks
- [ ] 10.3.6 Optimiser après load testing

---

## Documentation & Deployment

### Task D.1: User Documentation
**Estimation:** 2 jours

- [~] D.1.1 Guide Getting Started with Stripe Connect
- [~] D.1.2 Guide Setting Up Gallery Paywall
- [~] D.1.3 Guide Understanding Your Revenue
- [~] D.1.4 Guide Managing Refunds
- [~] D.1.5 Guide Handling Disputes
- [~] D.1.6 FAQ monetization

**Fichiers:**
- `docs/user-guides/stripe-connect-setup.md`
- `docs/user-guides/gallery-paywall-setup.md`
- `docs/user-guides/revenue-dashboard.md`
- `docs/user-guides/refunds-disputes.md`

---

### Task D.2: Developer Documentation
**Estimation:** 1 jour

- [~] D.2.1 API documentation (OpenAPI spec)
- [~] D.2.2 Webhook documentation dev
- [~] D.2.3 Service documentation dev
- [~] D.2.4 Database schema documentation dev
- [~] D.2.5 Testing guide dev

**Fichiers:**
- `docs/api/stripe-connect.md`
- `docs/api/webhooks.md`
- `docs/development/testing-guide.md`

---

### Task D.3: Deployment
**Estimation:** 1 jour

- [~] D.3.1 Configurer webhooks en production deployment
- [~] D.3.2 Migrer base de données production
- [~] D.3.3 Déployer code production
- [~] D.3.4 Tester en production
- [~] D.3.5 Monitorer logs production
- [~] D.3.6 Communiquer aux utilisateurs

---

## Total Estimation

**Total: 35-45 jours de développement**

**Breakdown:**
- Phase 1: 5-6 jours
- Phase 2: 4-5 jours
- Phase 3: 5-6 jours
- Phase 4: 4-5 jours
- Phase 5: 5-6 jours
- Phase 6: 3-4 jours
- Phase 7: 3-4 jours
- Phase 8: 3-4 jours
- Phase 9: 3-4 jours
- Phase 10: 2-3 jours
- Documentation & Deployment: 4 jours
