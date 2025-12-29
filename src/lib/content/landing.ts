import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Types for landing page content
export interface LandingContent {
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
    subtitleHighlight: string;
    cta: string;
    ctaSecondary: string;
  };
  stats: Array<{
    value: string;
    label: string;
  }>;
  problem: {
    badge: string;
    title: string;
    titleLine2: string;
    paragraphs: Array<{
      text: string;
      highlight: string;
    }>;
    comparison: {
      original: { label: string; value: string; description: string };
      compressed: { label: string; value: string; description: string };
      footer: string;
    };
  };
  solution: {
    badge: string;
    title: string;
    titleLine2: string;
    subtitle: string;
    subtitleHighlight: string;
  };
  benefits: Array<{
    icon: string;
    title: string;
    description: string;
    highlight: string;
  }>;
  steps: {
    title: string;
    items: Array<{
      step: string;
      title: string;
      description: string;
    }>;
  };
  testimonials: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{
      name: string;
      role: string;
      content: string;
      avatar: string;
    }>;
  };
  pricing: {
    badge: string;
    title: string;
    titleLine2: string;
    subtitle: string;
    guarantee: string;
  };
  plans: Array<{
    name: string;
    price: string;
    period: string;
    description: string;
    popular: boolean;
    cta: string;
    features: string[];
  }>;
  faq: {
    badge: string;
    title: string;
    items: Array<{
      question: string;
      answer: string;
    }>;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    footer: string;
  };
}

// Get landing page content from markdown file
export function getLandingContent(): LandingContent {
  const filePath = path.join(process.cwd(), 'src/content/landing.md');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(fileContent);
  
  return data as LandingContent;
}
