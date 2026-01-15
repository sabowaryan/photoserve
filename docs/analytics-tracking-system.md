# Système de Tracking Analytics - Documentation Technique

## Vue d'ensemble

Ce document explique comment les statistiques sont trackées dans PikSend, depuis la visite d'une galerie jusqu'à l'affichage dans le dashboard du photographe.

## Architecture Actuelle

### 1. Tables de Base de Données

#### Table `galleries`
```sql
CREATE TABLE galleries (
  id UUID PRIMARY KEY,
  title VARCHAR(255),
  views_count INTEGER DEFAULT 0,  -- Compteur simple de vues
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN,
  -- ... autres champs
);
```

#### Table `gallery_analytics`
```sql
CREATE TABLE gallery_analytics (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  
  -- Métadonnées du visiteur
  visitor_ip VARCHAR(45),        -- IP du visiteur (hashée pour RGPD)
  user_agent TEXT,               -- Navigateur/Device
  country_code VARCHAR(2),       -- Code pays (ex: FR, US, CA)
  
  -- Timestamp
  viewed_at TIMESTAMP DEFAULT NOW(),
  
  -- Index pour performance
  INDEX idx_gallery_analytics_gallery_id (gallery_id),
  INDEX idx_gallery_analytics_viewed_at (viewed_at)
);
```

### 2. Flow de Tracking

#### Étape 1 : Visite de la Galerie

**Fichier** : `src/app/g/[slug]/gallery-view-client.tsx`

```typescript
// Quand l'utilisateur accède à la galerie (après authentification)
useEffect(() => {
  const viewKey = `piksend_viewed_${initialGallery.id}`;
  const alreadyViewed = sessionStorage.getItem(viewKey);
  
  // Évite de compter plusieurs fois la même session
  if (isAuthenticated && !viewTracked.current && !alreadyViewed) {
    viewTracked.current = true;
    sessionStorage.setItem(viewKey, 'true');
    
    // Appel API pour incrémenter le compteur
    fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.views_count) {
          setViewsCount(data.views_count);
        }
      })
      .catch(console.error);
  }
}, [isAuthenticated, initialGallery.id]);
```

**Comportement** :
- ✅ Track uniquement après authentification (mot de passe validé)
- ✅ Une seule vue par session (via sessionStorage)
- ✅ Ne compte pas les galeries expirées ou inactives
- ✅ Mise à jour en temps réel du compteur

#### Étape 2 : API de Tracking Simple

**Fichier** : `src/app/api/galleries/[id]/view/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = createAdminClient();

  // 1. Récupère la galerie
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, views_count, is_active, expires_at')
    .eq('id', id)
    .single();

  // 2. Vérifie que la galerie est accessible
  const isExpired = new Date(gallery.expires_at) < new Date();
  if (!gallery.is_active || isExpired) {
    return NextResponse.json({ error: 'Gallery not accessible' }, { status: 403 });
  }

  // 3. Incrémente le compteur
  await supabase
    .from('galleries')
    .update({ views_count: (gallery.views_count || 0) + 1 })
    .eq('id', id);

  return NextResponse.json({ 
    success: true,
    views_count: (gallery.views_count || 0) + 1 
  });
}
```

**Limitations** :
- ❌ Ne capture PAS l'IP du visiteur
- ❌ Ne capture PAS le user agent
- ❌ Ne capture PAS le pays
- ❌ N'enregistre PAS dans `gallery_analytics`

#### Étape 3 : API de Tracking Avancée (Disponible mais non utilisée)

**Fichier** : `src/app/api/galleries/[id]/analytics/route.ts`

```typescript
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  
  // Extraction de l'IP depuis les headers
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] 
    || request.headers.get('x-real-ip') 
    || body.ip;
  
  const userAgent = request.headers.get('user-agent') || body.userAgent;
  
  // Utilise le service analytics
  const analyticsService = createAnalyticsService(supabase);
  await analyticsService.trackView(id, {
    ip,
    userAgent,
    countryCode: body.countryCode, // Nécessite géolocalisation côté client
  });
  
  return NextResponse.json({ success: true });
}
```

**Avantages** :
- ✅ Capture l'IP (hashée pour RGPD)
- ✅ Capture le user agent
- ✅ Enregistre dans `gallery_analytics`
- ✅ Permet analytics détaillées

