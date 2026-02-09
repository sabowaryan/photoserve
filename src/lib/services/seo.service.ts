/**
 * SEO Service
 * Handles metadata generation, structured data, and SEO-related functionality
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.8, 8.1, 8.2, 8.3
 */

import type { Metadata } from 'next';
import type { PageType, StructuredDataType, FAQ, Gallery } from '@/types';
import { SupportedLocale, FALLBACK_LOCALE } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/server';

// Base URL for the application
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';

// "The Elegant Bridge" Positioning
// PikSend = WeTransfer simplicity + Studio gallery elegance
// UVP: "Your work is high-end. Your delivery should be too."

// Primary keywords to maintain consistency across title, description, FAQs:
// - "professional photo delivery" (title keyword)
// - "no compression" (title keyword)
// - "galleries" (title keyword)
// - "original quality" (UVP keyword)
// - "zero friction" (UVP keyword)

// Title: Position as premium delivery experience, not just a tool
const DEFAULT_TITLE =
  'PikSend | Professional Photo Delivery Galleries (No Compression)';

// Description: Contains all title keywords + UVP messaging
const DEFAULT_DESCRIPTION =
  'Professional photo delivery galleries with no compression. Your work is high-end — your delivery should be too. Original quality, zero friction, no account required for guests.';

