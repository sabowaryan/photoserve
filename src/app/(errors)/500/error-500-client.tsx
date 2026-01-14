'use client';

import Link from 'next/link';
import { ServerCrash, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';

export default function Error500Client() {
  const { t } = useTranslation();
  
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Animated 500 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black text-destructive/10 leading-none select-none">
            500
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
              <ServerCrash className="w-12 h-12 text-destructive animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t('errors.500.title')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('errors.500.message')}
          </p>
        </div>

        {/* Status */}
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />
            <span className="text-sm font-medium text-destructive">{t('errors.503.temporarilyUnavailable')}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('errors.500.retryLater')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button onClick={handleRefresh} size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            {t('errors.500.retry')}
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('errors.500.home')}
            </Link>
          </Button>
        </div>

        {/* Support */}
        <div className="pt-3 border-t border-border">
          <p className="text-sm text-muted-foreground mb-2">
            {t('errors.500.problemPersists')}
          </p>
          <Button variant="ghost" size="sm" asChild className="gap-2">
            <a href="mailto:support@piksend.com">
              <Mail className="w-3.5 h-3.5" />
              {t('errors.500.contactSupport')}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
