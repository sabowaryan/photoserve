/**
 * Profile Header Component
 * 
 * Hero section with avatar, cover image, name, tagline, and location
 * 
 * Requirements:
 * - 2.1: Display photographer name
 * - 2.2: Display tagline if configured
 * - 2.4: Display location if configured
 * - 2.5: Display avatar if configured
 * - 2.6: Display cover image if configured
 * - 7.1: Display custom logo if configured
 * - 7.2: Apply brand colors if configured
 * - 11.1: Display responsive on mobile, tablet, and desktop
 */

import type { BrandColors } from '@/types';

interface ProfileHeaderProps {
  displayName: string;
  tagline?: string;
  location?: string;
  avatarUrl?: string;
  coverImageUrl?: string;
  customLogo?: string;
  brandColors?: BrandColors;
}

export function ProfileHeader({
  displayName,
  tagline,
  location,
  avatarUrl,
  coverImageUrl,
  customLogo,
  brandColors,
}: ProfileHeaderProps) {
  // Generate CSS custom properties for brand colors (Requirement 7.2)
  const brandColorStyles = brandColors ? {
    '--brand-primary': brandColors.primary,
    '--brand-secondary': brandColors.secondary,
    '--brand-accent': brandColors.accent,
  } as React.CSSProperties : undefined;

  return (
    <>
      {/* Hero Section with Cover Image - Responsive height (Requirement 11.1) */}
      <div 
        className="relative h-64 sm:h-80 md:h-96 lg:h-[32rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 overflow-hidden"
        role="banner"
        aria-label="En-tête du profil"
      >
        {coverImageUrl ? (
          <>
            <img
              src={coverImageUrl}
              alt={`Image de couverture de ${displayName}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" aria-hidden="true" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" aria-hidden="true">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
          </div>
        )}
        
        {/* Custom Logo in Header - Responsive sizing (Requirement 7.1, 11.1) */}
        {customLogo && (
          <div className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 lg:top-10 lg:left-10 z-10">
            <img
              src={customLogo}
              alt={`Logo de ${displayName}`}
              className="h-10 sm:h-12 md:h-14 lg:h-20 w-auto object-contain bg-white/95 backdrop-blur-md rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-2xl border border-white/20 profile-logo-bg"
            />
          </div>
        )}
      </div>

      {/* Profile Header - Responsive spacing and layout (Requirement 11.1) */}
      <div 
        className="container mx-auto px-4 sm:px-6 -mt-16 sm:-mt-20 md:-mt-24 lg:-mt-32 relative z-10"
        style={brandColorStyles}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6 md:gap-8">
          {/* Avatar - Responsive sizing (Requirement 11.1) */}
          <div className="relative group" role="img" aria-label={`Photo de profil de ${displayName}`}>
            <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-2xl sm:rounded-3xl border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shadow-2xl ring-4 ring-white/50 profile-avatar-border profile-avatar-ring profile-avatar-bg">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Photo de profil de ${displayName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-black text-slate-400 bg-gradient-to-br from-indigo-100 to-purple-100 profile-avatar-initial"
                  aria-label={`Initiale de ${displayName}`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name and Tagline - Responsive typography (Requirement 11.1) */}
          <div className="flex-1 text-center sm:text-left pb-2 sm:pb-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-1 sm:mb-2 tracking-tight profile-text-primary">
              {displayName}
            </h1>
            {tagline && (
              <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-2 sm:mb-3 font-medium profile-text-secondary">{tagline}</p>
            )}
            {location && (
              <div className="inline-flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/80 backdrop-blur-sm rounded-full text-xs sm:text-sm font-semibold text-slate-700 shadow-sm border border-slate-200 profile-location-badge">
                <svg
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 profile-location-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span aria-label={`Localisation: ${location}`}>{location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
