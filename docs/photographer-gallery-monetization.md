# Spécification : Monétisation de Galeries par le Photographe

## Vue d'ensemble

Cette spécification décrit l'implémentation d'un **système de paywall** permettant aux photographes de **vendre l'accès à leurs galeries** à leurs clients. Le photographe définit un prix, et le client doit payer pour accéder aux photos HD sans watermark.

## Objectifs

### Objectif principal
Permettre aux photographes de **monétiser leur travail** en vendant l'accès à leurs galeries directement à leurs clients.

### Objectifs secondaires
1. **Revenus photographe** : Générer des revenus directs pour le photographe
2. **Expérience client** : Processus de paiement simple et sécurisé
3. **Flexibilité** : Prix personnalisable par galerie
4. **Transparence** : Gestion des revenus et commissions
5. **Conformité** : Respect des réglementations de paiement

## Requirement

**Requirement 4.4** - Paywall (Vente de Galerie) - Plan Pro uniquement

## Fonctionnalités

### 1. Configuration du Paywall (Photographe)

#### 1.1 Activation du paywall par galerie

**Interface dans les paramètres de galerie :**

```typescript
interface GalleryMonetization {
  // Activation
  enablePaywall: boolean; // Toggle pour activer la vente
  
  // Prix
  price: number; // Prix en devise locale (ex: 29.99)
  currency: 'usd' | 'eur' | 'cad'; // Devise
  
  // Options
  allowPreview: boolean; // Autoriser aperçu basse résolution
  previewWatermark: boolean; // Watermark sur les aperçus
  unlockDuration?: number; // Durée d'accès en jours (optionnel, défaut: illimité)
  
  // Commission PikSend
  platformFee: number; // Commission PikSend (ex: 10%)
  photographerEarnings: number; // Revenus nets du photographe
}
```


#### 1.2 Interface de configuration

**Section : Paramètres de Galerie → Monétisation**

**Champs configurables :**
- **Activer la vente** : Toggle on/off
- **Prix de vente** : Input numérique (ex: 29.99)
- **Devise** : Sélecteur (USD, EUR, CAD)
- **Aperçu gratuit** : Toggle (autoriser aperçu basse résolution)
- **Watermark sur aperçus** : Toggle (si aperçu activé)
- **Durée d'accès** : Input optionnel (ex: 30 jours, ou illimité)

**Calcul automatique :**
- Commission PikSend : 10% du prix
- Revenus photographe : 90% du prix
- Affichage en temps réel : "Vous recevrez $26.99 par vente"

**Restrictions :**
- Fonctionnalité disponible uniquement pour les plans **Pro**
- Prix minimum : $5.00
- Prix maximum : $500.00

### 2. Expérience Client (Acheteur)

#### 2.1 Accès à la galerie avec paywall

**Scénario 1 : Aperçu désactivé**
```
1. Client accède à la galerie via le lien
2. Affichage d'un écran de paywall :
   - Titre de la galerie
   - Message du photographe (optionnel)
   - Prix affiché clairement
   - Bouton "Acheter l'accès" (CTA)
   - Aperçu de 3-5 photos (miniatures floutées)
3. Client clique sur "Acheter l'accès"
4. Redirection vers Stripe Checkout
5. Paiement réussi → Accès complet à la galerie
```

**Scénario 2 : Aperçu activé (freemium)**
```
1. Client accède à la galerie
2. Affichage de la galerie en mode aperçu :
   - Photos en basse résolution (max 800px)
   - Watermark sur chaque photo
   - Badge "HD disponible après achat"
   - Bannière sticky en haut : "Débloquez les photos HD pour $29.99"
3. Client peut naviguer, voir toutes les photos en basse résolution
4. Boutons de téléchargement désactivés
5. Client clique sur "Débloquer HD"
6. Redirection vers Stripe Checkout
7. Paiement réussi → Photos HD sans watermark + téléchargements
```

#### 2.2 Écran de paywall

