# Stripe Connect & Photographer Monetization

## Vue d'ensemble

Cette spécification définit l'implémentation complète de **Stripe Connect** permettant aux photographes Pro de monétiser leurs galeries et recevoir des paiements directs de leurs clients.

## Objectifs

1. **Monétisation**: Permettre aux photographes de vendre l'accès à leurs galeries
2. **Paiements directs**: Utiliser Stripe Connect pour des transferts automatiques
3. **Revenue Dashboard**: Tableau de bord complet pour suivre les revenus
4. **Performance**: Optimisations pour une expérience fluide
5. **Design cohérent**: Réutilisation du design system existant

## Documents

### 📋 [requirements.md](./requirements.md)
Spécification complète des exigences fonctionnelles et techniques.

**Contenu:**
- 11 piliers de fonctionnalités
- 60+ requirements détaillés
- Feature matrix par plan
- Schéma de base de données complet
- Architecture technique
- Phases d'implémentation

### 🏗️ [design.md](./design.md)
Architecture et flux de données du système.

**Contenu:**
- Architecture overview
- Data flows (5 flows principaux)
- Diagrammes de séquence
- Intégrations Stripe

### ✅ [tasks.md](./tasks.md)
Liste exhaustive des tâches d'implémentation.

**Contenu:**
- 10 phases de développement
- 50+ tâches détaillées
- Estimations de temps
- Fichiers à créer/modifier
- Checklist complète

## Fonctionnalités Principales

### 1. Stripe Connect
- Onboarding photographe
- Gestion du compte Connect
- Vérification et statut
- Accès au Stripe Dashboard

### 2. Gallery Paywall
- Configuration par galerie
- Prix personnalisable ($5-$500)
- Mode Full Paywall ou Freemium Preview
- Watermark automatique

### 3. Checkout & Purchase
- Stripe Checkout hébergé
- Destination charges (90% photographe, 10% plateforme)
- Vérification d'accès
- Déblocage automatique

### 4. Webhooks
- 8 événements principaux gérés
- Processing asynchrone
- Retry logic
- Idempotency

### 5. Revenue Dashboard
- Métriques en temps réel
- Graphiques interactifs
- Liste des ventes
- Top galleries
- Export CSV/Excel/PDF

### 6. Payouts
- Transferts automatiques
- Historique des payouts
- Balance en temps réel
- Notifications

### 7. Refunds & Disputes
- Remboursements depuis le dashboard
- Gestion des litiges
- Alertes en temps réel
- Evidence collection

### 8. Notifications
- Emails transactionnels
- Notifications in-app
- Alertes critiques
- Préférences configurables

## Stack Technique

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **UI**: React 18+, TypeScript
- **Styling**: Tailwind CSS v4
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

### Backend
- **API**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe Connect
- **Webhooks**: Stripe Webhooks

### Services
- **Email**: SendGrid / Mailgun / Resend
- **Storage**: Cloudinary
- **Caching**: Redis (optionnel)
- **Queue**: Vercel Queue / BullMQ (optionnel)

## Estimation

**Temps total**: 35-45 jours de développement

**Répartition**:
- Phase 1 (Connect Setup): 5-6 jours ⚡ CRITIQUE
- Phase 2 (Monetization): 4-5 jours ⚡ CRITIQUE
- Phase 3 (Paywall): 5-6 jours ⚡ CRITIQUE
- Phase 4 (Webhooks): 4-5 jours ⚡ CRITIQUE
- Phase 5 (Revenue Dashboard): 5-6 jours 🔶 IMPORTANT
- Phase 6 (Payouts): 3-4 jours 🔶 IMPORTANT
- Phase 7 (Refunds): 3-4 jours 🔶 IMPORTANT
- Phase 8 (Notifications): 3-4 jours 🟡 SOUHAITABLE
- Phase 9 (Analytics): 3-4 jours 🟡 SOUHAITABLE
- Phase 10 (Optimizations): 2-3 jours 🟢 OPTIONNEL

## Prérequis

### Comptes & Clés
- [ ] Compte Stripe (mode test et production)
- [ ] Stripe Connect activé
- [ ] Webhook secrets configurés
- [ ] Service email configuré

### Base de Données
- [ ] Supabase project configuré
- [ ] Migrations à jour
- [ ] RLS policies configurées

### Environnement
```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_SERVICE_API_KEY=...
EMAIL_FROM=noreply@piksend.com

# Optional
REDIS_URL=redis://...
```

## Démarrage Rapide

### 1. Lire la spec
```bash
# Lire les requirements
cat .kiro/specs/stripe-connect-monetization/requirements.md

# Lire le design
cat .kiro/specs/stripe-connect-monetization/design.md

# Lire les tasks
cat .kiro/specs/stripe-connect-monetization/tasks.md
```

### 2. Créer les migrations
```bash
# Créer les tables
supabase migration new create_stripe_connect_tables
# Copier le SQL depuis requirements.md
```

### 3. Implémenter Phase 1
```bash
# Suivre les tasks de la Phase 1
# Commencer par Task 1.1: Database Schema
```

### 4. Tester avec Stripe CLI
```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Écouter les webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger des événements
stripe trigger checkout.session.completed
```

## Tests

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Webhook Tests
```bash
# Avec Stripe CLI
stripe trigger checkout.session.completed
stripe trigger payout.paid
stripe trigger charge.refunded
```

## Monitoring

### Métriques à surveiller
- Webhook processing time
- Webhook failure rate
- Purchase conversion rate
- Refund rate
- Dispute rate
- Payout success rate

### Logs
- Webhook events
- Payment errors
- Refund requests
- Dispute alerts

## Support

### Documentation
- [Stripe Connect Docs](https://stripe.com/docs/connect)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

### Ressources Internes
- [Stripe Implementation Gaps](../../../docs/stripe-implementation-gaps.md)
- [Photographer Gallery Monetization](../../../docs/photographer-gallery-monetization.md)
- [Public Profile Specification](../../../docs/public-profile-specification.md)

## Changelog

### Version 1.0.0 (Janvier 2026)
- ✅ Spécification complète créée
- ✅ Consolidation de 3 documents sources
- ✅ Amélioration performance
- ✅ Design system cohérent
- ✅ 60+ requirements détaillés
- ✅ 50+ tasks d'implémentation
- ✅ Estimation complète

## Auteurs

**Équipe PikSend**
- Spec consolidée à partir de:
  - `docs/stripe-implementation-gaps.md`
  - `docs/photographer-gallery-monetization.md`
  - `docs/public-profile-specification.md`

## License

Propriétaire - PikSend © 2026

