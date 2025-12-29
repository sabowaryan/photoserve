import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import { MarkdownContent } from '@/components/shared/markdown-content';

type PageParams = Promise<{ page: string }>;

const LEGAL_PAGES = {
  terms: {
    title: 'Conditions d\'utilisation',
    description: 'Conditions générales d\'utilisation de PhotoServe',
    file: 'terms.md',
  },
  privacy: {
    title: 'Politique de confidentialité',
    description: 'Comment nous protégeons vos données personnelles',
    file: 'privacy.md',
  },
  cookies: {
    title: 'Politique des cookies',
    description: 'Utilisation des cookies sur PhotoServe',
    file: 'cookies.md',
  },
  mentions: {
    title: 'Mentions légales',
    description: 'Informations légales sur PhotoServe et Akollad Group',
    file: 'mentions.md',
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
    title: `${pageConfig.title} | PhotoServe`,
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

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <MarkdownContent content={content} />
    </div>
  );
}
