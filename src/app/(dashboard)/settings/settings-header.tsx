'use client';

import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';

export function SettingsHeader() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-medium text-sm transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          {t('dashboard.badge')}
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
            <Settings size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('settings.title')}</h1>
            <p className="text-sm text-slate-500 font-medium">{t('settings.subtitle')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
