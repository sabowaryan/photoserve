/**
 * SEO Utilities for Public Photographer Profiles
 * Handles meta tags generation, structured data, and sitemap entries for photographer profiles
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8
 */

import type { PublicProfile, MetaTags, SitemapEntry } from '@/types/public-profile';

/**
 * SEO Generator for Public Photographer Profiles
 * Generates meta tags, structured data, and sitemap entries
 */
export class SEOGenerator {
  /**
   * Génère les meta tags pour un profil
   * Validates: Requirements 8.1, 8.2, 8.3, 8.6, 8.7
   */
  static generateMetaTags(profile: PublicProfile): MetaTags {
    // Use custom meta title if provided, otherwise generate default
    const title = profile.metaTitle || 
      `${profile.displayName} - Photographe Professionnel`;
    
    // Use custom meta description if provided, otherwise use bio (truncated) or generate default
    const description = profile.metaDescription || 
      profile.bio?.substring(0, 160) || 
      `Découvrez le portfolio de ${profile.displayName}, photographe professionnel.`;
    
    // Use custom keywords if provided, otherwise generate from specialties
    const keywords = profile.metaKeywords?.join(', ') || 
      [...(profile.specialties || []), 'photographe', 'portfolio'].join(', ');
    
    // Use cover image or avatar for Open Graph, fallback to default
    const imageUrl = profile.coverImageUrl || profile.avatarUrl || 
      '/default-og-image.jpg';
    
    // Generate the profile URL
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
   * Génère les données structurées JSON-LD de type Person
   * Validates: Requirements 8.8
   */
  static generateStructuredData(profile: PublicProfile): object {
    // Extract social media URLs from socialLinks
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
   * Validates: Requirements 8.9, 8.10
   */
  static generateSitemapEntry(profile: PublicProfile): SitemapEntry {
    return {
      url: this.getProfileUrl(profile.slug),
      lastmod: profile.updatedAt.toISOString(),
      changefreq: 'weekly',
      priority: 0.8,
    };
  }

  /**
   * Construit l'URL complète du profil
   * @private
   */
  private static getProfileUrl(slug: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://piksend.com';
    return `${baseUrl}/p/${slug}`;
  }
}
