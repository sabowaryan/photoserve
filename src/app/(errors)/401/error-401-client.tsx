'use client';

import Link from 'next/link';
import { UserX, LogIn, Home, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n/context';

export default function Error401Client() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-6">
        {/* Animated 401 */}
        <div className="relative">
          <h1 className="text-[120px] sm:text-[140px] font-black text-primary/10 leading-none select-none">
            401
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-4">
              <UserX className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            {t('errors.401.title')}
          </h2>
          <p className="text-base text-muted-foreground">
            {t('errors.401.message')}
          </p>
        </div>

        {/* Info box */}
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">
            {t('errors.401.info')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button asChild size="sm" className="gap-2">
            <Link href="/auth">
              <LogIn className="w-4 h-4" />
              {t('errors.401.signIn')}
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link href="/auth?tab=register">
              <UserPlus className="w-4 h-4" />
              {t('errors.401.signUp')}
            </Link>
          </Button>
        </div>

        {/* Home link */}
        <Button variant="ghost" size="sm" asChild className="gap-2">
          <Link href="/">
            <Home className="w-4 h-4" />
            {t('errors.401.home')}
          </Link>
        </Button>
      </div>
    </div>
  );
}
