/**
 * Profile Footer Component
 * 
 * Footer section with copyright, legal links, and branding
 * 
 * Requirements:
 * - 7.3: Display white-label footer if custom domain is configured
 * - 7.4: Display default branding when no custom domain
 * - 7.5: Display "Propulsé par PikSend" when no custom domain
 * - 11.1: Display responsive on mobile, tablet, and desktop
 */

interface ProfileFooterProps {
  photographerName: string;
  hasCustomDomain?: boolean;
}

export function ProfileFooter({
  photographerName,
  hasCustomDomain = false,
}: ProfileFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer 
      className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-indigo-500 mt-12 sm:mt-16 profile-footer"
      role="contentinfo"
      aria-label="Pied de page"
    >
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 sm:gap-6">
          {/* Copyright */}
          <div className="text-xs sm:text-sm font-semibold text-slate-300 text-center md:text-left profile-footer-text">
            © {currentYear} {photographerName}. Tous droits réservés.
          </div>

          {/* Legal Links - Responsive layout (Requirement 11.1) */}
          <nav aria-label="Liens légaux">
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm">
              <a
                href="/legal/terms"
                className="text-slate-400 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1 profile-footer-link"
              >
                CGU
              </a>
              <span className="text-slate-600" aria-hidden="true">•</span>
              <a
                href="/legal/privacy"
                className="text-slate-400 hover:text-white transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1 profile-footer-link"
              >
                Confidentialité
              </a>
            </div>
          </nav>

          {/* Branding - Only show "Powered by PikSend" if no custom domain */}
          {!hasCustomDomain && (
            <div className="text-xs sm:text-sm text-slate-400 text-center md:text-right profile-footer-text">
              Propulsé par{' '}
              <a
                href="https://piksend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded px-1 profile-link"
              >
                PikSend
              </a>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
