import { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/services';
import { ContactPageClient } from './contact-page-client';

export const metadata: Metadata = generatePageMetadata('contact');

export default function ContactPage() {
  return <ContactPageClient />;
}