**Problème** :
- ❌ **NON UTILISÉE** actuellement dans le code client
- ❌ Nécessite géolocalisation IP (service externe)


### 3. Service Analytics

**Fichier** : `src/lib/services/analytics.service.ts`

#### Méthode `trackView()`

```typescript
async trackView(galleryId: string, metadata: ViewMetadata): Promise<void> {
  // 1. Valide que la galerie existe
  const { data: gallery } = await this.supabase
    .from('galleries')
    .select('id')
    .eq('id', galleryId)
    .single();

  // 2. Insère un enregistrement dans gallery_analytics
  await this.supabase
    .from('gallery_analytics')
    .insert({
      gallery_id: galleryId,
      visitor_ip: metadata.ip || null,
      country_code: metadata.countryCode || null,
      user_agent: metadata.userAgent || null,
    });

  // 3. Met à jour le compteur dans galleries
  const viewCount = await this.getViewCount(galleryId);
  await this.supabase
    .from('galleries')
    .update({ views_count: viewCount })
    .eq('id', galleryId);
}
```

#### Méthode `getGalleryStats()`

```typescript
async getGalleryStats(galleryId: string): Promise<GalleryStats> {
  // 1. Récupère tous les enregistrements analytics
  const { data: analytics } = await this.supabase
    .from('gallery_analytics')
    .select('*')
    .eq('gallery_id', galleryId)
    .order('viewed_at', { ascending: false });

  // 2. Calcule les métriques
  const totalViews = analytics.length;
  
  // Visiteurs uniques (par IP)
  const uniqueIPs = new Set(analytics.map(a => a.visitor_ip));
  const uniqueVisitors = uniqueIPs.size;
  
  // Vues par pays
  const viewsByCountry: Record<string, number> = {};
  analytics.forEach(a => {
    if (a.country_code) {
      viewsByCountry[a.country_code] = (viewsByCountry[a.country_code] || 0) + 1;
    }
  });
  
  // Vues par date (30 derniers jours)
  const viewsByDate = calculateViewsByDate(analytics);
  
  // 3. Récupère les métriques complémentaires
  const favoritesCount = await getFavoritesCount(galleryId);
  const commentsCount = await getCommentsCount(galleryId);
  
  return {
    totalViews,
    uniqueVisitors,
    viewsByCountry,
    viewsByDate,
    ctaClicks: 0, // TODO: À implémenter
    favoritesCount,
    commentsCount,
  };
}
```

### 4. Affichage dans le Dashboard

**Fichier** : `src/app/(dashboard)/dashboard/gallery/[id]/analytics/analytics-client.tsx`

#### Composant Client

```typescript
export function AnalyticsClient({ gallery }: AnalyticsClientProps) {
  const [stats, setStats] = useState<GalleryStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      // Appel API pour récupérer les stats
      const response = await fetch(`/api/galleries/${gallery.id}/analytics`);
      const data = await response.json();
      setStats(data.stats);
    }
    fetchStats();
  }, [gallery.id]);

  return (
    <div>
      {/* Cartes de métriques */}
      <StatsCard title="Total Views" value={stats.totalViews} icon={Eye} />
      <StatsCard title="Unique Visitors" value={stats.uniqueVisitors} icon={Users} />
      <StatsCard title="Favorites" value={stats.favoritesCount} icon={Heart} />
      <StatsCard title="Comments" value={stats.commentsCount} icon={MessageSquare} />
      
      {/* Graphique des vues dans le temps */}
      <ViewsChart data={stats.viewsByDate} />
      
      {/* Carte géographique */}
      <CountryMap data={stats.viewsByCountry} />
    </div>
  );
}
```

#### Métriques Affichées

1. **Total Views** : Nombre total de vues (depuis `gallery_analytics`)
2. **Unique Visitors** : Nombre d'IPs uniques
3. **Favorites** : Nombre de photos mises en favoris
4. **Comments** : Nombre de commentaires sur les photos
5. **Views Over Time** : Graphique linéaire des vues sur 30 jours
6. **Geographic Distribution** : Carte des pays avec nombre de vues

## Problèmes Actuels

### 1. Tracking Incomplet

