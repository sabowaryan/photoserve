/**
 * My Galleries Page for Guests
 * 
 * Allows guests to view their galleries created during the current session.
 * Galleries are identified by the guest_session_id stored in localStorage.
 */
import { Metadata } from 'next';
import { getTranslation } from '@/lib/i18n/server';
import { FALLBACK_LOCALE } from '@/lib/i18n/types';
import { MyGalleriesClient } from './my-galleries-client';

export async function generateMetadata(): Promise<Metadata> {
  const t = (key: string) => getTranslation(FALLBACK_LOCALE, key);
  
  return {
    title: t('seo.myGalleries.title'),
    description: t('seo.myGalleries.description'),
    robots: 'noindex, nofollow',
  };
}

export default function MyGalleriesPage() {
  return <MyGalleriesClient />;
}
