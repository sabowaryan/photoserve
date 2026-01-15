# Tasks: Stripe Connect & Photographer Monetization

## Phase 1: Stripe Connect Setup (5-6 jours)

### Task 1.1: Database Schema - Connect Accounts
**Estimation:** 0.5 jour

- [-] Créer migration `create_stripe_connect_accounts_table.sql`
- [ ] Ajouter table `stripe_connect_accounts` avec tous les champs
- [ ] Ajouter indexes (user_id, stripe_account_id, status)
- [ ] Ajouter contraintes (unique, foreign keys)
- [ ] Tester la migration en local
- [ ] Documenter le schéma

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_stripe_connect_accounts.sql`

---

### Task 1.2: Stripe Connect Service
**Estimation:** 1.5 jours

- [ ] Créer `src/lib/services/stripe-connect.service.ts`
- [ ] Implémenter `createConnectAccount(userId)`
- [ ] Implémenter `getOnboardingLink(accountId)`
- [ ] Implémenter `refreshOnboardingLink(accountId)`
- [ ] Implémenter `getAccountStatus(accountId)`
- [ ] Implémenter `updateAccountStatus(accountId)`
- [ ] Implémenter `createDashboardLink(accountId)`
- [ ] Implémenter `disconnectAccount(userId)`
- [ ] Ajouter gestion d'erreurs
- [ ] Ajouter logging
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/stripe-connect.service.ts`
- `src/lib/services/__tests__/stripe-connect.service.test.ts`

---

### Task 1.3: API Routes - Connect
**Estimation:** 1 jour

- [ ] Créer `src/app/api/stripe/connect/onboard/route.ts`
- [ ] Créer `src/app/api/stripe/connect/status/route.ts`
- [ ] Créer `src/app/api/stripe/connect/refresh-link/route.ts`
- [ ] Créer `src/app/api/stripe/connect/disconnect/route.ts`
- [ ] Créer `src/app/api/stripe/connect/dashboard-link/route.ts`
- [ ] Ajouter validation des inputs
- [ ] Ajouter vérification Pro plan
- [ ] Ajouter gestion d'erreurs
- [ ] Écrire tests d'intégration

**Fichiers:**
- `src/app/api/stripe/connect/onboard/route.ts`
- `src/app/api/stripe/connect/status/route.ts`
- `src/app/api/stripe/connect/refresh-link/route.ts`
- `src/app/api/stripe/connect/disconnect/route.ts`
- `src/app/api/stripe/connect/dashboard-link/route.ts`

---

### Task 1.4: UI - Settings Stripe Connect Section
**Estimation:** 2 jours

- [ ] Créer `src/components/settings/stripe-connect-section.tsx`
- [ ] Ajouter section dans `src/app/(dashboard)/settings/page.tsx`
- [ ] Implémenter bouton "Connect Stripe"
- [ ] Implémenter affichage du statut (badge)
- [ ] Implémenter bouton "Disconnect"
- [ ] Implémenter bouton "View Dashboard"
- [ ] Ajouter loading states
- [ ] Ajouter error handling
- [ ] Ajouter confirmation modals
- [ ] Rendre responsive (mobile-first)
- [ ] Ajouter tests E2E

**Fichiers:**
- `src/components/settings/stripe-connect-section.tsx`
- `src/app/(dashboard)/settings/page.tsx`

---

## Phase 2: Gallery Monetization (4-5 jours)

### Task 2.1: Database Schema - Monetization
**Estimation:** 0.5 jour

- [ ] Créer migration `create_gallery_monetization_table.sql`
- [ ] Ajouter table `gallery_monetization`
- [ ] Ajouter indexes (gallery_id, is_enabled)
- [ ] Ajouter contraintes (price range, unique gallery)
- [ ] Tester la migration
- [ ] Documenter le schéma

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_gallery_monetization.sql`

---

### Task 2.2: Gallery Monetization Service
**Estimation:** 1.5 jours

- [ ] Créer `src/lib/services/gallery-monetization.service.ts`
- [ ] Implémenter `enablePaywall(galleryId, config)`
- [ ] Implémenter `updatePaywall(galleryId, config)`
- [ ] Implémenter `disablePaywall(galleryId)`
- [ ] Implémenter `getConfig(galleryId)`
- [ ] Implémenter `createStripePrice(config)`
- [ ] Implémenter `updateSalesStats(galleryId)`
- [ ] Implémenter `getConversionRate(galleryId)`
- [ ] Ajouter validation
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/gallery-monetization.service.ts`
- `src/lib/services/__tests__/gallery-monetization.service.test.ts`