**Problème** : Le code client utilise `/api/galleries/[id]/view` (simple) au lieu de `/api/galleries/[id]/analytics` (avancé)

**Impact** :
- ❌ Pas de données dans `gallery_analytics`
- ❌ Pas d'IP trackée
- ❌ Pas de user agent
- ❌ Pas de pays
- ❌ Dashboard analytics affiche des données vides ou incorrectes

**Solution** :
```typescript
// Dans gallery-view-client.tsx, remplacer :
fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' })

// Par :
fetch(`/api/galleries/${initialGallery.id}/analytics`, { 
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userAgent: navigator.userAgent,
    // countryCode sera détecté côté serveur via IP
  })
})
```

### 2. Géolocalisation IP Manquante

**Problème** : Le code extrait l'IP mais ne la géolocalise pas

**Impact** :
- ❌ `country_code` reste NULL
- ❌ Carte géographique vide

**Solutions possibles** :

#### Option A : Service externe (Recommandé)

**Services de géolocalisation IP :**
- **ipapi.co** : 1000 requêtes/jour gratuites
- **ip-api.com** : 45 requêtes/minute gratuites
- **MaxMind GeoLite2** : Base de données locale (gratuite)

**Implémentation avec ipapi.co :**
```typescript
// src/lib/services/geolocation.service.ts
export async function getCountryFromIP(ip: string): Promise<string | null> {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/country/`);
    if (response.ok) {
      return await response.text(); // Retourne "FR", "US", etc.
    }
  } catch (error) {
    console.error('Geolocation error:', error);
  }
  return null;
}

// Dans analytics route
const countryCode = await getCountryFromIP(ip);
await analyticsService.trackView(galleryId, {
  ip,
  userAgent,
  countryCode,
});
```

#### Option B : Cloudflare (Si hébergé sur Cloudflare)

Cloudflare ajoute automatiquement le header `CF-IPCountry` :

```typescript
const countryCode = request.headers.get('cf-ipcountry');
```

#### Option C : Base de données locale (MaxMind)

```bash
npm install maxmind
```

```typescript
import maxmind, { CityResponse } from 'maxmind';

const lookup = await maxmind.open<CityResponse>('./GeoLite2-City.mmdb');
const geo = lookup.get(ip);
const countryCode = geo?.country?.iso_code;
```

### 3. Visiteurs Uniques Imprécis

**Problème** : Utilise l'IP pour identifier les visiteurs uniques

**Limitations** :
- Plusieurs personnes derrière le même NAT = 1 visiteur
- VPN/Proxy = IP changeante
- Mobile 4G = IP changeante

**Solutions** :

#### Option A : Fingerprinting (Recommandé)

```typescript
// Côté client
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

#### Option B : Cookies/LocalStorage

```typescript
// Générer un UUID unique par visiteur
let visitorId = localStorage.getItem('piksend_visitor_id');
if (!visitorId) {
  visitorId = crypto.randomUUID();
  localStorage.setItem('piksend_visitor_id', visitorId);
}
```

### 4. Pas de Tracking des Actions

**Manque** :
- ❌ Clics sur les photos (ouverture lightbox)
- ❌ Téléchargements
- ❌ Clics sur CTA
- ❌ Temps passé sur la galerie
- ❌ Photos les plus vues

**Solution** : Ajouter des événements

```typescript
// Table gallery_events
CREATE TABLE gallery_events (
  id UUID PRIMARY KEY,
  gallery_id UUID REFERENCES galleries(id),
  visitor_id VARCHAR(255),
  event_type VARCHAR(50), -- 'view', 'lightbox_open', 'download', 'cta_click'
  event_data JSONB,       -- { imageId, duration, etc. }
  created_at TIMESTAMP DEFAULT NOW()
);
```


## Améliorations Recommandées

### Phase 1 : Corriger le Tracking Basique (1 jour)

**Priorité** : 🔴 CRITIQUE

1. **Utiliser l'API analytics au lieu de view**
   ```typescript
   // gallery-view-client.tsx
   fetch(`/api/galleries/${initialGallery.id}/analytics`, { 
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       userAgent: navigator.userAgent,
     })
   })
   ```

2. **Ajouter la géolocalisation IP**
   - Intégrer ipapi.co ou ip-api.com
   - Extraire le pays depuis l'IP
   - Stocker dans `country_code`

