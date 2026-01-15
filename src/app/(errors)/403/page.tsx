import { Metadata } from 'next';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import Error403Client from './error-403-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
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
