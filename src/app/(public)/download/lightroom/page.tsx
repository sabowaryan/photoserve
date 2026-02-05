import { Metadata } from 'next';
import { DownloadPageClient } from './download-page-client';

export const metadata: Metadata = {
  title: 'Download Lightroom Plugin | PikSend',
  description: 'Download the PikSend Lightroom plugin to seamlessly upload and manage your photos directly from Adobe Lightroom Classic.',
  openGraph: {
    title: 'Download Lightroom Plugin | PikSend',
    description: 'Download the PikSend Lightroom plugin to seamlessly upload and manage your photos directly from Adobe Lightroom Classic.',
  },
};

export default function DownloadLightroomPage() {
  return <DownloadPageClient />;
}