---

### Task 2.3: API Routes - Monetization
**Estimation:** 0.5 jour

- [ ] Créer `src/app/api/galleries/[id]/monetization/route.ts`
- [ ] Implémenter POST (create/enable)
- [ ] Implémenter GET (retrieve config)
- [ ] Implémenter PUT (update)
- [ ] Implémenter DELETE (disable)
- [ ] Ajouter validation
- [ ] Ajouter vérification ownership
- [ ] Écrire tests

**Fichiers:**
- `src/app/api/galleries/[id]/monetization/route.ts`

---

### Task 2.4: UI - Gallery Monetization Tab
**Estimation:** 2 jours

- [ ] Créer `src/components/gallery-detail/monetization-tab.tsx`
- [ ] Ajouter onglet "Monetization" dans gallery settings
- [ ] Implémenter toggle "Enable Paywall"
- [ ] Implémenter input prix (avec validation $5-$500)
- [ ] Implémenter sélecteur devise (USD, EUR, CAD)
- [ ] Implémenter sélecteur preview mode
- [ ] Implémenter calculateur de revenus (avec platform fee)
- [ ] Ajouter preview du paywall
- [ ] Ajouter loading states
- [ ] Rendre responsive
- [ ] Écrire tests

**Fichiers:**
- `src/components/gallery-detail/monetization-tab.tsx`
- `src/app/(dashboard)/dashboard/gallery/[id]/page.tsx`

---

## Phase 3: Paywall & Checkout (5-6 jours)

### Task 3.1: Database Schema - Purchases
**Estimation:** 0.5 jour

- [ ] Créer migration `create_gallery_purchases_table.sql`
- [ ] Ajouter table `gallery_purchases`
- [ ] Ajouter indexes (gallery_id, photographer_id, buyer_email, status, date)
- [ ] Ajouter contraintes
- [ ] Tester la migration
- [ ] Documenter le schéma

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_gallery_purchases.sql`

---

### Task 3.2: Gallery Purchase Service
**Estimation:** 2 jours

- [ ] Créer `src/lib/services/gallery-purchase.service.ts`
- [ ] Implémenter `createCheckoutSession(galleryId, buyerEmail)`
- [ ] Implémenter `recordPurchase(paymentIntent)`
- [ ] Implémenter `verifyPurchase(galleryId, identifier)`
- [ ] Implémenter `getPurchase(galleryId, identifier)`
- [ ] Implémenter `grantAccess(purchaseId)`
- [ ] Implémenter `revokeAccess(purchaseId)`
- [ ] Implémenter `checkAccess(galleryId, identifier)`
- [ ] Implémenter `refundPurchase(purchaseId, reason)`
- [ ] Ajouter caching (5 minutes)
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/gallery-purchase.service.ts`
- `src/lib/services/__tests__/gallery-purchase.service.test.ts`

---


### Task 3.3: API Routes - Checkout & Purchase
**Estimation:** 1 jour

- [ ] Créer `src/app/api/stripe/checkout/gallery-purchase/route.ts`
- [ ] Créer `src/app/api/galleries/[id]/purchase-status/route.ts`
- [ ] Créer `src/app/api/galleries/[id]/verify-access/route.ts`
- [ ] Implémenter création de Checkout Session (destination charge)
- [ ] Implémenter vérification de purchase
- [ ] Implémenter vérification d'accès
- [ ] Ajouter validation
- [ ] Ajouter rate limiting
- [ ] Écrire tests

**Fichiers:**
- `src/app/api/stripe/checkout/gallery-purchase/route.ts`
- `src/app/api/galleries/[id]/purchase-status/route.ts`
- `src/app/api/galleries/[id]/verify-access/route.ts`

---

### Task 3.4: UI - Paywall Screen (Full Mode)
**Estimation:** 1.5 jours

