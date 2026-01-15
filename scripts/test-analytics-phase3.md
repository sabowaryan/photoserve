# Test Analytics Phase 3 - Guide de Vérification

## Prérequis

1. ✅ Migration SQL exécutée (`20260115_create_gallery_events.sql`)
2. ✅ Types TypeScript générés (`npx supabase gen types typescript --linked`)
3. ✅ Application démarrée (`npm run dev`)
4. ✅ Galerie publique accessible

---

## Tests Manuels

### 1. Test Session Tracking

**Action** :
1. Ouvrir une galerie publique dans un nouvel onglet
2. Attendre 2-3 secondes
3. Fermer l'onglet

**Vérification** :
```sql
-- Dans Supabase SQL Editor
SELECT * FROM gallery_events 
WHERE event_type IN ('session_start', 'session_end')
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement `session_start` avec `referrer` et `userAgent`
- 1 événement `session_end` avec `duration` et `eventsCount`

---

### 2. Test Lightbox Open

**Action** :
1. Ouvrir une galerie publique
2. Cliquer sur une photo pour ouvrir le lightbox

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type = 'lightbox_open'
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement avec `event_data` contenant `imageId` et `imageIndex`

---

### 3. Test Download All

**Action** :
1. Ouvrir une galerie publique
2. Cliquer sur "Télécharger tout"

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type = 'download_all'
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement avec `event_data` contenant `imageCount` et `format: "zip"`

---

### 4. Test Favorites

**Action** :
1. Ouvrir une galerie publique (plan Premium/Pro)
2. Cliquer sur le cœur d'une photo (ajouter aux favoris)
3. Cliquer à nouveau (retirer des favoris)

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type IN ('favorite_add', 'favorite_remove')
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement `favorite_add` avec `imageId`
- 1 événement `favorite_remove` avec `imageId`

---

### 5. Test Slideshow

**Action** :
1. Ouvrir une galerie publique (plan Premium/Pro)
2. Cliquer sur "Lancer le diaporama"
3. Attendre 10-15 secondes
4. Fermer le diaporama

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type IN ('slideshow_start', 'slideshow_end')
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement `slideshow_start` avec `imageCount` et `interval`
- 1 événement `slideshow_end` avec `duration` et `imagesViewed`

---

### 6. Test Download Selection

**Action** :
1. Ouvrir une galerie publique (plan Premium/Pro)
2. Sélectionner 2-3 photos
3. Cliquer sur "Télécharger la sélection"

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type = 'download_selection'
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement avec `event_data` contenant `imageIds`, `count`, et `format: "zip"`

---

### 7. Test Download Favorites

**Action** :
1. Ouvrir une galerie publique (plan Premium/Pro)
2. Ajouter 2-3 photos aux favoris
3. Cliquer sur "Télécharger les favoris"

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE event_type = 'download_favorites'
ORDER BY created_at DESC 
LIMIT 5;
```

**Résultat attendu** :
- 1 événement avec `event_data` contenant `imageIds`, `count`, et `format: "zip"`

---

## Tests API

### Test POST /api/galleries/[id]/events

```bash
# Remplacer [GALLERY_ID] par un vrai ID
curl -X POST http://localhost:3000/api/galleries/[GALLERY_ID]/events \
  -H "Content-Type: application/json" \
  -d '{
    "visitorId": "test-visitor-123",
    "eventType": "lightbox_open",
    "eventData": {
      "imageId": "test-image-456",
      "imageIndex": 0
    }
  }'
```

**Résultat attendu** :
- Status: `204 No Content`
- Pas de body

**Vérification** :
```sql
SELECT * FROM gallery_events 
WHERE visitor_id = 'test-visitor-123'
ORDER BY created_at DESC;
```

---

### Test GET /api/galleries/[id]/events (Authentifié)

```bash
# Nécessite un token d'authentification
# Remplacer [GALLERY_ID] et [TOKEN]
curl http://localhost:3000/api/galleries/[GALLERY_ID]/events \
  -H "Authorization: Bearer [TOKEN]"
```

**Résultat attendu** :
```json
{
  "stats": {
    "totalEvents": 150,
    "eventsByType": {
      "lightbox_open": 50,
      "download_all": 10,
      "favorite_add": 20,
      ...
    },
    "mostViewedImages": [
      { "imageId": "uuid", "views": 25 },
      ...
    ],
    "downloadStats": {
      "total": 30,
      "single": 10,
      "all": 10,
      "selection": 5,
      "favorites": 5
    },
    "favoriteStats": {
      "added": 20,
      "removed": 5,
      "net": 15
    },
    "ctaClicks": 5,
    "slideshowStats": {
      "starts": 10,
      "avgDuration": 120
    },
    "sessionStats": {
      "avgDuration": 300,
      "avgEventsPerSession": 15
    }
  }
}
```

---

## Tests de Performance

### 1. Volume de Données

