'use client';

import { useTranslation } from '@/lib/i18n/context';

export function AuthFooter() {
  const { t } = useTranslation();

  return (
    <footer className="mt-6 text-sm text-slate-500 text-center lg:text-end" role="contentinfo">
      &copy; {new Date().getFullYear()} PikSend. {t('common.allRightsReserved')}
    </footer>
  );
}
