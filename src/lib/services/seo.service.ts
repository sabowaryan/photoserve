/**
 * SEO Service
 * Handles metadata generation, structured data, and SEO-related functionality
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.8
 */

import type { Metadata } from 'next';
import type { PageType, StructuredDataType, FAQ, Gallery } from '@/types';

// Base URL for the application
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';

// Default metadata values - aligned with landing page content
const DEFAULT_TITLE =
  'PikSend – Livraison de photos en qualité originale pour photographes';

const DEFAULT_DESCRIPTION =
  'PikSend permet aux photographes de livrer leurs photos en qualité originale via des galeries sécurisées. Aucune compression, téléchargement HD, simple pour vos clients.';

// Core keywords aligned with landing page messaging
const CORE_KEYWORDS = [
  'partage photos qualité originale',
  'alternative WhatsApp photographe',
  'galerie photo sans compression',
  'livraison photos HD',
  'photographe professionnel',
  'galerie sécurisée mot de passe',
  'photos haute résolution',
  'partage photos clients',
  'galerie temporaire',
  'téléchargement photos qualité max',
];

/**
 * SEO Service Interface
 */
export interface ISeoService {
  generateMetadata(page: PageType, data?: MetadataInput): Metadata;
  generateStructuredData(type: StructuredDataType, data?: StructuredDataInput): object;
}

/**
 * Input types for metadata generation
 */
export interface MetadataInput {
  gallery?: Gallery;
  legalPage?: string;
  customTitle?: string;
  customDescription?: string;
}

/**
 * Input types for structured data generation
 */
export interface StructuredDataInput {
  faqs?: FAQ[];
  gallery?: Gallery;
  images?: Array<{ url: string; caption?: string }>;
}

/**
 * SEO Service Implementation
 */
export class SeoService implements ISeoService {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Generate metadata for different page types
   * Validates: Requirements 7.1, 7.2
   */
  generateMetadata(page: PageType, data?: MetadataInput): Metadata {
    switch (page) {
      case 'landing':
        return this.generateLandingMetadata();
      case 'pricing':
        return this.generatePricingMetadata();
      case 'features':
        return this.generateFeaturesMetadata();
      case 'help':
        return this.generateHelpMetadata();
      case 'contact':
        return this.generateContactMetadata();
      case 'auth':
        return this.generateAuthMetadata();
      case 'dashboard':
        return this.generateDashboardMetadata();
      case 'gallery':
        return this.generateGalleryMetadata(data?.gallery);
      case 'settings':
        return this.generateSettingsMetadata();
      case 'legal':
        return this.generateLegalMetadata(data?.legalPage);
      default:
        return this.generateDefaultMetadata();
    }
  }


