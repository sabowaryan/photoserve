import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import ForgotPasswordPageClient from './page.client';

export async function generateMetadata() {
  return generateAuthMetadata('forgotPassword');
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageClient />;
}
