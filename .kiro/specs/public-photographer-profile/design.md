# Document de Conception

## Vue d'ensemble

Cette fonctionnalité permet aux photographes avec un plan Pro de créer et gérer une page de profil publique qui sert de vitrine professionnelle. Le profil affiche les informations du photographe, ses galeries publiques, ses coordonnées de contact, et applique son branding personnalisé. La solution est optimisée pour le SEO, le responsive design, et inclut un système d'analytics pour suivre les performances.

### Objectifs de Conception

1. **Simplicité**: Interface de configuration intuitive dans le dashboard
2. **Performance**: Chargement rapide avec SSG et optimisation des images
3. **Flexibilité**: Personnalisation complète du contenu et du branding
4. **Visibilité**: Optimisation SEO maximale pour améliorer le référencement
5. **Mesurabilité**: Analytics détaillés pour suivre l'engagement des visiteurs

## Architecture

### Architecture Globale

L'architecture suit le pattern Next.js App Router avec une séparation claire entre:
- **Pages publiques**: Profils accessibles sans authentification
- **Pages privées**: Dashboard de configuration nécessitant authentification
- **API Routes**: Endpoints pour CRUD et analytics
- **Services**: Logique métier réutilisable
- **Repositories**: Accès aux données avec Supabase

```
┌─────────────────────────────────────────────────────────────┐
│                        Visiteur                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js App Router (SSG/SSR)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /p/[slug]  →  Page Profil Public (SSG)             │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Routes                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GET  /api/public-profile/[slug]                     │   │
│  │  PUT  /api/public-profile                            │   │
│  │  POST /api/public-profile/track-view                 │   │
│  │  GET  /api/public-profile/check-slug                 │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Services Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PublicProfileService                                 │   │
│  │  - getProfileBySlug()                                 │   │
│  │  - updateProfile()                                    │   │
│  │  - trackView()                                        │   │
│  │  - checkSlugAvailability()                            │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Repository Layer                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PublicProfileRepository                              │   │
│  │  - findBySlug()                                       │   │
│  │  - create()                                           │   │
│  │  - update()                                           │   │
│  │  - delete()                                           │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Database                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tables:                                              │   │
│  │  - public_profiles                                    │   │
│  │  - profile_views                                      │   │
│  │  - profiles (existing)                                │   │
│  │  - galleries (existing)                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```


### Flux de Données

#### Flux de Consultation (Visiteur)
```
1. Visiteur → /p/[slug]
2. Next.js SSG → Récupération du profil depuis cache/DB
3. Vérification: profil actif et utilisateur Pro
4. Récupération des galeries publiques (actives, non expirées)
5. Application du branding personnalisé
6. Rendu de la page
7. Tracking de la visite (async)
```

#### Flux de Configuration (Photographe)
```
1. Photographe → Dashboard → Profil Public
2. Modification des paramètres
3. Validation côté client (temps réel)
4. Soumission → API Route
5. Validation côté serveur
6. Mise à jour en base de données
7. Invalidation du cache SSG
8. Confirmation à l'utilisateur
```

## Composants et Interfaces

### Structure des Composants

```
app/
├── p/
│   └── [slug]/
│       ├── page.tsx                    # Page profil public (SSG)
│       ├── loading.tsx                 # État de chargement
│       └── not-found.tsx               # 404 personnalisé
│
├── (dashboard)/
│   └── settings/
│       └── public-profile/
│           ├── page.tsx                # Configuration principale
│           ├── components/
│           │   ├── general-tab.tsx     # Onglet Général
│           │   ├── media-tab.tsx       # Onglet Médias
│           │   ├── contact-tab.tsx     # Onglet Contact
│           │   ├── galleries-tab.tsx   # Onglet Galeries
│           │   ├── testimonials-tab.tsx # Onglet Témoignages
│           │   └── seo-tab.tsx         # Onglet SEO
│           └── preview/
│               └── page.tsx            # Prévisualisation
│
└── api/
    └── public-profile/
        ├── [slug]/
        │   └── route.ts                # GET profil par slug
        ├── route.ts                    # PUT mise à jour profil
        ├── track-view/
        │   └── route.ts                # POST tracking visite
        └── check-slug/
            └── route.ts                # GET vérification slug

components/
└── public-profile/
    ├── profile-header.tsx              # Hero section avec avatar/cover
    ├── profile-bio.tsx                 # Section bio et spécialités
    ├── profile-galleries.tsx           # Grille de galeries
    ├── gallery-card.tsx                # Carte individuelle de galerie
    ├── profile-contact.tsx             # Section contact et CTA
    ├── profile-testimonials.tsx        # Carrousel de témoignages
    ├── testimonial-card.tsx            # Carte de témoignage
    ├── profile-footer.tsx              # Footer avec liens
    └── theme-toggle.tsx                # Toggle mode clair/sombre

lib/
├── services/
│   ├── public-profile.service.ts       # Logique métier
│   └── analytics.service.ts            # Service analytics
├── repositories/
│   ├── public-profile.repository.ts    # Accès DB profils
│   └── profile-views.repository.ts     # Accès DB analytics
├── validators/
│   └── public-profile.validator.ts     # Validation des données
└── utils/
    ├── slug.utils.ts                   # Utilitaires pour slugs
    └── seo.utils.ts                    # Génération meta tags

types/
└── public-profile.ts                   # Types TypeScript
```

### Interfaces TypeScript

#### PublicProfile
```typescript
interface PublicProfile {
  id: string;
  userId: string;
  isEnabled: boolean;
  
  // Identité
  slug: string;
  displayName: string;
  tagline?: string;
  bio?: string;
  location?: string;
  
  // Médias
  avatarUrl?: string;
  coverImageUrl?: string;
  
  // Spécialités
  specialties?: string[];
  yearsOfExperience?: number;
  awards?: string[];
  
  // Contact
  publicEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  
  // Réseaux sociaux
  socialLinks?: SocialLinks;
  
  // CTA
  ctaButton?: CTAButton;
  
  // Témoignages
  testimonials?: Testimonial[];
  
  // Galeries
  featuredGalleries?: string[];
  hiddenGalleries?: string[];
  
  // SEO
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  
  // Analytics
  viewsCount: number;
  lastViewedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```


#### SocialLinks
```typescript
interface SocialLinks {
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  other?: string;
}
```

#### CTAButton
```typescript
interface CTAButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}
```

#### Testimonial
```typescript
interface Testimonial {
  id: string;
  clientName: string;
  clientPhoto?: string;
  rating: number; // 1-5
  text: string;
  date: string;
}
```

#### PublicGallery
```typescript
interface PublicGallery {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  imageCount: number;
  createdAt: Date;
  isNew: boolean; // < 7 jours
  isPasswordProtected: boolean;
}
```

