'use client';

import Link from 'next/link';
import { Instagram, Facebook, MapPin, Mail, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

// Custom X (formerly Twitter) icon
const XIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const companyInfo = {
  name: 'AKOLLAD GROUP',
  location: 'Kinshasa, Gombe',
  rccm: 'CD/KNG/RCCM/25-A-07960',
  taxNumber: 'A2557944L',
  nationalId: '01-J6100-N86614P',
  email: 'hello@piksend.com'
};

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background py-16 px-4 border-t border-border/50 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="logo-wrapper p-1 rounded-lg bg-primary/5">
                <img src="/icons/logo.svg" alt="PikSend" className="h-6 w-auto" />
              </div>
              <span className="font-display font-extrabold text-lg text-foreground tracking-tight" dir="ltr">PikSend</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-[240px]">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              {[Instagram, XIcon, Facebook].map((Icon, i) => (
                <button
                  key={i}
                  className="p-2 bg-muted/50 text-muted-foreground rounded-xl hover:bg-primary hover:text-primary-foreground transition-all border border-border/30 shadow-sm"
                >
                  <Icon size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-foreground text-xs uppercase tracking-widest mb-5">
              {t('footer.platform')}
            </h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li>
                <Link href="/features" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.help')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-foreground text-xs uppercase tracking-widest mb-5">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-3 text-muted-foreground text-sm">
              <li>
                <Link href="/legal/privacy" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.terms')}
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="hover:text-primary transition-colors font-medium">
                  {t('footer.links.mentions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-foreground text-xs uppercase tracking-widest mb-5">
              {t('footer.officialContact')}
            </h4>
            <div className="space-y-3">
              <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-3 group">
                <div className="p-2 bg-primary/5 text-primary rounded-xl group-hover:bg-primary group-hover:text-primary-foreground transition-all border border-primary/10 shadow-sm">
                  <Mail size={16} />
                </div>
                <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors font-medium">{companyInfo.email}</span>
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted/50 text-muted-foreground rounded-xl border border-border/30">
                  <MapPin size={16} />
                </div>
                <span className="text-sm text-muted-foreground font-medium">{companyInfo.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identifiers */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border border-border/40 rounded-xl shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">RCCM</span>
            <span className="text-xs font-semibold text-foreground">{companyInfo.rccm}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border border-border/40 rounded-xl shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">ID Nat</span>
            <span className="text-xs font-semibold text-foreground">{companyInfo.nationalId}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border border-border/40 rounded-xl shadow-sm">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">NIF</span>
            <span className="text-xs font-semibold text-foreground">{companyInfo.taxNumber}</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border/60">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>© {currentYear} PikSend</span>
            <span className="text-muted-foreground/30">•</span>
            <span className="font-bold text-foreground uppercase tracking-tighter">{companyInfo.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
            <Globe size={14} className="text-primary" />
            <span>{t('footer.country')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
