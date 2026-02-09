import { generateAuthMetadata } from '@/lib/metadata/auth-metadata';
import AuthPageClient from './page.client';

export async function generateMetadata() {
  return generateAuthMetadata('signin');
}

export default function AuthPage() {
  return <AuthPageClient />;
}
