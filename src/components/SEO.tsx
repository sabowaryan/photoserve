import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  twitterHandle?: string;
  noIndex?: boolean;
  structuredData?: object;
}

const BASE_URL = 'https://photoserve.app';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'PhotoServe';
const DEFAULT_DESCRIPTION = 'Créez des galeries photo temporaires et sécurisées par mot de passe. Partagez vos photos avec vos clients en toute confidentialité.';
const TWITTER_HANDLE = '@PhotoServe';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords = 'galerie photo, partage photos, photographe, sécurisé, mot de passe, temporaire, livraison photos, client',
  image = DEFAULT_IMAGE,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  twitterHandle = TWITTER_HANDLE,
  noIndex = false,
  structuredData,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Partagez vos photos en toute sécurité`;
  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : BASE_URL);
  
  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Update or create meta tags
    const updateMeta = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    
    // Basic meta tags
    updateMeta('description', description);
    updateMeta('keywords', keywords);
    updateMeta('author', author || SITE_NAME);
    
    // Robots
    if (noIndex) {
      updateMeta('robots', 'noindex, nofollow');
    } else {
      updateMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    }
    
    // Open Graph
    updateMeta('og:title', fullTitle, true);
    updateMeta('og:description', description, true);
    updateMeta('og:image', image, true);
    updateMeta('og:image:width', '1200', true);
    updateMeta('og:image:height', '630', true);
    updateMeta('og:image:alt', fullTitle, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', SITE_NAME, true);
    updateMeta('og:locale', 'fr_FR', true);
    
    if (publishedTime) {
      updateMeta('article:published_time', publishedTime, true);
    }
    if (modifiedTime) {
      updateMeta('article:modified_time', modifiedTime, true);
    }
    
    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:site', twitterHandle);
    updateMeta('twitter:creator', twitterHandle);
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);
    updateMeta('twitter:image:alt', fullTitle);
    
    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = currentUrl;
    
    // Structured Data (JSON-LD)
    const existingScript = document.querySelector('script[data-seo="structured-data"]');
    if (existingScript) {
      existingScript.remove();
    }
    
    const defaultStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      url: BASE_URL,
      applicationCategory: 'Photography',
      operatingSystem: 'All',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: '0',
        highPrice: '25.99',
        offerCount: '3',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '5',
        reviewCount: '500',
      },
      author: {
        '@type': 'Organization',
        name: SITE_NAME,
        url: BASE_URL,
      },
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo', 'structured-data');
    script.textContent = JSON.stringify(structuredData || defaultStructuredData);
    document.head.appendChild(script);
    
    // Cleanup function
    return () => {
      const scriptToRemove = document.querySelector('script[data-seo="structured-data"]');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [fullTitle, description, keywords, image, currentUrl, type, publishedTime, modifiedTime, author, twitterHandle, noIndex, structuredData]);
  
  return null;
}

// Pre-built structured data helpers
export const createGalleryStructuredData = (gallery: {
  title: string;
  createdAt: string;
  expiresAt: string;
  imageCount: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageGallery',
  name: gallery.title,
  dateCreated: gallery.createdAt,
  expires: gallery.expiresAt,
  numberOfItems: gallery.imageCount,
  isAccessibleForFree: true,
  accessMode: 'visual',
});

export const createOrganizationStructuredData = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: BASE_URL,
  logo: `${BASE_URL}/logo.png`,
  sameAs: [
    'https://twitter.com/PhotoServe',
    'https://www.instagram.com/photoserve',
    'https://www.linkedin.com/company/photoserve',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer service',
    availableLanguage: ['French', 'English'],
  },
});

export const createFAQStructuredData = (faqs: Array<{ question: string; answer: string }>) => ({
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
});
