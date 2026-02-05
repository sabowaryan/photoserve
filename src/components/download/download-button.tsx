'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCachedSession } from '@/hooks/use-cached-session';
import { useSubscription } from '@/hooks/use-subscription';
import { Download, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DownloadButtonProps {
  version?: string;
}

export function DownloadButton({ version }: DownloadButtonProps) {
  const router = useRouter();
  const { data: session, status } = useCachedSession();
  const { isPro, isLoading: isLoadingSubscription } = useSubscription();
  const [isDownloading, setIsDownloading] = useState(false);

  const isAuthenticated = status === 'authenticated' && !!session;
  const isLoading = status === 'loading' || isLoadingSubscription;

  const handleDownload = async () => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      // Encode the callback URL properly for NextAuth
      const callbackUrl = encodeURIComponent('/download/lightroom');
      router.push(`/auth?callbackUrl=${callbackUrl}`);
      return;
    }

    // If not Pro, show upgrade prompt
    if (!isPro) {
      router.push('/pricing');
      return;
    }

    // If Pro, call GET /api/plugin/download
    setIsDownloading(true);
    try {
      const url = version 
        ? `/api/plugin/download?version=${encodeURIComponent(version)}`
        : '/api/plugin/download';
      
      // Redirect to the download endpoint which will redirect to Cloudinary
      window.location.href = url;
      
      // Keep loading state for a bit to show feedback
      setTimeout(() => {
        setIsDownloading(false);
      }, 2000);
    } catch (error) {
      console.error('Download error:', error);
      setIsDownloading(false);
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          disabled
          className="w-full sm:w-auto px-8 py-6 text-lg font-semibold"
        >
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading...
        </Button>
      </div>
    );
  }

  // Not authenticated - show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700"
        >
          <Lock className="mr-2 h-5 w-5" />
          Sign In to Download
        </Button>
        <p className="text-sm text-slate-500 text-center">
          You need to sign in to download the plugin
        </p>
      </div>
    );
  }

  // Not Pro - show upgrade prompt
  if (!isPro) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          <Lock className="mr-2 h-5 w-5" />
          Upgrade to Pro to Download
        </Button>
        <p className="text-sm text-slate-500 text-center">
          The Lightroom plugin is available exclusively for Pro plan subscribers
        </p>
      </div>
    );
  }

  // Pro user - show download button
  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        size="lg"
        onClick={handleDownload}
        disabled={isDownloading}
        className="w-full sm:w-auto px-8 py-6 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all"
      >
        {isDownloading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparing Download...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Download Plugin
          </>
        )}
      </Button>
      <p className="text-sm text-slate-500 text-center">
        Compatible with Lightroom Classic 11.0 or later
      </p>
    </div>
  );
}