#### ProfileView
```typescript
interface ProfileView {
  id: string;
  profileId: string;
  visitorIpHash: string;
  userAgent: string;
  referrer?: string;
  country?: string;
  city?: string;
  galleriesViewed: string[];
  ctaClicked: boolean;
  socialLinksClicked: string[];
  viewedAt: Date;
  sessionDuration?: number;
}
```

#### ProfileAnalytics
```typescript
interface ProfileAnalytics {
  totalViews: number;
  viewsByPeriod: {
    date: string;
    views: number;
  }[];
  topGalleries: {
    galleryId: string;
    galleryTitle: string;
    views: number;
  }[];
  ctaClickRate: number;
  averageSessionDuration: number;
  topReferrers: {
    referrer: string;
    count: number;
  }[];
}
```

### Composants React Principaux

#### ProfileHeader
```typescript
interface ProfileHeaderProps {
  displayName: string;
  tagline?: string;
  location?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  customLogo?: string;
  brandColors?: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export function ProfileHeader({
  displayName,
  tagline,
  location,
  avatarUrl,
  coverImageUrl,
  customLogo,
  brandColors
}: ProfileHeaderProps) {
  // Rendu du hero section avec image de couverture
  // Application des couleurs de marque
  // Affichage de l'avatar et des informations principales
}
```

#### ProfileGalleries
```typescript
interface ProfileGalleriesProps {
  galleries: PublicGallery[];
  onGalleryClick: (slug: string) => void;
  columns?: 2 | 3 | 4;
}

export function ProfileGalleries({
  galleries,
  onGalleryClick,
  columns = 3
}: ProfileGalleriesProps) {
  // Grille responsive de galeries
  // Gestion du hover et des clics
  // Affichage des badges "Nouveau"
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
  onSocialClick: (platform: string) => void;
}

export function ProfileContact({
  email,
  phone,
  website,
  socialLinks,
  ctaButton,
  onCTAClick,
  onSocialClick
}: ProfileContactProps) {
  // Affichage des informations de contact
  // Protection anti-spam pour l'email
  // Boutons de réseaux sociaux
  // CTA principal avec tracking
}
```

## Modèles de Données

### Schéma de Base de Données

#### Table: public_profiles

```sql
CREATE TABLE public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Activation
  is_enabled BOOLEAN DEFAULT false NOT NULL,
  
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
  specialties TEXT[],
  years_of_experience INTEGER,
  awards TEXT[],
  
  -- Contact
  public_email VARCHAR(255),
  phone VARCHAR(50),
  website TEXT,
  address TEXT,
  
  -- Réseaux sociaux (JSONB)
  social_links JSONB DEFAULT '{}'::jsonb,
  
  -- CTA (JSONB)
  cta_button JSONB,
  
  -- Témoignages (JSONB)
  testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- Galeries
  featured_galleries UUID[],
  hidden_galleries UUID[],
  
  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  meta_keywords TEXT[],
  
  -- Analytics
  views_count INTEGER DEFAULT 0 NOT NULL,
  last_viewed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  -- Contraintes
  CONSTRAINT unique_user_profile UNIQUE(user_id),
  CONSTRAINT unique_slug UNIQUE(slug),
  CONSTRAINT check_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT check_slug_length CHECK (LENGTH(slug) <= 100),
  CONSTRAINT check_tagline_length CHECK (LENGTH(tagline) <= 100),
  CONSTRAINT check_bio_length CHECK (LENGTH(bio) <= 500),
  CONSTRAINT check_specialties_count CHECK (CARDINALITY(specialties) <= 5),
  CONSTRAINT check_awards_count CHECK (CARDINALITY(awards) <= 3),
  CONSTRAINT check_meta_title_length CHECK (LENGTH(meta_title) <= 60),
  CONSTRAINT check_meta_description_length CHECK (LENGTH(meta_description) <= 160)
);

-- Index pour recherche rapide
CREATE INDEX idx_public_profiles_slug ON public_profiles(slug);
CREATE INDEX idx_public_profiles_user_id ON public_profiles(user_id);
CREATE INDEX idx_public_profiles_enabled ON public_profiles(is_enabled) WHERE is_enabled = true;
CREATE INDEX idx_public_profiles_updated_at ON public_profiles(updated_at);

-- Trigger pour mise à jour automatique de updated_at
CREATE TRIGGER update_public_profiles_updated_at
  BEFORE UPDATE ON public_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```


#### Table: profile_views

```sql
CREATE TABLE profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public_profiles(id) ON DELETE CASCADE,
  
  -- Tracking (données anonymisées)
  visitor_ip_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  user_agent TEXT,
  referrer TEXT,
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Actions
  galleries_viewed UUID[] DEFAULT ARRAY[]::UUID[],
  cta_clicked BOOLEAN DEFAULT false,
  social_links_clicked TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Session
  viewed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  session_duration INTEGER, -- En secondes
  
  -- Index
  CONSTRAINT fk_profile FOREIGN KEY (profile_id) REFERENCES public_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX idx_profile_views_date ON profile_views(viewed_at DESC);
CREATE INDEX idx_profile_views_profile_date ON profile_views(profile_id, viewed_at DESC);
```

#### Requêtes SQL Importantes

**Récupération d'un profil avec galeries publiques:**
```sql
SELECT 
  pp.*,
  p.plan_type,
  COALESCE(
    json_agg(
      json_build_object(
        'id', g.id,
        'slug', g.slug,
        'title', g.title,
        'coverImageUrl', g.cover_image_url,
        'imageCount', g.image_count,
        'createdAt', g.created_at,
        'isNew', (NOW() - g.created_at) < INTERVAL '7 days',
        'isPasswordProtected', g.password IS NOT NULL
      )
      ORDER BY 
        CASE WHEN g.id = ANY(pp.featured_galleries) THEN 0 ELSE 1 END,
        g.created_at DESC
    ) FILTER (WHERE g.id IS NOT NULL),
    '[]'
  ) as galleries
FROM public_profiles pp
INNER JOIN profiles p ON pp.user_id = p.id
LEFT JOIN galleries g ON g.user_id = pp.user_id
  AND g.is_active = true
  AND (g.expires_at IS NULL OR g.expires_at > NOW())
  AND NOT (g.id = ANY(pp.hidden_galleries))
WHERE pp.slug = $1
  AND pp.is_enabled = true
  AND p.plan_type = 'pro'
GROUP BY pp.id, p.plan_type;
```

**Statistiques analytics pour un profil:**
```sql
SELECT 
  COUNT(*) as total_views,
  COUNT(DISTINCT DATE(viewed_at)) as unique_days,
  AVG(session_duration) as avg_session_duration,
  SUM(CASE WHEN cta_clicked THEN 1 ELSE 0 END) as total_cta_clicks,
  ROUND(
    100.0 * SUM(CASE WHEN cta_clicked THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as cta_click_rate
FROM profile_views
WHERE profile_id = $1
  AND viewed_at >= $2; -- Date de début
```

