import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/server';
import { FALLBACK_LOCALE } from '@/lib/i18n/types';
import Error503Client from './error-503-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
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
