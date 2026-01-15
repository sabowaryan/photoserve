# Spécification : Profil Public Photographe Pro

## Vue d'ensemble

Cette spécification décrit l'implémentation d'une **page de profil publique** pour les photographes avec un plan Pro. Cette page sert de vitrine professionnelle présentant leur portfolio, leurs galeries et leurs informations de contact.

## Objectifs

### Objectif principal
Permettre aux photographes Pro de disposer d'une **page vitrine professionnelle** accessible publiquement, renforçant leur présence en ligne et facilitant la découverte de leur travail.

### Objectifs secondaires
1. **SEO** : Améliorer le référencement du photographe
2. **Branding** : Appliquer le branding personnalisé (logo, couleurs, domaine)
3. **Portfolio** : Présenter les meilleures galeries
4. **Contact** : Faciliter la prise de contact
5. **Conversion** : Inciter les visiteurs à devenir clients

## Requirement

**Requirement 5.4** - Page de profil pro (Plan Pro uniquement)

## Fonctionnalités

### 1. URL & Routing

#### Option 1 : Sous-domaine PikSend (par défaut)
```
https://piksend.com/p/[username]
https://piksend.com/photographer/[username]
```

#### Option 2 : Domaine personnalisé (si configuré)
```
https://photos.johndoe.com
https://johndoe.com
```

#### Slug utilisateur
- Basé sur le nom d'utilisateur ou personnalisable
- Format : lettres minuscules, chiffres, tirets
- Unique dans la base de données
- Exemple : `john-doe`, `studio-martin`, `wedding-photos`

### 2. Contenu de la page

#### 2.1 Header / Hero Section

**Éléments affichés :**
- Photo de profil / Avatar (optionnel)
- Logo personnalisé (si configuré)
- Nom du photographe / Studio
- Slogan / Tagline (optionnel)
- Localisation (ville, pays)
- Photo de couverture / Hero image (optionnel)

**Design :**
- Hero section avec image de fond ou gradient
- Overlay semi-transparent pour lisibilité
- Centré et responsive
- Animation d'entrée élégante

#### 2.2 Bio / À propos

**Éléments affichés :**
- Texte de présentation (markdown supporté)
- Spécialités / Services (tags)
- Années d'expérience
- Récompenses / Certifications (optionnel)

**Limite :**
- Bio : 500 caractères maximum
- Spécialités : 5 tags maximum

#### 2.3 Galeries publiques

**Affichage :**
- Grille de cartes de galeries (2-4 colonnes selon écran)
- Tri : Plus récentes en premier, ou ordre personnalisé
- Filtres : Par catégorie, date, événement
- Pagination ou infinite scroll

**Carte de galerie :**
- Image de couverture (première image de la galerie)
- Titre de la galerie
- Date de création
- Nombre d'images
- Badge "Nouveau" si < 7 jours
- Hover : Overlay avec bouton "Voir la galerie"

**Visibilité :**
- Seules les galeries **actives** et **non expirées** sont affichées
- Option pour masquer certaines galeries du profil public
- Galeries protégées par mot de passe : affichées avec icône cadenas

#### 2.4 Contact & Réseaux sociaux

**Informations de contact :**
- Email professionnel (avec protection anti-spam)
- Téléphone (optionnel)
- Site web (optionnel)
- Adresse physique (optionnel)

**Réseaux sociaux :**
- Instagram
- Facebook
- Pinterest
- LinkedIn
- TikTok
- YouTube
- Autres (URL personnalisée)

**Bouton CTA principal :**
- "Me contacter"
- "Réserver une séance"
- "Demander un devis"
- Personnalisable (texte + lien)

#### 2.5 Témoignages (optionnel)

**Affichage :**
- Carrousel de témoignages clients
- 3-5 témoignages maximum
- Photo du client (optionnel)
- Nom du client
- Note (étoiles)
- Texte du témoignage

**Source :**
- Importés manuellement
- Ou collectés via le système de testimonials (Requirement 8.3)

#### 2.6 Footer

**Éléments :**
- Copyright avec nom du photographe
- Liens légaux (CGU, Politique de confidentialité)
- Liens réseaux sociaux (répétés)
- Badge "Propulsé par PikSend" (si pas de domaine custom)
- Ou footer white-label (si domaine custom)

