import { Metadata } from 'next';
import { LightroomDocsClient } from './lightroom-docs-client';

export const metadata: Metadata = {
  title: 'Lightroom Plugin Documentation | PikSend',
  description: 'Complete guide to installing, configuring, and using the PikSend Lightroom plugin. Upload photos directly from Adobe Lightroom to your PikSend galleries.',
  keywords: ['lightroom', 'plugin', 'documentation', 'installation', 'guide', 'adobe', 'photography'],
  openGraph: {
    title: 'Lightroom Plugin Documentation | PikSend',
    description: 'Complete guide to installing, configuring, and using the PikSend Lightroom plugin.',
    type: 'article',
  },
};

export default function LightroomDocsPage() {
  return <LightroomDocsClient />;
}