- [ ] Créer `src/components/gallery-view/gallery-paywall.tsx`
- [ ] Implémenter écran de paywall
- [ ] Afficher preview images (3-5 blurred)
- [ ] Afficher prix et features
- [ ] Implémenter bouton "Purchase Access"
- [ ] Ajouter logo photographe
- [ ] Ajouter badge "Secure payment by Stripe"
- [ ] Rendre responsive
- [ ] Ajouter animations
- [ ] Écrire tests

**Fichiers:**
- `src/components/gallery-view/gallery-paywall.tsx`

---

### Task 3.5: UI - Freemium Preview Mode
**Estimation:** 1 jour

- [ ] Modifier `src/app/g/[slug]/gallery-view-client.tsx`
- [ ] Implémenter affichage low-res images (800px)
- [ ] Ajouter watermark overlay
- [ ] Désactiver downloads
- [ ] Ajouter sticky banner "Unlock HD"
- [ ] Modifier lightbox pour preview mode
- [ ] Ajouter bouton "Unlock HD" dans lightbox
- [ ] Rendre responsive
- [ ] Écrire tests

**Fichiers:**
- `src/app/g/[slug]/gallery-view-client.tsx`
- `src/components/gallery-view/gallery-header.tsx`
- `src/components/gallery-view/lightbox.tsx`

---

## Phase 4: Webhooks (4-5 jours)

### Task 4.1: Database Schema - Webhook Events
**Estimation:** 0.5 jour

- [ ] Créer migration `create_webhook_events_table.sql`
- [ ] Ajouter table `webhook_events`
- [ ] Ajouter indexes (event_type, status, date)
- [ ] Tester la migration
- [ ] Documenter le schéma

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_webhook_events.sql`

---

### Task 4.2: Webhook Service
**Estimation:** 2 jours

- [ ] Créer `src/lib/services/webhook.service.ts`
- [ ] Implémenter `processWebhook(event)`
- [ ] Implémenter `retryFailedWebhook(eventId)`
- [ ] Implémenter `handleCheckoutCompleted(session)`
- [ ] Implémenter `handleAccountUpdated(account)`
- [ ] Implémenter `handlePayoutCreated(payout)`
- [ ] Implémenter `handlePayoutPaid(payout)`
- [ ] Implémenter `handlePayoutFailed(payout)`
- [ ] Implémenter `handleChargeRefunded(charge)`
- [ ] Implémenter `handleDisputeCreated(dispute)`
- [ ] Implémenter `logWebhookEvent(event)`
- [ ] Implémenter `updateWebhookStatus(eventId, status)`
- [ ] Ajouter idempotency handling
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/webhook.service.ts`
- `src/lib/services/__tests__/webhook.service.test.ts`

---

### Task 4.3: API Routes - Webhooks
**Estimation:** 1.5 jours

- [ ] Créer `src/app/api/stripe/webhook/route.ts`
- [ ] Créer `src/app/api/stripe/connect/webhook/route.ts`
- [ ] Implémenter signature verification
- [ ] Implémenter async processing (queue si possible)
- [ ] Implémenter retry logic avec exponential backoff
- [ ] Ajouter logging détaillé
- [ ] Ajouter rate limiting
- [ ] Tester avec Stripe CLI
- [ ] Écrire tests d'intégration

**Fichiers:**
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/connect/webhook/route.ts`

---

### Task 4.4: Webhook Testing & Configuration
**Estimation:** 0.5 jour

- [ ] Configurer webhooks dans Stripe Dashboard (staging)
- [ ] Tester tous les événements avec Stripe CLI
- [ ] Documenter la configuration
- [ ] Créer guide de test
- [ ] Configurer webhooks en production

**Documentation:**
- `docs/stripe-webhook-setup.md`

---

## Phase 5: Revenue Dashboard (5-6 jours)

### Task 5.1: Revenue Service
**Estimation:** 2 jours

- [ ] Créer `src/lib/services/revenue.service.ts`
- [ ] Implémenter `getOverview(photographerId, period)`
- [ ] Implémenter `getChartData(photographerId, range)`
- [ ] Implémenter `getSales(photographerId, filters)`
- [ ] Implémenter `getSaleDetails(saleId)`
- [ ] Implémenter `exportSales(photographerId, format)`
- [ ] Implémenter `getTopGalleries(photographerId, limit)`
- [ ] Implémenter `getConversionFunnel(photographerId)`
- [ ] Implémenter `getRevenueByGallery(photographerId)`
- [ ] Ajouter caching (15 minutes)
- [ ] Optimiser queries
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/revenue.service.ts`
- `src/lib/services/__tests__/revenue.service.test.ts`

