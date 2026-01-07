import { Metadata } from 'next';
import Error401Client from './error-401-client';

export const metadata: Metadata = {
  title: 'Non authentifié - 401 | PikSend',
  description: 'Veuillez vous connecter pour accéder à cette page.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Error401Page() {
  return <Error401Client />;
}
