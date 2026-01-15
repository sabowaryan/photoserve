# Analytics Phase 3 - Tracking d'Événements

## Vue d'ensemble

Cette phase ajoute le tracking des interactions utilisateur dans les galeries pour obtenir des insights détaillés sur le comportement des visiteurs.

## Date d'implémentation

**15 Janvier 2026**

## Objectifs

✅ Tracker les actions des visiteurs (clics, téléchargements, favoris)  
✅ Identifier les photos les plus populaires  
✅ Mesurer l'engagement (temps passé, actions effectuées)  
✅ Optimiser l'expérience utilisateur basée sur les données  

---

## Événements Trackés

### 1. Navigation & Visualisation

#### `lightbox_open`
**Quand** : Utilisateur clique sur une photo pour l'ouvrir en grand

**Données** :
```json
{
  "imageId": "uuid",
  "imageIndex": 0
}
```

**Utilité** : Identifier les photos les plus vues

#### `session_start`
**Quand** : Utilisateur arrive sur la galerie

**Données** :
```json
{
  "referrer": "https://...",
  "userAgent": "Mozilla/5.0..."
}
```

**Utilité** : Analyser les sources de trafic

#### `session_end`
**Quand** : Utilisateur quitte la galerie

**Données** :
```json
{
  "duration": 300,
  "eventsCount": 15
}
```

**Utilité** : Mesurer le temps passé et l'engagement

### 2. Téléchargements

#### `download_single`
**Quand** : Téléchargement d'une photo individuelle

**Données** :
```json
{
  "imageId": "uuid",
  "quality": "hd"
}
```

#### `download_all`
**Quand** : Téléchargement de toutes les photos (ZIP)

**Données** :
```json
{
  "imageCount": 150,
  "format": "zip"
}
```

#### `download_selection`
**Quand** : Téléchargement d'une sélection de photos

**Données** :
```json
{
  "imageIds": ["uuid1", "uuid2"],
  "count": 5,
  "format": "zip"
}
```

#### `download_favorites`
**Quand** : Téléchargement des favoris

**Données** :
```json
{
  "imageIds": ["uuid1", "uuid2"],
  "count": 10,
  "format": "zip"
}
```

**Utilité** : Mesurer le taux de téléchargement, identifier les photos populaires

### 3. Favoris

#### `favorite_add`
**Quand** : Ajout d'une photo aux favoris

**Données** :
```json
{
  "imageId": "uuid"
}
```

#### `favorite_remove`
**Quand** : Retrait d'une photo des favoris

**Données** :
```json
{
  "imageId": "uuid"
}
```

**Utilité** : Identifier les photos préférées des clients

### 4. Interactions

#### `cta_click`
**Quand** : Clic sur un bouton d'action (contact, réservation, etc.)

**Données** :
```json
{
  "ctaType": "contact",
  "ctaUrl": "mailto:..."
}
```

**Utilité** : Mesurer le taux de conversion

#### `slideshow_start`
**Quand** : Démarrage du diaporama

**Données** :
```json
{
  "imageCount": 150,
  "interval": 5000
}
```

#### `slideshow_end`
**Quand** : Fin du diaporama

**Données** :
```json
{
  "duration": 120,
  "imagesViewed": 24
}
```

**Utilité** : Mesurer l'engagement avec le diaporama

---

## Architecture

### Table `gallery_events`

```sql
CREATE TABLE gallery_events (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  
  -- Identification
  visitor_id VARCHAR(255),  -- Fingerprint
  visitor_ip VARCHAR(45),   -- Fallback
  
  -- Événement
  event_type VARCHAR(50),   -- Type d'événement
  event_data JSONB,         -- Données additionnelles
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Index** :
- `gallery_id` : Requêtes par galerie
- `visitor_id` : Requêtes par visiteur
- `event_type` : Filtrage par type
- `created_at` : Tri chronologique
- `(gallery_id, event_type)` : Requêtes combinées
- `(gallery_id, visitor_id)` : Parcours utilisateur

### Service `EventsService`

**Méthodes** :
- `trackEvent()` : Enregistrer un événement
- `getEventStats()` : Statistiques globales
- `getMostViewedImages()` : Photos les plus vues

**Exemple** :
```typescript
const eventsService = createEventsService(supabase);

// Tracker un événement
await eventsService.trackEvent({
  galleryId: 'uuid',
  visitorId: 'Fp1a2b3c...',
  eventType: 'lightbox_open',
  eventData: { imageId: 'uuid', imageIndex: 0 }
});

// Obtenir les stats
const stats = await eventsService.getEventStats('gallery-id');
// {
//   totalEvents: 1250,
//   eventsByType: { lightbox_open: 450, download_all: 25, ... },
//   mostViewedImages: [{ imageId: 'uuid', views: 120 }, ...],
//   downloadStats: { total: 50, single: 20, all: 25, ... },
//   ...
// }
```

### Hook `useEventTracker`

**Utilisation** :
```typescript
const eventTracker = useEventTracker({
  galleryId: 'uuid',
  visitorId: 'Fp1a2b3c...'
});

