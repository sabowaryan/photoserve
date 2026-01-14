'use client';

import Link from 'next/link';
import { Construction, RefreshCw, Home, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n/context';

export default function Error503Client() {
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          window.location.reload();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-yellow-500/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Animated 503 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black text-yellow-500/10 leading-none select-none">
            503
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
              <Construction className="w-12 h-12 text-yellow-500 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t('errors.503.title')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('errors.503.message')}
          </p>
        </div>

        {/* Countdown */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">{t('errors.503.autoRefresh')}</span>
          </div>
          <div className="text-3xl font-bold text-foreground">
            {countdown}s
          </div>
          <p className="text-sm text-muted-foreground">
            {t('errors.503.inSeconds', { seconds: countdown.toString() })}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-yellow-500 h-full transition-all duration-1000 ease-linear"
            style={{ width: `${((60 - countdown) / 60) * 100}%` }}
          />
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
              {t('errors.503.home')}
            </Link>
          </Button>
        </div>

        {/* Status page link */}
        <p className="text-sm text-muted-foreground">
          {t('errors.503.statusPage')}{' '}
          <a 
            href="https://status.piksend.com" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            status.piksend.com
          </a>
        </p>
      </div>
    </div>
  );
}
