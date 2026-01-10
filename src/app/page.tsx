import { getLandingContent } from '@/lib/content/landing';
import { LandingPageClient } from '@/components/landing/landing-page-client';

export default function LandingPage() {
  const content = getLandingContent();
  
  return <LandingPageClient content={content} />;
}
