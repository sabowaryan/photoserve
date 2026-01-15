# Stripe - Analyse des Lacunes d'Implémentation

## Vue d'ensemble

Ce document analyse l'état actuel de l'intégration Stripe dans PikSend et identifie les fonctionnalités manquantes ou incomplètes.

## État actuel de l'implémentation

### ✅ Ce qui est implémenté

#### 1. Checkout Sessions (Paiements)

**Routes API existantes :**
- ✅ `/api/stripe/checkout` - Abonnement utilisateur (Premium/Pro)
- ✅ `/api/stripe/checkout/gallery-unlock` - Déblocage galerie ($2.99)
- ✅ `/api/stripe/checkout/guest-subscribe` - Abonnement invité ($9.99/mois)

**Fonctionnalités :**
- ✅ Création de sessions de paiement
- ✅ Support abonnements mensuels/annuels
- ✅ Support paiements one-time (déblocage galerie)
- ✅ Métadonnées pour tracking (user_id, gallery_id, plan)
- ✅ URLs de succès/annulation personnalisables
- ✅ Gestion des clients Stripe existants

#### 2. Customer Portal

**Route API :**
- ✅ `/api/stripe/portal` - Portail client pour gestion abonnement

**Fonctionnalités :**
- ✅ Accès au portail Stripe
- ✅ Gestion abonnement (upgrade, downgrade, annulation)
- ✅ Historique des paiements
- ✅ Mise à jour des moyens de paiement

#### 3. Service de Paiement

**Fichier :** `src/lib/services/payment.service.ts`

**Fonctionnalités :**
- ✅ Création de checkout sessions
- ✅ Création de portal sessions
- ✅ Récupération du statut d'abonnement
- ✅ Vérification si Stripe est activé (admin toggle)
- ✅ Gestion des erreurs (StripeDisabledError)
- ✅ Mapping des statuts Stripe

#### 4. Configuration Stripe

**Fichier :** `src/lib/stripe/client.ts` (supposé)

**Fonctionnalités :**
- ✅ Initialisation du client Stripe
- ✅ Prix configurés (STRIPE_PRICES)
- ✅ Plans : Premium ($9.99/mois) et Pro ($19.99/mois)
- ✅ Intervalles : monthly et yearly

### ❌ Ce qui manque (CRITIQUE)

#### 1. Webhooks Stripe

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Problème :**
Sans webhooks, les paiements ne sont PAS synchronisés avec la base de données. Cela signifie :
- ❌ Après un paiement réussi, l'utilisateur n'est PAS upgradé automatiquement
- ❌ Les galeries débloquées ne sont PAS marquées comme unlocked
- ❌ Les abonnements annulés ne sont PAS reflétés dans la DB
- ❌ Les échecs de paiement ne sont PAS gérés
- ❌ Les remboursements ne sont PAS traités

**Impact** : 🔴 **BLOQUANT** - Le système de paiement ne fonctionne pas correctement

**Ce qui doit être implémenté :**

```typescript
// Route manquante : /api/stripe/webhook

POST /api/stripe/webhook
```

**Événements Stripe à gérer :**

1. **`checkout.session.completed`**
   - Paiement réussi (abonnement ou one-time)
   - Action : Mettre à jour le plan utilisateur ou débloquer la galerie

2. **`customer.subscription.created`**
   - Nouvel abonnement créé
   - Action : Créer l'enregistrement d'abonnement dans la DB

3. **`customer.subscription.updated`**
   - Abonnement modifié (upgrade, downgrade)
   - Action : Mettre à jour le plan utilisateur

4. **`customer.subscription.deleted`**
   - Abonnement annulé
   - Action : Rétrograder l'utilisateur vers Free

5. **`invoice.payment_succeeded`**
   - Paiement récurrent réussi
   - Action : Prolonger l'abonnement

6. **`invoice.payment_failed`**
   - Échec de paiement
   - Action : Notifier l'utilisateur, marquer comme past_due

7. **`customer.subscription.trial_will_end`**
   - Fin de période d'essai imminente
   - Action : Notifier l'utilisateur

8. **`charge.refunded`**
   - Remboursement effectué
   - Action : Révoquer l'accès, mettre à jour la DB


#### 2. Gestion des Abonnements dans la DB

**Statut** : ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

**Ce qui existe :**
- ✅ Champs dans `profiles` : `stripe_customer_id`, `stripe_subscription_id`, `subscription_plan`

**Ce qui manque :**
- ❌ Table dédiée `subscriptions` pour historique complet
- ❌ Tracking des changements de plan
- ❌ Historique des paiements
- ❌ Gestion des périodes d'essai
- ❌ Dates de renouvellement

