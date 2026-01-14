'use client';

import { Shield } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { SignOutSection } from './sign-out-section';

export function SecuritySection() {
  const { t } = useTranslation();

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
          <Shield size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{t('common.security')}</h2>
          <p className="text-xs text-slate-500">{t('common.manageAccountAccess')}</p>
        </div>
      </div>
      <div className="p-6 space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{t('common.emailAndPassword')}</p>
              <p className="text-xs text-slate-500">{t('common.loginMethod')}</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            {t('admin.users.status.active')}
          </span>
        </div>

        {/* Sign Out */}
        <SignOutSection />
      </div>
    </section>
  );
}
