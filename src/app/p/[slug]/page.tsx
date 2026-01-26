/**
 * Public Photographer Profile Page
 * 
 * Static Site Generation (SSG) page for public photographer profiles
 * 
 * Requirements:
 * - 6.1: Profile accessible via /p/[slug]
 * - 6.3: Return 404 for non-existent profiles
 * - 6.4: Return 404 for disabled profiles
 * - 1.10: Handle disabled profiles
 * - 7.1: Apply custom logo if configured
 * - 7.2: Apply brand colors if configured
 * - 7.3: Display white-label footer if custom domain configured
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { createPublicProfileService } from '@/lib/services/public-profile.service';
import { SEOGenerator } from '@/lib/utils/seo.utils';
import { ProfileHeader } from '@/components/public-profile/profile-header';
import { ProfileBio } from '@/components/public-profile/profile-bio';
import { ProfileGalleries } from '@/components/public-profile/profile-galleries';
import { ProfileContact } from '@/components/public-profile/profile-contact';
import { ProfileTestimonials } from '@/components/public-profile/profile-testimonials';
import { ProfileFooter } from '@/components/public-profile/profile-footer';
import { ProfileClientWrapper } from '@/components/public-profile/profile-client-wrapper';
import type { ProfileBranding } from '@/types';

interface PublicProfilePageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generate metadata for the profile page
 * Implements SEO optimization (Requirements 8.1, 8.2, 8.3, 8.6, 8.7, 8.8)
 * Uses SEOGenerator utility class for consistent meta tag generation
 */
export async function generateMetadata({ params }: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  
  const supabase = createAdminClient();
  const service = createPublicProfileService(supabase);
  
  const profile = await service.getProfileBySlug(slug);
  
  if (!profile) {
    return {
      title: 'Profile Not Found',
    };
  }
  
  // Generate meta tags using SEOGenerator
  const metaTags = SEOGenerator.generateMetaTags(profile);
  
  return {
    title: metaTags.title,
    description: metaTags.description,
    keywords: metaTags.keywords,
    openGraph: {
      title: metaTags.openGraph.title,
      description: metaTags.openGraph.description,
      images: [metaTags.openGraph.image],
      url: metaTags.openGraph.url,
      type: metaTags.openGraph.type as 'profile',
    },
    twitter: {
      card: metaTags.twitter.card as 'summary_large_image',
      title: metaTags.twitter.title,
      description: metaTags.twitter.description,
      images: [metaTags.twitter.image],
    },
    alternates: {
      canonical: metaTags.canonical,
    },
  };
}

/**
 * Generate static params for all active profiles
 * Implements Static Site Generation (SSG) (Requirement 12.6)
 */
export async function generateStaticParams() {
  const supabase = createAdminClient();
  
  // Fetch all enabled profiles
  const { data: profiles } = await supabase
    .from('public_profiles')
    .select('slug')
    .eq('is_enabled', true);
  
  if (!profiles) {
    return [];
  }
  
  return profiles.map((profile) => ({
    slug: profile.slug,
  }));
}

/**
 * Public Profile Page Component
 * 
 * Displays the photographer's public profile with:
 * - Profile information (name, tagline, bio, location)
 * - Avatar and cover image
 * - Public galleries
 * - Contact information
 * - Social links
 * 
 * Returns 404 if:
 * - Profile doesn't exist (Requirement 6.3)
 * - Profile is disabled (Requirement 6.4)
 * - User is not Pro (Requirement 1.1)
 */
export default async function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { slug } = await params;
  
  const supabase = createAdminClient();
  const service = createPublicProfileService(supabase);
  
  // Fetch profile with galleries
  const profile = await service.getProfileBySlug(slug);
  
  // Return 404 if profile not found or disabled (Requirements 6.3, 6.4, 1.10)
  if (!profile) {
    notFound();
  }
  
  // Generate structured data for SEO (Requirement 8.8)
  const structuredData = SEOGenerator.generateStructuredData(profile);
  
  // Fetch user's branding information (Requirements 7.1, 7.2, 7.3)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('branding')
    .eq('id', profile.userId)
    .single();
  
  const branding = userProfile?.branding as ProfileBranding | null;
  
  // Check if custom domain is configured and verified (Requirement 7.3)
  const hasCustomDomain = Boolean(
    branding?.customDomain && 
    branding?.domainVerified
  );
  
  // Extract branding elements (Requirements 7.1, 7.2)
  const customLogo = branding?.customLogo;
  const brandColors = branding?.brandColors;
  
  return (
    <ProfileClientWrapper profileSlug={slug}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 profile-bg-gradient transition-colors duration-300">
        {/* Structured Data for SEO (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        
        {/* Profile Header with branding (Requirements 7.1, 7.2) */}
        <ProfileHeader
          displayName={profile.displayName}
          tagline={profile.tagline}
          location={profile.location}
          avatarUrl={profile.avatarUrl}
          coverImageUrl={profile.coverImageUrl}
          customLogo={customLogo}
          brandColors={brandColors}
        />
        
        {/* Main Content - Responsive grid layout (Requirement 11.1) */}
        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16" role="main" aria-label="Contenu principal du profil">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Bio and Info */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">
              {/* Bio and Expertise */}
              <ProfileBio
                bio={profile.bio}
                specialties={profile.specialties}
                yearsOfExperience={profile.yearsOfExperience}
                awards={profile.awards}
              />
              
              {/* Galleries */}
              <ProfileGalleries galleries={profile.galleries} />
              
              {/* Testimonials */}
              {profile.testimonials && profile.testimonials.length > 0 && (
                <ProfileTestimonials testimonials={profile.testimonials} />
              )}
            </div>
            
            {/* Right Column - Contact and Social - Sticky on desktop (Requirement 11.1) */}
            <aside className="space-y-6" aria-label="Informations de contact">
              {/* Contact Information with brand colors (Requirement 7.2) */}
              <ProfileContact
                email={profile.publicEmail}
                phone={profile.phone}
                website={profile.website}
                address={profile.address}
                socialLinks={profile.socialLinks}
                ctaButton={profile.ctaButton}
                brandColors={brandColors}
              />
            </aside>
          </div>
        </main>
        
        {/* Footer */}
        <ProfileFooter 
          photographerName={profile.displayName}
          hasCustomDomain={hasCustomDomain}
        />
      </div>
    </ProfileClientWrapper>
  );
}