### 3. Configuration du profil

#### 3.1 Paramètres dans le dashboard

**Section : Paramètres → Profil Public**

**Champs configurables :**

```typescript
interface PublicProfileSettings {
  // Activation
  isPublicProfileEnabled: boolean; // Toggle pour activer/désactiver
  
  // Identité
  profileSlug: string; // URL slug (ex: john-doe)
  displayName: string; // Nom affiché
  tagline?: string; // Slogan (max 100 caractères)
  bio?: string; // Présentation (max 500 caractères, markdown)
  location?: string; // Ville, Pays
  
  // Médias
  avatarUrl?: string; // Photo de profil
  coverImageUrl?: string; // Image de couverture hero
  
  // Spécialités
  specialties?: string[]; // Tags (max 5)
  yearsOfExperience?: number;
  awards?: string[]; // Récompenses (max 3)
  
  // Contact
  publicEmail?: string; // Email public (peut être différent du compte)
  phone?: string;
  website?: string;
  address?: string;
  
  // Réseaux sociaux
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    pinterest?: string;
    linkedin?: string;
    tiktok?: string;
    youtube?: string;
    other?: string;
  };
  
  // CTA
  ctaButton?: {
    text: string; // Ex: "Me contacter"
    url: string; // URL ou email
    style: 'primary' | 'secondary'; // Style du bouton
  };
  
  // Témoignages
  testimonials?: Array<{
    id: string;
    clientName: string;
    clientPhoto?: string;
    rating: number; // 1-5
    text: string; // Max 200 caractères
    date: string;
  }>;
  
  // Galeries
  featuredGalleries?: string[]; // IDs des galeries mises en avant
  hideGalleriesFromProfile?: string[]; // IDs des galeries à masquer
  
  // SEO
  metaTitle?: string; // Titre SEO (max 60 caractères)
  metaDescription?: string; // Description SEO (max 160 caractères)
  metaKeywords?: string[]; // Mots-clés SEO
}
```

#### 3.2 Interface de configuration

**Onglets :**
1. **Général** : Activation, slug, nom, tagline, bio
2. **Médias** : Avatar, cover image
3. **Contact** : Email, téléphone, réseaux sociaux, CTA
4. **Galeries** : Sélection des galeries à afficher, ordre
5. **Témoignages** : Gestion des témoignages
6. **SEO** : Meta tags, mots-clés

**Prévisualisation :**
- Bouton "Prévisualiser" pour voir le profil avant publication
- Lien direct vers le profil public

### 4. Branding & Design

#### 4.1 Application du branding

**Si l'utilisateur a configuré son branding (Requirement 5.1-5.3) :**
- Logo personnalisé dans le header
- Couleurs de marque appliquées (primary, secondary, accent)
- Domaine personnalisé utilisé
- Footer white-label

**Sinon :**
- Logo PikSend
- Couleurs par défaut
- URL piksend.com/p/[username]
- Footer avec mention PikSend

#### 4.2 Thème

**Mode clair/sombre :**
- Détection automatique de la préférence système
- Toggle manuel pour changer de mode
- Persistance dans localStorage

**Responsive :**
- Mobile-first design
- Breakpoints : 640px, 768px, 1024px, 1280px
- Navigation adaptative

### 5. SEO & Performance

#### 5.1 SEO

**Meta tags :**
```html
<title>{metaTitle || displayName + " - Photographe Professionnel"}</title>
<meta name="description" content="{metaDescription || bio}" />
<meta name="keywords" content="{metaKeywords.join(', ')}" />
<meta property="og:title" content="{displayName}" />
<meta property="og:description" content="{bio}" />
<meta property="og:image" content="{coverImageUrl || avatarUrl}" />
<meta property="og:type" content="profile" />
<meta name="twitter:card" content="summary_large_image" />
```

