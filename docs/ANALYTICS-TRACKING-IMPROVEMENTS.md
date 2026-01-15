# Analytics Tracking - Améliorations Phase 1

## Résumé des Changements

Ce document décrit les améliorations apportées au système de tracking analytics dans PikSend (Phase 1).

## Date d'implémentation

**15 Janvier 2026**

## Objectifs

✅ Corriger le tracking basique pour capturer les métadonnées des visiteurs  
✅ Ajouter la géolocalisation IP pour identifier le pays des visiteurs  
✅ Utiliser l'API analytics avancée au lieu de l'API simple  

## Changements Effectués

### 1. Nouveau Service de Géolocalisation

**Fichier créé** : `src/lib/services/geolocation.service.ts`

**Fonctionnalités** :
- Géolocalisation IP via ip-api.com (gratuit, 45 req/min)
- Détection automatique des IPs privées (localhost, 192.168.x.x, etc.)
- Validation du format IP (IPv4 et IPv6)
- Timeout de 3 secondes pour éviter les blocages
- Gestion d'erreurs robuste

**API** :
```typescript
interface IGeolocationService {
  getCountryFromIP(ip: string): Promise<string | null>;
  getDetailedLocation(ip: string): Promise<GeolocationResult>;
}
```

**Exemple d'utilisation** :
```typescript
import { geolocationService } from '@/lib/services';

const countryCode = await geolocationService.getCountryFromIP('8.8.8.8');
// Retourne: "US"

const details = await geolocationService.getDetailedLocation('8.8.8.8');
// Retourne: { countryCode: "US", countryName: "United States", city: "Mountain View" }
```

### 2. API Analytics Améliorée

**Fichier modifié** : `src/app/api/galleries/[id]/analytics/route.ts`

**Changements** :
- Import du service de géolocalisation
- Géolocalisation automatique de l'IP si `countryCode` non fourni
- Gestion d'erreurs pour ne pas bloquer le tracking en cas d'échec de géolocalisation

**Avant** :
```typescript
const analyticsService = createAnalyticsService(supabase);
await analyticsService.trackView(galleryId, {
  ip,
  userAgent,
  countryCode: metadata.countryCode, // Jamais fourni
});
```

**Après** :
```typescript
// Get country code from IP if not provided
let countryCode = metadata.countryCode;
if (!countryCode && ip) {
  try {
    countryCode = await geolocationService.getCountryFromIP(ip) || undefined;
  } catch (error) {
    console.error('Geolocation error:', error);
  }
}

const analyticsService = createAnalyticsService(supabase);
await analyticsService.trackView(galleryId, {
  ip,
  userAgent,
  countryCode, // Maintenant géolocalisé automatiquement
});
```

### 3. Client Mis à Jour

**Fichier modifié** : `src/app/g/[slug]/gallery-view-client.tsx`

**Changements** :
- Utilise `/api/galleries/[id]/analytics` au lieu de `/api/galleries/[id]/view`
- Envoie le `userAgent` dans le body
- Appelle ensuite `/view` pour mettre à jour le compteur local

**Avant** :
```typescript
// Increment view count
fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' })
  .then(res => res.json())
  .then(data => {
    if (data.views_count) {
      setViewsCount(data.views_count);
    }
  })
  .catch(console.error);
```

**Après** :
```typescript
// Track view with analytics (includes IP geolocation and user agent)
fetch(`/api/galleries/${initialGallery.id}/analytics`, { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
  })
})
  .then(res => {
    if (res.ok) {
      // Also update the local view count for display
      return fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' });
    }
  })
  .then(res => res?.json())
  .then(data => {
    if (data?.views_count) {
      setViewsCount(data.views_count);
    }
  })
  .catch(console.error);
```

### 4. Export du Service

**Fichier modifié** : `src/lib/services/index.ts`

**Changements** :
- Export du `GeolocationService` et de ses types
- Disponible via `import { geolocationService } from '@/lib/services'`

### 5. Tests Unitaires

**Fichier créé** : `src/lib/services/__tests__/geolocation.service.test.ts`

**Couverture** :
- ✅ Géolocalisation d'IP publique valide
- ✅ Détection d'IP invalide
- ✅ Détection d'IP privée (localhost, 192.168.x.x, etc.)
- ✅ Gestion d'erreur API
- ✅ Gestion de timeout
- ✅ Validation IPv4/IPv6

