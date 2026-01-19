# Système d'Expiration des Galeries

## Vue d'ensemble

Oui, le système prévoit la suppression automatique des galeries expirées via un cron job.

## Comment ça fonctionne

### 1. Expiration des galeries

Chaque galerie a un champ `expires_at` qui définit sa date d'expiration. Cette date est calculée lors de la création :

```typescript
expires_at = created_at + max_expiration_days
```

Les limites d'expiration par plan :
- **Free** : 7 jours maximum
- **Premium** : 90 jours maximum
- **Pro** : 365 jours maximum

### 2. Détection des galeries expirées

Le système considère une galerie comme expirée si :
- `expires_at < maintenant` OU
- `is_active = false` (galerie désactivée manuellement)

### 3. Nettoyage automatique

**Edge Function:** `cleanup-expired-galleries`

**Fréquence recommandée:** Quotidienne (2h du matin)

**Actions effectuées:**
1. Trouve toutes les galeries expirées
2. Pour chaque galerie :
   - Supprime toutes les images de Cloudinary
   - Supprime toutes les images de la base de données
   - Supprime la galerie de la base de données
   - Met à jour le `storage_used_mb` de l'utilisateur

**Résultat:**
```json
{
  "success": true,
  "deletedGalleries": 5,
  "deletedImages": 123,
  "freedStorageMb": 456.78,
  "affectedUsers": 3
}
```

### 4. Notifications avant expiration

**Edge Function:** `notify-expiring-galleries`

**Fréquence recommandée:** Quotidienne (9h du matin)

**Actions:**
- Trouve les galeries qui expirent dans 24-48h
- Envoie un email de rappel au propriétaire
- Permet à l'utilisateur de prolonger ou télécharger le contenu

## Configuration requise

Le cron job doit être configuré dans Supabase ou via un service externe. Voir [docs/cron-jobs-setup.md](./cron-jobs-setup.md) pour les instructions détaillées.

### Configuration Supabase (Recommandé)

```sql
-- Nettoyage quotidien à 2h du matin
SELECT cron.schedule(
  'cleanup-expired-galleries',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-expired-galleries',
    headers := '{"Content-Type": "application/json"}'::jsonb
  );
  $$
);
```

## Cycle de vie d'une galerie

```
Création
   ↓
Active (avant expires_at)
   ↓
Notification (24-48h avant expiration)
   ↓
Expirée (après expires_at)
   ↓
Suppression automatique (cron job quotidien)
   ↓
Espace libéré
```

## Avantages

1. **Gestion automatique** : Pas besoin d'intervention manuelle
2. **Libération d'espace** : Le stockage est automatiquement libéré
3. **Conformité RGPD** : Les données sont supprimées après expiration
4. **Optimisation des coûts** : Réduit les coûts de stockage Cloudinary
5. **Notifications** : Les utilisateurs sont prévenus avant suppression

## Cas particuliers

### Galeries avec paiement (Pro)

Les galeries avec paywall qui ont été achetées peuvent avoir une logique d'expiration différente :
- L'achat peut prolonger l'expiration de 30 jours
- Les galeries monétisées peuvent avoir une durée de vie plus longue

### Galeries désactivées manuellement

Si un utilisateur désactive une galerie (`is_active = false`), elle sera supprimée lors du prochain nettoyage, même si `expires_at` n'est pas encore atteint.

## Monitoring

Pour vérifier les galeries qui seront supprimées :

```sql
-- Galeries expirées
SELECT id, title, user_id, expires_at, created_at
FROM galleries
WHERE expires_at < NOW() OR is_active = false
ORDER BY expires_at DESC;

-- Galeries qui expirent bientôt (24-48h)
SELECT id, title, user_id, expires_at
FROM galleries
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '48 hours'
  AND is_active = true
ORDER BY expires_at ASC;
```

## Test manuel

Pour tester le nettoyage manuellement :

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/cleanup-expired-galleries \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Sécurité

- La fonction utilise le `SUPABASE_SERVICE_ROLE_KEY` pour avoir les permissions nécessaires
- Seules les galeries réellement expirées sont supprimées
- Les logs détaillés permettent de tracer toutes les suppressions
- Aucune donnée n'est supprimée sans vérification de la date d'expiration
