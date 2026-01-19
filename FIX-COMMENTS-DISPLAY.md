# Correction de l'affichage des commentaires

## Problème identifié

Le système de commentaires était activé par le photographe dans les paramètres de la galerie, mais aucun champ de commentaire ne s'affichait dans la galerie publique.

### Cause racine

Le composant `Lightbox` avait déjà le support complet des commentaires (UI, props, handlers), mais ces fonctionnalités n'étaient pas activées dans `gallery-view-client.tsx` :

1. ❌ Pas de vérification de la fonctionnalité `comments` dans le plan
2. ❌ Pas de vérification du setting `enableComments`
3. ❌ Pas de handler `handleComment` pour soumettre les commentaires
4. ❌ Props `showComments` et `onComment` non passées au Lightbox
5. ❌ Méthode `trackComment` manquante dans le hook `useEventTracker`

## Solution appliquée

### 1. Vérification de la fonctionnalité (`src/app/g/[slug]/gallery-view-client.tsx`)

**Ajout de la vérification du plan** :
```typescript
const canUseComments = hasFeatureAccess(ownerPlan, 'comments');
```

**Ajout de la vérification des settings** :
```typescript
const enableComments = canUseComments && settings.enableComments;
```

### 2. Handler de soumission de commentaire

**Nouveau handler `handleComment`** :
```typescript
const handleComment = async (imageId: string, comment: string) => {
  if (!enableComments) return;
  
  const sessionManager = new GuestSessionManager();
  const sessionId = sessionManager.getSessionToken();
  
  try {
    const response = await fetch(`/api/images/${imageId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, sessionId }),
    });
    
    if (response.ok) {
      toast.success("Commentaire ajouté avec succès !");
      eventTracker.trackComment(imageId);
    } else {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  } catch (error) {
    console.error("Comment error:", error);
    toast.error("Erreur lors de l'ajout du commentaire");
  }
};
```

### 3. Props du Lightbox

**AVANT** :
```typescript
<Lightbox
  onFavorite={canUseFavorites ? handleToggleFavorite : undefined}
  showFavorites={canUseFavorites}
  favorites={favorites}
  // Pas de props pour les commentaires
/>
```

**APRÈS** :
```typescript
<Lightbox
  onFavorite={canUseFavorites ? handleToggleFavorite : undefined}
  onComment={enableComments ? handleComment : undefined}
  showFavorites={canUseFavorites}
  showComments={enableComments}
  favorites={favorites}
/>
```

### 4. Event tracking (`src/hooks/use-event-tracker.ts`)

**Ajout de la méthode `trackComment`** :
```typescript
const trackComment = useCallback(
  async (imageId: string) => {
    await trackEvent('comment_add', { imageId });
  },
  [trackEvent]
);
```

## Architecture des commentaires

### Flux complet

1. **Photographe active les commentaires** :
   - Dashboard → Settings → `enableComments: true`
   - Stocké dans `galleries.settings.enableComments`

2. **Visiteur ouvre le Lightbox** :
   - Vérifie `canUseComments` (plan du photographe)
   - Vérifie `enableComments` (setting activé)
   - Si les deux sont vrais → affiche le panneau de commentaires

3. **Visiteur soumet un commentaire** :
   - Saisit le texte dans le champ
   - Clique sur "Envoyer"
   - `handleComment` → API `/api/images/[id]/comments`
   - Service `CommentsService.addComment()`
   - Stocké dans table `comments` avec `session_id`

4. **Photographe consulte les commentaires** :
   - Dashboard → Galerie → Onglet Analytics
   - API `/api/images/[id]/comments` (GET)
   - Liste tous les commentaires avec dates

### API existante

L'API était déjà complète et fonctionnelle :

- ✅ `POST /api/images/[id]/comments` - Ajouter un commentaire
- ✅ `GET /api/images/[id]/comments` - Lister les commentaires
- ✅ `DELETE /api/images/[id]/comments` - Supprimer un commentaire

### Service existant

Le service `CommentsService` était déjà implémenté :

- ✅ `addComment(imageId, content, sessionId)` - Validation et insertion
- ✅ `getComments(imageId)` - Récupération avec tri
- ✅ `deleteComment(commentId)` - Suppression

### UI existante

Le composant `Lightbox` avait déjà l'UI complète :

- ✅ Panneau latéral pour les commentaires
- ✅ Liste des commentaires existants
- ✅ Champ de saisie avec bouton d'envoi
- ✅ Compteur de commentaires
- ✅ Gestion du loading state

## Fonctionnalités des commentaires

### Pour les visiteurs

- ✅ Voir tous les commentaires sur une photo
- ✅ Ajouter un commentaire (max 1000 caractères)
- ✅ Commentaires liés à leur session (anonymes)
- ✅ Feedback visuel (toast de succès/erreur)

### Pour les photographes

- ✅ Activer/désactiver les commentaires par galerie
- ✅ Voir tous les commentaires dans le dashboard
- ✅ Compteur de commentaires dans les analytics
- ✅ Notifications push pour nouveaux commentaires (si activées)

### Gating par plan

Les commentaires sont disponibles selon le plan :

- ❌ **Free** : Non disponible
- ✅ **Premium** : Disponible
- ✅ **Pro** : Disponible

## Fichiers modifiés

- ✅ `src/app/g/[slug]/gallery-view-client.tsx` - Activation et handler
- ✅ `src/hooks/use-event-tracker.ts` - Tracking des commentaires

## Fichiers existants (non modifiés)

- ✅ `src/app/api/images/[id]/comments/route.ts` - API complète
- ✅ `src/lib/services/comments.service.ts` - Service complet
- ✅ `src/components/gallery-view/lightbox.tsx` - UI complète

## Tests à effectuer

### 1. Test avec plan Premium/Pro

1. Créer une galerie avec un compte Premium ou Pro
2. Activer les commentaires dans les settings de la galerie
3. Ouvrir la galerie en mode public
4. Cliquer sur une photo pour ouvrir le Lightbox
5. ✅ Le panneau de commentaires devrait s'afficher à droite
6. Saisir un commentaire et soumettre
7. ✅ Toast de succès devrait apparaître
8. ✅ Le commentaire devrait apparaître dans la liste

### 2. Test avec plan Free

1. Créer une galerie avec un compte Free
2. Tenter d'activer les commentaires
3. ✅ L'option devrait être désactivée (upgrade required)

### 3. Test avec commentaires désactivés

1. Galerie avec plan Premium/Pro
2. Laisser `enableComments: false` dans les settings
3. Ouvrir le Lightbox
4. ✅ Le panneau de commentaires ne devrait PAS s'afficher

### 4. Test de persistance

1. Ajouter plusieurs commentaires
2. Fermer et rouvrir le Lightbox
3. ✅ Les commentaires devraient persister
4. Ouvrir le dashboard photographe
5. ✅ Les commentaires devraient être visibles dans les analytics

## Conformité aux exigences

- ✅ **Requirement 3.2.1** : Lightbox inclut un champ de saisie de commentaire
- ✅ **Requirement 3.2.2** : Les commentaires sont sauvegardés avec référence à l'image
- ✅ **Requirement 3.2.3** : Les commentaires sont visibles dans le dashboard photographe
- ✅ **Feature gating** : Disponible uniquement pour Premium et Pro
- ✅ **RGPD** : Commentaires liés à session_id (anonymes)