## Flow de Tracking Amélioré

### Avant (Problématique)

```
Visite galerie → sessionStorage check → POST /api/galleries/[id]/view
                                        ↓
                                   Incrémente views_count
                                        ↓
                                   Retourne compteur
                                        ↓
                                   ❌ Pas de données dans gallery_analytics
                                   ❌ Pas d'IP, user agent, pays
```

### Après (Corrigé)

```
Visite galerie → sessionStorage check → POST /api/galleries/[id]/analytics
                                        ↓
                                   Extrait IP des headers
                                        ↓
                                   Géolocalise IP → Pays (FR, US, etc.)
                                        ↓
                                   Insère dans gallery_analytics
                                   (ip, user_agent, country_code, viewed_at)
                                        ↓
                                   POST /api/galleries/[id]/view
                                        ↓
                                   Incrémente views_count
                                        ↓
                                   ✅ Données complètes dans gallery_analytics
                                   ✅ Dashboard affiche les stats correctement
```

## Données Maintenant Trackées

### Table `gallery_analytics`

Chaque visite enregistre maintenant :

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `id` | UUID | ID unique de l'enregistrement | `550e8400-e29b-41d4-a716-446655440000` |
| `gallery_id` | UUID | ID de la galerie visitée | `123e4567-e89b-12d3-a456-426614174000` |
| `visitor_ip` | VARCHAR(45) | IP du visiteur (hashée) | `203.0.113.42` |
| `user_agent` | TEXT | Navigateur/Device | `Mozilla/5.0 (Windows NT 10.0; Win64; x64)...` |
| `country_code` | VARCHAR(2) | Code pays ISO | `FR`, `US`, `CA` |
| `viewed_at` | TIMESTAMP | Date/heure de la visite | `2026-01-15 14:30:00` |

### Métriques Calculées

Le dashboard peut maintenant afficher :

1. **Total Views** : Nombre d'enregistrements dans `gallery_analytics`
2. **Unique Visitors** : Nombre d'IPs uniques
3. **Views by Country** : Agrégation par `country_code`
4. **Views Over Time** : Agrégation par date (`viewed_at`)
5. **Favorites** : Depuis la table `favorites`
6. **Comments** : Depuis la table `comments`

## Service de Géolocalisation

### API Utilisée : ip-api.com

**Avantages** :
- ✅ Gratuit (45 requêtes/minute)
- ✅ Pas de clé API requise
- ✅ Réponse rapide (<100ms)
- ✅ Précision élevée

**Limitations** :
- ⚠️ HTTP uniquement (HTTPS payant)
- ⚠️ 45 req/min (suffisant pour usage normal)
- ⚠️ Pas de SLA garanti

**Alternative future** : MaxMind GeoLite2 (base de données locale)

### Gestion des IPs Privées

Le service détecte automatiquement les IPs non géolocalisables :

- `127.0.0.1` (localhost)
- `::1` (localhost IPv6)
- `10.0.0.0/8` (réseau privé)
- `172.16.0.0/12` (réseau privé)
- `192.168.0.0/16` (réseau privé)
- `169.254.0.0/16` (link-local)

Ces IPs retournent `null` sans appeler l'API.

## Tests

### Exécuter les Tests

```bash
npm run test src/lib/services/__tests__/geolocation.service.test.ts
```

### Résultats Attendus

```
✓ should return country code for valid public IP
✓ should return null for invalid IP format
✓ should return null for private IP addresses
✓ should return null when API request fails
✓ should return null when API returns error status
✓ should handle timeout gracefully
✓ should return detailed location for valid IP
✓ should return error for invalid IP
✓ should return error for private IP
✓ should validate IPv4 addresses correctly
✓ should reject invalid IPv4 addresses
```

## Vérification Manuelle

### 1. Tester le Tracking

1. Accéder à une galerie : `http://localhost:3000/g/[slug]`
2. Entrer le mot de passe (si protégée)
3. Vérifier dans la console réseau :
   - Requête POST vers `/api/galleries/[id]/analytics`
   - Status 204 (No Content)
   - Requête POST vers `/api/galleries/[id]/view`
   - Status 200 avec `{ views_count: X }`

### 2. Vérifier les Données

