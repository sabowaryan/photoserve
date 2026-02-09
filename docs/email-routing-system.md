# Système de Routage des Emails

## Vue d'ensemble

Le système route les emails en fonction de leur **type** (transactional/marketing) et utilise un **sender par défaut** configuré dans la base de données. Voici comment ça fonctionne:

---

## 1. Types d'Emails

### Transactional (Transactionnel)
- **Priorité:** Haute par défaut
- **Vérifications:** Suppression list uniquement (bounces/complaints)
- **Exemples:** 
  - Vérification d'email
  - Réinitialisation de mot de passe
  - Notification de changement de mot de passe
  - Confirmations de commande
  - Notifications système

### Marketing
- **Priorité:** Normale par défaut
- **Vérifications:** Suppression list + Unsubscribe list
- **Exemples:**
  - Newsletters
  - Promotions
  - Annonces de produits
  - Campagnes marketing

---

## 2. Sélection du Sender

### Logique de Sélection

```typescript
// Dans EmailService.sendTransactionalEmail() et sendMarketingEmail()
const from = params.from || await this.getDefaultSender();
```

**Ordre de priorité:**
1. **Sender spécifié** dans `params.from` (optionnel)
2. **Sender par défaut** de la base de données (`is_default = true`)

### Sender par Défaut

Le sender par défaut est récupéré depuis la table `sender_addresses`:

```sql
SELECT email 
FROM sender_addresses 
WHERE is_default = true 
  AND is_verified = true
LIMIT 1;
```

**Critères:**
- ✅ Doit être vérifié (`is_verified = true`)
- ✅ Doit être marqué comme défaut (`is_default = true`)
- ⚠️ Un seul sender peut être défaut à la fois (géré par trigger DB)

---

## 3. Flux d'Envoi d'Email

### Étape 1: Validation
```typescript
// EmailService.validateEmailParams()
- Vérifier format email (to, from, cc, bcc)
- Vérifier sujet non vide
- Vérifier contenu HTML non vide
- Vérifier type valide (transactional/marketing)
```

### Étape 2: Vérifications de Sécurité

**Pour TOUS les emails:**
```typescript
// Vérifier suppression list (bounces/complaints)
const suppressionCheck = await this.checkSuppressed(params.to);
if (suppressionCheck.isSuppressed) {
  return { success: false, error: "Email suppressed" };
}
```

**Pour emails MARKETING uniquement:**
```typescript
// Vérifier unsubscribe list
const unsubscribeCheck = await this.checkUnsubscribed(params.to);
if (unsubscribeCheck.isUnsubscribed) {
  return { success: false, error: "Email unsubscribed" };
}
```

### Étape 3: Sélection du Sender
```typescript
// Utiliser sender spécifié ou récupérer le défaut
const from = params.from || await this.getDefaultSender();
```

### Étape 4: Mise en Queue
```typescript
// Ajouter à la queue avec priorité
const queueId = await this.queueManager.enqueue({
  from,
  to: params.to,
  subject: params.subject,
  html: params.html,
  priority: params.priority || (type === 'transactional' ? 'high' : 'normal'),
  type: params.type,
});
```

### Étape 5: Logging
```typescript
// Logger l'email pour tracking
await this.logEmail({
  queueId,
  from,
  to: params.to,
  subject: params.subject,
  status: 'queued',
});
```

---

## 4. Gestion de la Queue

### Priorités de Traitement

La queue traite les emails dans cet ordre:

1. **Priorité** (high > normal > low)
2. **Date de création** (plus ancien en premier)
3. **Scheduled time** (respecté si défini)

```typescript
// QueueManager.processBatch()
.order('priority', { ascending: false })  // high > normal > low
.order('created_at', { ascending: true }) // oldest first
```

### Retry Logic

**Délais de retry (exponential backoff):**
- Retry 1: 1 minute
- Retry 2: 5 minutes
- Retry 3: 15 minutes
- Retry 4: 45 minutes
- Retry 5: 2 heures

**Maximum:** 5 tentatives par défaut

---

## 5. Services Spécialisés

### EmailVerificationService

Service dédié aux emails d'authentification avec:
- **Retry automatique** avec exponential backoff
- **Fallback provider** (AWS SES si Resend échoue)
- **Tracking du temps de livraison** (max 30 secondes)

**Méthodes:**
```typescript
sendVerificationEmail()      // Email de vérification
sendPasswordResetEmail()     // Réinitialisation mot de passe
sendPasswordChangedEmail()   // Notification changement
```

**Caractéristiques:**
- 3 tentatives max avec le provider principal
- Bascule vers fallback si échec
- Tracking dans `email_delivery_metrics`

---

## 6. Configuration des Senders

### Ajouter un Sender

1. **Créer le sender** dans le dashboard admin
2. **Vérifier le domaine** via DNS (DKIM, SPF, DMARC)
3. **Marquer comme défaut** (optionnel)

### Définir le Sender par Défaut

```typescript
// Via API
POST /api/admin/emails/senders/{id}/set-default

// Via Repository
await senderRepository.setDefault(senderId);
```

**Validation:**
- ✅ Le sender doit exister
- ✅ Le sender doit être vérifié
- ⚠️ L'ancien défaut est automatiquement désactivé (trigger DB)

