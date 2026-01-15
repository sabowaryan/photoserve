import { Metadata } from 'next';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import Error503Client from './error-503-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
  return {
    title: t('seo.error503.title'),
    description: t('seo.error503.description'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Error503Page() {
  return <Error503Client />;
}
