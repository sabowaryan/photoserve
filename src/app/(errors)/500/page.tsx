import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/server';
import { FALLBACK_LOCALE } from '@/lib/i18n/types';
import Error500Client from './error-500-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
  return {
    title: t('seo.error500.title'),
    description: t('seo.error500.description'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Error500Page() {
  return <Error500Client />;
}