// Tracker une ouverture de lightbox
eventTracker.trackLightboxOpen('image-id', 0);

// Tracker un téléchargement
eventTracker.trackDownloadAll(150);

// Tracker un favori
eventTracker.trackFavoriteAdd('image-id');
```

**Avantages** :
- ✅ API simple et typée
- ✅ Gestion d'erreurs automatique
- ✅ Pas de blocage de l'UX
- ✅ Réutilisable

---

## Statistiques Disponibles

### Dashboard Photographe

**Métriques globales** :
- Total d'événements
- Événements par type
- Taux d'engagement

**Photos** :
- Photos les plus vues (lightbox)
- Photos les plus téléchargées
- Photos les plus mises en favoris

**Téléchargements** :
- Total de téléchargements
- Par type (single, all, selection, favorites)
- Taux de téléchargement (vues → téléchargements)

**Engagement** :
- Temps moyen passé
- Actions moyennes par session
- Taux de rebond

**Diaporama** :
- Nombre de démarrages
- Durée moyenne
- Photos vues en moyenne

**Conversion** :
- Clics CTA
- Taux de conversion (vues → CTA)

---

## Intégration dans le Client

### Événements Automatiques

**Déjà intégrés** :
- ✅ `download_all` - Téléchargement complet
- ✅ `download_selection` - Téléchargement sélection
- ✅ `download_favorites` - Téléchargement favoris

**À intégrer** (exemples fournis) :
- ✅ `lightbox_open` - Dans MasonryGrid (INTÉGRÉ)
- ✅ `download_single` - Dans Lightbox (INTÉGRÉ via download modal)
- ✅ `favorite_add/remove` - Dans handlers (INTÉGRÉ)
- `cta_click` - Dans CTAButton (À FAIRE si CTA présent)
- ✅ `slideshow_start/end` - Dans Slideshow (INTÉGRÉ)
- ✅ `session_start/end` - Dans useEffect (INTÉGRÉ)

### Exemple : Lightbox Open

```typescript
// Dans gallery-view-client.tsx - INTÉGRÉ ✅
<MasonryGrid
  images={images}
  onImageClick={(index) => {
    const image = images[index];
    if (image) {
      eventTracker.trackLightboxOpen(image.id, index);
    }
    setLightboxIndex(index);
  }}
  // ... autres props
/>
```

### Exemple : Favoris

```typescript
// Dans gallery-view-client.tsx - INTÉGRÉ ✅
const handleToggleFavorite = async (imageId: string) => {
  // ... logique API
  
  if (response.ok) {
    const { isFavorite } = await response.json();
    
    // Tracker l'événement
    if (isFavorite) {
      eventTracker.trackFavoriteAdd(imageId);
    } else {
      eventTracker.trackFavoriteRemove(imageId);
    }
    
    // Mettre à jour l'état local
    setFavorites(/* ... */);
  }
};
```

### Exemple : Slideshow

```typescript
// Dans slideshow.tsx - INTÉGRÉ ✅
export function Slideshow({ 
  onSlideshowStart,
  onSlideshowEnd,
  // ... autres props
}) {
  const [startTime] = useState(Date.now());
  const [viewedImages] = useState(new Set<number>([0]));
  
  // Track start
  useEffect(() => {
    if (onSlideshowStart) {
      onSlideshowStart(images.length, interval);
    }
  }, []);
  
  // Track end on unmount
  useEffect(() => {
    return () => {
      if (onSlideshowEnd) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
        onSlideshowEnd(duration, viewedImages.size);
      }
    };
  }, []);
  
  // ... reste du composant
}
```

### Exemple : Session Tracking

```typescript
// Dans gallery-view-client.tsx - INTÉGRÉ ✅
useEffect(() => {
  if (!isAuthenticated || isExpired || isInactive) return;

  const sessionStart = Date.now();
  let eventCount = 0;

  // Track session start
  eventTracker.trackSessionStart(
    typeof document !== 'undefined' ? document.referrer : undefined,
    typeof navigator !== 'undefined' ? navigator.userAgent : undefined
  );

  // Increment event count on interactions
  const incrementEventCount = () => {
    eventCount++;
  };

  window.addEventListener('click', incrementEventCount);
  window.addEventListener('keydown', incrementEventCount);

  // Track session end on unmount or page unload
  const trackSessionEnd = () => {
    const duration = Math.floor((Date.now() - sessionStart) / 1000);
    eventTracker.trackSessionEnd(duration, eventCount);
  };

  window.addEventListener('beforeunload', trackSessionEnd);

  return () => {
    trackSessionEnd();
    window.removeEventListener('click', incrementEventCount);
    window.removeEventListener('keydown', incrementEventCount);
    window.removeEventListener('beforeunload', trackSessionEnd);
  };
}, [isAuthenticated, isExpired, isInactive, eventTracker]);
```

---

## Performance

### Impact Base de Données

**Taille par événement** : ~200 bytes
- `id` : 16 bytes (UUID)
- `gallery_id` : 16 bytes (UUID)
- `visitor_id` : 30 bytes (VARCHAR)
- `event_type` : 20 bytes (VARCHAR)
- `event_data` : 100 bytes (JSONB)
- `created_at` : 8 bytes (TIMESTAMP)
- Index : ~50 bytes

**Volume estimé** :
- 1000 vues/mois → ~10,000 événements/mois
- 10,000 événements × 200 bytes = 2 MB/mois
- **Impact négligeable**

### Impact Performance

**Tracking asynchrone** :
- ✅ Pas de blocage de l'UI
- ✅ Fire-and-forget
- ✅ Erreurs silencieuses

**Requêtes optimisées** :
- ✅ Index sur toutes les colonnes de filtrage
- ✅ Index composites pour requêtes complexes
- ✅ JSONB pour flexibilité sans overhead

---

## Cas d'Usage

### 1. Identifier les Photos Populaires

**Question** : Quelles photos plaisent le plus aux clients ?

**Réponse** :
```sql
SELECT 
  event_data->>'imageId' as image_id,
  COUNT(*) as views