  /**
   * Generate landing page metadata
   * Aligned with landing.md content - focus on WhatsApp compression problem
   */
  private generateLandingMetadata(): Metadata {
  const title =
    'PikSend – Livrez vos photos en qualité originale jusqu’à la livraison';

  const description =
    'Vos photos sont exportées en haute résolution, mais vos clients ne reçoivent pas toujours cette qualité. PikSend permet une livraison photo HD, sans compression, via un simple lien sécurisé.';

  return {
    title,
    description,
    keywords: [
      ...CORE_KEYWORDS,
      'livraison photo qualité originale',
      'galerie photo professionnelle',
      'partage photos sans compression',
      'livraison photos clients',
    ],
      authors: [{ name: 'PikSend' }],
      creator: 'PikSend',
      publisher: 'PikSend',
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: this.baseUrl,
        languages: {
          'fr-FR': this.baseUrl,
        },
      },
      openGraph: {
  title: 'PikSend – Livraison photo HD sans perte de qualité',
  description:
    'Livrez vos photos exactement comme vous les avez exportées. Galeries sécurisées, téléchargement en qualité originale, simple pour vos clients.',
  type: 'website',
  locale: 'fr_FR',
  url: this.baseUrl,
  siteName: 'PikSend',
  images: [
    {
      url: `${this.baseUrl}/og-image.png`,
      width: 1200,
      height: 630,
      alt: 'PikSend – Livraison de photos en qualité originale',
    },
  ],
},
      twitter: {
  card: 'summary_large_image',
  title: 'PikSend – Vos photos livrées en qualité originale',
  description:
    'Livraison photo HD pour photographes professionnels. Zéro compression, galeries sécurisées, simple pour vos clients.',
  images: [`${this.baseUrl}/og-image.png`],
},
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      verification: {
        // Add verification codes when available
        // google: 'your-google-verification-code',
      },
    };
  }

  /**
   * Generate pricing page metadata
   * Aligned with landing page pricing section
   */
  private generatePricingMetadata(): Metadata {
    const title = 'Tarifs PikSend - Commencez gratuitement, évoluez quand vous êtes prêt';
    const description = 'Plans adaptés aux photographes : Gratuit pour tester, Premium à $9.99/mois, Pro à $25.99/mois. Livrez vos photos en qualité originale sans compression. Annulation en 1 clic.';

    return {
      title,
      description,
      keywords: [
        'tarifs galerie photo',
        'prix partage photos HD',
        'abonnement photographe professionnel',
        'galerie photo gratuite',
        'stockage photos photographe',
        'plan photographe premium',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/pricing`,
      },
      openGraph: {
        title: 'Tarifs PikSend - Du gratuit au Pro',
        description: 'Commencez gratuitement avec 3 galeries. Passez à Premium ou Pro pour plus de stockage et de fonctionnalités. Satisfait ou remboursé 30 jours.',
        type: 'website',
        locale: 'fr_FR',
        url: `${this.baseUrl}/pricing`,
        siteName: 'PikSend',
        images: [
          {
            url: `${this.baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'Tarifs PikSend - Plans pour photographes',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Tarifs PikSend - Commencez gratuitement',
        description: 'Plans adaptés aux photographes. Gratuit, Premium $9.99/mois, Pro $25.99/mois.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate features page metadata
   */
  private generateFeaturesMetadata(): Metadata {
    const title = 'Fonctionnalités PikSend - Livrez vos photos en HD, pas compressées';
    const description = 'Qualité 100% préservée, galeries sécurisées par mot de passe, expiration automatique, téléchargement HD. Tout ce dont un photographe a besoin pour livrer ses photos.';

    return {
      title,
      description,
      keywords: [
        'fonctionnalités galerie photo',
        'partage photos sans compression',
        'galerie sécurisée photographe',
        'téléchargement photos HD',
        'expiration galerie automatique',
        'protection mot de passe photos',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/features`,
      },
      openGraph: {
        title: 'Fonctionnalités PikSend - WhatsApp vs PikSend',
        description: 'WhatsApp compresse à 70%. PikSend préserve 100%. Comparez et découvrez pourquoi les photographes choisissent PikSend.',
        type: 'website',
        locale: 'fr_FR',
        url: `${this.baseUrl}/features`,
        siteName: 'PikSend',
        images: [
          {
            url: `${this.baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'Fonctionnalités PikSend',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Fonctionnalités PikSend',
        description: 'Qualité 100% préservée, galeries sécurisées, expiration automatique. Tout pour livrer vos photos en HD.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate help page metadata
   */
  private generateHelpMetadata(): Metadata {
    const title = 'Centre d\'aide PikSend - FAQ et guides';
    const description = 'Trouvez les réponses à vos questions sur PikSend. Comment créer une galerie, partager vos photos, gérer votre abonnement et plus encore.';

    return {
      title,
      description,
      keywords: [
        'aide PikSend',
        'FAQ galerie photo',
        'support photographe',
        'guide utilisation PikSend',
        'questions fréquentes',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/help`,
      },
      openGraph: {
        title: 'Centre d\'aide PikSend',
        description: 'Guides, FAQ et support technique pour utiliser PikSend.',
        type: 'website',
        locale: 'fr_FR',
        url: `${this.baseUrl}/help`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'Centre d\'aide PikSend',
        description: 'Trouvez les réponses à vos questions sur PikSend.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate contact page metadata
   */
  private generateContactMetadata(): Metadata {
    const title = 'Contact PikSend - Support et questions';
    const description = 'Contactez l\'équipe PikSend. Support technique, questions commerciales ou partenariats. Réponse sous 24-48h.';

    return {
      title,
      description,
      keywords: [
        'contact PikSend',
        'support photographe',
        'aide technique galerie photo',
        'partenariat photographe',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/contact`,
      },
      openGraph: {
        title: 'Contactez PikSend',
        description: 'Une question ? Notre équipe est là pour vous aider.',
        type: 'website',
        locale: 'fr_FR',
        url: `${this.baseUrl}/contact`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'Contact PikSend',
        description: 'Support technique et questions commerciales.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate auth page metadata
   */
  private generateAuthMetadata(): Metadata {
    const title = 'Connexion PikSend - Accédez à vos galeries';
    const description = 'Connectez-vous ou créez un compte PikSend pour gérer vos galeries photo sécurisées et livrer vos photos en qualité originale.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/auth`,
      },
      openGraph: {
        title: 'Connexion PikSend',
        description: 'Accédez à vos galeries photo sécurisées.',
        type: 'website',
        locale: 'fr_FR',
        url: `${this.baseUrl}/auth`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'Connexion PikSend',
        description: 'Accédez à vos galeries photo sécurisées.',
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }


  /**
   * Generate dashboard page metadata
   */
  private generateDashboardMetadata(): Metadata {
    const title = 'Tableau de bord - PikSend';
    const description = 'Gérez vos galeries photo, consultez vos statistiques et créez de nouvelles galeries sécurisées.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /**
   * Generate gallery view page metadata
   * Validates: Requirements 7.8 - noindex for gallery pages
   */
  private generateGalleryMetadata(gallery?: Gallery): Metadata {
    const title = gallery 
      ? `${gallery.title} | PikSend`
      : 'Galerie photo - PikSend';
    const description = 'Galerie photo sécurisée par mot de passe.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      // Important: noindex for gallery pages to protect client privacy
      robots: {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
        noimageindex: true,
      },
    };
  }

  /**
   * Generate settings page metadata
   */
  private generateSettingsMetadata(): Metadata {
    const title = 'Paramètres - PikSend';
    const description = 'Gérez votre profil, votre abonnement et vos préférences PikSend.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /**
   * Generate legal page metadata
   */
  private generateLegalMetadata(page?: string): Metadata {
    const legalPages: Record<string, { title: string; description: string }> = {
      terms: {
        title: 'Conditions d\'utilisation - PikSend',
        description: 'Consultez les conditions générales d\'utilisation de PikSend.',
      },
      privacy: {
        title: 'Politique de confidentialité - PikSend',
        description: 'Découvrez comment PikSend protège vos données personnelles.',
      },
      cookies: {
        title: 'Politique des cookies - PikSend',
        description: 'Informations sur l\'utilisation des cookies par PikSend.',
      },
      mentions: {
        title: 'Mentions légales - PikSend',
        description: 'Mentions légales et informations sur l\'éditeur de PikSend.',
      },
    };

    const pageInfo = page && legalPages[page] 
      ? legalPages[page] 
      : { title: 'Informations légales - PikSend', description: 'Informations légales de PikSend.' };

    return {
      title: pageInfo.title,
      description: pageInfo.description,
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: page ? `${this.baseUrl}/legal/${page}` : `${this.baseUrl}/legal`,
      },
      openGraph: {
        title: pageInfo.title,
        description: pageInfo.description,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: pageInfo.title,
        description: pageInfo.description,
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate default metadata
   */
  private generateDefaultMetadata(): Metadata {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        type: 'website',
        locale: 'fr_FR',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
      },
    };
  }


  /**
   * Generate structured data (JSON-LD) for different types
   * Validates: Requirements 7.3
   */
  generateStructuredData(type: StructuredDataType, data?: StructuredDataInput): object {
    switch (type) {
      case 'Organization':
        return this.generateOrganizationSchema();
      case 'FAQPage':
        return this.generateFAQSchema(data?.faqs || []);
      case 'ImageGallery':
        return this.generateImageGallerySchema(data?.gallery, data?.images);
      default:
        return {};
    }
  }

  /**
   * Generate Organization schema
   */
  private generateOrganizationSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'PikSend',
      url: this.baseUrl,
      logo: `${this.baseUrl}/logo.svg`,
      description: DEFAULT_DESCRIPTION,
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['French'],
      },
    };
  }

  /**
   * Generate FAQ schema
   */
  private generateFAQSchema(faqs: FAQ[]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  /**
   * Generate ImageGallery schema
   */
  private generateImageGallerySchema(
    gallery?: Gallery,
    images?: Array<{ url: string; caption?: string }>
  ): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'ImageGallery',
      name: gallery?.title || 'Galerie photo',
      description: 'Galerie photo sécurisée',
      dateCreated: gallery?.created_at,
      image: images?.map((img) => ({
        '@type': 'ImageObject',
        contentUrl: img.url,
        caption: img.caption,
      })) || [],
    };
  }
}

/**
 * Factory function to create SEO service instance
 */
export function createSeoService(baseUrl?: string): ISeoService {
  return new SeoService(baseUrl);
}

/**
 * Default SEO service instance
 */
export const seoService = createSeoService();

/**
 * Helper function to generate metadata for a page
 */
export function generatePageMetadata(page: PageType, data?: MetadataInput): Metadata {
  return seoService.generateMetadata(page, data);
}

/**
 * Helper function to generate structured data
 */
export function generateStructuredData(type: StructuredDataType, data?: StructuredDataInput): object {
  return seoService.generateStructuredData(type, data);
}

/**
 * Default FAQs for the landing page
 */
export const DEFAULT_FAQS: FAQ[] = [
  {
    question: 'Comment fonctionne PikSend ?',
    answer: 'PikSend vous permet de créer des galeries photo sécurisées par mot de passe. Uploadez vos photos, définissez un mot de passe et une date d\'expiration, puis partagez le lien avec vos clients.',
  },
  {
    question: 'Mes photos sont-elles sécurisées ?',
    answer: 'Oui, toutes les galeries sont protégées par mot de passe. Les mots de passe sont hashés avec bcrypt et les galeries ne sont pas indexées par les moteurs de recherche.',
  },
  {
    question: 'Combien de temps mes galeries restent-elles disponibles ?',
    answer: 'La durée dépend de votre plan. Le plan gratuit permet jusqu\'à 30 jours, le plan Premium jusqu\'à 90 jours, et le plan Pro jusqu\'à 180 jours.',
  },
  {
    question: 'Puis-je télécharger les photos en haute résolution ?',
    answer: 'Oui, vos clients peuvent télécharger les photos dans leur résolution originale directement depuis la galerie.',
  },
  {
    question: 'Comment puis-je passer à un plan supérieur ?',
    answer: 'Vous pouvez mettre à niveau votre plan à tout moment depuis votre tableau de bord. Le changement est immédiat et vous bénéficiez instantanément des nouvelles limites.',
  },
];
