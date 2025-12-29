import Link from 'next/link';
import { LogoIcon } from '@/components/shared/logo';
import { Users } from 'lucide-react';

// Company legal information
const companyInfo = {
  name: 'Akollad Group',
  location: 'Kinshasa, Gombe',
  rccm: 'CD/KNG/RCCM/25-A-07960',
  taxNumber: 'A2557944L',
  nationalId: '01-j6100-N86614P',
};

export function Footer() {
  return (
    <footer className="border-t border-border py-12 sm:py-16 px-4 bg-card/30">
      <div className="container mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon size={20} />
              <span className="font-display text-xl font-bold">PhotoServe</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              La plateforme sécurisée pour partager vos photos avec vos clients.
            </p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">500+ photographes</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Tarifs
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Légal</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/legal/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Conditions d&apos;utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Politique des cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Centre d&apos;aide
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border">
          {/* Company Legal Info */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 text-xs text-muted-foreground">
            <span>{companyInfo.location}</span>
            <span>RCCM: {companyInfo.rccm}</span>
            <span>N° Impôt: {companyInfo.taxNumber}</span>
            <span>ID Nat: {companyInfo.nationalId}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © {new Date().getFullYear()} PhotoServe. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground">By {companyInfo.name}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