**Table recommandée :**

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Stripe IDs
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,
  
  -- Plan info
  plan VARCHAR(20) NOT NULL, -- 'premium' | 'pro'
  interval VARCHAR(20) NOT NULL, -- 'monthly' | 'yearly'
  status VARCHAR(50) NOT NULL, -- 'active' | 'canceled' | 'past_due' | 'trialing'
  
  -- Dates
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  trial_start TIMESTAMP,
  trial_end TIMESTAMP,
  canceled_at TIMESTAMP,
  ended_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_stripe_subscription UNIQUE(stripe_subscription_id)
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
```

#### 3. Gestion des Paiements One-Time

**Statut** : ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

**Ce qui existe :**
- ✅ Route checkout pour déblocage galerie
- ✅ Prix défini ($2.99)

**Ce qui manque :**
- ❌ Webhook pour marquer la galerie comme unlocked
- ❌ Table `payments` pour historique
- ❌ Gestion des remboursements
- ❌ Notifications utilisateur après paiement

**Table recommandée :**

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Stripe IDs
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Payment info
  type VARCHAR(50) NOT NULL, -- 'gallery_unlock' | 'subscription' | 'other'
  amount INTEGER NOT NULL, -- En centimes
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(50) NOT NULL, -- 'succeeded' | 'failed' | 'refunded'
  
  -- Metadata
  gallery_id UUID REFERENCES galleries(id) ON DELETE SET NULL,
  metadata JSONB,
  
  -- Dates
  paid_at TIMESTAMP,
  refunded_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_payment_intent UNIQUE(stripe_payment_intent_id)
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_gallery_id ON payments(gallery_id);
CREATE INDEX idx_payments_type ON payments(type);
CREATE INDEX idx_payments_status ON payments(status);
```

#### 4. Notifications Utilisateur

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Ce qui manque :**
- ❌ Email de confirmation après paiement
- ❌ Email d'échec de paiement
- ❌ Email de renouvellement d'abonnement
- ❌ Email d'annulation d'abonnement
- ❌ Notifications in-app

**Événements à notifier :**
1. Paiement réussi (abonnement ou one-time)
2. Échec de paiement
3. Abonnement renouvelé
4. Abonnement annulé
5. Fin de période d'essai imminente
6. Remboursement effectué

#### 5. Gestion des Erreurs et Retry

**Statut** : ⚠️ **BASIQUE**

**Ce qui existe :**
- ✅ Gestion basique des erreurs dans les routes API
- ✅ StripeDisabledError

**Ce qui manque :**
- ❌ Retry automatique en cas d'échec webhook
- ❌ Queue de traitement des webhooks
- ❌ Logging détaillé des événements Stripe
- ❌ Alertes admin en cas d'erreur critique
- ❌ Réconciliation manuelle en cas de désynchronisation

#### 6. Migration Guest → User

**Statut** : ⚠️ **PARTIELLEMENT IMPLÉMENTÉ**

**Ce qui existe :**
- ✅ Route checkout pour guest subscription
- ✅ Métadonnées guest_session_id dans checkout

**Ce qui manque :**
- ❌ Logique de migration des galeries guest vers user après paiement
- ❌ Webhook pour déclencher la migration
- ❌ Gestion des cas d'erreur (guest crée un compte mais ne paie pas)
- ❌ Nettoyage des sessions guest après migration

#### 7. Sécurité Webhooks

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Ce qui manque :**
- ❌ Vérification de la signature Stripe
- ❌ Protection contre les replay attacks
- ❌ Rate limiting sur l'endpoint webhook
- ❌ Logging des tentatives d'accès non autorisées

**Implémentation requise :**

```typescript
// Vérification de la signature Stripe
const sig = request.headers.get('stripe-signature');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

try {
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    webhookSecret
  );
  // Traiter l'événement
} catch (err) {
  // Signature invalide
  return new Response('Webhook signature verification failed', { 
    status: 400 
  });
}
```

### ⚠️ Ce qui est incomplet

#### 1. Tests

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Ce qui manque :**
- ❌ Tests unitaires pour payment.service.ts
- ❌ Tests d'intégration pour les routes Stripe
- ❌ Tests E2E pour le flow de paiement complet
- ❌ Tests des webhooks avec Stripe CLI
- ❌ Tests de cas d'erreur (paiement échoué, etc.)

#### 2. Documentation

**Statut** : ⚠️ **MINIMALE**

**Ce qui manque :**
- ❌ Guide de configuration Stripe (clés API, webhooks)
- ❌ Documentation des flows de paiement
- ❌ Guide de test en mode sandbox
- ❌ Documentation des événements webhook
- ❌ Guide de dépannage

