import { Metadata } from 'next';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import Error500Client from './error-500-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
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
