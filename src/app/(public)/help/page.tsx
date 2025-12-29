import { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { MarkdownContent } from '@/components/shared/markdown-content';
import { generatePageMetadata } from '@/lib/services';

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

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <MarkdownContent content={content} />
    </div>
  );
}
