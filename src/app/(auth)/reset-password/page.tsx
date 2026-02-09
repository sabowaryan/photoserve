import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import ResetPasswordPageClient from './page.client';

export async function generateMetadata() {
  return generateAuthMetadata('resetPassword');
}

export default function ResetPasswordPage() {
  return <ResetPasswordPageClient />;
}