**Design :**
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    [Logo Photographe]                       │
│                                                             │
│                  Mariage Sophie & Marc                      │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Blur]  │  │ [Blur]  │  │ [Blur]  │  │ [Blur]  │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│              🔒 Cette galerie est protégée                  │
│                                                             │
│  Accédez à 150 photos HD de votre événement                │
│  sans watermark et téléchargez-les en haute qualité.       │
│                                                             │
│                      ┌─────────────┐                        │
│                      │   $29.99    │                        │
│                      └─────────────┘                        │
│                                                             │
│              [🛒 Acheter l'accès maintenant]                │
│                                                             │
│  ✓ 150 photos en haute définition                          │
│  ✓ Téléchargement illimité                                 │
│  ✓ Sans watermark                                          │
│  ✓ Accès à vie                                             │
│                                                             │
│  🔒 Paiement sécurisé par Stripe                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 2.3 Processus de paiement

**Flow Stripe Checkout :**
1. Client clique sur "Acheter l'accès"
2. Création d'une session Stripe Checkout
3. Redirection vers Stripe (hosted checkout page)
4. Client entre ses informations de paiement
5. Paiement traité par Stripe
6. Webhook Stripe notifie PikSend
7. Galerie débloquée dans la DB
8. Redirection vers la galerie avec message de succès
9. Client peut maintenant accéder aux photos HD

**Gestion des erreurs :**
- Paiement échoué : Message d'erreur + possibilité de réessayer
- Session expirée : Nouvelle session créée automatiquement
- Annulation : Retour à la galerie avec paywall

### 3. Gestion des Revenus (Photographe)

#### 3.1 Dashboard des ventes

**Section : Dashboard → Revenus**

**Métriques affichées :**
- **Revenus totaux** : Somme de toutes les ventes
- **Revenus ce mois** : Ventes du mois en cours
- **Nombre de ventes** : Total de galeries vendues
- **Revenu moyen par vente** : Moyenne des prix de vente
- **Taux de conversion** : % de visiteurs qui achètent

**Graphiques :**
- Évolution des revenus (jour, semaine, mois)
- Top galeries les plus vendues
- Répartition par devise

**Liste des ventes :**
| Date | Galerie | Client | Prix | Commission | Net | Statut |
|------|---------|--------|------|------------|-----|--------|
| 15/01 | Mariage Sophie | sophie@... | $29.99 | $3.00 | $26.99 | Payé |
| 14/01 | Baptême Emma | emma@... | $19.99 | $2.00 | $17.99 | Payé |


#### 3.2 Paiements au photographe

**Méthodes de paiement :**

**Option 1 : Stripe Connect (Recommandé)**
- Le photographe connecte son compte Stripe
- Paiements directs vers son compte (moins la commission)
- Transferts automatiques selon la fréquence choisie (quotidien, hebdomadaire, mensuel)
- Gestion des taxes et conformité par Stripe

**Option 2 : Paiements manuels**
- PikSend collecte les paiements
- Photographe demande un retrait (minimum $50)
- Transfert manuel par virement bancaire ou PayPal
- Délai de traitement : 5-7 jours ouvrables

**Commission PikSend :**
- **10%** de chaque vente
- Couvre les frais Stripe (2.9% + $0.30) + marge PikSend
- Transparent et affiché avant chaque vente

**Exemple de calcul :**
```
Prix de vente : $29.99
Frais Stripe : $1.17 (2.9% + $0.30)
Commission PikSend : $3.00 (10%)
Revenus photographe : $25.82 (86.1%)
```

#### 3.3 Factures et conformité

**Factures automatiques :**
- Générées automatiquement pour chaque vente
- Envoyées au client par email
- Téléchargeables depuis le dashboard photographe
- Conformes aux réglementations fiscales

**Déclarations fiscales :**
- Export CSV des ventes pour déclaration
- Rapport annuel pour impôts (1099-K aux USA)
- Support multi-devises

### 4. Architecture Technique

#### 4.1 Base de données

**Table : `gallery_monetization`**

```sql
CREATE TABLE gallery_monetization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Options
  allow_preview BOOLEAN DEFAULT false,
  preview_watermark BOOLEAN DEFAULT true,
  unlock_duration_days INTEGER, -- NULL = illimité
  
  -- Commission
  platform_fee_percent DECIMAL(5, 2) DEFAULT 10.00,
  
  -- Stripe
  stripe_price_id VARCHAR(255), -- ID du prix Stripe
  
  -- Stats
  total_sales INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_gallery_monetization UNIQUE(gallery_id),
  CONSTRAINT check_price_range CHECK (price >= 5.00 AND price <= 500.00)
);

CREATE INDEX idx_gallery_monetization_gallery_id ON gallery_monetization(gallery_id);
CREATE INDEX idx_gallery_monetization_enabled ON gallery_monetization(is_enabled);
```

**Table : `gallery_purchases`**

```sql
CREATE TABLE gallery_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Acheteur
  buyer_email VARCHAR(255) NOT NULL,
  buyer_name VARCHAR(255),
  buyer_session_id VARCHAR(255), -- Pour guests
  
  -- Paiement
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  
  -- Montants (en centimes)
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  platform_fee_cents INTEGER NOT NULL,
  photographer_earnings_cents INTEGER NOT NULL,
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'succeeded' | 'refunded' | 'disputed'
  
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
CREATE INDEX idx_gallery_purchases_buyer_email ON gallery_purchases(buyer_email);
CREATE INDEX idx_gallery_purchases_status ON gallery_purchases(status);
CREATE INDEX idx_gallery_purchases_session_id ON gallery_purchases(buyer_session_id);
```

**Table : `photographer_payouts`**

```sql
CREATE TABLE photographer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photographer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Montant
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  
  -- Stripe Connect
  stripe_transfer_id VARCHAR(255),
  stripe_payout_id VARCHAR(255),
  
  -- Statut
  status VARCHAR(50) NOT NULL, -- 'pending' | 'processing' | 'paid' | 'failed'
  
  -- Période couverte
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  
  -- Timestamps
  requested_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  
  -- Indexes
  CREATE INDEX idx_photographer_payouts_photographer_id ON photographer_payouts(photographer_id);
  CREATE INDEX idx_photographer_payouts_status ON photographer_payouts(status);
);
```


#### 4.2 API Routes

**POST `/api/galleries/[id]/monetization`**
- Activer/configurer le paywall pour une galerie
- Body : `{ isEnabled, price, currency, allowPreview, unlockDuration }`
- Crée un prix Stripe si nécessaire
- Retourne la configuration

**GET `/api/galleries/[id]/monetization`**
- Récupère la configuration du paywall
- Retourne : `{ isEnabled, price, currency, stats }`

**POST `/api/stripe/checkout/gallery-purchase`**
- Crée une session Stripe Checkout pour acheter une galerie
- Body : `{ galleryId, buyerEmail, successUrl, cancelUrl }`
- Retourne : `{ checkoutUrl }`

**GET `/api/galleries/[id]/purchase-status`**
- Vérifie si l'utilisateur actuel a acheté la galerie
- Query : `?sessionId=xxx` ou `?email=xxx`
- Retourne : `{ hasPurchased, purchaseDate, expiresAt }`

**GET `/api/photographer/sales`**
- Liste des ventes du photographe
- Query : `?period=month&page=1&limit=20`
- Retourne : `{ sales, totalRevenue, totalSales, stats }`

**POST `/api/photographer/payout`**
- Demande un retrait de revenus
- Body : `{ amount, method }`
- Retourne : `{ payoutId, status, estimatedDate }`

#### 4.3 Webhooks Stripe

**Événements à gérer :**

**`checkout.session.completed` (gallery_purchase)**
```typescript
async function handleGalleryPurchase(session: Stripe.Checkout.Session) {
  const { gallery_id, buyer_email } = session.metadata;
  
  // 1. Enregistrer l'achat
  await supabase.from('gallery_purchases').insert({
    gallery_id,
    buyer_email,
    buyer_session_id: session.client_reference_id,
    stripe_payment_intent_id: session.payment_intent,
    amount_cents: session.amount_total,
    currency: session.currency,
    platform_fee_cents: Math.floor(session.amount_total * 0.10),
    photographer_earnings_cents: Math.floor(session.amount_total * 0.90),
    status: 'succeeded',
    access_granted_at: new Date().toISOString(),
  });
  
  // 2. Mettre à jour les stats de la galerie
  await supabase.rpc('increment_gallery_sales', { 
    gallery_id,
    amount: session.amount_total 
  });
  
  // 3. Envoyer email de confirmation au client
  await sendPurchaseConfirmationEmail(buyer_email, gallery_id);
  
  // 4. Notifier le photographe
  await notifyPhotographerOfSale(gallery_id);
}
```

**`charge.refunded` (gallery_purchase)**
```typescript
async function handleGalleryRefund(charge: Stripe.Charge) {
  // 1. Marquer l'achat comme remboursé
  await supabase
    .from('gallery_purchases')
    .update({ 
      status: 'refunded',
      refunded_at: new Date().toISOString()
    })
    .eq('stripe_charge_id', charge.id);
  
  // 2. Révoquer l'accès
  // (L'accès sera vérifié à chaque chargement de galerie)
  
  // 3. Notifier le photographe
  await notifyPhotographerOfRefund(charge.metadata.gallery_id);
}
```

#### 4.4 Composants React

**GalleryPaywall.tsx**
```typescript
interface GalleryPaywallProps {
  gallery: {
    id: string;
    title: string;
    imageCount: number;
    previewImages: string[]; // 3-5 images pour aperçu
  };
  monetization: {
    price: number;
    currency: string;
    allowPreview: boolean;
    unlockDuration?: number;
  };
  onPurchase: () => void;
}

export function GalleryPaywall({ gallery, monetization, onPurchase }: GalleryPaywallProps) {
  // Affiche l'écran de paywall avec prix et CTA
  // Gère le clic sur "Acheter l'accès"
  // Redirige vers Stripe Checkout
}
```

**GalleryPreviewMode.tsx**
```typescript
interface GalleryPreviewModeProps {
  images: Image[];
  monetization: {
    price: number;
    currency: string;
  };
  onUnlock: () => void;
}

export function GalleryPreviewMode({ images, monetization, onUnlock }: GalleryPreviewModeProps) {
  // Affiche les images en basse résolution
  // Watermark sur chaque image
  // Bannière sticky "Débloquer HD"
  // Désactive les téléchargements
}
```

**PhotographerSalesDashboard.tsx**
```typescript
export function PhotographerSalesDashboard() {
  // Affiche les métriques de ventes
  // Graphiques de revenus
  // Liste des ventes récentes
  // Bouton "Demander un retrait"
}
```

### 5. User Flows

#### 5.1 Configuration du paywall (Photographe)

```
1. Dashboard → Galeries → [Sélectionner une galerie]
2. Onglet "Monétisation"
3. Toggle "Activer la vente" → ON
4. Définir le prix : $29.99
5. Choisir la devise : USD
6. Options :
   - ☑ Autoriser aperçu gratuit
   - ☑ Watermark sur aperçus
   - Durée d'accès : Illimité
7. Aperçu du calcul :
   - Prix de vente : $29.99
   - Commission PikSend (10%) : $3.00
   - Vous recevrez : $26.99
8. Enregistrer
9. Copier le lien de la galerie
10. Partager avec le client
```

#### 5.2 Achat par le client (Mode Paywall complet)

```
1. Client reçoit le lien de la galerie
2. Accès à la galerie → Écran de paywall
3. Aperçu de 3-5 photos floutées
4. Affichage du prix : $29.99
5. Clic sur "Acheter l'accès"
6. Redirection vers Stripe Checkout
7. Saisie des informations :
   - Email
   - Carte bancaire
8. Validation du paiement
9. Redirection vers la galerie
10. Message de succès : "Accès débloqué !"
11. Accès complet aux photos HD
12. Téléchargements disponibles
```

#### 5.3 Achat par le client (Mode Aperçu)

```
1. Client reçoit le lien de la galerie
2. Accès à la galerie en mode aperçu
3. Navigation dans toutes les photos (basse résolution)
4. Watermark visible sur chaque photo
5. Bannière sticky : "Débloquez les photos HD pour $29.99"
6. Clic sur "Débloquer HD"
7. Redirection vers Stripe Checkout
8. Paiement
9. Retour à la galerie
10. Photos HD sans watermark
11. Téléchargements activés
```


### 6. Sécurité & Conformité

#### 6.1 Vérification d'accès

**Middleware de vérification :**
```typescript
async function verifyGalleryAccess(galleryId: string, sessionId: string, email?: string) {
  // 1. Vérifier si la galerie a un paywall
  const monetization = await getGalleryMonetization(galleryId);
  if (!monetization?.is_enabled) {
    return { hasAccess: true, reason: 'no_paywall' };
  }
  
  // 2. Vérifier si l'utilisateur est le propriétaire
  const isOwner = await isGalleryOwner(galleryId, sessionId);
  if (isOwner) {
    return { hasAccess: true, reason: 'owner' };
  }
  
  // 3. Vérifier si l'utilisateur a acheté
  const purchase = await supabase
    .from('gallery_purchases')
    .select('*')
    .eq('gallery_id', galleryId)
    .or(`buyer_session_id.eq.${sessionId},buyer_email.eq.${email}`)
    .eq('status', 'succeeded')
    .single();
  
  if (!purchase) {
    return { hasAccess: false, reason: 'not_purchased' };
  }
  
  // 4. Vérifier si l'accès n'a pas expiré
  if (purchase.access_expires_at) {
    const now = new Date();
    const expiresAt = new Date(purchase.access_expires_at);
    if (now > expiresAt) {
      return { hasAccess: false, reason: 'expired' };
    }
  }
  
  return { hasAccess: true, reason: 'purchased', purchase };
}
```

**Application :**
- Vérification à chaque chargement de galerie
- Vérification avant chaque téléchargement
- Vérification avant accès aux photos HD

#### 6.2 Protection des images

**Images basse résolution (aperçu) :**
- Transformation Cloudinary : `w_800,q_70`
- Watermark appliqué si configuré
- Pas de téléchargement possible

**Images haute résolution (après achat) :**
- URL signées avec expiration (24h)
- Vérification d'accès avant génération de l'URL
- Rate limiting sur les téléchargements

#### 6.3 Conformité PCI-DSS

**Stripe gère :**
- Collecte des informations de carte
- Stockage sécurisé des données de paiement
- Conformité PCI-DSS niveau 1

**PikSend ne stocke JAMAIS :**
- Numéros de carte bancaire
- CVV
- Informations de paiement sensibles

**PikSend stocke uniquement :**
- IDs Stripe (customer, payment_intent, charge)
- Montants et devises
- Statuts de paiement

#### 6.4 RGPD & Confidentialité

**Données collectées :**
- Email de l'acheteur (nécessaire pour l'accès)
- Nom (optionnel)
- Historique d'achats

