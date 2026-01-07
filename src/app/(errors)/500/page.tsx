import { Metadata } from 'next';
import Error500Client from './error-500-client';

export const metadata: Metadata = {
  title: 'Erreur serveur - 500 | PikSend',
  description: 'Une erreur interne du serveur s\'est produite. Veuillez réessayer plus tard.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Error500Page() {
  return <Error500Client />;
}
