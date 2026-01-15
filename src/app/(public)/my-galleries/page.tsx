/**
 * My Galleries Page for Guests
 * 
 * Allows guests to view their galleries created during the current session.
 * Galleries are identified by the guest_session_id stored in localStorage.
 */
import { Metadata } from 'next';
import { getTranslation, getServerLocale } from '@/lib/i18n/server';
import { MyGalleriesClient } from './my-galleries-client';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const t = (key: string) => getTranslation(locale, key);
  
  return {
    title: t('seo.myGalleries.title'),
    description: t('seo.myGalleries.description'),
    robots: 'noindex, nofollow',
  };
}

export default function MyGalleriesPage() {
  return <MyGalleriesClient />;
}