**Créer 1000 événements** :
```sql
-- Script pour tester la performance
INSERT INTO gallery_events (gallery_id, visitor_id, event_type, event_data)
SELECT 
  'your-gallery-id',
  'test-visitor-' || generate_series,
  'lightbox_open',
  jsonb_build_object('imageId', 'test-image-' || generate_series, 'imageIndex', generate_series)
FROM generate_series(1, 1000);
```

**Mesurer la requête** :
```sql
EXPLAIN ANALYZE
SELECT 
  event_type,
  COUNT(*) as count
FROM gallery_events
WHERE gallery_id = 'your-gallery-id'
GROUP BY event_type;
```

**Résultat attendu** :
- Temps d'exécution < 50ms
- Index utilisé : `idx_gallery_events_gallery_event`

---

### 2. Requête Most Viewed Images

```sql
EXPLAIN ANALYZE
SELECT 
  event_data->>'imageId' as image_id,
  COUNT(*) as views
FROM gallery_events
WHERE gallery_id = 'your-gallery-id'
  AND event_type = 'lightbox_open'
GROUP BY event_data->>'imageId'
ORDER BY views DESC
LIMIT 10;
```

**Résultat attendu** :
- Temps d'exécution < 100ms
- Index utilisé : `idx_gallery_events_gallery_event`

---

## Tests d'Intégration

### Scénario Complet : Visite d'une Galerie

**Actions** :
1. Ouvrir la galerie → `session_start`
2. Cliquer sur photo 1 → `lightbox_open`
3. Cliquer sur photo 2 → `lightbox_open`
4. Ajouter photo 2 aux favoris → `favorite_add`
5. Lancer le diaporama → `slideshow_start`
6. Fermer le diaporama après 30s → `slideshow_end`
7. Télécharger tout → `download_all`
8. Fermer la page → `session_end`

**Vérification** :
```sql
SELECT 
  event_type,
  event_data,
  created_at
FROM gallery_events
WHERE visitor_id = 'votre-visitor-id'
ORDER BY created_at ASC;
```

**Résultat attendu** :
- 8 événements dans l'ordre chronologique
- Tous avec le même `visitor_id`
- Tous avec le même `gallery_id`
- `session_end` avec `duration` ≈ temps total et `eventsCount` = 7

---

## Checklist de Validation

### Base de Données
- [ ] Table `gallery_events` existe
- [ ] 6 index créés
- [ ] Contrainte FK sur `gallery_id`
- [ ] Cascade DELETE fonctionne

### API
- [ ] POST `/api/galleries/[id]/events` retourne 204
- [ ] GET `/api/galleries/[id]/events` retourne stats
- [ ] Validation Zod fonctionne
- [ ] Extraction IP automatique

### Client
- [ ] Session tracking fonctionne
- [ ] Lightbox tracking fonctionne
- [ ] Favorite tracking fonctionne
- [ ] Download tracking fonctionne
- [ ] Slideshow tracking fonctionne

### Performance
- [ ] Pas de blocage UI
- [ ] Erreurs silencieuses
- [ ] Requêtes < 100ms
- [ ] Index utilisés

### Types
- [ ] Pas d'erreurs TypeScript
- [ ] Types générés à jour
- [ ] Autocomplétion fonctionne

---

## Dépannage

### Problème : Événements non enregistrés

**Vérifications** :
1. Migration SQL exécutée ?
2. Table `gallery_events` existe ?
3. Erreurs dans la console navigateur ?
4. Erreurs dans les logs serveur ?

**Solution** :
```sql
-- Vérifier la table
SELECT * FROM information_schema.tables 
WHERE table_name = 'gallery_events';

-- Vérifier les permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name = 'gallery_events';
```

---

### Problème : Erreurs TypeScript

**Vérifications** :
1. Types générés avec `npx supabase gen types typescript --linked` ?
2. Fichier `src/lib/supabase/types.ts` à jour ?
3. Import correct dans les fichiers ?

**Solution** :
```bash
# Régénérer les types
npx supabase gen types typescript --linked > src/lib/supabase/types.ts

# Vérifier les erreurs
npm run type-check
```

---

### Problème : Stats vides

**Vérifications** :
1. Événements enregistrés en base ?
2. `gallery_id` correct ?
3. Authentification OK pour GET ?

**Solution** :
```sql
-- Compter les événements
SELECT COUNT(*) FROM gallery_events 
WHERE gallery_id = 'your-gallery-id';

-- Vérifier les types
SELECT DISTINCT event_type FROM gallery_events;
```

---

## Conclusion

Si tous les tests passent, la Phase 3 est **100% fonctionnelle** ! 🎉

**Prochaines étapes** :
1. Monitorer en production
2. Créer le dashboard analytics
3. Optimiser basé sur les données réelles

---

**Document créé le** : 15 Janvier 2026  
**Version** : 1.0.0  
**Auteur** : Équipe PikSend
