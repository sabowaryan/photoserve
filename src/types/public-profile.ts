import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

/**
 * Liste des slugs réservés qui ne peuvent pas être utilisés pour les profils publics
 */
export const RESERVED_SLUGS = [
  'admin',
  'api',
  'dashboard',
  'settings',
  'app',
  'auth',
  'login',
  'signup',
  'profile',
  'user',
  'public',
  'private',
  'test',
  'demo',
] as const;

/**
 * Limites de longueur pour les champs texte
 */
export const TEXT_LIMITS = {
  SLUG: 100,
  DISPLAY_NAME: 200,
  TAGLINE: 100,
  BIO: 500,
  LOCATION: 200,
  SPECIALTY: 50,
  AWARD: 100,
  CLIENT_NAME: 100,
  TESTIMONIAL_TEXT: 200,
  CTA_TEXT: 50,
  META_TITLE: 60,
  META_DESCRIPTION: 160,
  PHONE: 50,
  ADDRESS: 500,
} as const;

/**
 * Limites de cardinalité pour les tableaux
 */
export const ARRAY_LIMITS = {
  SPECIALTIES: 5,
  AWARDS: 3,
  TESTIMONIALS: 5,
  META_KEYWORDS: 10,
} as const;

// ============================================================================
// Base Interfaces
// ============================================================================

/**
 * Liens vers les réseaux sociaux du photographe
 */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  pinterest?: string;
  linkedin?: string;
  tiktok?: string;
  youtube?: string;
  other?: string;
}

/**
 * Configuration du bouton Call-to-Action
 */
export interface CTAButton {
  text: string;
  url: string;
  style: 'primary' | 'secondary';
}

/**
 * Témoignage d'un client
 */
export interface Testimonial {
  id: string;
  clientName: string;
  clientPhoto?: string;
  rating: number; // 1-5
  text: string;
  date: string;
}

/**
 * Galerie publique affichée sur le profil
 */
export interface PublicGallery {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string;
  imageCount: number;
  createdAt: Date;
  isNew: boolean; // < 7 jours
  isPasswordProtected: boolean;
}

/**
 * Profil public d'un photographe
 */