3. **Tester le dashboard analytics**
   - Vérifier que les données s'affichent
   - Vérifier la carte géographique
   - Vérifier le graphique des vues

### Phase 2 : Améliorer la Précision (2 jours)

**Priorité** : 🟠 IMPORTANT

1. **Fingerprinting des visiteurs**
   - Installer `@fingerprintjs/fingerprintjs`
   - Générer un ID unique par navigateur
   - Remplacer l'IP pour compter les visiteurs uniques

2. **Ajouter un champ `visitor_id` dans `gallery_analytics`**
   ```sql
   ALTER TABLE gallery_analytics 
   ADD COLUMN visitor_id VARCHAR(255);
   
   CREATE INDEX idx_gallery_analytics_visitor_id 
   ON gallery_analytics(visitor_id);
   ```

3. **Mettre à jour le calcul des visiteurs uniques**
   ```typescript
   const uniqueVisitors = new Set(
     analytics.map(a => a.visitor_id || a.visitor_ip)
   ).size;
   ```

### Phase 3 : Tracking des Actions (2-3 jours)

**Priorité** : 🟡 SOUHAITABLE

1. **Créer la table `gallery_events`**
   ```sql
   CREATE TABLE gallery_events (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
     visitor_id VARCHAR(255),
     event_type VARCHAR(50) NOT NULL,
     event_data JSONB,
     created_at TIMESTAMP DEFAULT NOW(),
     
     INDEX idx_gallery_events_gallery_id (gallery_id),
     INDEX idx_gallery_events_type (event_type),
     INDEX idx_gallery_events_created_at (created_at)
   );
   ```

2. **Tracker les événements clés**
   ```typescript
   // Ouverture lightbox
   const trackLightboxOpen = (imageId: string) => {
     fetch('/api/galleries/[id]/events', {
       method: 'POST',
       body: JSON.stringify({
         eventType: 'lightbox_open',
         eventData: { imageId }
       })
     });
   };
   
   // Téléchargement
   const trackDownload = (imageId: string, type: 'single' | 'all') => {
     fetch('/api/galleries/[id]/events', {
       method: 'POST',
       body: JSON.stringify({
         eventType: 'download',
         eventData: { imageId, type }
       })
     });
   };
   
   // Clic CTA
   const trackCTAClick = () => {
     fetch('/api/galleries/[id]/events', {
       method: 'POST',
       body: JSON.stringify({
         eventType: 'cta_click'
       })
     });
   };
   ```

3. **Afficher dans le dashboard**
   - Photos les plus vues (lightbox_open)
   - Taux de téléchargement
   - Taux de clic CTA
   - Engagement moyen

### Phase 4 : Analytics Avancées (3-4 jours)

**Priorité** : 🟢 NICE TO HAVE

1. **Temps passé sur la galerie**
   ```typescript
   // Tracker le temps de session
   let sessionStart = Date.now();
   
   window.addEventListener('beforeunload', () => {
     const duration = Date.now() - sessionStart;
     navigator.sendBeacon(
       `/api/galleries/${galleryId}/events`,
       JSON.stringify({
         eventType: 'session_end',
         eventData: { duration }
       })
     );
   });
   ```

2. **Heatmap des clics**
   - Tracker les clics sur les photos
   - Afficher une heatmap dans le dashboard
   - Identifier les zones chaudes

3. **Funnel de conversion**
   - Vue → Lightbox → Téléchargement
   - Vue → CTA → Conversion
   - Taux d'abandon à chaque étape

4. **Comparaison de galeries**
   - Comparer les performances de plusieurs galeries
   - Identifier les meilleures pratiques
   - Suggestions d'amélioration

## Conformité RGPD

### Données Personnelles Collectées

**Données trackées :**
- ✅ IP (hashée)
- ✅ User Agent
- ✅ Pays
- ✅ Visitor ID (fingerprint)
- ✅ Événements (clics, téléchargements)

**Données NON collectées :**
- ❌ Nom/Email (sauf si fourni volontairement)
- ❌ Données sensibles

### Obligations RGPD

1. **Consentement**
   - Afficher un banner de cookies
   - Demander le consentement pour analytics
   - Permettre de refuser