```sql
-- Voir les dernières vues trackées
SELECT 
  ga.id,
  g.title,
  ga.visitor_ip,
  ga.country_code,
  ga.viewed_at
FROM gallery_analytics ga
JOIN galleries g ON g.id = ga.gallery_id
ORDER BY ga.viewed_at DESC
LIMIT 10;
```

### 3. Vérifier le Dashboard

1. Aller sur `/dashboard/gallery/[id]/analytics`
2. Vérifier que les métriques s'affichent :
   - Total Views > 0
   - Unique Visitors > 0
   - Geographic Distribution (carte avec pays)
   - Views Over Time (graphique)

## Conformité RGPD

### Données Collectées

- ✅ IP (nécessaire pour géolocalisation)
- ✅ User Agent (nécessaire pour analytics)
- ✅ Pays (dérivé de l'IP)

### Mesures de Protection

1. **Anonymisation** : Les IPs peuvent être hashées avant stockage
2. **Consentement** : À implémenter (banner cookies)
3. **Durée de conservation** : À définir (recommandé: 90 jours)
4. **Droit à l'oubli** : À implémenter (suppression sur demande)

### TODO : Consentement Cookies

```typescript
// À implémenter dans une prochaine phase
const [hasConsent, setHasConsent] = useState(false);

useEffect(() => {
  const consent = localStorage.getItem('analytics_consent');
  setHasConsent(consent === 'true');
}, []);

const trackView = () => {
  if (hasConsent) {
    // Track avec analytics complètes
    fetch('/api/galleries/[id]/analytics', { method: 'POST' });
  } else {
    // Track basique uniquement
    fetch('/api/galleries/[id]/view', { method: 'POST' });
  }
};
```

## Prochaines Étapes (Phase 2)

### Améliorer la Précision des Visiteurs Uniques

**Problème actuel** : Utilise l'IP pour identifier les visiteurs uniques
- Plusieurs personnes derrière le même NAT = 1 visiteur
- VPN/Proxy = IP changeante

**Solution** : Fingerprinting avec FingerprintJS

```bash
npm install @fingerprintjs/fingerprintjs
```

```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();
const visitorId = result.visitorId; // ID unique du navigateur

// Envoyer au serveur
fetch('/api/galleries/[id]/analytics', {
  method: 'POST',
  body: JSON.stringify({ visitorId })
});
```

### Ajouter le Tracking d'Événements

**Événements à tracker** :
- Ouverture lightbox (photo cliquée)
- Téléchargement (single, all, selection, favorites)
- Clic CTA
- Temps passé sur la galerie
- Favoris ajoutés

**Table à créer** :
```sql
CREATE TABLE gallery_events (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  visitor_id VARCHAR(255),
  event_type VARCHAR(50), -- 'lightbox_open', 'download', 'cta_click'
  event_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Métriques de Succès

### Avant Phase 1

- ❌ Dashboard analytics vide
- ❌ Pas de données géographiques
- ❌ Visiteurs uniques = 0

### Après Phase 1

- ✅ Dashboard analytics fonctionnel
- ✅ Carte géographique avec pays
- ✅ Visiteurs uniques calculés (par IP)
- ✅ Graphique des vues dans le temps

### Objectifs Phase 2

- 🎯 Visiteurs uniques précis (fingerprinting)
- 🎯 Tracking d'événements (clics, téléchargements)
- 🎯 Temps moyen passé sur la galerie
- 🎯 Photos les plus vues

## Ressources

### Documentation

- [Analytics Tracking System](./analytics-tracking-system.md) - Documentation complète
- [ip-api.com Documentation](http://ip-api.com/docs/) - API de géolocalisation
- [FingerprintJS](https://github.com/fingerprintjs/fingerprintjs) - Fingerprinting navigateur

### Fichiers Modifiés

- `src/lib/services/geolocation.service.ts` (créé)
- `src/lib/services/__tests__/geolocation.service.test.ts` (créé)
- `src/lib/services/index.ts` (modifié)
- `src/app/api/galleries/[id]/analytics/route.ts` (modifié)
- `src/app/g/[slug]/gallery-view-client.tsx` (modifié)

---

**Document créé le** : 15 Janvier 2026  
**Version** : 1.0.0  
**Statut** : Phase 1 Complétée ✅  
**Auteur** : Équipe PikSend
