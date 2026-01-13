import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { ArrowLeft, FileText, Shield, Cookie, Building2 } from 'lucide-react';

type PageParams = Promise<{ page: string }>;

const LEGAL_PAGES = {
  terms: {
    title: 'Conditions d\'utilisation',
    description: 'Conditions générales d\'utilisation de PikSend',
    file: 'terms.md',
    icon: FileText,
    color: 'from-indigo-500 to-violet-500',
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Comment nous protégeons vos données personnelles',
    file: 'privacy.md',
    icon: Shield,
    color: 'from-emerald-500 to-teal-500',
  },
  cookies: {
    title: 'Politique des cookies',
    description: 'Utilisation des cookies sur PikSend',
    file: 'cookies.md',
    icon: Cookie,
    color: 'from-amber-500 to-orange-500',
  },
  mentions: {
    title: 'Mentions légales',
    description: 'Informations légales sur PikSend et Akollad Group',
    file: 'mentions.md',
    icon: Building2,
    color: 'from-rose-500 to-pink-500',
  },
};

export async function generateStaticParams() {
  return Object.keys(LEGAL_PAGES).map((page) => ({ page }));
}

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { page } = await params;
  const pageConfig = LEGAL_PAGES[page as keyof typeof LEGAL_PAGES];
  
  if (!pageConfig) {
    return { title: 'Page non trouvée' };
  }

  return {
    title: `${pageConfig.title} | PikSend`,
    description: pageConfig.description,
  };
}

function getMarkdownContent(filename: string): string {
  const filePath = path.join(process.cwd(), 'src', 'content', 'legal', filename);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export default async function LegalPage({ params }: { params: PageParams }) {
  const { page } = await params;
  const pageConfig = LEGAL_PAGES[page as keyof typeof LEGAL_PAGES];

  if (!pageConfig) {
    notFound();
  }

  const content = getMarkdownContent(pageConfig.file);

  if (!content) {
    notFound();
  }

  const Icon = pageConfig.icon;
  const otherPages = Object.entries(LEGAL_PAGES).filter(([key]) => key !== page);

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
          Retour à l&apos;accueil
        </Link>

        {/* Hero Header */}
        <div className={`bg-gradient-to-br ${pageConfig.color} rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl translate-x-1/3 translate-y-1/3" />
          
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/10">
              <Icon size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{pageConfig.title}</h1>
              <p className="text-white/70 text-sm">{pageConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Other Legal Pages */}
        <div className="flex flex-wrap gap-2 mb-8">
          {otherPages.map(([key, config]) => {
            const PageIcon = config.icon;
            return (
              <Link 
                key={key}
                href={`/legal/${key}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 border border-slate-200/50 rounded-lg text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 transition-all"
              >
                <PageIcon size={12} />
                {config.title}
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