**Top galeries vues:**
```sql
SELECT 
  gallery_id,
  g.title as gallery_title,
  COUNT(*) as view_count
FROM profile_views pv
CROSS JOIN UNNEST(pv.galleries_viewed) as gallery_id
INNER JOIN galleries g ON g.id = gallery_id
WHERE pv.profile_id = $1
  AND pv.viewed_at >= $2
GROUP BY gallery_id, g.title
ORDER BY view_count DESC
LIMIT 10;
```

### Validation des Données

#### Règles de Validation

**Slug:**
- Format: `^[a-z0-9-]+$` (lettres minuscules, chiffres, tirets uniquement)
- Longueur: 1-100 caractères
- Unicité: Doit être unique dans la table
- Slugs réservés interdits: `admin`, `api`, `dashboard`, `settings`, `app`, `auth`, `login`, `signup`, `profile`, `user`, `public`, `private`, `test`, `demo`

**Textes:**
- `displayName`: 1-200 caractères, requis
- `tagline`: 0-100 caractères, optionnel
- `bio`: 0-500 caractères, optionnel, support markdown
- `location`: 0-200 caractères, optionnel

**Spécialités:**
- Maximum 5 tags
- Chaque tag: 1-50 caractères

**Récompenses:**
- Maximum 3 récompenses
- Chaque récompense: 1-100 caractères

**Contact:**
- `publicEmail`: Format email valide
- `phone`: Format international recommandé
- `website`: URL valide (http/https)

**SEO:**
- `metaTitle`: 0-60 caractères
- `metaDescription`: 0-160 caractères
- `metaKeywords`: Maximum 10 mots-clés

**Témoignages:**
- Maximum 5 témoignages
- `clientName`: 1-100 caractères
- `rating`: 1-5 (entier)
- `text`: 1-200 caractères

#### Validateur TypeScript

```typescript
import { z } from 'zod';

const RESERVED_SLUGS = [
  'admin', 'api', 'dashboard', 'settings', 'app', 
  'auth', 'login', 'signup', 'profile', 'user',
  'public', 'private', 'test', 'demo'
];

export const PublicProfileSchema = z.object({
  isEnabled: z.boolean(),
  
  // Identité
  slug: z.string()
    .min(1, 'Le slug est requis')
    .max(100, 'Le slug ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
    .refine(slug => !RESERVED_SLUGS.includes(slug), 'Ce slug est réservé'),
  
  displayName: z.string()
    .min(1, 'Le nom est requis')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  
  tagline: z.string()
    .max(100, 'Le slogan ne peut pas dépasser 100 caractères')
    .optional(),
  
  bio: z.string()
    .max(500, 'La bio ne peut pas dépasser 500 caractères')
    .optional(),
  
  location: z.string()
    .max(200, 'La localisation ne peut pas dépasser 200 caractères')
    .optional(),
  
  // Médias
  avatarUrl: z.string().url('URL invalide').optional(),
  coverImageUrl: z.string().url('URL invalide').optional(),
  
  // Spécialités
  specialties: z.array(z.string().max(50))
    .max(5, 'Maximum 5 spécialités')
    .optional(),
  
  yearsOfExperience: z.number()
    .int()
    .min(0)
    .max(100)
    .optional(),
  
  awards: z.array(z.string().max(100))
    .max(3, 'Maximum 3 récompenses')
    .optional(),
  
  // Contact
  publicEmail: z.string()
    .email('Email invalide')
    .optional(),
  
  phone: z.string()
    .max(50)
    .optional(),
  
  website: z.string()
    .url('URL invalide')
    .optional(),
  
  address: z.string()
    .max(500)
    .optional(),
  
  // Réseaux sociaux
  socialLinks: z.object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    pinterest: z.string().url().optional(),
    linkedin: z.string().url().optional(),
    tiktok: z.string().url().optional(),
    youtube: z.string().url().optional(),
    other: z.string().url().optional(),
  }).optional(),
  
  // CTA
  ctaButton: z.object({
    text: z.string().min(1).max(50),
    url: z.string().url(),
    style: z.enum(['primary', 'secondary']),
  }).optional(),
  
  // Témoignages
  testimonials: z.array(
    z.object({
      id: z.string().uuid(),
      clientName: z.string().min(1).max(100),
      clientPhoto: z.string().url().optional(),
      rating: z.number().int().min(1).max(5),
      text: z.string().min(1).max(200),
      date: z.string().datetime(),
    })
  ).max(5, 'Maximum 5 témoignages').optional(),
  
  // Galeries
  featuredGalleries: z.array(z.string().uuid()).optional(),
  hiddenGalleries: z.array(z.string().uuid()).optional(),
  
  // SEO
  metaTitle: z.string()
    .max(60, 'Le titre SEO ne peut pas dépasser 60 caractères')
    .optional(),
  
  metaDescription: z.string()
    .max(160, 'La description SEO ne peut pas dépasser 160 caractères')
    .optional(),
  
  metaKeywords: z.array(z.string())
    .max(10, 'Maximum 10 mots-clés')
    .optional(),
});

export type PublicProfileInput = z.infer<typeof PublicProfileSchema>;
```


### Services et Logique Métier

#### PublicProfileService