**Structured Data (JSON-LD) :**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{displayName}",
  "jobTitle": "Photographe Professionnel",
  "description": "{bio}",
  "image": "{avatarUrl}",
  "url": "{profileUrl}",
  "sameAs": [
    "{instagram}",
    "{facebook}",
    ...
  ],
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "{location}"
  }
}
```

**Sitemap :**
- Ajouter les profils publics au sitemap.xml
- Priorité : 0.8
- Fréquence de mise à jour : weekly

#### 5.2 Performance

**Optimisations :**
- Images optimisées via Cloudinary (WebP, lazy loading)
- Code splitting par route
- Prefetch des galeries au hover
- Cache CDN pour les profils publics
- SSG (Static Site Generation) pour les profils Pro

**Métriques cibles :**
- LCP (Largest Contentful Paint) : < 2.5s
- FID (First Input Delay) : < 100ms
- CLS (Cumulative Layout Shift) : < 0.1

### 6. Sécurité & Confidentialité

#### 6.1 Protection des données

**Email :**
- Affichage avec protection anti-spam (ex: john[at]example[dot]com)
- Ou formulaire de contact sans exposer l'email

**Téléphone :**
- Optionnel, affiché uniquement si l'utilisateur le souhaite
- Format international

**Adresse :**
- Optionnelle, peut être partielle (ville uniquement)

#### 6.2 Contrôle de visibilité

**Galeries :**
- L'utilisateur peut masquer certaines galeries du profil public
- Galeries expirées automatiquement masquées
- Galeries inactives automatiquement masquées

**Profil :**
- Toggle pour activer/désactiver complètement le profil public
- Si désactivé : page 404 ou message "Profil non disponible"

### 7. Analytics

#### 7.1 Statistiques du profil

**Métriques trackées :**
- Nombre de visites du profil
- Pages vues
- Taux de rebond
- Durée moyenne de visite
- Clics sur les galeries
- Clics sur le CTA
- Clics sur les réseaux sociaux
- Origine du trafic (direct, recherche, réseaux sociaux)

**Dashboard :**
- Section "Analytics" dans les paramètres du profil
- Graphiques de visites (jour, semaine, mois)
- Top galeries les plus vues
- Taux de conversion (visites → clics CTA)

#### 7.2 Tracking

**Implémentation :**
- Google Analytics (optionnel, configuré par l'utilisateur)
- Tracking interne PikSend (anonymisé)
- Respect RGPD (consentement cookies)


## Architecture technique

### 8.1 Structure de fichiers

```
src/
├── app/
│   ├── p/
│   │   └── [slug]/
│   │       ├── page.tsx              # Page du profil public
│   │       ├── loading.tsx           # Loading state
│   │       └── not-found.tsx         # 404 si profil inexistant
│   └── (dashboard)/
│       └── settings/
│           └── public-profile/
│               ├── page.tsx          # Configuration du profil
│               └── preview/
│                   └── page.tsx      # Prévisualisation
├── components/
│   └── public-profile/
│       ├── profile-header.tsx        # Hero section
│       ├── profile-bio.tsx           # Section bio
│       ├── profile-galleries.tsx     # Grille de galeries
│       ├── profile-contact.tsx       # Section contact
│       ├── profile-testimonials.tsx  # Carrousel témoignages
│       └── profile-footer.tsx        # Footer
├── lib/
│   ├── repositories/
│   │   └── public-profile.repository.ts  # Accès DB
│   └── services/
│       └── public-profile.service.ts     # Logique métier
└── types/
    └── public-profile.ts             # Types TypeScript
```

### 8.2 Base de données

#### Table : `public_profiles`

```sql
CREATE TABLE public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Activation
  is_enabled BOOLEAN DEFAULT false,
  
  -- Identité
  slug VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  tagline VARCHAR(100),
  bio TEXT,
  location VARCHAR(200),
  
  -- Médias
  avatar_url TEXT,
  cover_image_url TEXT,
  
  -- Spécialités
  specialties TEXT[], -- Array de tags
  years_of_experience INTEGER,
  awards TEXT[],
  
  -- Contact
  public_email VARCHAR(255),
  phone VARCHAR(50),
  website TEXT,
  address TEXT,
  
  -- Réseaux sociaux (JSONB)
  social_links JSONB,
  
  -- CTA (JSONB)
  cta_button JSONB,
  
  -- Témoignages (JSONB)
  testimonials JSONB,
  
  -- Galeries
  featured_galleries UUID[],
  hidden_galleries UUID[],
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT[],
  
  -- Analytics
  views_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_user_profile UNIQUE(user_id),
  CONSTRAINT unique_slug UNIQUE(slug)
);

