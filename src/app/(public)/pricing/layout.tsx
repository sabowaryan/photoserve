import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/services';

export const metadata: Metadata = generatePageMetadata('pricing');

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
