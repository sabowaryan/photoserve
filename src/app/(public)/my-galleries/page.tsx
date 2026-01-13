/**
 * My Galleries Page for Guests
 * 
 * Allows guests to view their galleries created during the current session.
 * Galleries are identified by the guest_session_id stored in localStorage.
 */
import { Metadata } from 'next';
import { MyGalleriesClient } from './my-galleries-client';

export const metadata: Metadata = {
  title: 'Mes galeries | PikSend',
  description: 'Retrouvez vos galeries créées en tant qu\'invité',
  robots: 'noindex, nofollow',
};

export default function MyGalleriesPage() {
  return <MyGalleriesClient />;
}
