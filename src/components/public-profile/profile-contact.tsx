/**
 * Profile Contact Component
 * 
 * Contact section with anti-spam email protection, social links, and CTA button
 * 
 * Requirements:
 * - 4.1: Display email with anti-spam protection (@ -> [at], . -> [dot])
 * - 4.2: Display phone number if configured
 * - 4.3: Display website as clickable link if configured
 * - 4.4: Display address if configured
 * - 4.5: Display social media icons with links if configured
 * - 4.6: Support Instagram, Facebook, Pinterest, LinkedIn, TikTok, YouTube
 * - 4.7: Display customizable CTA button
 * - 7.2: Apply brand colors to buttons and links
 * - 9.5: Track CTA clicks
 * - 9.6: Track social link clicks
 */

'use client';

import { useProfileTracking } from './profile-client-wrapper';
import type { SocialLinks, CTAButton } from '@/types/public-profile';
import type { BrandColors } from '@/types';

interface ProfileContactProps {
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  socialLinks?: SocialLinks;
  ctaButton?: CTAButton;
  brandColors?: BrandColors;
}

/**
 * Formats email with anti-spam protection
 * Replaces @ with [at] and . with [dot]
 * 
 * @param email - The email address to format
 * @returns Formatted email string with anti-spam protection
 */
function formatEmailForDisplay(email: string): string {
  return email.replace(/@/g, '[at]').replace(/\./g, '[dot]');
}

/**
 * Social media platform configuration
 */
const SOCIAL_PLATFORMS = {
  instagram: {
    name: 'Instagram',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
      </svg>
    ),
  },
  facebook: {
    name: 'Facebook',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  pinterest: {
    name: 'Pinterest',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
      </svg>
    ),
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  tiktok: {
    name: 'TikTok',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  youtube: {
    name: 'YouTube',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
} as const;

export function ProfileContact({
  email,
  phone,
  website,
  address,
  socialLinks,
  ctaButton,
  brandColors,
}: ProfileContactProps) {
  // Get tracking functions from context
  const { trackCTAClick, trackSocialClick } = useProfileTracking();

  // If no contact information to display, return null
  if (!email && !phone && !website && !address && !socialLinks && !ctaButton) {
    return null;
  }

  // Filter social links to only include those with values
  const activeSocialLinks = socialLinks
    ? (Object.entries(socialLinks).filter(([_, url]) => url) as [keyof typeof SOCIAL_PLATFORMS, string][])
    : [];

  // Apply brand colors to CTA button (Requirement 7.2)
  const ctaButtonStyle = ctaButton && brandColors ? {
    backgroundColor: ctaButton.style === 'primary' ? brandColors.primary : brandColors.secondary,
    color: '#ffffff',
  } as React.CSSProperties : undefined;

  // Apply brand colors to links (Requirement 7.2)
  const linkStyle = brandColors ? {
    color: brandColors.accent,
  } as React.CSSProperties : undefined;

  /**
   * Handle CTA button click
   * Tracks the click and opens the CTA URL
   */
  const handleCTAClick = () => {
    // Track the CTA click (Requirement 9.5)
    trackCTAClick();
    
    // Open the CTA URL if configured
    if (ctaButton?.url) {
      window.open(ctaButton.url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Handle social link click
   * Tracks the click before navigation
   */
  const handleSocialClick = (platform: string) => {
    // Track the social link click (Requirement 9.6)
    trackSocialClick(platform);
  };

  return (
    <section 
      className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm border border-slate-200 lg:sticky lg:top-6 profile-card contact-card"
      aria-labelledby="contact-heading"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg text-white shadow-lg shadow-green-500/30" aria-hidden="true">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 id="contact-heading" className="text-lg font-bold text-slate-900 profile-text-primary">Contact</h2>
      </div>

      <div className="space-y-3">
        {/* Contact Information */}
        {(email || phone || website || address) && (
          <div className="space-y-2">
            {email && (
              <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Email</p>
                  <p className="text-xs font-semibold text-slate-900 break-all" aria-label={`Adresse email: ${email}`}>
                    {formatEmailForDisplay(email)}
                  </p>
                </div>
              </div>
            )}

            {phone && (
              <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-0.5">Téléphone</p>
                  <p className="text-xs font-semibold text-slate-900">{phone}</p>
                </div>
              </div>
            )}

            {website && (
              <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-0.5">Site web</p>
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-purple-700 hover:text-purple-900 hover:underline break-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded"
                    style={linkStyle}
                    aria-label={`Visiter le site web: ${website}`}
                  >
                    {website}
                  </a>
                </div>
              </div>
            )}

            {address && (
              <div className="flex items-start gap-2 p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
                <svg
                  className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5"
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
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Adresse</p>
                  <address className="text-xs font-semibold text-slate-900 whitespace-pre-line not-italic">{address}</address>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Social Links - Responsive grid (Requirement 11.1) */}
        {activeSocialLinks.length > 0 && (
          <div className="pt-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Réseaux sociaux</p>
            <nav aria-label="Liens vers les réseaux sociaux">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1.5">
                {activeSocialLinks.map(([platform, url]) => {
                  const config = SOCIAL_PLATFORMS[platform];
                  return (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleSocialClick(platform)}
                      className="flex items-center gap-1.5 px-2.5 py-2 bg-gradient-to-br from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border border-slate-200 rounded-lg transition-all hover:scale-105 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                      aria-label={`Visiter ${config.name}`}
                    >
                      <div className="text-slate-600 [&>svg]:w-4 [&>svg]:h-4">{config.icon}</div>
                      <span className="text-[11px] font-semibold text-slate-700">{config.name}</span>
                    </a>
                  );
                })}
              </div>
            </nav>
          </div>
        )}

        {/* CTA Button with brand colors (Requirement 7.2) */}
        {ctaButton && (
          <div className="pt-2">
            <button
              onClick={handleCTAClick}
              className={`w-full px-4 py-3 rounded-lg font-bold text-sm transition-all hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-offset-2 ${
                !brandColors && ctaButton.style === 'primary'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-indigo-500'
                  : !brandColors && ctaButton.style === 'secondary'
                  ? 'bg-white text-indigo-600 border-2 border-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500'
                  : 'focus:ring-indigo-500'
              }`}
              style={ctaButtonStyle}
              aria-label={ctaButton.text}
            >
              {ctaButton.text}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