2. **Transparence**
   - Politique de confidentialité claire
   - Expliquer quelles données sont collectées
   - Expliquer pourquoi et comment

3. **Droits de l'utilisateur**
   - Droit d'accès (voir ses données)
   - Droit de rectification
   - Droit à l'oubli (suppression)
   - Droit à la portabilité

4. **Sécurité**
   - Hasher les IPs
   - Chiffrer les données sensibles
   - Limiter l'accès aux données

### Implémentation du Consentement

```typescript
// Cookie consent banner
import { CookieConsent } from '@/components/cookie-consent';

export function GalleryView() {
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
      // Track basique uniquement (compteur)
      fetch('/api/galleries/[id]/view', { method: 'POST' });
    }
  };
  
  return (
    <>
      <CookieConsent onAccept={() => setHasConsent(true)} />
      {/* ... */}
    </>
  );
}
```

## Alternatives : Services Tiers

### Option A : Google Analytics 4

**Avantages :**
- ✅ Gratuit
- ✅ Très complet
- ✅ Intégration facile
- ✅ Rapports avancés

**Inconvénients :**
- ❌ Données hébergées chez Google
- ❌ Complexe à configurer
- ❌ Problèmes RGPD potentiels

**Implémentation :**
```typescript
import { GoogleAnalytics } from '@next/third-parties/google';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <GoogleAnalytics gaId="G-XXXXXXXXXX" />
      </body>
    </html>
  );
}
```

### Option B : Plausible Analytics

**Avantages :**
- ✅ Privacy-first (conforme RGPD)
- ✅ Simple et léger
- ✅ Pas de cookies
- ✅ Dashboard clair

**Inconvénients :**
- ❌ Payant ($9/mois)
- ❌ Moins de fonctionnalités que GA

**Implémentation :**
```html
<script defer data-domain="piksend.com" src="https://plausible.io/js/script.js"></script>
```

### Option C : Mixpanel

**Avantages :**
- ✅ Tracking d'événements avancé
- ✅ Funnels et cohortes
- ✅ A/B testing

**Inconvénients :**
- ❌ Payant (gratuit jusqu'à 100k événements/mois)
- ❌ Complexe

### Recommandation

**Pour PikSend :**
- ✅ **Solution custom** (actuelle) pour le contrôle total
- ✅ **Plausible** en complément pour analytics globales
- ❌ Éviter Google Analytics (RGPD, complexité)

## Métriques Clés à Suivre

### Pour le Photographe

**Engagement :**
- Nombre de vues
- Visiteurs uniques
- Temps moyen passé
- Taux de rebond

**Actions :**
- Photos les plus vues
- Nombre de téléchargements
- Favoris ajoutés
- Commentaires laissés

**Conversion :**
- Taux de clic CTA
- Taux de conversion (si paywall)
- Revenus générés

**Géographie :**
- Pays des visiteurs
- Villes (si disponible)

### Pour PikSend (Admin)

**Utilisation :**
- Galeries actives
- Vues totales
- Utilisateurs actifs

**Performance :**
- Temps de chargement
- Taux d'erreur
- Uptime

**Business :**
- Conversions Free → Premium
- Revenus mensuels
- Churn rate

## Résumé

### État Actuel

✅ **Ce qui fonctionne :**
- Compteur de vues basique
- Dashboard analytics (structure)
- Service analytics (code)

❌ **Ce qui ne fonctionne pas :**
- Tracking avancé non utilisé
- Pas de géolocalisation IP
- Pas de tracking d'événements
- Dashboard affiche des données vides

### Actions Prioritaires

1. **Immédiat** : Utiliser l'API analytics au lieu de view
2. **Court terme** : Ajouter géolocalisation IP
3. **Moyen terme** : Fingerprinting visiteurs
4. **Long terme** : Tracking d'événements avancé

### Estimation

- **Phase 1** (Corriger basique) : 1 jour
- **Phase 2** (Améliorer précision) : 2 jours
- **Phase 3** (Tracking actions) : 2-3 jours
- **Phase 4** (Analytics avancées) : 3-4 jours

**Total** : 8-10 jours de développement

---

**Document créé le** : Janvier 2026  
**Version** : 1.0.0  
**Statut** : Documentation technique complète  
**Auteur** : Équipe PikSend
