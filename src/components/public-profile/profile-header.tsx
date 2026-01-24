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
      {/* Hero Section with Cover Image */}
      <div className="relative h-72 md:h-[32rem] bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 overflow-hidden">
        {coverImageUrl ? (
          <>
            <img
              src={coverImageUrl}
              alt={`${displayName} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>
          </div>
        )}
        
        {/* Custom Logo in Header (Requirement 7.1) */}
        {customLogo && (
          <div className="absolute top-6 left-6 md:top-10 md:left-10 z-10">
            <img
              src={customLogo}
              alt={`${displayName} logo`}
              className="h-14 md:h-20 w-auto object-contain bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-2xl border border-white/20"
            />
          </div>
        )}
      </div>

      {/* Profile Header */}
      <div 
        className="container mx-auto px-4 -mt-24 md:-mt-32 relative z-10"
        style={brandColorStyles}
      >
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
          {/* Avatar */}
          <div className="relative group">
            <div className="w-36 h-36 md:w-48 md:h-48 rounded-3xl border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shadow-2xl ring-4 ring-white/50">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl md:text-6xl font-black text-slate-400 bg-gradient-to-br from-indigo-100 to-purple-100">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Name and Tagline */}
          <div className="flex-1 text-center md:text-left pb-4">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 mb-2 tracking-tight">
              {displayName}
            </h1>
            {tagline && (
              <p className="text-lg md:text-xl text-slate-600 mb-3 font-medium">{tagline}</p>
            )}
            {location && (
              <div className="inline-flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full text-sm font-semibold text-slate-700 shadow-sm border border-slate-200">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                {location}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