-- Index pour recherche rapide par slug
CREATE INDEX idx_public_profiles_slug ON public_profiles(slug);
CREATE INDEX idx_public_profiles_user_id ON public_profiles(user_id);
CREATE INDEX idx_public_profiles_enabled ON public_profiles(is_enabled);
```

#### Table : `profile_views` (Analytics)

```sql
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  
  -- Tracking
  visitor_ip VARCHAR(45), -- Hashé pour RGPD
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Actions
  galleries_viewed UUID[],
  cta_clicked BOOLEAN DEFAULT false,
  social_links_clicked TEXT[],
  
  -- Timestamps
  viewed_at TIMESTAMP DEFAULT NOW(),
  session_duration INTEGER, -- En secondes
  
  -- Index
  CREATE INDEX idx_profile_views_profile_id ON profile_views(profile_id);
  CREATE INDEX idx_profile_views_date ON profile_views(viewed_at);
);
```

### 8.3 API Routes

#### GET `/api/public-profile/[slug]`
**Description :** Récupère les données d'un profil public

**Réponse :**
```typescript
{
  profile: PublicProfile;
  galleries: PublicGallery[];
  stats: {
    totalViews: number;
    totalGalleries: number;
  };
}
```

#### PUT `/api/public-profile`
**Description :** Met à jour le profil public de l'utilisateur connecté

**Body :**
```typescript
{
  settings: PublicProfileSettings;
}
```

#### POST `/api/public-profile/track-view`
**Description :** Enregistre une visite du profil (analytics)

**Body :**
```typescript
{
  profileSlug: string;
  referrer?: string;
  action?: 'view' | 'cta_click' | 'social_click' | 'gallery_view';
}
```

#### GET `/api/public-profile/check-slug`
**Description :** Vérifie la disponibilité d'un slug

**Query :**
```
?slug=john-doe
```

**Réponse :**
```typescript
{
  available: boolean;
  suggestions?: string[]; // Si non disponible
}
```

### 8.4 Composants React

#### ProfileHeader

```typescript
interface ProfileHeaderProps {
  displayName: string;
  tagline?: string;
  location?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  customLogo?: string;
  brandColors?: BrandColors;
}
```

#### ProfileGalleries

```typescript
interface ProfileGalleriesProps {
  galleries: PublicGallery[];
  onGalleryClick: (slug: string) => void;
  layout: 'grid' | 'masonry';
  columns: 2 | 3 | 4;
}
```

#### ProfileContact

```typescript
interface ProfileContactProps {
  email?: string;
  phone?: string;
  website?: string;
  socialLinks?: SocialLinks;
  ctaButton?: CTAButton;
  onCTAClick: () => void;
}
```

### 8.5 Hooks personnalisés

#### usePublicProfile

```typescript
function usePublicProfile(slug: string) {
  const { data, isLoading, error } = useSWR(
    `/api/public-profile/${slug}`,
    fetcher
  );
  
  return {
    profile: data?.profile,
    galleries: data?.galleries,
    stats: data?.stats,
    isLoading,
    error,
  };
}
```

#### useProfileAnalytics

```typescript
function useProfileAnalytics(profileId: string) {
  const trackView = async () => {
    await fetch('/api/public-profile/track-view', {
      method: 'POST',
      body: JSON.stringify({ profileSlug: slug }),
    });
  };
  
  const trackCTAClick = async () => {
    await fetch('/api/public-profile/track-view', {
      method: 'POST',
      body: JSON.stringify({ 
        profileSlug: slug,
        action: 'cta_click'
      }),
    });
  };
  
  return { trackView, trackCTAClick };
}
```

## User Flow

### 9.1 Configuration du profil (Photographe)

```
1. Dashboard → Paramètres → Profil Public
2. Toggle "Activer mon profil public"
3. Choisir un slug unique (ex: john-doe)
4. Remplir les informations :
   - Nom, tagline, bio
   - Upload avatar et cover image
   - Ajouter spécialités
   - Configurer contact et réseaux sociaux
   - Définir le CTA
