/**
 * Profile Footer Component
 * 
 * Footer section with copyright, legal links, and branding
 * 
 * Requirements:
 * - 7.3: Display white-label footer if custom domain is configured
 * - 7.4: Display default branding when no custom domain
 * - 7.5: Display "Propulsé par PikSend" when no custom domain
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
    <footer className="bg-gradient-to-br from-slate-900 to-slate-800 border-t-4 border-indigo-500 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <div className="text-sm font-semibold text-slate-300">
            © {currentYear} {photographerName}. Tous droits réservés.
          </div>

          {/* Legal Links */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a
              href="/legal/terms"
              className="text-slate-400 hover:text-white transition-colors font-medium"
            >
              Conditions Générales d'Utilisation
            </a>
            <span className="text-slate-600">•</span>
            <a
              href="/legal/privacy"
              className="text-slate-400 hover:text-white transition-colors font-medium"
            >
              Politique de Confidentialité
            </a>
          </div>

          {/* Branding - Only show "Powered by PikSend" if no custom domain */}
          {!hasCustomDomain && (
            <div className="text-sm text-slate-400">
              Propulsé par{' '}
              <a
                href="https://piksend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 hover:underline font-bold transition-colors"
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
