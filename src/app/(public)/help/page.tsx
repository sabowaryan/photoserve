import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { generatePageMetadata } from '@/lib/services';
import { HelpPageClient } from './help-page-client';

export const metadata: Metadata = generatePageMetadata('help');

function getHelpContent(): string {
  const filePath = path.join(process.cwd(), 'src', 'content', 'help.md');
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export default function HelpPage() {
  const content = getHelpContent();

  return <HelpPageClient content={content} />;
}
