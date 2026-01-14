import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { LegalPageClient } from './legal-page-client';

type PageParams = Promise<{ page: string }>;

const LEGAL_PAGES = {
  terms: {
    file: 'terms.md',
    icon: 'FileText' as const,
    color: 'from-indigo-500 to-violet-500',
  },
  privacy: {
    file: 'privacy.md',
    icon: 'Shield' as const,
    color: 'from-emerald-500 to-teal-500',
  },
  cookies: {
    file: 'cookies.md',
    icon: 'Cookie' as const,
    color: 'from-amber-500 to-orange-500',
  },
  mentions: {
    file: 'mentions.md',
    icon: 'Building2' as const,
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
    return { title: 'Page not found' };
  }

  // Metadata will be handled by the layout or through SEO keys
  return {
    title: `PikSend`,
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

  const otherPages = Object.entries(LEGAL_PAGES)
    .filter(([key]) => key !== page)
    .map(([key, config]) => ({
      key,
      icon: config.icon,
    }));

  return (
    <LegalPageClient
      pageKey={page}
      content={content}
      icon={pageConfig.icon}
      color={pageConfig.color}
      otherPages={otherPages}
    />
  );
}
