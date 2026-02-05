import { Metadata } from 'next';
import { SupportPageClient } from './support-page-client';

export const metadata: Metadata = {
  title: 'Support | PikSend',
  description: 'Get help with PikSend. Browse our FAQ, contact support, and find documentation.',
};

export default function SupportPage() {
  return <SupportPageClient />;
}