---

## 7. Tables de Base de Données

### sender_addresses
```sql
- id (uuid)
- email (text) - Adresse email du sender
- name (text) - Nom d'affichage
- is_verified (boolean) - Vérifié via DNS
- is_default (boolean) - Sender par défaut
- domain_records (jsonb) - Records DNS (DKIM, SPF, DMARC)
- verified_at (timestamp)
- created_at (timestamp)
```

### email_queue
```sql
- id (uuid)
- from_address (text) - Sender utilisé
- to_address (text) - Destinataire
- subject (text)
- html_content (text)
- priority (enum: high, normal, low)
- type (enum: transactional, marketing)
- status (enum: pending, processing, sent, failed, cancelled)
- scheduled_at (timestamp) - Pour emails programmés
- retry_count (integer)
- max_retries (integer)
```

### email_suppressions
```sql
- email (text) - Email supprimé
- reason (enum: bounce, complaint)
- bounce_type (enum: hard, soft)
- created_at (timestamp)
```

### email_unsubscribes
```sql
- email (text) - Email désabonné
- reason (text) - Raison du désabonnement
- unsubscribed_at (timestamp)
```

---

## 8. Exemples d'Utilisation

### Envoyer un Email Transactionnel

```typescript
const emailService = new EmailService(supabase);

const result = await emailService.sendTransactionalEmail({
  to: 'user@example.com',
  subject: 'Verify your email',
  html: '<p>Click here to verify...</p>',
  type: 'transactional',
  priority: 'high', // Optionnel, défaut = high
  from: 'noreply@piksend.com', // Optionnel, utilise le défaut si omis
});

if (result.success) {
  console.log('Email queued:', result.id);
}
```

### Envoyer un Email Marketing

```typescript
const result = await emailService.sendMarketingEmail({
  to: 'subscriber@example.com',
  subject: 'New features available!',
  html: '<p>Check out our new features...</p>',
  type: 'marketing',
  priority: 'normal', // Optionnel, défaut = normal
  // from omis = utilise le sender par défaut
});
```

### Programmer un Email

```typescript
const scheduledAt = new Date();
scheduledAt.setHours(scheduledAt.getHours() + 24); // Dans 24h

const result = await emailService.scheduleEmail({
  to: 'user@example.com',
  subject: 'Reminder',
  html: '<p>Don\'t forget...</p>',
  type: 'transactional',
  scheduledAt,
});
```

### Utiliser EmailVerificationService

```typescript
const verificationService = new EmailVerificationService(supabase);

const result = await verificationService.sendVerificationEmail({
  userId: 'user-123',
  email: 'user@example.com',
  name: 'John Doe',
  token: 'verification-token-123',
  baseUrl: 'https://piksend.com',
});

console.log('Queue time:', result.queueTime, 'ms');
console.log('Retry attempts:', result.retryAttempts);
console.log('Provider used:', result.provider); // 'primary' or 'fallback'
```

---

## 9. Monitoring et Santé

### Statistiques de Queue

```typescript
const stats = await queueManager.getStats();

console.log('Pending:', stats.pending);
console.log('Processing:', stats.processing);
console.log('Sent (24h):', stats.sent);
console.log('Failed (24h):', stats.failed);
console.log('By priority:', stats.byPriority);
```

### Santé de la Queue

```typescript
const health = await queueManager.getQueueHealth();

console.log('Status:', health.status); // healthy, degraded, unhealthy
console.log('Queue depth:', health.queueDepth);
console.log('Processing rate:', health.processingRate, 'emails/min');
console.log('Error rate:', health.errorRate, '%');
console.log('Issues:', health.issues);
console.log('Recommendations:', health.recommendations);
```

---

## 10. Résumé du Routage

```
┌─────────────────────────────────────────────────────────────┐
│                    Email Request                             │
│  { to, subject, html, type, priority?, from? }              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Validation & Security Checks                    │
│  • Format validation                                         │
│  • Suppression list check (ALL)                             │
│  • Unsubscribe list check (MARKETING only)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 Sender Selection                             │
│  from = params.from || getDefaultSender()                   │
│  • Use specified sender if provided                          │
│  • Otherwise use default verified sender                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Queue Email                                 │
│  • Priority: high (transactional) / normal (marketing)      │
│  • Status: pending                                           │
│  • Scheduled: now or future                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Queue Processor (Cron/Worker)                   │
│  • Process by priority (high > normal > low)                │
│  • Process oldest first                                      │
│  • Respect scheduled time                                    │
│  • Retry on failure (exponential backoff)                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Email Provider (Resend)                         │
│  • Send via Resend API                                       │
│  • Track delivery                                            │
│  • Log events                                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Points Clés

1. ✅ **Un seul sender par défaut** à la fois
2. ✅ **Le sender doit être vérifié** pour être utilisé
3. ✅ **Type d'email détermine les vérifications** (suppression vs unsubscribe)
4. ✅ **Priorité automatique** selon le type (high pour transactional)
5. ✅ **Retry automatique** avec exponential backoff
6. ✅ **Fallback provider** pour emails critiques (vérification, reset password)
7. ✅ **Tracking complet** dans les logs et métriques