export interface PublicProfile {
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

/**
 * Profil public avec ses galeries
 */
export interface PublicProfileWithGalleries extends PublicProfile {
  galleries: PublicGallery[];
}

/**
 * Vue d'un profil (analytics)
 */
export interface ProfileView {
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

/**
 * Statistiques analytics d'un profil
 */
export interface ProfileAnalytics {
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

/**
 * Meta tags pour le SEO
 */
export interface MetaTags {
  title: string;
  description: string;
  keywords: string;
  openGraph: {
    title: string;
    description: string;
    image: string;
    url: string;
    type: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  canonical: string;
}

/**
 * Entrée sitemap pour un profil
 */
export interface SitemapEntry {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: number;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * Schéma de validation pour les liens de réseaux sociaux
 */
export const SocialLinksSchema = z.object({
  instagram: z.string().url('URL Instagram invalide').optional(),
  facebook: z.string().url('URL Facebook invalide').optional(),
  pinterest: z.string().url('URL Pinterest invalide').optional(),
  linkedin: z.string().url('URL LinkedIn invalide').optional(),
  tiktok: z.string().url('URL TikTok invalide').optional(),
  youtube: z.string().url('URL YouTube invalide').optional(),
  other: z.string().url('URL invalide').optional(),
}).optional();

/**
 * Schéma de validation pour le bouton CTA
 */
export const CTAButtonSchema = z.object({
  text: z
    .string()
    .min(1, 'Le texte du bouton est requis')
    .max(TEXT_LIMITS.CTA_TEXT, `Le texte ne peut pas dépasser ${TEXT_LIMITS.CTA_TEXT} caractères`),
  url: z.string().url('URL invalide'),
  style: z.enum(['primary', 'secondary'], {
    message: 'Le style doit être "primary" ou "secondary"',
  }),
}).optional();

/**
 * Schéma de validation pour un témoignage
 */
export const TestimonialSchema = z.object({
  id: z.string().uuid('ID invalide'),
  clientName: z
    .string()
    .min(1, 'Le nom du client est requis')
    .max(TEXT_LIMITS.CLIENT_NAME, `Le nom ne peut pas dépasser ${TEXT_LIMITS.CLIENT_NAME} caractères`),
  clientPhoto: z.string().url('URL de photo invalide').optional(),
  rating: z
    .number()
    .int('La note doit être un nombre entier')
    .min(1, 'La note minimale est 1')
    .max(5, 'La note maximale est 5'),
  text: z
    .string()
    .min(1, 'Le texte du témoignage est requis')
    .max(TEXT_LIMITS.TESTIMONIAL_TEXT, `Le texte ne peut pas dépasser ${TEXT_LIMITS.TESTIMONIAL_TEXT} caractères`),
  date: z.string().datetime('Date invalide'),
});

/**
 * Schéma de validation complet pour un profil public
 */
export const PublicProfileSchema = z.object({
  isEnabled: z.boolean(),

  // Identité
  slug: z
    .string()
    .min(1, 'Le slug est requis')
    .max(TEXT_LIMITS.SLUG, `Le slug ne peut pas dépasser ${TEXT_LIMITS.SLUG} caractères`)
    .regex(/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets')
    .refine((slug) => !RESERVED_SLUGS.includes(slug as any), 'Ce slug est réservé'),

  displayName: z
    .string()
    .min(1, 'Le nom est requis')
    .max(TEXT_LIMITS.DISPLAY_NAME, `Le nom ne peut pas dépasser ${TEXT_LIMITS.DISPLAY_NAME} caractères`),

  tagline: z
    .string()
    .max(TEXT_LIMITS.TAGLINE, `Le slogan ne peut pas dépasser ${TEXT_LIMITS.TAGLINE} caractères`)
    .optional(),

  bio: z
    .string()
    .max(TEXT_LIMITS.BIO, `La bio ne peut pas dépasser ${TEXT_LIMITS.BIO} caractères`)
    .optional(),

  location: z
    .string()
    .max(TEXT_LIMITS.LOCATION, `La localisation ne peut pas dépasser ${TEXT_LIMITS.LOCATION} caractères`)
    .optional(),

  // Médias
  avatarUrl: z.string().url('URL invalide').optional(),
  coverImageUrl: z.string().url('URL invalide').optional(),

  // Spécialités
  specialties: z
    .array(z.string().max(TEXT_LIMITS.SPECIALTY, `Chaque spécialité ne peut pas dépasser ${TEXT_LIMITS.SPECIALTY} caractères`))
    .max(ARRAY_LIMITS.SPECIALTIES, `Maximum ${ARRAY_LIMITS.SPECIALTIES} spécialités`)
    .optional(),

  yearsOfExperience: z
    .number()
    .int('Les années d\'expérience doivent être un nombre entier')
    .min(0, 'Les années d\'expérience ne peuvent pas être négatives')
    .max(100, 'Les années d\'expérience ne peuvent pas dépasser 100')
    .optional(),

  awards: z
    .array(z.string().max(TEXT_LIMITS.AWARD, `Chaque récompense ne peut pas dépasser ${TEXT_LIMITS.AWARD} caractères`))
    .max(ARRAY_LIMITS.AWARDS, `Maximum ${ARRAY_LIMITS.AWARDS} récompenses`)
    .optional(),

  // Contact
  publicEmail: z.string().email('Email invalide').optional(),

  phone: z
    .string()
    .max(TEXT_LIMITS.PHONE, `Le téléphone ne peut pas dépasser ${TEXT_LIMITS.PHONE} caractères`)
    .optional(),

  website: z.string().url('URL invalide').optional(),

  address: z
    .string()
    .max(TEXT_LIMITS.ADDRESS, `L'adresse ne peut pas dépasser ${TEXT_LIMITS.ADDRESS} caractères`)
    .optional(),

  // Réseaux sociaux
  socialLinks: SocialLinksSchema,

  // CTA
  ctaButton: CTAButtonSchema,

  // Témoignages
  testimonials: z
    .array(TestimonialSchema)
    .max(ARRAY_LIMITS.TESTIMONIALS, `Maximum ${ARRAY_LIMITS.TESTIMONIALS} témoignages`)
    .optional(),

  // Galeries
  featuredGalleries: z.array(z.string().uuid('ID de galerie invalide')).optional(),
  hiddenGalleries: z.array(z.string().uuid('ID de galerie invalide')).optional(),

  // SEO
  metaTitle: z
    .string()
    .max(TEXT_LIMITS.META_TITLE, `Le titre SEO ne peut pas dépasser ${TEXT_LIMITS.META_TITLE} caractères`)
    .optional(),

  metaDescription: z
    .string()
    .max(TEXT_LIMITS.META_DESCRIPTION, `La description SEO ne peut pas dépasser ${TEXT_LIMITS.META_DESCRIPTION} caractères`)
    .optional(),

  metaKeywords: z
    .array(z.string())
    .max(ARRAY_LIMITS.META_KEYWORDS, `Maximum ${ARRAY_LIMITS.META_KEYWORDS} mots-clés`)
    .optional(),
});

/**
 * Type inféré du schéma de validation
 */
export type PublicProfileInput = z.infer<typeof PublicProfileSchema>;

/**
 * Schéma de validation partiel pour les mises à jour
 */
export const PublicProfileUpdateSchema = PublicProfileSchema.partial().extend({
  slug: PublicProfileSchema.shape.slug, // Le slug reste requis
  displayName: PublicProfileSchema.shape.displayName, // Le nom reste requis
});

/**
 * Type inféré du schéma de mise à jour
 */
export type PublicProfileUpdate = z.infer<typeof PublicProfileUpdateSchema>;
