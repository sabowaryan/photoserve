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
    <footer className="bg-white py-8 px-4 border-t border-slate-100 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 mb-3">
              <div className="p-1 bg-indigo-50 rounded-lg">
                <img src="/icons/logo.svg" alt="PikSend" className="h-5 w-auto" />
              </div>
              <span className="font-bold text-sm text-slate-900">PikSend</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed mb-3 max-w-[200px]">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-2">
              {[Instagram, XIcon, Facebook].map((Icon, i) => (
                <button 
                  key={i} 
                  className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-indigo-600 hover:text-white transition-all border border-slate-100"
                >
                  <Icon size={12} />
                </button>
              ))}
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-3">
              {t('footer.platform')}
            </h4>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li>
                <Link href="/features" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.features')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.pricing')}
                </Link>
              </li>
              <li>
                <Link href="/help" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.help')}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-3">
              {t('footer.legal')}
            </h4>
            <ul className="space-y-2 text-slate-500 text-xs">
              <li>
                <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.privacy')}
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.terms')}
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="hover:text-indigo-600 transition-colors">
                  {t('footer.links.mentions')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mb-3">
              {t('footer.officialContact')}
            </h4>
            <div className="space-y-2">
              <a href={`mailto:${companyInfo.email}`} className="flex items-center gap-2 group">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Mail size={12} />
                </div>
                <span className="text-xs text-slate-600">{companyInfo.email}</span>
              </a>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-50 text-slate-400 rounded-lg">
                  <MapPin size={12} />
                </div>
                <span className="text-xs text-slate-600">{companyInfo.location}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identifiers */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase">RCCM</span>
            <span className="text-[10px] font-medium text-slate-600">{companyInfo.rccm}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase">ID Nat</span>
            <span className="text-[10px] font-medium text-slate-600">{companyInfo.nationalId}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase">NIF</span>
            <span className="text-[10px] font-medium text-slate-600">{companyInfo.taxNumber}</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>© {currentYear} PikSend</span>
            <span>•</span>
            <span className="font-medium text-slate-500">{companyInfo.name}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <Globe size={10} className="text-indigo-500" />
            <span>{t('footer.country')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