5. Sélectionner les galeries à afficher
6. Ajouter des témoignages (optionnel)
7. Configurer le SEO
8. Prévisualiser
9. Publier
10. Partager le lien du profil
```

### 9.2 Visite du profil (Visiteur)

```
1. Accès via :
   - URL directe (piksend.com/p/john-doe)
   - Domaine custom (photos.johndoe.com)
   - Recherche Google
   - Réseaux sociaux
   
2. Arrivée sur le profil :
   - Hero section avec nom et tagline
   - Scroll pour découvrir la bio
   - Voir les galeries disponibles
   
3. Actions possibles :
   - Cliquer sur une galerie → Ouvre la galerie
   - Cliquer sur CTA → Contact ou réservation
   - Cliquer sur réseaux sociaux → Profils externes
   - Lire les témoignages
   
4. Tracking :
   - Visite enregistrée (analytics)
   - Actions trackées (clics CTA, galeries vues)
```

## Tests

### 10.1 Tests unitaires

**À tester :**
- Validation du slug (format, unicité)
- Validation des champs (longueur, format)
- Génération des meta tags SEO
- Formatage des données de contact
- Filtrage des galeries (actives, non expirées)

### 10.2 Tests d'intégration

**À tester :**
- Création d'un profil public
- Mise à jour du profil
- Récupération du profil par slug
- Tracking des visites
- Application du branding personnalisé

### 10.3 Tests E2E

**Scénarios :**
1. Photographe crée son profil public
2. Photographe personnalise son profil
3. Visiteur accède au profil
4. Visiteur clique sur une galerie
5. Visiteur clique sur le CTA
6. Photographe consulte les analytics


## Wireframes & Design

### 11.1 Layout Desktop

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                                    [Mode ☀️/🌙]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              HERO SECTION (Cover Image)                     │
│                                                             │
│         [Avatar]                                            │
│      John Doe Photography                                   │
│   Capturing life's precious moments                         │
│        📍 Paris, France                                     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  À PROPOS                                                   │
│  ─────────                                                  │
│  Photographe professionnel spécialisé en mariages          │
│  et événements depuis 10 ans. Passionné par la             │
│  capture d'émotions authentiques...                        │
│                                                             │
│  🎯 Mariages  🎯 Portraits  🎯 Événements                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  MES GALERIES                                               │
│  ────────────                                               │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │      │
│  │ Mariage │  │ Portrait│  │ Baptême │  │ Famille │      │
│  │ Sophie  │  │ Studio  │  │ Emma    │  │ Martin  │      │
│  │ 150 📷  │  │ 45 📷   │  │ 80 📷   │  │ 60 📷   │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐      │
│  │ [Image] │  │ [Image] │  │ [Image] │  │ [Image] │      │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  TÉMOIGNAGES                                                │
│  ────────────                                               │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │ ⭐⭐⭐⭐⭐                                            │    │
│  │ "John a capturé notre mariage de façon            │    │
│  │  magnifique. Nous sommes ravis !"                 │    │
│  │                                    - Sophie & Marc │    │
│  └───────────────────────────────────────────────────┘    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  CONTACT                                                    │
│  ───────                                                    │
│                                                             │
│  📧 contact@johndoe.com                                     │
│  📱 +33 6 12 34 56 78                                       │
│  🌐 www.johndoe.com                                         │
│                                                             │
│  [Instagram] [Facebook] [Pinterest]                        │
│                                                             │
│  [📩 Me contacter]                                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  © 2026 John Doe Photography - Tous droits réservés        │
│  Mentions légales | Politique de confidentialité           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Layout Mobile

```
┌─────────────────────┐
│  [☰]  [Logo]  [🌙]  │
├─────────────────────┤
│                     │
│   HERO (Cover)      │
│                     │
│     [Avatar]        │
│   John Doe          │
│   Photography       │
│  📍 Paris, France   │
│                     │
├─────────────────────┤
│                     │
│  À PROPOS           │
│  ─────────          │
│  Bio text...        │
│                     │
│  🎯 Mariages        │
│  🎯 Portraits       │
│                     │
├─────────────────────┤
│                     │
│  MES GALERIES       │
│  ────────────       │
│                     │
│  ┌───────────────┐  │
│  │   [Image]     │  │
│  │   Mariage     │  │
│  │   Sophie      │  │
│  │   150 📷      │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │   [Image]     │  │
│  └───────────────┘  │
│                     │
├─────────────────────┤
│                     │
│  TÉMOIGNAGES        │
│  ────────────       │
│  [Carrousel]        │
│                     │
├─────────────────────┤
│                     │
│  CONTACT            │
│  ───────            │
│  📧 Email           │
│  📱 Téléphone       │
│                     │
│  [Instagram] [FB]   │
│                     │
│  [Me contacter]     │
│                     │
├─────────────────────┤
│  © 2026 John Doe    │
└─────────────────────┘
```

## Priorités d'implémentation

### Phase 1 : MVP (Minimum Viable Product)
**Durée estimée : 2-3 jours**

✅ **Essentiel :**
1. Route `/p/[slug]` avec page de profil
2. Configuration basique dans dashboard (slug, nom, bio)
3. Affichage des galeries publiques
4. Section contact avec email et réseaux sociaux
5. Application du branding (logo, couleurs)
6. Responsive mobile

### Phase 2 : Enrichissement
**Durée estimée : 2-3 jours**

✅ **Important :**
1. Hero section avec cover image et avatar
2. Spécialités et tags
3. Témoignages
4. CTA personnalisable
5. Prévisualisation du profil
6. SEO (meta tags, structured data)

### Phase 3 : Analytics & Optimisation
**Durée estimée : 1-2 jours**

✅ **Nice to have :**
1. Tracking des visites
2. Dashboard analytics
3. Filtres et tri des galeries
4. Galeries mises en avant
5. Optimisations performance (SSG, cache)

### Phase 4 : Avancé
**Durée estimée : 2-3 jours**

✅ **Optionnel :**
1. Formulaire de contact intégré
2. Réservation en ligne
3. Blog/Actualités
4. Galerie de photos mises en avant (best-of)
5. Intégration Google Analytics

## Dépendances

### Fonctionnalités requises (déjà implémentées)
- ✅ Branding personnalisé (5.1, 5.2, 5.3)
- ✅ Domaine personnalisé
- ✅ Système de galeries
- ✅ Plan Pro

### Bibliothèques tierces
- `react-markdown` : Rendu du bio en markdown
- `swiper` : Carrousel de témoignages
- `react-share` : Boutons de partage social
- `next-seo` : Gestion SEO avancée

## Considérations

### Accessibilité (A11y)
- Contraste des couleurs (WCAG AA minimum)
- Navigation au clavier
- Attributs ARIA appropriés
- Alt text sur toutes les images
- Focus visible sur les éléments interactifs

### Internationalisation (i18n)
- Support FR/EN minimum
- Traduction des labels et messages
- Format de date localisé
- Format de téléphone localisé

### RGPD
- Consentement cookies pour analytics
- Protection de l'email (anti-spam)
- Droit à l'oubli (suppression du profil)
- Anonymisation des données analytics

### Performance
- Images optimisées (WebP, lazy loading)
- Code splitting
- SSG pour les profils publics
- Cache CDN
- Prefetch des galeries

## Métriques de succès

### KPIs à suivre
1. **Adoption** : % d'utilisateurs Pro avec profil public activé
2. **Engagement** : Nombre moyen de visites par profil
3. **Conversion** : Taux de clics sur le CTA
4. **SEO** : Positionnement dans les résultats de recherche
5. **Satisfaction** : Feedback utilisateurs (NPS)

### Objectifs
- 50% des utilisateurs Pro activent leur profil dans le premier mois
- Moyenne de 100+ visites/mois par profil
- Taux de clic CTA > 10%
- Profils indexés dans Google sous 7 jours

## Ressources

### Documentation
- [Branding White-Label](./white-label-branding.md)
- [Domaine Personnalisé](./custom-domain-implementation.md)
- [Fonctionnalités par Plan](./FEATURES-BY-PLAN.md)

### Design
- Figma : [Lien vers les maquettes]
- Palette de couleurs : Tailwind CSS
- Typographie : Plus Jakarta Sans

### Références
- Requirement 5.4 : Page de profil pro
- Plan Pro : Fonctionnalités white-label

---

**Document créé le** : Janvier 2026  
**Version** : 1.0.0  
**Statut** : Spécification complète - Prêt pour implémentation  
**Auteur** : Équipe PikSend
