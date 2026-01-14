import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/server';
import { FALLBACK_LOCALE } from '@/lib/i18n/types';
import Error403Client from './error-403-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
  return {
    title: t('seo.error403.title'),
    description: t('seo.error403.description'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Error403Page() {
  return <Error403Client />;
}