---

### Task 5.2: API Routes - Revenue
**Estimation:** 1 jour

- [ ] Créer `src/app/api/photographer/revenue/overview/route.ts`
- [ ] Créer `src/app/api/photographer/revenue/chart/route.ts`
- [ ] Créer `src/app/api/photographer/sales/route.ts`
- [ ] Créer `src/app/api/photographer/sales/[id]/route.ts`
- [ ] Créer `src/app/api/photographer/sales/export/route.ts`
- [ ] Créer `src/app/api/photographer/top-galleries/route.ts`
- [ ] Ajouter validation
- [ ] Ajouter pagination
- [ ] Ajouter filtering
- [ ] Écrire tests

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

- [ ] Créer `src/app/(dashboard)/revenue/page.tsx`
- [ ] Créer `src/components/revenue/revenue-overview.tsx`
- [ ] Créer `src/components/revenue/revenue-chart.tsx`
- [ ] Créer `src/components/revenue/sales-table.tsx`
- [ ] Créer `src/components/revenue/top-galleries-widget.tsx`
- [ ] Créer `src/components/revenue/filters.tsx`
- [ ] Implémenter overview cards (metrics)
- [ ] Implémenter revenue chart (recharts)
- [ ] Implémenter sales table avec pagination
- [ ] Implémenter filters & search
- [ ] Implémenter export button
- [ ] Ajouter loading states
- [ ] Rendre responsive
- [ ] Ajouter au navigation
- [ ] Écrire tests E2E

**Fichiers:**
- `src/app/(dashboard)/revenue/page.tsx`
- `src/components/revenue/revenue-overview.tsx`
- `src/components/revenue/revenue-chart.tsx`
- `src/components/revenue/sales-table.tsx`
- `src/components/revenue/top-galleries-widget.tsx`
- `src/components/revenue/filters.tsx`

---

## Phase 6: Payouts (3-4 jours)

### Task 6.1: Database Schema - Payouts
**Estimation:** 0.5 jour

- [ ] Créer migration `create_photographer_payouts_table.sql`
- [ ] Ajouter table `photographer_payouts`
- [ ] Ajouter indexes
- [ ] Tester la migration
- [ ] Documenter le schéma

**Fichiers:**
- `supabase/migrations/YYYYMMDD_create_photographer_payouts.sql`

---

### Task 6.2: Payout Service
**Estimation:** 1 jour

- [ ] Créer `src/lib/services/payout.service.ts`
- [ ] Implémenter `getPayouts(photographerId, filters)`
- [ ] Implémenter `getPayoutDetails(payoutId)`
- [ ] Implémenter `getBalance(accountId)`
- [ ] Implémenter `getNextPayoutDate(accountId)`
- [ ] Implémenter `syncPayouts(accountId)`
- [ ] Écrire tests unitaires

**Fichiers:**
- `src/lib/services/payout.service.ts`
- `src/lib/services/__tests__/payout.service.test.ts`

---

### Task 6.3: API Routes - Payouts
**Estimation:** 0.5 jour

- [ ] Créer `src/app/api/photographer/payouts/route.ts`
- [ ] Créer `src/app/api/photographer/payouts/[id]/route.ts`
- [ ] Créer `src/app/api/photographer/balance/route.ts`
- [ ] Ajouter validation
- [ ] Écrire tests

**Fichiers:**
- `src/app/api/photographer/payouts/route.ts`
- `src/app/api/photographer/payouts/[id]/route.ts`
- `src/app/api/photographer/balance/route.ts`

---

### Task 6.4: UI - Payouts Tab
**Estimation:** 1.5 jours

- [ ] Créer `src/components/revenue/payouts-tab.tsx`
- [ ] Créer `src/components/revenue/balance-widget.tsx`
- [ ] Créer `src/components/revenue/payout-list.tsx`
- [ ] Implémenter balance widget
- [ ] Implémenter payout history list
- [ ] Implémenter filters
- [ ] Ajouter loading states
- [ ] Rendre responsive
- [ ] Écrire tests

