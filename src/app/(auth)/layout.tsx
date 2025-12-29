import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/services';

export const metadata: Metadata = generatePageMetadata('auth');

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
