/**
 * Layout for persona landing pages
 * Provides common structure for all persona-specific pages
 * 
 * @module app/(marketing)/for/layout
 * Requirements: 2.1
 */

import { Header } from '@/components/layouts/header';
import { Footer } from '@/components/layouts/footer';

export default function ForLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