**Fichiers:**
- `src/components/revenue/payouts-tab.tsx`
- `src/components/revenue/balance-widget.tsx`
- `src/components/revenue/payout-list.tsx`

---

## Phase 7: Refunds & Disputes (3-4 jours)

### Task 7.1: Refund Service
**Estimation:** 1 jour

- [ ] Ajouter méthodes refund dans `gallery-purchase.service.ts`
- [ ] Implémenter `refundPurchase(purchaseId, reason)`
- [ ] Implémenter `getRefundableAmount(purchaseId)`
- [ ] Implémenter `processPartialRefund(purchaseId, amount)`
- [ ] Écrire tests

**Fichiers:**
- `src/lib/services/gallery-purchase.service.ts`

---

### Task 7.2: API Routes - Refunds & Disputes
**Estimation:** 0.5 jour

- [ ] Créer `src/app/api/photographer/sales/[id]/refund/route.ts`
- [ ] Créer `src/app/api/photographer/disputes/route.ts`
- [ ] Créer `src/app/api/photographer/disputes/[id]/route.ts`
- [ ] Ajouter validation
- [ ] Écrire tests

**Fichiers:**
- `src/app/api/photographer/sales/[id]/refund/route.ts`
- `src/app/api/photographer/disputes/route.ts`
- `src/app/api/photographer/disputes/[id]/route.ts`

---

### Task 7.3: UI - Refund Modal
**Estimation:** 1 jour

- [ ] Créer `src/components/revenue/refund-modal.tsx`
- [ ] Implémenter modal de confirmation
- [ ] Implémenter sélection full/partial refund
- [ ] Implémenter input reason
- [ ] Ajouter validation
- [ ] Ajouter loading states
- [ ] Écrire tests

**Fichiers:**
- `src/components/revenue/refund-modal.tsx`

---

### Task 7.4: UI - Disputes Page
**Estimation:** 1 jour

- [ ] Créer `src/app/(dashboard)/revenue/disputes/page.tsx`
- [ ] Créer `src/components/revenue/dispute-alert.tsx`
- [ ] Créer `src/components/revenue/dispute-list.tsx`
- [ ] Créer `src/components/revenue/dispute-details.tsx`
- [ ] Implémenter liste des disputes
- [ ] Implémenter détails dispute
- [ ] Implémenter alert banner
- [ ] Ajouter link vers Stripe Dashboard
- [ ] Rendre responsive
- [ ] Écrire tests

**Fichiers:**
- `src/app/(dashboard)/revenue/disputes/page.tsx`
- `src/components/revenue/dispute-alert.tsx`
- `src/components/revenue/dispute-list.tsx`
- `src/components/revenue/dispute-details.tsx`

---

## Phase 8: Notifications & Emails (3-4 jours)

### Task 8.1: Email Service Setup
**Estimation:** 1 jour

- [ ] Choisir service email (SendGrid, Mailgun, Resend)
- [ ] Configurer service
- [ ] Créer `src/lib/services/email.service.ts`
- [ ] Implémenter `sendEmail(to, template, data)`
- [ ] Implémenter `sendPurchaseConfirmation(purchase)`
- [ ] Implémenter `sendSaleNotification(sale)`
- [ ] Implémenter `sendPayoutNotification(payout)`
- [ ] Implémenter `sendDisputeAlert(dispute)`
- [ ] Écrire tests

**Fichiers:**
- `src/lib/services/email.service.ts`
- `src/lib/services/__tests__/email.service.test.ts`

---

### Task 8.2: Email Templates
**Estimation:** 1.5 jours

- [ ] Créer `src/emails/purchase-confirmation.tsx`
- [ ] Créer `src/emails/sale-notification.tsx`
- [ ] Créer `src/emails/payout-notification.tsx`
- [ ] Créer `src/emails/dispute-alert.tsx`
- [ ] Créer `src/emails/refund-confirmation.tsx`
- [ ] Utiliser React Email ou MJML
- [ ] Rendre responsive
- [ ] Tester rendu

**Fichiers:**
- `src/emails/purchase-confirmation.tsx`
- `src/emails/sale-notification.tsx`
- `src/emails/payout-notification.tsx`
- `src/emails/dispute-alert.tsx`
- `src/emails/refund-confirmation.tsx`

