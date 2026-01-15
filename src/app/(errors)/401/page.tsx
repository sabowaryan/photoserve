import { Metadata } from 'next';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import Error401Client from './error-401-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
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