FROM gallery_events
WHERE gallery_id = 'uuid'
  AND event_type = 'lightbox_open'
GROUP BY event_data->>'imageId'
ORDER BY views DESC
LIMIT 10;
```

**Dashboard** : Top 10 des photos les plus vues

### 2. Mesurer le Taux de Téléchargement

**Question** : Combien de visiteurs téléchargent les photos ?

**Calcul** :
```typescript
const views = stats.totalViews;
const downloads = stats.downloadStats.total;
const downloadRate = (downloads / views) * 100;
// Ex: 25 téléchargements / 100 vues = 25%
```

**Dashboard** : Taux de téléchargement par galerie

### 3. Optimiser le Diaporama

**Question** : Le diaporama est-il utilisé ? Combien de temps ?

**Réponse** :
```typescript
const slideshowStarts = stats.slideshowStats.starts;
const avgDuration = stats.slideshowStats.avgDuration;
// Ex: 50 démarrages, durée moyenne 120s
```

**Action** : Si peu utilisé, le rendre plus visible

### 4. Améliorer la Conversion

**Question** : Combien de visiteurs cliquent sur le CTA ?

**Calcul** :
```typescript
const views = stats.totalViews;
const ctaClicks = stats.ctaClicks;
const conversionRate = (ctaClicks / views) * 100;
// Ex: 5 clics / 100 vues = 5%
```

**Action** : Tester différents CTA, positions, textes

---

## Prochaines Étapes (Phase 4)

### Fonctionnalités Avancées

**Heatmap** :
- Visualiser les zones cliquées
- Identifier les patterns de navigation
- Optimiser le layout

**Funnel de Conversion** :
- Vue → Lightbox → Téléchargement
- Vue → CTA → Conversion
- Identifier les points de friction

**Temps de Session** :
- Tracking précis du temps passé
- Temps par photo
- Temps avant première action

**A/B Testing** :
- Tester différentes versions
- Mesurer l'impact des changements
- Optimiser basé sur les données

---

## Migration

### Exécuter la Migration

```bash
# Dans Supabase Dashboard → SQL Editor
# Copier-coller le contenu de :
supabase/migrations/20260115_create_gallery_events.sql
```

### Vérifier la Migration

```sql
-- Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'gallery_events';

-- Vérifier les index
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'gallery_events';
```

### Tester le Tracking

```typescript
// Dans la console navigateur
const response = await fetch('/api/galleries/[id]/events', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    visitorId: 'test-visitor',
    eventType: 'lightbox_open',
    eventData: { imageId: 'test-image', imageIndex: 0 }
  })
});

console.log(response.status); // 204
```

```sql
-- Vérifier en base
SELECT * FROM gallery_events ORDER BY created_at DESC LIMIT 5;
```

---

## Résumé

### Avant Phase 3

- ❌ Pas de tracking des actions
- ❌ Pas de données sur les photos populaires
- ❌ Pas de mesure d'engagement
- ❌ Pas de taux de conversion

### Après Phase 3

- ✅ Tracking complet des interactions
- ✅ Photos les plus vues identifiées
- ✅ Taux de téléchargement mesuré
- ✅ Engagement quantifié
- ✅ Conversion trackée
- ✅ Insights actionnables

### Métriques Disponibles

**Navigation** :
- Photos les plus vues
- Parcours utilisateur
- Temps passé

**Actions** :
- Téléchargements (par type)
- Favoris ajoutés/retirés
- Clics CTA

**Engagement** :
- Événements par session
- Durée moyenne
- Taux de rebond

**Conversion** :
- Vues → Téléchargements
- Vues → CTA
- Vues → Favoris

---

**Document créé le** : 15 Janvier 2026  
**Version** : 1.0.0  
**Statut** : Phase 3 Complétée ✅  
**Auteur** : Équipe PikSend
