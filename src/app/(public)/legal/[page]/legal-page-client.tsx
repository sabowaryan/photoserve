'use client';

import Link from 'next/link';
import { ArrowLeft, FileText, Shield, Cookie, Building2, LucideIcon } from 'lucide-react';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { useTranslation } from '@/lib/i18n/context';

interface LegalPageClientProps {
  pageKey: string;
  content: string;
  icon: 'FileText' | 'Shield' | 'Cookie' | 'Building2';
  color: string;
  otherPages: Array<{
    key: string;
    icon: 'FileText' | 'Shield' | 'Cookie' | 'Building2';
  }>;
}

const ICONS: Record<string, LucideIcon> = {
  FileText,
  Shield,
  Cookie,
  Building2,
};

const LEGAL_TITLES: Record<string, string> = {
  terms: 'common.termsOfUse',
  privacy: 'common.privacyPolicy',
  cookies: 'common.cookiePolicy',
  mentions: 'common.legalNotice',
};

const LEGAL_DESCRIPTIONS: Record<string, string> = {
  terms: 'seo.legal.terms.description',
  privacy: 'seo.legal.privacy.description',
  cookies: 'seo.legal.cookies.description',
  mentions: 'seo.legal.mentions.description',
};

export function LegalPageClient({ pageKey, content, icon, color, otherPages }: LegalPageClientProps) {
  const { t } = useTranslation();
  const Icon = ICONS[icon] || FileText;

  const title = t(LEGAL_TITLES[pageKey] || 'common.termsOfUse');
  const description = t(LEGAL_DESCRIPTIONS[pageKey] || '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 relative">
      {/* Decorative Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-violet-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        {/* Back Link */}
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm mb-8 group transition-colors"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('errors.404.home')}
        </Link>

        {/* Hero Header */}
        <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
              <Icon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{title}</h1>
              <p className="text-white/70 text-sm">{description}</p>
            </div>
          </div>
        </div>

        {/* Other Legal Pages */}
        <div className="flex flex-wrap gap-2 mb-8">
          {otherPages.map(({ key, icon: pageIcon }) => {
            const PageIcon = ICONS[pageIcon] || FileText;
            const pageTitle = t(LEGAL_TITLES[key] || 'common.termsOfUse');
            return (
              <Link 
                key={key}
                href={`/legal/${key}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-slate-200/50 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <PageIcon size={12} />
                {pageTitle}
              </Link>
            );
          })}
        </div>

        {/* Content Card */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
          <MarkdownContent content={content} />
        </div>
      </div>
    </div>
  );
}
