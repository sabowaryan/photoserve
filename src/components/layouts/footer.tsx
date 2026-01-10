'use client';

import Link from 'next/link';
import { LogoIcon } from '@/components/shared/logo';
import { Instagram, Twitter, Linkedin, MapPin, Mail, Globe } from 'lucide-react';

// Company legal information
const companyInfo = {
  name: 'AKOLLAD GROUP',
  location: 'Kinshasa, Gombe',
  rccm: 'CD/KNG/RCCM/25-A-07960',
  taxNumber: 'A2557944L',
  nationalId: '01-J6100-N86614P',
  email: 'hello@piksend.com'
};

export function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-white pt-20 pb-10 px-6 border-t border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand & Identity */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-4 items-start">
              {/* Logo Area */}
              <div className="flex flex-col gap-5 items-center sm:items-start">
                <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                  <LogoIcon size={28} />
                </div>
                {/* Social Icons - Mobile */}
                <div className="flex md:hidden items-center gap-3">
                  {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                    <button 
                      key={i} 
                      className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all duration-300 border border-slate-100"
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Text Area */}
              <div className="flex flex-col gap-2">
                <span className="font-black text-2xl tracking-tighter text-slate-900 leading-tight">
                  PikSend
                </span>
                <p className="text-slate-500 font-medium leading-relaxed text-sm md:text-base max-w-sm">
                  La solution de livraison haute résolution pour les photographes qui refusent de faire des compromis sur la qualité originale.
                </p>
                {/* Desktop Socials */}
                <div className="hidden md:flex items-center gap-3 mt-4">
                  {[Instagram, Twitter, Linkedin].map((Icon, i) => (
                    <button 
                      key={i} 
                      className="p-3 bg-slate-50 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-slate-100"
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Links Groups */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
                Plateforme
              </h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li>
                  <button 
                    onClick={() => scrollToSection('features')} 
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Fonctionnalités
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => scrollToSection('tarifs')} 
                    className="hover:text-indigo-600 transition-colors"
                  >
                    Tarifs
                  </button>
                </li>
                <li>
                  <Link href="/help" className="hover:text-indigo-600 transition-colors">
                    Aide
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="space-y-6">
              <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
                Légal
              </h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li>
                  <Link href="/legal/privacy" className="hover:text-indigo-600 transition-colors">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="hover:text-indigo-600 transition-colors">
                    Conditions
                  </Link>
                </li>
                <li>
                  <Link href="/legal/mentions" className="hover:text-indigo-600 transition-colors">
                    Mentions
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Group */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="font-black text-slate-900 uppercase tracking-widest text-[10px]">
              Contact Officiel
            </h4>
            <div className="space-y-4">
              <a 
                href={`mailto:${companyInfo.email}`} 
                className="flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                  <Mail size={16} />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {companyInfo.email}
                </span>
              </a>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-50 text-slate-400 rounded-xl">
                  <MapPin size={16} />
                </div>
                <span className="text-sm font-bold text-slate-700">
                  {companyInfo.location}, RDC
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Identifiers */}
        <div className="pt-10 border-t border-slate-100">
          <div className="flex flex-col gap-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* RCCM Box */}
              <div className="flex items-center gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] hover:border-indigo-100 transition-colors shadow-sm">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm">
                  RC
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    RCCM
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {companyInfo.rccm}
                  </span>
                </div>
              </div>
              
              {/* ID Nat Box */}
              <div className="flex items-center gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] hover:border-indigo-100 transition-colors shadow-sm">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm">
                  ID
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Identification Nationale
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {companyInfo.nationalId}
                  </span>
                </div>
              </div>
              
              {/* Tax Box */}
              <div className="flex items-center gap-4 p-5 bg-slate-50/50 border border-slate-100 rounded-[1.8rem] hover:border-indigo-100 transition-colors shadow-sm sm:col-span-2 lg:col-span-1">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 text-[10px] font-black shadow-sm">
                  TX
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    Numéro d&apos;Impôt
                  </span>
                  <span className="text-xs font-bold text-slate-800">
                    {companyInfo.taxNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Copyright & Country */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
              <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
                <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em]">
                  © {currentYear} PIKSEND
                </div>
                <div className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-2">
                  Propriété exclusive de{' '}
                  <span className="text-slate-900 font-black tracking-tight">
                    {companyInfo.name}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-5 py-2 rounded-full border border-slate-100">
                <Globe size={12} className="text-indigo-600" /> 
                République Démocratique du Congo
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
