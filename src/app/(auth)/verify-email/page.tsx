import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import VerifyEmailPageClient from './page.client';

export async function generateMetadata() {
  return generateAuthMetadata('verifyEmail');
}

export default function VerifyEmailPage() {
  return <VerifyEmailPageClient />;
}
