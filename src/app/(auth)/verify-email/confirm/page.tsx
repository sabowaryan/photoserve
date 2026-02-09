import type { Metadata } from 'next';
import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import VerifyEmailConfirmPageClient from './page.client';

export async function generateMetadata(): Promise<Metadata> {
  return generateAuthMetadata('verifyEmail');
}

export default function VerifyEmailConfirmPage() {
  return <VerifyEmailConfirmPageClient />;
}
