import { Metadata } from 'next';
import Error503Client from './error-503-client';

export const metadata: Metadata = {
  title: 'Service indisponible - 503 | PikSend',
  description: 'Le service est temporairement indisponible pour maintenance. Veuillez réessayer dans quelques instants.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function Error503Page() {
  return <Error503Client />;
}
