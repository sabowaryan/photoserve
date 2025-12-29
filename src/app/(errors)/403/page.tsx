import { Metadata } from 'next';
import Error403Client from './error-403-client';

export const metadata: Metadata = {
  title: 'Accès refusé - 403 | PhotoServe',
  description: 'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Error403Page() {
  return <Error403Client />;
}