#### 3. Admin Dashboard

**Statut** : ⚠️ **BASIQUE**

**Ce qui existe :**
- ✅ Toggle pour activer/désactiver Stripe

**Ce qui manque :**
- ❌ Vue des abonnements actifs
- ❌ Vue des paiements récents
- ❌ Statistiques de revenus
- ❌ Gestion des remboursements
- ❌ Logs des webhooks
- ❌ Réconciliation manuelle

#### 4. Gestion des Taxes

**Statut** : ❌ **NON IMPLÉMENTÉ**

**Ce qui manque :**
- ❌ Configuration Stripe Tax
- ❌ Collecte automatique des taxes
- ❌ Affichage des taxes dans les prix
- ❌ Conformité TVA européenne

## Priorités d'implémentation

### 🔴 CRITIQUE (Bloquant)

**Durée estimée : 3-4 jours**

1. **Webhooks Stripe** (Priorité #1)
   - Implémenter `/api/stripe/webhook`
   - Gérer les 8 événements principaux
   - Vérification de signature
   - Tests avec Stripe CLI

2. **Synchronisation DB après paiement**
   - Mettre à jour `subscription_plan` dans profiles
   - Marquer galeries comme `is_unlocked`
   - Créer enregistrements dans `payments`

3. **Table subscriptions**
   - Créer la table
   - Migrer les données existantes
   - Mettre à jour les queries

### 🟠 IMPORTANT (Fonctionnel)

**Durée estimée : 2-3 jours**

4. **Table payments**
   - Créer la table
   - Enregistrer tous les paiements
   - Historique consultable

5. **Notifications email**
   - Confirmation de paiement
   - Échec de paiement
   - Renouvellement

6. **Migration Guest → User**
   - Logique de migration après paiement
   - Webhook handler
   - Tests

### 🟡 SOUHAITABLE (Qualité)

**Durée estimée : 2-3 jours**

7. **Gestion des erreurs avancée**
   - Retry automatique
   - Queue de webhooks
   - Logging détaillé

8. **Admin Dashboard**
   - Vue des abonnements
   - Statistiques de revenus
   - Logs des webhooks

9. **Tests complets**
   - Tests unitaires
   - Tests d'intégration
   - Tests E2E

### 🟢 OPTIONNEL (Nice to have)

**Durée estimée : 1-2 jours**

10. **Gestion des taxes**
    - Stripe Tax
    - Conformité TVA

11. **Documentation complète**
    - Guide de configuration
    - Guide de test
    - Guide de dépannage

## Estimation totale

**Temps de développement** : 8-12 jours  
**Répartition** :
- Critique : 3-4 jours
- Important : 2-3 jours
- Souhaitable : 2-3 jours
- Optionnel : 1-2 jours


## Spécification détaillée : Webhooks Stripe

### Architecture

```
Stripe → POST /api/stripe/webhook → Vérification signature → Handler événement → DB Update → Notification
```

### Implémentation

#### Fichier : `src/app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event;

  try {
    // Vérifier la signature
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  // Traiter l'événement
  try {
    await handleWebhookEvent(event);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
    });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return new Response('Webhook Handler Error', { status: 500 });
  }
}

async function handleWebhookEvent(event: any) {
  const supabase = await createClient();

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, supabase);
      break;

    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object, supabase);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object, supabase);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object, supabase);
      break;

    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object, supabase);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object, supabase);
      break;

    case 'charge.refunded':
      await handleChargeRefunded(event.data.object, supabase);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// Handlers pour chaque événement
async function handleCheckoutCompleted(session: any, supabase: any) {
  const metadata = session.metadata;
  
  if (metadata.type === 'gallery_unlock') {
    // Débloquer la galerie
    await supabase
      .from('galleries')
      .update({ 
        is_unlocked: true,
        unlocked_at: new Date().toISOString()
      })
      .eq('id', metadata.gallery_id);
    
    // Enregistrer le paiement
    await supabase
      .from('payments')
      .insert({
        stripe_payment_intent_id: session.payment_intent,
        type: 'gallery_unlock',
        amount: session.amount_total,
        currency: session.currency,
        status: 'succeeded',
        gallery_id: metadata.gallery_id,
        paid_at: new Date().toISOString(),
      });
  } else if (metadata.type === 'guest_subscription') {
    // Gérer l'abonnement guest
    // TODO: Implémenter la migration guest → user
  }
}