// Competitive differentiation keywords - aligned with title and FAQs
const CORE_KEYWORDS = [
  // Primary keywords (from title)
  'professional photo delivery',
  'photo delivery galleries',
  'no compression photo sharing',
  'original quality photos',
  // vs WhatsApp - "Don't let an algorithm destroy your pixels"
  'whatsapp photo quality alternative',
  'send photos without compression',
  'photo quality loss solution',
  // vs WeTransfer - "Don't ask clients to download a blind ZIP"
  'wetransfer alternative for photographers',
  'visual photo gallery delivery',
  'photo gallery instead of zip',
  // vs Google Drive - "Zero friction, no 'Request Access'"
  'no login photo sharing',
  'instant photo gallery access',
  'client gallery no account required',
  // vs Pixieset - "Pro gallery in 30 seconds, not 30 minutes"
  'fast photo gallery setup',
  'simple photographer gallery',
  'pixieset alternative',
  // General high-value keywords
  'professional photography delivery',
  'deliver high res photos to clients',
  'online photo gallery for photographers',
  'secure photo gallery',
  'password protected photo gallery',
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
  locale?: SupportedLocale;
  customDomain?: string; // Custom domain for canonical URL and Open Graph tags
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
        return this.generateGalleryMetadata(data?.gallery, data?.customDomain);
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
   * "The Elegant Bridge" positioning - WeTransfer simplicity + Studio elegance
   * SEO-optimized: Title keywords repeated in description, OG, and aligned with FAQs
   */
  private generateLandingMetadata(): Metadata {
    const title = DEFAULT_TITLE;
    const description = DEFAULT_DESCRIPTION;

    return {
      title,
      description,
      keywords: [
        ...CORE_KEYWORDS,
        // Additional landing-specific keywords
        'professional client gallery',
        'elegant photo delivery',
        'studio quality gallery',
        'high-end photo sharing',
      ],
      authors: [{ name: 'PikSend' }],
      creator: 'PikSend',
      publisher: 'PikSend',
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: this.baseUrl,
        languages: {
          'en-US': this.baseUrl,
        },
      },
      openGraph: {
        // Contains title keywords: professional, photo delivery, no compression
        title: 'Stop Killing Your Photo Quality — Professional Photo Delivery with No Compression',
        // Contains: original quality, galleries, zero friction
        description: 'Professional photo delivery galleries in original quality. Zero friction, no account required for guests. Your work is high-end — your delivery should be too.',
        type: 'website',
        locale: 'en_US',
        url: this.baseUrl,
        siteName: 'PikSend',
        images: [
          {
            url: `${this.baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'PikSend - Professional Photo Delivery Galleries',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        // Contains title keywords
        title: 'Professional Photo Delivery Galleries — No Compression | PikSend',
        // Contains: original quality, zero friction
        description: 'Deliver photos in original quality with zero friction. Professional galleries, no account required for clients.',
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
   * Keywords: professional photo delivery, galleries, no compression, original quality
   */
  private generatePricingMetadata(): Metadata {
    const title = 'PikSend Pricing | Professional Photo Delivery Galleries — Start Free';
    const description = 'Professional photo delivery galleries with no compression. Free plan to start, Premium $9.99/month, Pro $25.99/month. Original quality delivery, zero friction for your clients.';

    return {
      title,
      description,
      keywords: [
        'professional photo delivery pricing',
        'photo gallery pricing',
        'no compression photo sharing price',
        'photographer gallery subscription',
        'free photo delivery gallery',
        'original quality photo plans',
        'pixieset alternative pricing',
        'wetransfer alternative pricing',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/pricing`,
      },
      openGraph: {
        title: 'Professional Photo Delivery Galleries — Pricing | PikSend',
        description: 'Start free with professional photo delivery galleries. No compression, original quality. Upgrade when ready.',
        type: 'website',
        locale: 'en_US',
        url: `${this.baseUrl}/pricing`,
        siteName: 'PikSend',
        images: [
          {
            url: `${this.baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'PikSend Pricing - Professional Photo Delivery Galleries',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Professional Photo Delivery Galleries — Start Free | PikSend',
        description: 'No compression photo delivery. Free, Premium $9.99/month, Pro $25.99/month.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate features page metadata
   * Keywords: professional photo delivery, galleries, no compression, original quality
   */
  private generateFeaturesMetadata(): Metadata {
    const title = 'PikSend Features | Professional Photo Delivery Galleries — No Compression';
    const description = 'Professional photo delivery galleries with no compression. Original quality preserved, password-protected, zero friction access. Better than WhatsApp, WeTransfer, or Pixieset.';

    return {
      title,
      description,
      keywords: [
        'professional photo delivery features',
        'no compression photo gallery',
        'original quality photo sharing',
        'password protected photo gallery',
        'whatsapp photo alternative',
        'wetransfer alternative features',
        'pixieset alternative features',
        'zero friction photo delivery',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/features`,
      },
      openGraph: {
        title: 'Professional Photo Delivery Features — No Compression | PikSend',
        description: 'WhatsApp compresses 70%. PikSend preserves 100% original quality. Professional galleries, zero friction.',
        type: 'website',
        locale: 'en_US',
        url: `${this.baseUrl}/features`,
        siteName: 'PikSend',
        images: [
          {
            url: `${this.baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'PikSend Features - Professional Photo Delivery Galleries',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Professional Photo Delivery — No Compression | PikSend',
        description: 'Original quality galleries, zero friction, password protected. Better than WhatsApp or WeTransfer.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate help page metadata
   * Keywords: professional photo delivery, galleries, no compression
   */
  private generateHelpMetadata(): Metadata {
    const title = 'PikSend Help Center | Professional Photo Delivery Galleries FAQ';
    const description = 'Get help with PikSend professional photo delivery galleries. Learn how to create galleries, share photos with no compression, and deliver in original quality.';

    return {
      title,
      description,
      keywords: [
        'PikSend help',
        'professional photo delivery help',
        'photo gallery FAQ',
        'no compression photo guide',
        'original quality delivery support',
        'photographer gallery tutorial',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/help`,
      },
      openGraph: {
        title: 'Help Center — Professional Photo Delivery Galleries | PikSend',
        description: 'Guides and FAQ for professional photo delivery. No compression, original quality galleries.',
        type: 'website',
        locale: 'en_US',
        url: `${this.baseUrl}/help`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'PikSend Help Center — Photo Delivery Galleries',
        description: 'Get help with professional photo delivery galleries.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate contact page metadata
   * Keywords: professional photo delivery, galleries
   */
  private generateContactMetadata(): Metadata {
    const title = 'Contact PikSend | Professional Photo Delivery Galleries Support';
    const description = 'Contact PikSend for professional photo delivery galleries support. Technical help, business inquiries, partnerships. Response within 24-48h.';

    return {
      title,
      description,
      keywords: [
        'contact PikSend',
        'professional photo delivery support',
        'photo gallery help',
        'photographer support',
        'PikSend partnership',
      ],
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/contact`,
      },
      openGraph: {
        title: 'Contact PikSend — Professional Photo Delivery Support',
        description: 'Get help with professional photo delivery galleries. Our team responds within 24-48h.',
        type: 'website',
        locale: 'en_US',
        url: `${this.baseUrl}/contact`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'Contact PikSend — Photo Delivery Support',
        description: 'Professional photo delivery galleries support and inquiries.',
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  }

  /**
   * Generate auth page metadata
   * Keywords: professional photo delivery, galleries
   * noindex: true (private page)
   */
  private generateAuthMetadata(): Metadata {
    const title = 'Sign In | PikSend Professional Photo Delivery Galleries';
    const description = 'Sign in to PikSend to manage your professional photo delivery galleries. Original quality, no compression, zero friction for your clients.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: `${this.baseUrl}/auth`,
      },
      openGraph: {
        title: 'Sign In — Professional Photo Delivery Galleries | PikSend',
        description: 'Access your professional photo delivery galleries.',
        type: 'website',
        locale: 'en_US',
        url: `${this.baseUrl}/auth`,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'Sign In to PikSend',
        description: 'Access your professional photo delivery galleries.',
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /**
   * Generate dashboard page metadata
   * Keywords: professional photo delivery, galleries
   * noindex: true (private page)
   */
  private generateDashboardMetadata(): Metadata {
    const title = 'Dashboard | PikSend Professional Photo Delivery Galleries';
    const description = 'Manage your professional photo delivery galleries. Create new galleries, view statistics, deliver photos in original quality with no compression.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title: 'Dashboard — Professional Photo Delivery Galleries | PikSend',
        description: 'Manage your professional photo delivery galleries.',
        type: 'website',
        locale: 'en_US',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'PikSend Dashboard',
        description: 'Manage your professional photo delivery galleries.',
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /**
   * Generate gallery view page metadata
   * Keywords: professional photo delivery, gallery, original quality
   * Validates: Requirements 7.8 - noindex for gallery pages (privacy)
   * Validates: Requirements 12.1, 12.2, 12.3, 12.4 - Custom domain support
   */
  private generateGalleryMetadata(gallery?: Gallery, customDomain?: string): Metadata {
    const title = gallery 
      ? `${gallery.title} | PikSend Professional Photo Gallery`
      : 'Professional Photo Gallery | PikSend';
    const description = 'Professional photo delivery gallery. Original quality photos, no compression, password-protected.';

    // Determine the base URL for canonical and Open Graph tags
    // If custom domain is provided, use it; otherwise use the default base URL
    // Clean up custom domain by removing trailing slashes and ensuring it's not empty
    const cleanCustomDomain = customDomain?.trim().replace(/\/+$/, '');
    const baseUrl = cleanCustomDomain && cleanCustomDomain.length > 0
      ? `https://${cleanCustomDomain}` 
      : this.baseUrl;
    
    // Construct the canonical URL
    const canonicalUrl = gallery 
      ? `${baseUrl}/g/${gallery.unique_slug}`
      : baseUrl;

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: gallery?.title || 'Professional Photo Gallery | PikSend',
        description: 'Professional photo delivery gallery in original quality.',
        type: 'website',
        locale: 'en_US',
        url: canonicalUrl,
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: gallery?.title || 'Professional Photo Gallery',
        description: 'Professional photo delivery gallery.',
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
   * Keywords: professional photo delivery, galleries
   * noindex: true (private page)
   */
  private generateSettingsMetadata(): Metadata {
    const title = 'Settings | PikSend Professional Photo Delivery Galleries';
    const description = 'Manage your PikSend account settings. Profile, subscription, and preferences for professional photo delivery galleries.';

    return {
      title,
      description,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title: 'Settings — Professional Photo Delivery | PikSend',
        description: 'Manage your professional photo delivery account.',
        type: 'website',
        locale: 'en_US',
        siteName: 'PikSend',
      },
      twitter: {
        card: 'summary',
        title: 'PikSend Settings',
        description: 'Manage your professional photo delivery account.',
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  /**
   * Generate legal page metadata
   * Keywords: professional photo delivery, galleries
   */
  private generateLegalMetadata(page?: string): Metadata {
    const legalPages: Record<string, { title: string; description: string }> = {
      terms: {
        title: 'Terms of Service | PikSend Professional Photo Delivery Galleries',
        description: 'Terms of service for PikSend professional photo delivery galleries. No compression, original quality photo sharing.',
      },
      privacy: {
        title: 'Privacy Policy | PikSend Professional Photo Delivery Galleries',
        description: 'Privacy policy for PikSend professional photo delivery galleries. How we protect your photos and data.',
      },
      cookies: {
        title: 'Cookie Policy | PikSend Professional Photo Delivery Galleries',
        description: 'Cookie policy for PikSend professional photo delivery galleries.',
      },
      mentions: {
        title: 'Legal Notice | PikSend Professional Photo Delivery Galleries',
        description: 'Legal notice for PikSend professional photo delivery galleries.',
      },
    };

    const pageInfo = page && legalPages[page] 
      ? legalPages[page] 
      : { title: 'Legal | PikSend Professional Photo Delivery Galleries', description: 'Legal information for PikSend professional photo delivery galleries.' };

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
        locale: 'en_US',
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
   * Uses primary keywords: professional photo delivery, galleries, no compression
   */
  private generateDefaultMetadata(): Metadata {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      keywords: CORE_KEYWORDS,
      metadataBase: new URL(this.baseUrl),
      openGraph: {
        title: DEFAULT_TITLE,
        description: DEFAULT_DESCRIPTION,
        type: 'website',
        locale: 'en_US',
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
      case 'SoftwareApplication':
        return this.generateSoftwareApplicationSchema();
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
      logo: `${this.baseUrl}/icons/logo.svg`,
      description: DEFAULT_DESCRIPTION,
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        availableLanguage: ['English'],
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
      name: gallery?.title || 'Photo Gallery',
      description: 'Secure photo gallery',
      dateCreated: gallery?.created_at,
      image: images?.map((img) => ({
        '@type': 'ImageObject',
        contentUrl: img.url,
        caption: img.caption,
      })) || [],
    };
  }

  /**
   * Generate SoftwareApplication schema
   * Important for SaaS ranking
   */
  private generateSoftwareApplicationSchema(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      'name': 'PikSend',
      'operatingSystem': 'All',
      'applicationCategory': 'MultimediaApplication',
      'description': DEFAULT_DESCRIPTION,
      'offers': {
        '@type': 'Offer',
        'price': '9.99',
        'priceCurrency': 'USD',
        'availability': 'https://schema.org/InStock'
      }
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
 * Generate localized metadata for a page
 * Uses translation keys from locale files for SEO content
 * Validates: Requirements 8.1, 8.2, 8.3
 */
export function generateLocalizedMetadata(
  page: PageType,
  locale: SupportedLocale = FALLBACK_LOCALE,
  data?: MetadataInput
): Metadata {
  const t = (key: string, params?: Record<string, string | number>) => 
    getTranslation(locale, key, params);
  
  const baseUrl = BASE_URL;
  
  // Map page types to SEO translation keys
  const seoKeyMap: Record<PageType, string> = {
    landing: 'seo.home',
    pricing: 'seo.pricing',
    features: 'seo.features',
    help: 'seo.help',
    contact: 'seo.contact',
    auth: 'seo.auth',
    dashboard: 'seo.dashboard',
    gallery: 'seo.galleryDetails',
    settings: 'seo.dashboard',
    legal: 'seo.legal',
  };

  const seoKey = seoKeyMap[page] || 'seo.home';
  
  // Get localized title and description
  let title: string;
  let description: string;
  
  if (page === 'legal' && data?.legalPage) {
    title = t(`seo.legal.${data.legalPage}.title`);
    description = t(`seo.legal.${data.legalPage}.description`);
  } else {
    title = data?.customTitle || t(`${seoKey}.title`);
    description = data?.customDescription || t(`${seoKey}.description`);
  }

  // Get locale code for OpenGraph
  const ogLocaleMap: Record<SupportedLocale, string> = {
    en: 'en_US',
    fr: 'fr_FR',
    sv: 'sv_SE',
    no: 'nb_NO',
    da: 'da_DK',
    fi: 'fi_FI',
    ja: 'ja_JP',
    ko: 'ko_KR',
    'zh-CN': 'zh_CN',
    'zh-TW': 'zh_TW',
    ar: 'ar_SA',
  };

  const ogLocale = ogLocaleMap[locale] || 'en_US';

  // Determine if page should be indexed
  const noIndexPages: PageType[] = ['dashboard', 'settings', 'auth', 'gallery'];
  const shouldIndex = !noIndexPages.includes(page);

  // Build alternates for hreflang
  const alternateLanguages: Record<string, string> = {};
  const supportedLocales: SupportedLocale[] = ['en', 'fr', 'sv', 'no', 'da', 'fi', 'ja', 'ko', 'zh-CN', 'zh-TW', 'ar'];
  
  for (const loc of supportedLocales) {
    const langCode = loc === 'zh-CN' ? 'zh-Hans' : loc === 'zh-TW' ? 'zh-Hant' : loc;
    alternateLanguages[langCode] = `${baseUrl}/${loc}${page === 'landing' ? '' : `/${page}`}`;
  }

  return {
    title,
    description,
    metadataBase: new URL(baseUrl),
    alternates: shouldIndex ? {
      canonical: `${baseUrl}${page === 'landing' ? '' : `/${page}`}`,
      languages: alternateLanguages,
    } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: ogLocale,
      url: `${baseUrl}${page === 'landing' ? '' : `/${page}`}`,
      siteName: 'PikSend',
      images: [
        {
          url: `${baseUrl}/og-image.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
    },
    robots: shouldIndex ? {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    } : {
      index: false,
      follow: false,
    },
  };
}

/**
 * Helper function to generate structured data
 */
export function generateStructuredData(type: StructuredDataType, data?: StructuredDataInput): object {
  return seoService.generateStructuredData(type, data);
}

/**
 * Default FAQs for the landing page
 * SEO-optimized: Contains primary keywords from title and description
 * Keywords: professional photo delivery, no compression, galleries, original quality, zero friction
 */
export const DEFAULT_FAQS: FAQ[] = [
  {
    question: 'Why is PikSend better than WhatsApp for professional photo delivery?',
    answer: 'WhatsApp compresses your photos by up to 70%, destroying the original quality you worked hard to achieve. PikSend delivers professional photo galleries with no compression — every pixel preserved, exactly as you exported them.',
  },
  {
    question: 'How is PikSend different from WeTransfer for photo delivery?',
    answer: 'WeTransfer sends a cold ZIP file that expires quickly. PikSend creates professional photo delivery galleries where clients can preview your work in original quality before downloading. Same simplicity, but with studio elegance.',
  },
  {
    question: 'Do clients need an account to access my photo galleries?',
    answer: 'No. Zero friction access — your clients get instant access to your professional galleries without creating an account. No "Request Access" buttons, no sign-ups required. Just share the link and they\'re in.',
  },
  {
    question: 'Is PikSend simpler than Pixieset for professional photo delivery?',
    answer: 'Yes. Create a professional photo delivery gallery in 30 seconds, not 30 minutes. No complex setup, no compression, no overwhelming features. Just upload, share, done. Original quality results without the learning curve.',
  },
  {
    question: 'Are my professional photo galleries secure?',
    answer: 'Absolutely. All professional photo delivery galleries are password-protected with enterprise-grade encryption. No compression of your images, passwords are hashed with bcrypt, and galleries are never indexed by search engines.',
  },
];
