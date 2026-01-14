'use client';

import Link from 'next/link';
import { ShieldX, Home, LogIn, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';

export default function Error403Client() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-orange-500/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Animated 403 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black text-orange-500/10 leading-none select-none">
            403
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
              <ShieldX className="w-12 h-12 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t('errors.403.title')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('errors.403.message')}
          </p>
        </div>

        {/* Reasons */}
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 text-left space-y-2">
          <p className="text-sm font-medium text-foreground">{t('errors.403.suggestions')}</p>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              {t('errors.403.suggestion1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              {t('errors.403.suggestion2')}
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="sm" className="gap-2">
            <Link href="/auth">
              <LogIn className="w-4 h-4" />
              {t('common.signIn')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              {t('errors.403.home')}
            </Link>
          </Button>
        </div>

        {/* Back */}
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => window.history.back()}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('errors.404.previousPage')}
        </Button>
      </div>
    </div>
  );
}
