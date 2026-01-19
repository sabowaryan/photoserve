# Correction du rafraîchissement des commentaires

## Problème identifié

Après l'ajout d'un commentaire, le message "Aucun commentaire pour le moment" continuait de s'afficher, même si le commentaire était bien créé en base de données.

### Cause racine

Le composant `Lightbox` utilisait les commentaires passés initialement avec les images (`currentImage?.comments`), qui étaient statiques et ne se mettaient jamais à jour après l'ajout d'un nouveau commentaire.

**Code problématique** :
```typescript
const comments = currentImage?.comments || [];

const handleSubmitComment = async () => {
  await onComment(currentImage.id, commentText.trim());
  setCommentText("");
  // ❌ Les commentaires ne sont pas rechargés
};
```

## Solution appliquée

### 1. État local pour les commentaires

Ajout d'un état local pour gérer les commentaires dynamiquement :

```typescript
const [comments, setComments] = useState<Array<{ 
  id: string; 
  content: string; 
  createdAt: string 
}>>([]); 
const [isLoadingComments, setIsLoadingComments] = useState(false);
```

### 2. Chargement automatique des commentaires

Ajout d'un `useEffect` pour charger les commentaires depuis l'API quand l'image change :

```typescript
useEffect(() => {
  if (!showComments || !currentImage) {
    setComments([]);
    return;
  }

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await fetch(`/api/images/${currentImage.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  loadComments();
}, [currentImage?.id, showComments]);
```

### 3. Rechargement après ajout

Mise à jour du handler pour recharger les commentaires après l'ajout :

```typescript
const handleSubmitComment = async () => {
  if (!commentText.trim() || !onComment || !currentImage) return;
  
  setIsSubmittingComment(true);
  try {
    await onComment(currentImage.id, commentText.trim());
    setCommentText("");
    
    // ✅ Reload comments after successful submission
    const response = await fetch(`/api/images/${currentImage.id}/comments`);
    if (response.ok) {
      const data = await response.json();
      setComments(data.comments || []);
    }
  } catch (error) {
    console.error("Failed to submit comment:", error);
  } finally {
    setIsSubmittingComment(false);
  }
};
```

### 4. Indicateur de chargement

Ajout d'un état de chargement dans l'UI :

```typescript
{isLoadingComments ? (
  <p className="text-xs text-white/40 text-center py-8">
    Chargement...
  </p>
) : comments.length === 0 ? (
  <p className="text-xs text-white/40 text-center py-8">
    Aucun commentaire pour le moment
  </p>
) : (
  // Liste des commentaires
)}
```

## Flux complet

### 1. Ouverture du Lightbox

1. Utilisateur clique sur une photo
2. Lightbox s'ouvre avec l'image
3. `useEffect` détecte le changement d'image
4. Appel API `GET /api/images/[id]/comments`
5. Commentaires chargés et affichés

### 2. Navigation entre images

1. Utilisateur clique sur "Suivant" ou "Précédent"
2. `currentImage.id` change
3. `useEffect` se déclenche automatiquement
4. Nouveaux commentaires chargés pour la nouvelle image

### 3. Ajout d'un commentaire

1. Utilisateur saisit un commentaire
2. Clique sur "Envoyer"
3. `handleSubmitComment()` appelé
4. Appel API `POST /api/images/[id]/comments`
5. Commentaire créé (201)
6. Rechargement automatique des commentaires
7. ✅ Nouveau commentaire visible immédiatement

## Avantages de cette approche

### ✅ Données toujours à jour
- Les commentaires sont chargés depuis l'API à chaque fois
- Pas de données obsolètes ou en cache

### ✅ Synchronisation multi-utilisateurs
- Si plusieurs personnes commentent en même temps
- Chaque utilisateur voit les nouveaux commentaires en naviguant

### ✅ Feedback immédiat
- Après l'ajout, le commentaire apparaît instantanément
- Pas besoin de fermer/rouvrir le Lightbox

### ✅ Gestion des erreurs
- Si le chargement échoue, l'UI reste stable
- Messages d'erreur dans la console pour le debug

## États de l'UI

### État 1 : Chargement initial
```
┌─────────────────────────┐
│ Commentaires         0  │
├─────────────────────────┤
│                         │
│    Chargement...        │
│                         │
└─────────────────────────┘
```

### État 2 : Aucun commentaire
```
┌─────────────────────────┐
│ Commentaires         0  │
├─────────────────────────┤
│                         │
│ Aucun commentaire pour  │
│    le moment            │
│                         │
└─────────────────────────┘
```

### État 3 : Avec commentaires
```
┌─────────────────────────┐
│ Commentaires         3  │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ Super photo !       │ │
│ │ 19 jan, 14:30       │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ J'adore les couleurs│ │
│ │ 19 jan, 14:25       │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Fichiers modifiés

