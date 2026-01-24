/**
 * Public Profile Preview Page
 * 
 * Allows photographers to preview their public profile before publishing
 * Uses the same components as the public profile page
 * 
 * Requirements:
 * - 10.5: Provide preview button to see profile before publication
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import { getSession, requireSupabaseClient } from '@/lib/auth';
import { createPublicProfileService } from '@/lib/services/public-profile.service';
import { ProfileHeader } from '@/components/public-profile/profile-header';
import { ProfileBio } from '@/components/public-profile/profile-bio';
import { ProfileGalleries } from '@/components/public-profile/profile-galleries';
import { ProfileContact } from '@/components/public-profile/profile-contact';
import { ProfileTestimonials } from '@/components/public-profile/profile-testimonials';
import { ProfileFooter } from '@/components/public-profile/profile-footer';
import type { ProfileBranding } from '@/types';

/**
 * Preview Page Component
 * 
 * Displays the photographer's profile as it will appear publicly
 * Includes a preview banner to indicate this is not the live version
 * Requires authentication - only the profile owner can preview
 */
export default async function PreviewPage() {
  // Check authentication
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth');
  }
  
  const { supabase } = await requireSupabaseClient();
  const user = session.user;
  
  // Fetch the user's public profile
  const { data: publicProfile } = await supabase
    .from('public_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  // If no profile exists, redirect to settings to create one
  if (!publicProfile) {
    redirect('/settings/profile?tab=general');
  }
  
  // Fetch profile with galleries using the service
  const service = createPublicProfileService(supabase);
  const profile = await service.getProfileBySlugForPreview(publicProfile.slug, user.id);
  
  // If profile fetch failed, redirect to settings
  if (!profile) {
    redirect('/settings/profile?tab=general');
  }
  
  // Fetch user's branding information (Requirements 7.1, 7.2, 7.3)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('branding')
    .eq('id', user.id)
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
    <div className="min-h-screen bg-background">
      {/* Preview Mode Banner */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl border-b-4 border-white/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left side - Info */}
            <div className="flex items-start gap-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 shadow-lg">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-lg font-black tracking-tight">Mode Prévisualisation</p>
                  <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wider rounded-full border border-white/30">
                    Privé
                  </span>
                </div>
                <p className="text-sm text-white/90 font-medium max-w-2xl">
                  Ceci est un aperçu de votre profil public. Les visiteurs ne verront pas cette bannière.
                </p>
              </div>
            </div>
            
            {/* Right side - Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Link
                href="/settings/profile"
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold text-sm rounded-xl transition-all hover:scale-105 border border-white/30 shadow-lg"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour aux paramètres</span>
                <span className="sm:hidden">Retour</span>
              </Link>
              {profile.isEnabled && (
                <Link
                  href={`/p/${profile.slug}`}
                  target="_blank"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-indigo-600 hover:bg-slate-50 font-bold text-sm rounded-xl transition-all hover:scale-105 shadow-xl"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Voir le profil public</span>
                  <span className="sm:hidden">Profil public</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile Content - Same as public page */}
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100">
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
        
        {/* Main Content */}
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Bio and Info */}
            <div className="lg:col-span-2 space-y-8">
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
            
            {/* Right Column - Contact and Social */}
            <div className="space-y-6">
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
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <ProfileFooter 
          photographerName={profile.displayName}
          hasCustomDomain={hasCustomDomain}
        />
      </div>
    </div>
  );
}