async function handleSubscriptionCreated(subscription: any, supabase: any) {
  const userId = subscription.metadata.user_id;
  const plan = subscription.metadata.plan;
  
  // Mettre à jour le profil
  await supabase
    .from('profiles')
    .update({
      subscription_plan: plan,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
    })
    .eq('id', userId);
  
  // Créer l'enregistrement d'abonnement
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      stripe_price_id: subscription.items.data[0].price.id,
      plan: plan,
      interval: subscription.items.data[0].price.recurring.interval,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    });
}

async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  // Mettre à jour le statut et les dates
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  const userId = subscription.metadata.user_id;
  
  // Rétrograder vers Free
  await supabase
    .from('profiles')
    .update({
      subscription_plan: 'free',
      stripe_subscription_id: null,
    })
    .eq('id', userId);
  
  // Marquer l'abonnement comme terminé
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handlePaymentSucceeded(invoice: any, supabase: any) {
  // Enregistrer le paiement
  await supabase
    .from('payments')
    .insert({
      stripe_payment_intent_id: invoice.payment_intent,
      stripe_charge_id: invoice.charge,
      stripe_customer_id: invoice.customer,
      type: 'subscription',
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      paid_at: new Date(invoice.status_transitions.paid_at * 1000).toISOString(),
    });
}

async function handlePaymentFailed(invoice: any, supabase: any) {
  // Notifier l'utilisateur
  // TODO: Envoyer email d'échec de paiement
  
  // Marquer l'abonnement comme past_due
  await supabase
    .from('subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_customer_id', invoice.customer);
}

async function handleChargeRefunded(charge: any, supabase: any) {
  // Marquer le paiement comme remboursé
  await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refunded_at: new Date().toISOString(),
    })
    .eq('stripe_charge_id', charge.id);
  
  // Si c'était un déblocage de galerie, re-verrouiller
  const { data: payment } = await supabase
    .from('payments')
    .select('gallery_id, type')
    .eq('stripe_charge_id', charge.id)
    .single();
  
  if (payment?.type === 'gallery_unlock' && payment.gallery_id) {
    await supabase
      .from('galleries')
      .update({ is_unlocked: false })
      .eq('id', payment.gallery_id);
  }
}
```

### Configuration Stripe Dashboard

1. **Créer le webhook endpoint**
   - URL : `https://votre-domaine.com/api/stripe/webhook`
   - Événements à écouter :
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `charge.refunded`

2. **Récupérer le webhook secret**
   - Copier le `Signing secret`
   - Ajouter à `.env` : `STRIPE_WEBHOOK_SECRET=whsec_...`

3. **Tester avec Stripe CLI**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   stripe trigger checkout.session.completed
   ```

## Checklist d'implémentation

### Phase 1 : Webhooks (CRITIQUE)

- [ ] Créer `/api/stripe/webhook/route.ts`
- [ ] Implémenter vérification de signature
- [ ] Implémenter handlers pour 8 événements
- [ ] Créer table `subscriptions`
- [ ] Créer table `payments`
- [ ] Tester avec Stripe CLI
- [ ] Déployer et configurer webhook dans Stripe Dashboard

### Phase 2 : Notifications

- [ ] Service d'envoi d'emails
- [ ] Template email confirmation paiement
- [ ] Template email échec paiement
- [ ] Template email renouvellement
- [ ] Template email annulation
- [ ] Intégrer dans les webhook handlers

### Phase 3 : Migration Guest

- [ ] Logique de migration des galeries
- [ ] Handler webhook pour guest subscription
- [ ] Tests de migration
- [ ] Nettoyage des sessions guest

### Phase 4 : Admin Dashboard

- [ ] Page vue des abonnements
- [ ] Page vue des paiements
- [ ] Statistiques de revenus
- [ ] Logs des webhooks
- [ ] Outils de réconciliation

### Phase 5 : Tests & Documentation

- [ ] Tests unitaires payment.service
- [ ] Tests d'intégration routes Stripe
- [ ] Tests E2E flow complet
- [ ] Documentation configuration
- [ ] Documentation dépannage

## Ressources

### Documentation Stripe
- [Webhooks Guide](https://stripe.com/docs/webhooks)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Webhook Events](https://stripe.com/docs/api/events/types)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)

### Fichiers à créer/modifier
- `src/app/api/stripe/webhook/route.ts` (nouveau)
- `src/lib/services/webhook.service.ts` (nouveau)
- `src/lib/services/email.service.ts` (nouveau)
- `supabase/migrations/XXX_create_subscriptions_table.sql` (nouveau)
- `supabase/migrations/XXX_create_payments_table.sql` (nouveau)

---

**Document créé le** : Janvier 2026  
**Version** : 1.0.0  
**Statut** : Analyse complète - Prêt pour implémentation  
**Auteur** : Équipe PikSend
