'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { VersionInfo } from '@/components/download/version-info';
import { SystemRequirements } from '@/components/download/system-requirements';
import { DownloadButton } from '@/components/download/download-button';
import { InstallationInstructions } from '@/components/download/installation-instructions';

interface PluginVersion {
  version: string;
  downloadUrl: string;
  fileSize: number;
  changelog: string;
  releaseDate: string;
  minLightroomVersion: string;
}

export function DownloadPageClient() {
  const [versionData, setVersionData] = useState<PluginVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVersionData() {
      try {
        const response = await fetch('/api/plugin/version');
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('No stable version available yet. Please check back later.');
          } else {
            setError('Failed to load plugin information. Please try again later.');
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        setVersionData(data);
      } catch (err) {
        console.error('Error fetching version data:', err);
        setError('Failed to load plugin information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVersionData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
              <p className="text-slate-600">Loading plugin information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !versionData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-5xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Unable to Load Plugin</h3>
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
              Download PikSend for Lightroom
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Seamlessly upload and manage your photos directly from Adobe Lightroom Classic
            </p>
          </div>

          {/* Download Button - Prominent placement */}
          <div className="flex justify-center py-6">
            <DownloadButton version={versionData.version} />
          </div>

          {/* Version Info */}
          <VersionInfo
            version={versionData.version}
            fileSize={versionData.fileSize}
            releaseDate={versionData.releaseDate}
            changelog={versionData.changelog}
          />

          {/* System Requirements */}
          <SystemRequirements minLightroomVersion={versionData.minLightroomVersion} />

          {/* Installation Instructions */}
          <InstallationInstructions />

          {/* Additional Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <p className="text-slate-600">
              The PikSend Lightroom plugin is available exclusively for Pro plan subscribers.{' '}
              <a href="/pricing" className="text-indigo-600 hover:underline font-medium">
                View pricing
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