- ✅ `src/components/gallery-view/lightbox.tsx` - Chargement dynamique des commentaires

## Tests à effectuer

### 1. Test de chargement initial

1. Ouvrir une galerie avec commentaires activés
2. Cliquer sur une photo pour ouvrir le Lightbox
3. ✅ "Chargement..." devrait s'afficher brièvement
4. ✅ Les commentaires existants devraient apparaître

### 2. Test d'ajout de commentaire

1. Dans le Lightbox, saisir un commentaire
2. Cliquer sur "Envoyer"
3. ✅ Le champ se vide
4. ✅ Le nouveau commentaire apparaît dans la liste
5. ✅ Le compteur s'incrémente

### 3. Test de navigation

1. Ajouter un commentaire sur la photo 1
2. Naviguer vers la photo 2
3. ✅ Les commentaires de la photo 2 se chargent
4. Revenir à la photo 1
5. ✅ Le commentaire ajouté est toujours visible

### 4. Test multi-utilisateurs (optionnel)

1. Ouvrir la galerie dans deux navigateurs différents
2. Ajouter un commentaire dans le navigateur 1
3. Dans le navigateur 2, naviguer vers une autre photo puis revenir
4. ✅ Le nouveau commentaire devrait être visible

### 5. Test de performance

1. Ajouter plusieurs commentaires (5-10)
2. Naviguer rapidement entre les photos
3. ✅ Pas de lag ou de freeze
4. ✅ Les commentaires se chargent rapidement

## Améliorations futures possibles

### WebSocket / Real-time
Pour une synchronisation en temps réel sans navigation :
```typescript
// Écouter les nouveaux commentaires via WebSocket
useEffect(() => {
  const ws = new WebSocket(`wss://api.example.com/comments/${imageId}`);
  ws.onmessage = (event) => {
    const newComment = JSON.parse(event.data);
    setComments(prev => [newComment, ...prev]);
  };
  return () => ws.close();
}, [imageId]);
```

### Polling
Pour rafraîchir périodiquement :
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    loadComments();
  }, 30000); // Toutes les 30 secondes
  return () => clearInterval(interval);
}, [imageId]);
```

### Optimistic UI
Pour un feedback encore plus rapide :
```typescript
const handleSubmitComment = async () => {
  // Ajouter immédiatement à l'UI
  const tempComment = {
    id: 'temp-' + Date.now(),
    content: commentText,
    createdAt: new Date().toISOString()
  };
  setComments(prev => [tempComment, ...prev]);
  
  // Puis envoyer à l'API
  await onComment(imageId, commentText);
  
  // Recharger pour avoir l'ID réel
  loadComments();
};
```

## Conformité

- ✅ Les commentaires sont chargés dynamiquement depuis l'API
- ✅ L'UI se met à jour immédiatement après l'ajout
- ✅ Gestion des états de chargement
- ✅ Pas de données obsolètes
- ✅ Expérience utilisateur fluide
