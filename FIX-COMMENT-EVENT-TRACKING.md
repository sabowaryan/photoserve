# Correction du tracking des événements de commentaires

## Problème identifié

Lors de l'ajout d'un commentaire, l'erreur suivante se produisait :

```
Failed to track event: {
  code: '23514',
  message: 'new row for relation "gallery_events" violates check constraint "check_event_type"'
}
```

Le commentaire était bien créé (201), mais l'événement de tracking échouait.

### Cause racine

Le type d'événement `comment_add` n'était pas inclus dans la contrainte CHECK de la table `gallery_events` dans la base de données.

**Contrainte existante** :
```sql
CHECK (event_type IN (
  'lightbox_open',
  'download_single',
  'download_all',
  'download_selection',
  'download_favorites',
  'favorite_add',
  'favorite_remove',
  -- 'comment_add' MANQUANT
  'cta_click',
  'slideshow_start',
  'slideshow_end',
  'session_start',
  'session_end',
  'view',
  'paywall_view',
  'checkout_start',
  'purchase_complete'
))
```

## Solution appliquée

### 1. Migration SQL (`supabase/migrations/20260119_add_comment_event_type.sql`)

Création d'une nouvelle migration pour ajouter le type d'événement `comment_add` :

```sql
-- Drop existing constraint
ALTER TABLE public.gallery_events DROP CONSTRAINT IF EXISTS check_event_type;

-- Add updated constraint with comment event type
ALTER TABLE public.gallery_events ADD CONSTRAINT check_event_type CHECK (
  event_type IN (
    -- Original event types
    'lightbox_open',
    'download_single',
    'download_all',
    'download_selection',
    'download_favorites',
    'favorite_add',
    'favorite_remove',
    'comment_add',  -- NEW: Comment tracking
    'cta_click',
    'slideshow_start',
    'slideshow_end',
    'session_start',
    'session_end',
    -- Monetization event types
    'view',
    'paywall_view',
    'checkout_start',
    'purchase_complete'
  )
);
```

### 2. Type TypeScript (`src/lib/services/events.service.ts`)

Mise à jour du type `EventType` pour inclure `comment_add` :

```typescript
export type EventType =
  | 'lightbox_open'
  | 'download_single'
  | 'download_all'
  | 'download_selection'
  | 'download_favorites'
  | 'favorite_add'
  | 'favorite_remove'
  | 'comment_add'  // NEW
  | 'cta_click'
  | 'slideshow_start'
  | 'slideshow_end'
  | 'session_start'
  | 'session_end';
```

## Flux complet du tracking de commentaire

1. **Utilisateur ajoute un commentaire** :
   - Saisit le texte dans le Lightbox
   - Clique sur "Envoyer"

2. **Création du commentaire** :
   - `handleComment()` → `POST /api/images/[id]/comments`
   - Service `CommentsService.addComment()`
   - Commentaire stocké dans table `comments`
   - ✅ Retourne 201 Created

3. **Tracking de l'événement** :
   - `eventTracker.trackComment(imageId)`
   - `POST /api/galleries/[id]/events`
   - Service `EventsService.trackEvent()`
   - Événement stocké dans table `gallery_events`
   - ✅ Retourne 204 No Content (après migration)

4. **Analytics** :
   - Dashboard photographe
   - Compteur de commentaires
   - Graphiques d'engagement

## Types d'événements disponibles

Après cette correction, tous les types d'événements suivants sont trackés :

### Interactions avec les images
- `lightbox_open` - Ouverture d'une photo en plein écran
- `download_single` - Téléchargement d'une photo
- `download_all` - Téléchargement de toutes les photos
- `download_selection` - Téléchargement d'une sélection
- `download_favorites` - Téléchargement des favoris

### Engagement utilisateur
- `favorite_add` - Ajout aux favoris
- `favorite_remove` - Retrait des favoris
- `comment_add` - Ajout d'un commentaire ✨ NOUVEAU
- `cta_click` - Clic sur un bouton CTA

### Diaporama
- `slideshow_start` - Démarrage du diaporama
- `slideshow_end` - Fin du diaporama

### Session
- `session_start` - Début de visite
- `session_end` - Fin de visite

### Monétisation (funnel)
- `view` - Vue de la galerie
- `paywall_view` - Vue du paywall
- `checkout_start` - Début du paiement
- `purchase_complete` - Achat complété

## Application de la migration

### En développement local

```bash
# Appliquer la migration
npx supabase db reset

# Ou appliquer uniquement la nouvelle migration
npx supabase migration up
```

### En production

1. Connectez-vous à votre dashboard Supabase
2. Allez dans SQL Editor
3. Exécutez le contenu de `20260119_add_comment_event_type.sql`
4. Vérifiez que la contrainte est mise à jour :

```sql
-- Vérification
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'check_event_type';
```

## Fichiers modifiés

- ✅ `supabase/migrations/20260119_add_comment_event_type.sql` - Migration SQL
- ✅ `src/lib/services/events.service.ts` - Type TypeScript

## Tests à effectuer

### 1. Test de création de commentaire avec tracking

1. Ouvrir une galerie avec commentaires activés
2. Ouvrir le Lightbox sur une photo
3. Ajouter un commentaire
4. ✅ Commentaire créé (201)
5. ✅ Événement tracké (204)
6. ✅ Pas d'erreur dans la console

### 2. Vérification en base de données

```sql
-- Vérifier que l'événement est bien enregistré
SELECT * FROM gallery_events 
WHERE event_type = 'comment_add' 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Vérification dans les analytics

1. Dashboard photographe
2. Onglet Analytics de la galerie
3. ✅ Le compteur de commentaires devrait s'incrémenter
4. ✅ Les événements `comment_add` devraient apparaître dans les logs

## Bénéfices

- ✅ Tracking complet des interactions utilisateur
- ✅ Métriques d'engagement précises
- ✅ Analytics détaillées pour les photographes
- ✅ Cohérence entre SQL et TypeScript
- ✅ Pas d'erreurs silencieuses dans les logs
