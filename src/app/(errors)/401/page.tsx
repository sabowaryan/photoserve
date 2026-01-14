import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/server';
import { FALLBACK_LOCALE } from '@/lib/i18n/types';
import Error401Client from './error-401-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
  return {
    title: t('seo.error401.title'),
    description: t('seo.error401.description'),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Error401Page() {
  return <Error401Client />;
}