---

### Task 8.3: In-App Notifications
**Estimation:** 1 jour

- [ ] Créer `src/components/notifications/notification-bell.tsx`
- [ ] Créer `src/components/notifications/notification-list.tsx`
- [ ] Implémenter système de notifications
- [ ] Ajouter au header
- [ ] Implémenter mark as read
- [ ] Ajouter au webhook handlers
- [ ] Écrire tests

**Fichiers:**
- `src/components/notifications/notification-bell.tsx`
- `src/components/notifications/notification-list.tsx`

---

## Phase 9: Analytics & Reporting (3-4 jours)

### Task 9.1: Advanced Analytics
**Estimation:** 1.5 jours

- [ ] Ajouter méthodes analytics dans `revenue.service.ts`
- [ ] Implémenter conversion funnel
- [ ] Implémenter revenue by gallery
- [ ] Implémenter cohort analysis
- [ ] Optimiser queries
- [ ] Écrire tests

**Fichiers:**
- `src/lib/services/revenue.service.ts`

---

### Task 9.2: Export Functionality
**Estimation:** 1 jour

- [ ] Créer `src/lib/utils/export.ts`
- [ ] Implémenter export CSV
- [ ] Implémenter export Excel
- [ ] Implémenter export PDF
- [ ] Ajouter au revenue service
- [ ] Écrire tests

**Fichiers:**
- `src/lib/utils/export.ts`

---

### Task 9.3: UI - Analytics Tab
**Estimation:** 1 jour

- [ ] Créer `src/components/revenue/analytics-tab.tsx`
- [ ] Créer `src/components/revenue/conversion-funnel.tsx`
- [ ] Implémenter funnel visualization
- [ ] Implémenter advanced charts
- [ ] Rendre responsive
- [ ] Écrire tests

**Fichiers:**
- `src/components/revenue/analytics-tab.tsx`
- `src/components/revenue/conversion-funnel.tsx`

---

## Phase 10: Optimizations (2-3 jours)

### Task 10.1: Caching Implementation
**Estimation:** 1 jour

- [ ] Implémenter Redis caching (si disponible)
- [ ] Ajouter cache pour monetization config
- [ ] Ajouter cache pour purchase verification
- [ ] Ajouter cache pour revenue stats
- [ ] Implémenter cache invalidation
- [ ] Tester performance

---

### Task 10.2: Database Optimization
**Estimation:** 0.5 jour

- [ ] Analyser slow queries
- [ ] Ajouter indexes manquants
- [ ] Optimiser aggregation queries
- [ ] Tester performance

---

### Task 10.3: Load Testing
**Estimation:** 1 jour

- [ ] Créer scripts de load testing
- [ ] Tester webhook endpoint
- [ ] Tester checkout flow
- [ ] Tester dashboard queries
- [ ] Identifier bottlenecks
- [ ] Optimiser

---

## Documentation & Deployment

### Task D.1: User Documentation
**Estimation:** 2 jours

- [ ] Guide: Getting Started with Stripe Connect
- [ ] Guide: Setting Up Gallery Paywall
- [ ] Guide: Understanding Your Revenue
- [ ] Guide: Managing Refunds
- [ ] Guide: Handling Disputes
- [ ] FAQ

**Fichiers:**
- `docs/user-guides/stripe-connect-setup.md`
- `docs/user-guides/gallery-paywall-setup.md`
- `docs/user-guides/revenue-dashboard.md`
- `docs/user-guides/refunds-disputes.md`

---

### Task D.2: Developer Documentation
**Estimation:** 1 jour

- [ ] API documentation (OpenAPI spec)
- [ ] Webhook documentation
- [ ] Service documentation
- [ ] Database schema documentation
- [ ] Testing guide

**Fichiers:**
- `docs/api/stripe-connect.md`
- `docs/api/webhooks.md`
- `docs/development/testing-guide.md`

---

### Task D.3: Deployment
**Estimation:** 1 jour

- [ ] Configurer webhooks en production
- [ ] Migrer base de données
- [ ] Déployer code
- [ ] Tester en production
- [ ] Monitorer logs
- [ ] Communiquer aux utilisateurs

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