**Droits de l'utilisateur :**
- Accès à ses données (liste des achats)
- Rectification (mise à jour email)
- Suppression (droit à l'oubli)
- Portabilité (export des données)

**Conservation des données :**
- Achats : 7 ans (obligation légale comptable)
- Données personnelles : Suppression possible après 3 ans d'inactivité

### 7. Gestion des Cas Particuliers

#### 7.1 Remboursements

**Politique de remboursement :**
- Photographe peut rembourser dans les 30 jours
- Remboursement partiel ou total
- Accès révoqué automatiquement

**Process :**
1. Photographe demande un remboursement depuis le dashboard
2. Confirmation requise
3. Remboursement traité via Stripe
4. Webhook met à jour le statut
5. Accès révoqué
6. Client notifié par email

#### 7.2 Litiges (Disputes)

**En cas de litige Stripe :**
1. Webhook `charge.dispute.created` reçu
2. Notification au photographe
3. Photographe peut fournir des preuves (emails, contrat)
4. PikSend assiste dans la résolution
5. Si litige perdu : Remboursement + frais de litige ($15)

#### 7.3 Galeries expirées

**Comportement :**
- Si galerie expirée MAIS achetée : Accès maintenu
- Achat prolonge automatiquement l'accès (ou illimité)
- Photographe peut réactiver une galerie expirée

#### 7.4 Migration de compte

**Guest → User :**
- Achats liés au session_id
- Lors de la création de compte, migration automatique
- Achats associés à l'email du nouveau compte

### 8. Notifications & Emails

#### 8.1 Emails au client

**Confirmation d'achat :**
```
Sujet : Votre accès à la galerie "{Titre}" est confirmé

Bonjour,

Merci pour votre achat ! Vous avez maintenant accès à la galerie "{Titre}".

📸 {Nombre} photos en haute définition
💾 Téléchargement illimité
🚫 Sans watermark
{Durée d'accès}

[Accéder à la galerie]

Facture : {Lien PDF}

Besoin d'aide ? Contactez {Photographe} à {Email}

---
PikSend - Partage de photos professionnel
```

**Rappel d'expiration (si durée limitée) :**
```
Sujet : Votre accès à "{Titre}" expire dans 7 jours

Bonjour,

Votre accès à la galerie "{Titre}" expire le {Date}.

Pensez à télécharger vos photos avant cette date.

[Accéder à la galerie]
```

#### 8.2 Emails au photographe

**Nouvelle vente :**
```
Sujet : 🎉 Nouvelle vente : {Titre} - ${Montant}

Félicitations !

Vous avez réalisé une nouvelle vente :

Galerie : {Titre}
Client : {Email}
Montant : ${Prix}
Vos revenus : ${Net} (après commission 10%)

[Voir les détails]

---
Total des ventes ce mois : ${Total}
```

**Demande de remboursement :**
```
Sujet : Demande de remboursement pour "{Titre}"

Le client {Email} a demandé un remboursement pour la galerie "{Titre}".

Montant : ${Prix}
Raison : {Raison}

[Traiter la demande]
```

### 9. Analytics & Reporting

#### 9.1 Métriques photographe

**Dashboard des ventes :**
- Revenus totaux (all-time)
- Revenus ce mois
- Revenus ce trimestre
- Nombre de ventes
- Revenu moyen par vente
- Taux de conversion (vues → achats)
- Top galeries les plus vendues

**Graphiques :**
- Évolution des revenus (ligne)
- Ventes par galerie (barres)
- Répartition par devise (camembert)

#### 9.2 Métriques admin (PikSend)

**Dashboard admin :**
- Volume total de transactions
- Commission totale générée
- Nombre de photographes actifs (avec ventes)
- Revenu moyen par photographe
- Taux de remboursement
- Taux de litiges

### 10. Priorités d'Implémentation

#### Phase 1 : MVP (Minimum Viable Product)
**Durée estimée : 4-5 jours**

✅ **Essentiel :**
1. Table `gallery_monetization` et `gallery_purchases`
2. Configuration du paywall dans les paramètres de galerie
3. Écran de paywall (mode complet, sans aperçu)
4. Route Stripe Checkout pour achat de galerie
5. Webhook `checkout.session.completed` pour débloquer
6. Vérification d'accès avant affichage de la galerie
7. Dashboard basique des ventes (liste + total)


#### Phase 2 : Mode Aperçu (Freemium)
**Durée estimée : 2-3 jours**

✅ **Important :**
1. Option "Autoriser aperçu" dans la configuration
2. Transformation Cloudinary pour basse résolution
3. Affichage de la galerie en mode aperçu
4. Bannière sticky "Débloquer HD"
5. Watermark sur les aperçus
6. Désactivation des téléchargements en mode aperçu

#### Phase 3 : Revenus & Paiements
**Durée estimée : 3-4 jours**

✅ **Important :**
1. Table `photographer_payouts`
2. Intégration Stripe Connect
3. Dashboard des revenus (graphiques, stats)
4. Demande de retrait
5. Calcul automatique des commissions
6. Historique des paiements

#### Phase 4 : Notifications & Emails
**Durée estimée : 2 jours**

✅ **Souhaitable :**
1. Email de confirmation d'achat au client
2. Email de nouvelle vente au photographe
3. Email de rappel d'expiration (si durée limitée)
4. Templates d'emails personnalisables

#### Phase 5 : Gestion Avancée
**Durée estimée : 2-3 jours**

✅ **Nice to have :**
1. Remboursements depuis le dashboard
2. Gestion des litiges
3. Factures PDF automatiques
4. Export des ventes (CSV)
5. Analytics avancées

#### Phase 6 : Optimisations
**Durée estimée : 1-2 jours**

✅ **Optionnel :**
1. Codes promo / réductions
2. Ventes groupées (plusieurs galeries)
3. Abonnements récurrents (accès à toutes les galeries)
4. Durée d'accès personnalisable par galerie

## Estimation Totale

**Temps de développement** : 14-19 jours  
**Répartition** :
- Phase 1 (MVP) : 4-5 jours
- Phase 2 (Aperçu) : 2-3 jours
- Phase 3 (Revenus) : 3-4 jours
- Phase 4 (Emails) : 2 jours
- Phase 5 (Avancé) : 2-3 jours
- Phase 6 (Optimisations) : 1-2 jours

## Dépendances

### Fonctionnalités requises (déjà implémentées)
- ✅ Système de galeries
- ✅ Stripe Checkout (base)
- ✅ Plan Pro
- ✅ Watermark overlay
- ⚠️ Webhooks Stripe (à compléter)

### Fonctionnalités requises (à implémenter)
- ❌ Stripe Connect (pour paiements directs au photographe)
- ❌ Transformation d'images (basse résolution)
- ❌ Système d'emails transactionnels
- ❌ Génération de factures PDF

### Bibliothèques tierces
- `@stripe/stripe-js` : Client Stripe (déjà installé)
- `stripe` : SDK Stripe Node.js (déjà installé)
- `pdfkit` ou `react-pdf` : Génération de factures PDF
- `nodemailer` ou service email (SendGrid, Mailgun) : Envoi d'emails

## Considérations

### Légales

**Contrat photographe-client :**
- Conditions générales de vente (CGV)
- Droits d'utilisation des photos
- Politique de remboursement
- Durée de conservation des photos

**Obligations fiscales :**
- Déclaration des revenus
- TVA (si applicable)
- Factures conformes

### UX/UI

**Transparence des prix :**
- Prix affiché clairement
- Commission PikSend visible
- Pas de frais cachés

**Confiance :**
- Badge "Paiement sécurisé par Stripe"
- Témoignages clients (optionnel)
- Politique de remboursement claire

**Mobile-first :**
- Écran de paywall responsive
- Checkout Stripe optimisé mobile
- Dashboard des ventes adaptatif

### Performance

**Optimisations :**
- Cache des configurations de paywall
- Lazy loading des images en aperçu
- Prefetch des données de vente

**Scalabilité :**
- Index sur les tables de ventes
- Pagination des listes de ventes
- Rate limiting sur les webhooks

## Métriques de Succès

### KPIs à suivre

1. **Adoption** : % de photographes Pro qui activent le paywall
2. **Conversion** : % de visiteurs qui achètent
3. **Revenu moyen** : Prix moyen par vente
4. **Volume** : Nombre de ventes par mois
5. **Satisfaction** : Taux de remboursement (< 5%)

### Objectifs

- 30% des photographes Pro activent le paywall dans les 3 mois
- Taux de conversion > 15% (visiteurs → acheteurs)
- Revenu moyen par vente : $25-50
- Volume : 100+ ventes/mois après 6 mois
- Taux de remboursement < 5%

## Wireframes

### Écran de Paywall (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Mode ☀️/🌙]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    [Logo Photographe]                       │
│                                                             │
│              Mariage Sophie & Marc - 15 Juin 2025          │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Blur]  │  │ [Blur]  │  │ [Blur]  │  │ [Blur]  │      │
│  │ Photo 1 │  │ Photo 2 │  │ Photo 3 │  │ Photo 4 │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│              ┌─────────────────────────────┐               │
│              │  🔒 Galerie Protégée        │               │
│              │                             │               │
│              │  Accédez à 150 photos HD    │               │
│              │  de votre événement         │               │
│              │                             │               │
│              │      ┌─────────────┐        │               │
│              │      │   $29.99    │        │               │
│              │      └─────────────┘        │               │
│              │                             │               │
│              │  [🛒 Acheter l'accès]       │               │
│              │                             │               │
│              │  ✓ 150 photos HD            │               │
│              │  ✓ Téléchargement illimité  │               │
│              │  ✓ Sans watermark           │               │
│              │  ✓ Accès à vie              │               │
│              │                             │               │
│              │  🔒 Paiement sécurisé       │               │
│              └─────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mode Aperçu (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Mode ☀️/🌙]     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🔓 Débloquez les photos HD pour $29.99  [Acheter] │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Mariage Sophie & Marc - 150 photos                        │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │      │
│  │ 800px   │  │ 800px   │  │ 800px   │  │ 800px   │      │
│  │ [WM]    │  │ [WM]    │  │ [WM]    │  │ [WM]    │      │
│  │ [🔒]    │  │ [🔒]    │  │ [🔒]    │  │ [🔒]    │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │      │
│  │ [WM]    │  │ [WM]    │  │ [WM]    │  │ [WM]    │      │
│  │ [🔒]    │  │ [🔒]    │  │ [🔒]    │  │ [🔒]    │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

[WM] = Watermark "PikSend" ou logo photographe
[🔒] = Badge "HD après achat"
```

### Dashboard des Ventes (Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard → Revenus                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Revenus      │  │ Ventes       │  │ Revenu moyen │     │
│  │ $1,234.56    │  │ 42           │  │ $29.39       │     │
│  │ +12% ce mois │  │ +5 ce mois   │  │ -2% ce mois  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Évolution des revenus                               │   │
│  │                                                     │   │
│  │  $                                                  │   │
│  │  │     ╱╲                                          │   │
│  │  │    ╱  ╲    ╱╲                                   │   │
│  │  │   ╱    ╲  ╱  ╲                                  │   │
│  │  │  ╱      ╲╱    ╲                                 │   │
│  │  └──────────────────────────────────────────────   │   │
│  │    Jan  Fév  Mar  Avr  Mai  Jun  Jul  Aoû  Sep    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Ventes récentes                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Date  │ Galerie        │ Client      │ Prix │ Net  │   │
│  ├───────┼────────────────┼─────────────┼──────┼──────┤   │
│  │ 15/01 │ Mariage Sophie │ sophie@...  │ $30  │ $27  │   │
│  │ 14/01 │ Baptême Emma   │ emma@...    │ $20  │ $18  │   │
│  │ 13/01 │ Portrait Julie │ julie@...   │ $15  │ $13  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Demander un retrait]  [Exporter CSV]                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Ressources

### Documentation
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Connect](https://stripe.com/docs/connect)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Cloudinary Transformations](https://cloudinary.com/documentation/image_transformations)

### Références
- Requirement 4.4 : Paywall (Vente de Galerie)
- Plan Pro : Fonctionnalités avancées
- [Stripe Implementation Gaps](./stripe-implementation-gaps.md)

---

**Document créé le** : Janvier 2026  
**Version** : 1.0.0  
**Statut** : Spécification complète - Prêt pour implémentation  
**Auteur** : Équipe PikSend
