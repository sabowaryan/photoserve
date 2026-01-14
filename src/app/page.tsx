import { getLandingContent } from '@/lib/content/landing';
import { LandingPageClient } from '@/components/landing/landing-page-client';
import { generatePageMetadata, generateStructuredData, DEFAULT_FAQS } from '@/lib/services/seo.service';
import type { Metadata } from 'next';

// SEO Metadata for landing page
export const metadata: Metadata = generatePageMetadata('landing');

export default function LandingPage() {
  const content = getLandingContent();
  
  // Generate structured data for SEO
  const organizationSchema = generateStructuredData('Organization');
  const softwareSchema = generateStructuredData('SoftwareApplication');
  const faqSchema = generateStructuredData('FAQPage', { faqs: DEFAULT_FAQS });
  
  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <LandingPageClient content={content} />
    </>
  );
}
