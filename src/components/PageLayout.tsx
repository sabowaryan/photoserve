import { ReactNode } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface PageLayoutProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function PageLayout({ title, children, className = '' }: PageLayoutProps) {
  useDocumentTitle(title);

  return (
    <div className={className}>
      {children}
    </div>
  );
}
