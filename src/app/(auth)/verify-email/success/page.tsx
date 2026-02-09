import type { Metadata } from 'next';
import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import VerifyEmailSuccessPageClient from './page.client';

export async function generateMetadata(): Promise<Metadata> {
  return generateAuthMetadata('verifyEmailSuccess');
}

export default function VerifyEmailSuccessPage() {
  return <VerifyEmailSuccessPageClient />;
}