```typescript
export class PublicProfileService {
  constructor(
    private profileRepo: PublicProfileRepository,
    private viewsRepo: ProfileViewsRepository,
    private galleryRepo: GalleryRepository
  ) {}

  /**
   * Récupère un profil public par son slug
   * Vérifie que le profil est actif et que l'utilisateur est Pro
   */
  async getProfileBySlug(slug: string): Promise<PublicProfileWithGalleries | null> {
    const profile = await this.profileRepo.findBySlug(slug);
    
    if (!profile || !profile.isEnabled) {
      return null;
    }
    
    // Vérifier que l'utilisateur a un plan Pro
    const user = await this.profileRepo.getUserByProfileId(profile.userId);
    if (user.planType !== 'pro') {
      return null;
    }
    
    // Récupérer les galeries publiques
    const galleries = await this.galleryRepo.findPublicGalleriesByUserId(
      profile.userId,
      profile.hiddenGalleries
    );
    
    // Trier: galeries mises en avant d'abord, puis par date
    const sortedGalleries = this.sortGalleries(galleries, profile.featuredGalleries);
    
    return {
      ...profile,
      galleries: sortedGalleries,
    };
  }

  /**
   * Crée ou met à jour un profil public
   */
  async upsertProfile(
    userId: string,
    data: PublicProfileInput
  ): Promise<PublicProfile> {
    // Valider les données
    const validated = PublicProfileSchema.parse(data);
    
    // Vérifier l'unicité du slug
    const existingProfile = await this.profileRepo.findBySlug(validated.slug);
    if (existingProfile && existingProfile.userId !== userId) {
      throw new Error('Ce slug est déjà utilisé');
    }
    
    // Vérifier que l'utilisateur est Pro
    const user = await this.profileRepo.getUserById(userId);
    if (user.planType !== 'pro') {
      throw new Error('Cette fonctionnalité est réservée aux utilisateurs Pro');
    }
    
    // Créer ou mettre à jour
    const existing = await this.profileRepo.findByUserId(userId);
    if (existing) {
      return await this.profileRepo.update(existing.id, validated);
    } else {
      return await this.profileRepo.create({
        ...validated,
        userId,
      });
    }
  }

  /**
   * Vérifie la disponibilité d'un slug
   */
  async checkSlugAvailability(
    slug: string,
    currentUserId?: string
  ): Promise<{ available: boolean; suggestions?: string[] }> {
    // Vérifier les slugs réservés
    if (RESERVED_SLUGS.includes(slug)) {
      return {
        available: false,
        suggestions: this.generateSlugSuggestions(slug),
      };
    }
    
    const existing = await this.profileRepo.findBySlug(slug);
    
    if (!existing || existing.userId === currentUserId) {
      return { available: true };
    }
    
    return {
      available: false,
      suggestions: this.generateSlugSuggestions(slug),
    };
  }

  /**
   * Génère des suggestions de slugs alternatifs
   */
  private generateSlugSuggestions(baseSlug: string): string[] {
    const suggestions: string[] = [];
    
    // Ajouter des suffixes numériques
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${baseSlug}-${i}`);
    }
    
    // Ajouter l'année courante
    const year = new Date().getFullYear();
    suggestions.push(`${baseSlug}-${year}`);
    
    return suggestions;
  }

  /**
   * Trie les galeries: featured en premier, puis par date
   */
  private sortGalleries(
    galleries: PublicGallery[],
    featuredIds?: string[]
  ): PublicGallery[] {
    return galleries.sort((a, b) => {
      const aFeatured = featuredIds?.includes(a.id) ?? false;
      const bFeatured = featuredIds?.includes(b.id) ?? false;
      
      if (aFeatured && !bFeatured) return -1;
      if (!aFeatured && bFeatured) return 1;
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  /**
   * Enregistre une visite du profil
   */
  async trackView(
    profileSlug: string,
    viewData: {
      ipAddress: string;
      userAgent: string;
      referrer?: string;
    }
  ): Promise<void> {
    const profile = await this.profileRepo.findBySlug(profileSlug);
    if (!profile) return;
    
    // Hasher l'IP pour RGPD
    const ipHash = await this.hashIpAddress(viewData.ipAddress);
    
    // Enregistrer la visite
    await this.viewsRepo.create({
      profileId: profile.id,
      visitorIpHash: ipHash,
      userAgent: viewData.userAgent,
      referrer: viewData.referrer,
      viewedAt: new Date(),
    });
    
    // Incrémenter le compteur
    await this.profileRepo.incrementViewsCount(profile.id);
  }

  /**
   * Enregistre un clic sur le CTA
   */
  async trackCTAClick(profileSlug: string, sessionId: string): Promise<void> {
    await this.viewsRepo.updateCTAClick(sessionId, true);
  }

  /**
   * Enregistre un clic sur un réseau social
   */
  async trackSocialClick(
    profileSlug: string,
    sessionId: string,
    platform: string
  ): Promise<void> {
    await this.viewsRepo.addSocialClick(sessionId, platform);
  }

  /**
   * Récupère les analytics d'un profil
   */
  async getAnalytics(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileAnalytics> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (!profile) {
      throw new Error('Profil non trouvé');
    }
    
    return await this.viewsRepo.getAnalytics(profile.id, startDate, endDate);
  }

  /**
   * Hash une adresse IP pour conformité RGPD
   */
  private async hashIpAddress(ip: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
```

#### AnalyticsService

```typescript
export class AnalyticsService {
  constructor(private viewsRepo: ProfileViewsRepository) {}

  /**
   * Calcule les statistiques pour une période donnée
   */
  async calculateStats(
    profileId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProfileAnalytics> {
    const views = await this.viewsRepo.findByProfileAndDateRange(
      profileId,
      startDate,
      endDate
    );
    
    const totalViews = views.length;
    const ctaClicks = views.filter(v => v.ctaClicked).length;
    const ctaClickRate = totalViews > 0 ? (ctaClicks / totalViews) * 100 : 0;
    
    const avgSessionDuration = views.reduce((sum, v) => 
      sum + (v.sessionDuration || 0), 0
    ) / totalViews;
    
    // Grouper les vues par date
    const viewsByPeriod = this.groupViewsByDate(views);
    
    // Top galeries
    const topGalleries = await this.calculateTopGalleries(views);
    
    // Top referrers
    const topReferrers = this.calculateTopReferrers(views);
    
    return {
      totalViews,
      viewsByPeriod,
      topGalleries,
      ctaClickRate,
      averageSessionDuration: Math.round(avgSessionDuration),
      topReferrers,
    };
  }

  private groupViewsByDate(views: ProfileView[]): { date: string; views: number }[] {
    const grouped = new Map<string, number>();
    
    views.forEach(view => {
      const date = view.viewedAt.toISOString().split('T')[0];
      grouped.set(date, (grouped.get(date) || 0) + 1);
    });
    
    return Array.from(grouped.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async calculateTopGalleries(
    views: ProfileView[]
  ): Promise<{ galleryId: string; galleryTitle: string; views: number }[]> {
    const galleryViews = new Map<string, number>();
    
    views.forEach(view => {
      view.galleriesViewed.forEach(galleryId => {
        galleryViews.set(galleryId, (galleryViews.get(galleryId) || 0) + 1);
      });
    });
    
    // Récupérer les titres des galeries
    const galleryIds = Array.from(galleryViews.keys());
    const galleries = await this.viewsRepo.getGalleriesByIds(galleryIds);
    
    return Array.from(galleryViews.entries())
      .map(([galleryId, views]) => ({
        galleryId,
        galleryTitle: galleries.find(g => g.id === galleryId)?.title || 'Unknown',
        views,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }

  private calculateTopReferrers(
    views: ProfileView[]
  ): { referrer: string; count: number }[] {
    const referrers = new Map<string, number>();
    
    views.forEach(view => {
      if (view.referrer) {
        const domain = this.extractDomain(view.referrer);
        referrers.set(domain, (referrers.get(domain) || 0) + 1);
      }
    });
    
    return Array.from(referrers.entries())
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractDomain(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.hostname;
    } catch {
      return 'Direct';
    }
  }
}
```


### Génération SEO

#### SEOGenerator

```typescript
export class SEOGenerator {
  /**
   * Génère les meta tags pour un profil
   */
  generateMetaTags(profile: PublicProfile): MetaTags {
    const title = profile.metaTitle || 
      `${profile.displayName} - Photographe Professionnel`;
    
    const description = profile.metaDescription || 
      profile.bio?.substring(0, 160) || 
      `Découvrez le portfolio de ${profile.displayName}, photographe professionnel.`;
    
    const keywords = profile.metaKeywords?.join(', ') || 
      [...(profile.specialties || []), 'photographe', 'portfolio'].join(', ');
    
    const imageUrl = profile.coverImageUrl || profile.avatarUrl || 
      '/default-og-image.jpg';
    
    const profileUrl = this.getProfileUrl(profile.slug);
    
    return {
      title,
      description,
      keywords,
      openGraph: {
        title,
        description,
        image: imageUrl,
        url: profileUrl,
        type: 'profile',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        image: imageUrl,
      },
      canonical: profileUrl,
    };
  }

  /**
   * Génère les données structurées JSON-LD
   */
  generateStructuredData(profile: PublicProfile): object {
    const sameAs = Object.entries(profile.socialLinks || {})
      .filter(([_, url]) => url)
      .map(([_, url]) => url);
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: profile.displayName,
      jobTitle: 'Photographe Professionnel',
      description: profile.bio,
      image: profile.avatarUrl,
      url: this.getProfileUrl(profile.slug),
      sameAs,
      address: profile.location ? {
        '@type': 'PostalAddress',
        addressLocality: profile.location,
      } : undefined,
      email: profile.publicEmail,
      telephone: profile.phone,
    };
  }

  /**
   * Génère l'entrée sitemap pour un profil
   */
  generateSitemapEntry(profile: PublicProfile): SitemapEntry {
    return {
      url: this.getProfileUrl(profile.slug),
      lastmod: profile.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    };
  }

  private getProfileUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';
    return `${baseUrl}/p/${slug}`;
  }
}
```

### Utilitaires

#### SlugUtils

```typescript
export class SlugUtils {
  /**
   * Normalise une chaîne en slug valide
   */
  static normalize(input: string): string {
    return input
      .toLowerCase()
      .trim()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[ñ]/g, 'n')
      .replace(/[^a-z0-9\s-]/g, '') // Supprimer caractères spéciaux
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Supprimer tirets multiples
      .replace(/^-|-$/g, ''); // Supprimer tirets début/fin
  }

  /**
   * Valide le format d'un slug
   */
  static isValid(slug: string): boolean {
    return /^[a-z0-9-]+$/.test(slug) && 
           slug.length > 0 && 
           slug.length <= 100 &&
           !RESERVED_SLUGS.includes(slug);
  }

  /**
   * Génère un slug unique à partir d'un nom
   */
  static async generateUnique(
    name: string,
    checkAvailability: (slug: string) => Promise<boolean>
  ): Promise<string> {
    let slug = this.normalize(name);
    let counter = 1;
    
    while (!(await checkAvailability(slug))) {
      slug = `${this.normalize(name)}-${counter}`;
      counter++;
    }
    
    return slug;
  }
}
```

## Correctness Properties

*Une propriété est une caractéristique ou un comportement qui doit être vrai pour toutes les exécutions valides d'un système - essentiellement, une déclaration formelle sur ce que le système doit faire. Les propriétés servent de pont entre les spécifications lisibles par l'humain et les garanties de correction vérifiables par machine.*


### Propriété 1: Restriction d'accès au plan Pro

*Pour tout* utilisateur, l'activation d'un profil public doit réussir si et seulement si l'utilisateur possède un plan Pro.

**Valide: Exigences 1.1**

### Propriété 2: Création d'enregistrement lors de l'activation

*Pour tout* photographe Pro qui active son profil public, un enregistrement correspondant doit être créé dans la table public_profiles avec l'ID utilisateur correct.

**Valide: Exigences 1.2**

### Propriété 3: Unicité des slugs

*Pour tous* slugs, si un slug existe déjà dans la base de données, toute tentative de créer un nouveau profil avec ce même slug doit échouer avec une erreur appropriée.

**Valide: Exigences 1.3, 1.5**

### Propriété 4: Validation du format des slugs

*Pour toute* chaîne de caractères, elle est acceptée comme slug valide si et seulement si elle correspond au pattern `^[a-z0-9-]+$`, a une longueur entre 1 et 100 caractères, et n'est pas dans la liste des slugs réservés.

**Valide: Exigences 1.4, 14.1, 14.5, 14.6**

### Propriété 5: Normalisation des slugs

*Pour toute* chaîne d'entrée contenant des majuscules ou des espaces, la normalisation doit produire un slug en minuscules avec les espaces remplacés par des tirets.

**Valide: Exigences 14.7, 14.8**

### Propriété 6: Respect des limites de longueur des champs texte

*Pour tout* profil, les champs texte doivent respecter leurs limites maximales: displayName ≤ 200, tagline ≤ 100, bio ≤ 500, metaTitle ≤ 60, metaDescription ≤ 160 caractères.

**Valide: Exigences 1.6, 1.7, 1.8, 8.4, 8.5**

### Propriété 7: Respect des limites de cardinalité des tableaux

*Pour tout* profil, les tableaux doivent respecter leurs limites maximales: specialties ≤ 5, awards ≤ 3, testimonials ≤ 5, metaKeywords ≤ 10 éléments.

**Valide: Exigences 1.8, 5.2, 8.10**

### Propriété 8: Inaccessibilité des profils désactivés

*Pour tout* profil avec isEnabled = false, toute tentative d'accès via son URL doit retourner une réponse 404.

**Valide: Exigences 1.10, 6.4**

### Propriété 9: Affichage conditionnel des informations du photographe

*Pour tout* profil et pour tout champ optionnel (tagline, bio, location, avatar, cover, specialties, awards), le champ doit apparaître dans le rendu si et seulement si il est configuré (non null/undefined).

**Valide: Exigences 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

### Propriété 10: Filtrage des galeries publiques

*Pour tout* profil, les galeries affichées doivent satisfaire toutes les conditions suivantes: is_active = true, expires_at > NOW() ou NULL, et l'ID n'est pas dans hidden_galleries.

**Valide: Exigences 3.1, 3.2, 3.3, 3.4**

### Propriété 11: Badge "Nouveau" basé sur la date

*Pour toute* galerie, le badge "Nouveau" doit être affiché si et seulement si la date de création est inférieure à 7 jours par rapport à la date actuelle.

**Valide: Exigences 3.5**

### Propriété 12: Ordre de tri des galeries

*Pour tout* ensemble de galeries avec des IDs featured, les galeries featured doivent apparaître avant les galeries non-featured, et au sein de chaque groupe, le tri doit être par date de création décroissante.

**Valide: Exigences 3.8, 3.9**

### Propriété 13: Protection anti-spam des emails

*Pour tout* email public affiché, le format doit remplacer '@' par '[at]' et '.' par '[dot]' pour protection anti-spam.

**Valide: Exigences 4.1, 13.1**

### Propriété 14: Enregistrement des événements analytics

*Pour tout* événement trackable (visite, clic CTA, clic social), un enregistrement correspondant doit être créé dans profile_views avec les données appropriées (IP hashée, user agent, timestamp).

**Valide: Exigences 9.1, 9.2, 9.5, 9.6**

### Propriété 15: Incrémentation du compteur de vues

*Pour toute* visite d'un profil, le champ views_count du profil doit être incrémenté de 1.

**Valide: Exigences 9.3**

### Propriété 16: Anonymisation des adresses IP

*Pour toute* adresse IP enregistrée, elle doit être hashée avec SHA-256 avant stockage, et l'IP originale ne doit jamais être stockée en clair.

**Valide: Exigences 9.9, 13.4**

### Propriété 17: Génération des meta tags SEO

*Pour tout* profil, les meta tags doivent être générés avec: title (custom ou généré), description (custom ou bio tronquée), keywords, Open Graph tags, et Twitter Card tags.

**Valide: Exigences 8.1, 8.2, 8.3, 8.6, 8.7**

### Propriété 18: Génération des données structurées JSON-LD

*Pour tout* profil, les données structurées JSON-LD doivent inclure le type Person avec les champs: name, jobTitle, description, image, url, sameAs (réseaux sociaux), address, email, telephone.

**Valide: Exigences 8.8**

### Propriété 19: Application conditionnelle du branding

*Pour tout* profil, si un logo personnalisé est configuré, il doit être affiché; si des couleurs de marque sont configurées, elles doivent être appliquées; si un domaine personnalisé est configuré, le footer doit être white-label.

**Valide: Exigences 7.1, 7.2, 7.3**

### Propriété 20: Validation des URLs

*Pour tous* les champs URL (avatarUrl, coverImageUrl, website, socialLinks), si une valeur est fournie, elle doit être une URL valide commençant par http:// ou https://.

**Valide: Exigences 4.3, validation générale**

### Propriété 21: Suggestions de slugs alternatifs

*Pour tout* slug déjà pris, le système doit générer au moins 3 suggestions alternatives en ajoutant des suffixes numériques ou l'année courante.

**Valide: Exigences 1.5, 14.4**

### Propriété 22: Vérification en temps réel de la disponibilité des slugs

*Pour tout* slug saisi, la vérification de disponibilité doit retourner true si le slug n'existe pas ou appartient à l'utilisateur actuel, et false avec suggestions sinon.

**Valide: Exigences 14.1, 14.2, 14.3**

### Propriété 23: Calcul correct des statistiques analytics

*Pour tout* profil et période donnée, les statistiques calculées (total views, CTA click rate, average session duration) doivent correspondre exactement aux données agrégées de profile_views pour cette période.

**Valide: Exigences 9.7, 9.8**

### Propriété 24: Accessibilité via URL slug

*Pour tout* profil actif avec un slug valide, l'URL /p/[slug] doit retourner une réponse 200 avec le contenu du profil.

**Valide: Exigences 6.1, 6.3**

### Propriété 25: Support du markdown dans la bio

*Pour toute* bio contenant du markdown valide, le rendu HTML doit correctement interpréter le markdown (gras, italique, liens, listes).

**Valide: Exigences 2.3**


## Gestion des Erreurs

### Stratégie Globale

L'application utilise une approche de gestion d'erreurs en couches:
1. **Validation côté client**: Feedback immédiat dans l'interface
2. **Validation côté serveur**: Sécurité et intégrité des données
3. **Gestion des erreurs de base de données**: Transactions et rollback
4. **Logging centralisé**: Suivi et débogage

### Types d'Erreurs

#### Erreurs de Validation

**Erreurs de format:**
- Slug invalide (caractères non autorisés)
- Email invalide
- URL invalide
- Longueur de champ dépassée

**Réponse:**
```typescript
{
  error: 'VALIDATION_ERROR',
  message: 'Les données fournies sont invalides',
  details: [
    {
      field: 'slug',
      message: 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets'
    }
  ]
}
```

#### Erreurs de Contraintes

**Erreurs d'unicité:**
- Slug déjà utilisé
- Email déjà enregistré

**Réponse:**
```typescript
{
  error: 'CONSTRAINT_ERROR',
  message: 'Ce slug est déjà utilisé',
  suggestions: ['john-doe-1', 'john-doe-2', 'john-doe-2026']
}
```

#### Erreurs d'Autorisation

**Erreurs d'accès:**
- Utilisateur non Pro tentant d'activer un profil
- Utilisateur tentant de modifier le profil d'un autre

**Réponse:**
```typescript
{
  error: 'AUTHORIZATION_ERROR',
  message: 'Cette fonctionnalité est réservée aux utilisateurs Pro',
  upgradeUrl: '/pricing'
}
```

#### Erreurs de Ressource

**Ressource non trouvée:**
- Profil inexistant
- Profil désactivé
- Galerie supprimée

**Réponse:**
```typescript
{
  error: 'NOT_FOUND',
  message: 'Profil non trouvé',
  statusCode: 404
}
```

#### Erreurs Serveur

**Erreurs internes:**
- Erreur de base de données
- Erreur de service externe (Cloudinary)
- Timeout

**Réponse:**
```typescript
{
  error: 'INTERNAL_ERROR',
  message: 'Une erreur est survenue. Veuillez réessayer.',
  requestId: 'req_abc123' // Pour le support
}
```

### Gestion des Erreurs par Couche

#### API Routes

```typescript
export async function PUT(request: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validation
    const validated = PublicProfileSchema.safeParse(data);
    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Données invalides',
          details: validated.error.errors
        },
        { status: 400 }
      );
    }

    // Logique métier
    const profile = await publicProfileService.upsertProfile(
      session.user.id,
      validated.data
    );

    return NextResponse.json({ profile }, { status: 200 });

  } catch (error) {
    if (error instanceof SlugAlreadyExistsError) {
      return NextResponse.json(
        {
          error: 'CONSTRAINT_ERROR',
          message: error.message,
          suggestions: error.suggestions
        },
        { status: 409 }
      );
    }

    if (error instanceof NotProUserError) {
      return NextResponse.json(
        {
          error: 'AUTHORIZATION_ERROR',
          message: error.message,
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }

    // Erreur non gérée
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue',
        requestId: generateRequestId()
      },
      { status: 500 }
    );
  }
}
```

#### Services

```typescript
export class PublicProfileService {
  async upsertProfile(userId: string, data: PublicProfileInput): Promise<PublicProfile> {
    // Vérifier le plan
    const user = await this.profileRepo.getUserById(userId);
    if (user.planType !== 'pro') {
      throw new NotProUserError('Cette fonctionnalité est réservée aux utilisateurs Pro');
    }

    // Vérifier l'unicité du slug
    const existingProfile = await this.profileRepo.findBySlug(data.slug);
    if (existingProfile && existingProfile.userId !== userId) {
      const suggestions = await this.generateSlugSuggestions(data.slug);
      throw new SlugAlreadyExistsError('Ce slug est déjà utilisé', suggestions);
    }

    // Transaction pour garantir la cohérence
    try {
      return await this.profileRepo.upsert(userId, data);
    } catch (error) {
      if (error.code === '23505') { // Violation de contrainte unique
        throw new SlugAlreadyExistsError('Ce slug est déjà utilisé');
      }
      throw error;
    }
  }
}
```

### Logging et Monitoring

#### Structure des Logs

```typescript
interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  service: string;
  action: string;
  userId?: string;
  profileId?: string;
  error?: {
    type: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}
```

#### Exemples de Logs

```typescript
// Succès
logger.info({
  service: 'PublicProfileService',
  action: 'upsertProfile',
  userId: 'user_123',
  profileId: 'profile_456',
  metadata: { slug: 'john-doe' }
});

// Erreur
logger.error({
  service: 'PublicProfileService',
  action: 'upsertProfile',
  userId: 'user_123',
  error: {
    type: 'SlugAlreadyExistsError',
    message: 'Ce slug est déjà utilisé',
  },
  metadata: { attemptedSlug: 'john-doe' }
});
```


## Stratégie de Test

### Approche Duale

Cette fonctionnalité utilise une approche de test combinant:
1. **Tests unitaires**: Pour les cas spécifiques, les cas limites et les conditions d'erreur
2. **Tests basés sur les propriétés**: Pour vérifier les propriétés universelles sur tous les inputs

Les deux approches sont complémentaires et nécessaires pour une couverture complète.

### Tests Basés sur les Propriétés

#### Configuration

**Bibliothèque**: `fast-check` pour TypeScript/JavaScript
**Itérations**: Minimum 100 itérations par test de propriété
**Tag**: Chaque test doit référencer sa propriété du document de conception

Format du tag:
```typescript
// Feature: public-photographer-profile, Property 4: Validation du format des slugs
```

#### Générateurs de Données

```typescript
import * as fc from 'fast-check';

// Générateur de slugs valides
const validSlugArb = fc.stringOf(
  fc.oneof(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'.split(''))
  ),
  { minLength: 1, maxLength: 100 }
).filter(s => s.length > 0 && !s.startsWith('-') && !s.endsWith('-'));

// Générateur de slugs invalides
const invalidSlugArb = fc.oneof(
  fc.string().filter(s => /[A-Z]/.test(s)), // Contient des majuscules
  fc.string().filter(s => /[^a-z0-9-]/.test(s)), // Caractères spéciaux
  fc.string({ minLength: 101 }), // Trop long
  fc.constant('') // Vide
);

// Générateur de profils
const publicProfileArb = fc.record({
  slug: validSlugArb,
  displayName: fc.string({ minLength: 1, maxLength: 200 }),
  tagline: fc.option(fc.string({ maxLength: 100 })),
  bio: fc.option(fc.string({ maxLength: 500 })),
  location: fc.option(fc.string({ maxLength: 200 })),
  specialties: fc.option(fc.array(fc.string({ maxLength: 50 }), { maxLength: 5 })),
  awards: fc.option(fc.array(fc.string({ maxLength: 100 }), { maxLength: 3 })),
  testimonials: fc.option(fc.array(testimonialArb, { maxLength: 5 })),
});

// Générateur de galeries
const galleryArb = fc.record({
  id: fc.uuid(),
  slug: validSlugArb,
  title: fc.string({ minLength: 1, maxLength: 200 }),
  isActive: fc.boolean(),
  expiresAt: fc.option(fc.date()),
  createdAt: fc.date(),
});
```

#### Exemples de Tests de Propriétés

**Propriété 4: Validation du format des slugs**
```typescript
// Feature: public-photographer-profile, Property 4: Validation du format des slugs
describe('Slug validation', () => {
  it('should accept all valid slugs', () => {
    fc.assert(
      fc.property(validSlugArb, (slug) => {
        const result = SlugUtils.isValid(slug);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject all invalid slugs', () => {
    fc.assert(
      fc.property(invalidSlugArb, (slug) => {
        const result = SlugUtils.isValid(slug);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });
});
```

**Propriété 5: Normalisation des slugs**
```typescript
// Feature: public-photographer-profile, Property 5: Normalisation des slugs
describe('Slug normalization', () => {
  it('should convert uppercase to lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        expect(normalized).toBe(normalized.toLowerCase());
      }),
      { numRuns: 100 }
    );
  });

  it('should replace spaces with hyphens', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const normalized = SlugUtils.normalize(input);
        expect(normalized).not.toContain(' ');
      }),
      { numRuns: 100 }
    );
  });
});
```

**Propriété 10: Filtrage des galeries publiques**
```typescript
// Feature: public-photographer-profile, Property 10: Filtrage des galeries publiques
describe('Gallery filtering', () => {
  it('should only include active, non-expired, non-hidden galleries', () => {
    fc.assert(
      fc.property(
        fc.array(galleryArb),
        fc.array(fc.uuid()),
        (galleries, hiddenIds) => {
          const now = new Date();
          const filtered = filterPublicGalleries(galleries, hiddenIds, now);
          
          filtered.forEach(gallery => {
            expect(gallery.isActive).toBe(true);
            expect(
              gallery.expiresAt === null || gallery.expiresAt > now
            ).toBe(true);
            expect(hiddenIds).not.toContain(gallery.id);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Propriété 12: Ordre de tri des galeries**
```typescript
// Feature: public-photographer-profile, Property 12: Ordre de tri des galeries
describe('Gallery sorting', () => {
  it('should place featured galleries first, then sort by date', () => {
    fc.assert(
      fc.property(
        fc.array(galleryArb, { minLength: 5 }),
        fc.array(fc.uuid(), { maxLength: 3 }),
        (galleries, featuredIds) => {
          const sorted = sortGalleries(galleries, featuredIds);
          
          // Vérifier que les featured sont en premier
          let foundNonFeatured = false;
          sorted.forEach(gallery => {
            if (!featuredIds.includes(gallery.id)) {
              foundNonFeatured = true;
            } else if (foundNonFeatured) {
              // Featured après non-featured = erreur
              expect(false).toBe(true);
            }
          });
          
          // Vérifier le tri par date dans chaque groupe
          const featured = sorted.filter(g => featuredIds.includes(g.id));
          const nonFeatured = sorted.filter(g => !featuredIds.includes(g.id));
          
          expect(isSortedByDateDesc(featured)).toBe(true);
          expect(isSortedByDateDesc(nonFeatured)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Propriété 16: Anonymisation des adresses IP**
```typescript
// Feature: public-photographer-profile, Property 16: Anonymisation des adresses IP
describe('IP address hashing', () => {
  it('should always hash IP addresses before storage', () => {
    fc.assert(
      fc.property(fc.ipV4(), async (ip) => {
        const hashed = await hashIpAddress(ip);
        
        // Le hash ne doit pas contenir l'IP originale
        expect(hashed).not.toContain(ip);
        
        // Le hash doit être de longueur fixe (SHA-256 = 64 caractères hex)
        expect(hashed).toHaveLength(64);
        
        // Le hash doit être déterministe
        const hashed2 = await hashIpAddress(ip);
        expect(hashed).toBe(hashed2);
      }),
      { numRuns: 100 }
    );
  });
});
```

**Propriété 23: Calcul correct des statistiques analytics**
```typescript
// Feature: public-photographer-profile, Property 23: Calcul correct des statistiques analytics
describe('Analytics calculations', () => {
  it('should calculate statistics correctly from views', () => {
    fc.assert(
      fc.property(
        fc.array(profileViewArb, { minLength: 1, maxLength: 100 }),
        (views) => {
          const stats = calculateAnalytics(views);
          
          // Total views doit correspondre
          expect(stats.totalViews).toBe(views.length);
          
          // CTA click rate doit être correct
          const ctaClicks = views.filter(v => v.ctaClicked).length;
          const expectedRate = (ctaClicks / views.length) * 100;
          expect(stats.ctaClickRate).toBeCloseTo(expectedRate, 2);
          
          // Average session duration doit être correct
          const totalDuration = views.reduce((sum, v) => sum + (v.sessionDuration || 0), 0);
          const expectedAvg = totalDuration / views.length;
          expect(stats.averageSessionDuration).toBeCloseTo(expectedAvg, 0);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Tests Unitaires

Les tests unitaires se concentrent sur:
- **Exemples spécifiques**: Cas d'usage concrets
- **Cas limites**: Valeurs aux frontières
- **Conditions d'erreur**: Gestion des erreurs
- **Intégration**: Points d'intégration entre composants

#### Exemples de Tests Unitaires

**Validation de slugs réservés:**
```typescript
describe('Reserved slugs', () => {
  it('should reject reserved slug "admin"', () => {
    expect(SlugUtils.isValid('admin')).toBe(false);
  });

  it('should reject reserved slug "api"', () => {
    expect(SlugUtils.isValid('api')).toBe(false);
  });

  it('should reject reserved slug "dashboard"', () => {
    expect(SlugUtils.isValid('dashboard')).toBe(false);
  });
});
```

**Génération de meta tags:**
```typescript
describe('SEO meta tags generation', () => {
  it('should use custom meta title when provided', () => {
    const profile = {
      displayName: 'John Doe',
      metaTitle: 'Custom Title',
    };
    
    const metaTags = SEOGenerator.generateMetaTags(profile);
    expect(metaTags.title).toBe('Custom Title');
  });

  it('should generate default title when not provided', () => {
    const profile = {
      displayName: 'John Doe',
    };
    
    const metaTags = SEOGenerator.generateMetaTags(profile);
    expect(metaTags.title).toBe('John Doe - Photographe Professionnel');
  });

  it('should truncate bio to 160 characters for description', () => {
    const longBio = 'a'.repeat(200);
    const profile = {
      displayName: 'John Doe',
      bio: longBio,
    };
    
    const metaTags = SEOGenerator.generateMetaTags(profile);
    expect(metaTags.description.length).toBeLessThanOrEqual(160);
  });
});
```

**Protection anti-spam des emails:**
```typescript
describe('Email anti-spam protection', () => {
  it('should format email with [at] and [dot]', () => {
    const email = 'john@example.com';
    const formatted = formatEmailForDisplay(email);
    expect(formatted).toBe('john[at]example[dot]com');
  });

  it('should handle multiple dots', () => {
    const email = 'john.doe@example.co.uk';
    const formatted = formatEmailForDisplay(email);
    expect(formatted).toBe('john[dot]doe[at]example[dot]co[dot]uk');
  });
});
```

**Gestion des erreurs:**
```typescript
describe('Error handling', () => {
  it('should throw NotProUserError for non-Pro users', async () => {
    const service = new PublicProfileService(mockRepo);
    const freeUser = { id: 'user_1', planType: 'free' };
    
    await expect(
      service.upsertProfile(freeUser.id, validProfileData)
    ).rejects.toThrow(NotProUserError);
  });

  it('should throw SlugAlreadyExistsError for duplicate slugs', async () => {
    const service = new PublicProfileService(mockRepo);
    mockRepo.findBySlug.mockResolvedValue({ userId: 'other_user' });
    
    await expect(
      service.upsertProfile('user_1', { slug: 'taken-slug' })
    ).rejects.toThrow(SlugAlreadyExistsError);
  });
});
```

### Tests d'Intégration

**API Routes:**
```typescript
describe('PUT /api/public-profile', () => {
  it('should create a new profile for Pro user', async () => {
    const response = await fetch('/api/public-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProfileData),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.profile.slug).toBe(validProfileData.slug);
  });

  it('should return 403 for non-Pro user', async () => {
    // Mock session avec free user
    const response = await fetch('/api/public-profile', {
      method: 'PUT',
      body: JSON.stringify(validProfileData),
    });
    
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe('AUTHORIZATION_ERROR');
  });
});
```

### Couverture de Test

**Objectifs de couverture:**
- **Lignes**: > 80%
- **Branches**: > 75%
- **Fonctions**: > 85%
- **Propriétés**: 100% (toutes les propriétés doivent avoir un test)

**Commandes:**
```bash
# Exécuter tous les tests
npm test

# Exécuter les tests de propriétés uniquement
npm test -- --grep "Property"

# Exécuter avec couverture
npm test -- --coverage

# Exécuter les tests d'intégration
npm test:integration
```

### Tests de Performance

Bien que non couverts par les tests unitaires/propriétés, les métriques de performance doivent être vérifiées:

**Lighthouse CI:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

**Load Testing:**
- 100 requêtes/seconde sur /api/public-profile/[slug]
- Temps de réponse p95 < 500ms

