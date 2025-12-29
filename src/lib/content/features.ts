import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Types for features page content
export interface FeaturesContent {
  meta: {
    title: string;
    description: string;
  };
  hero: {
    badge: string;
    title: string;
    titleHighlight: string;
    subtitle: string;
  };
  comparison: {
    title: string;
    items: Array<{
      feature: string;
      whatsapp: string;
      photoserve: string;
    }>;
  };
  mainFeatures: {
    title: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
      highlight: string;
      details: string[];
    }>;
  };
  additionalFeatures: {
    title: string;
    items: Array<{
      icon: string;
      title: string;
      description: string;
    }>;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    footer: string;
  };
}

// Get features page content from markdown file
export function getFeaturesContent(): FeaturesContent {
  const filePath = path.join(process.cwd(), 'src/content/features.md');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(fileContent);
  
  return data as FeaturesContent;
}
