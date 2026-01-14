'use client';

import { User } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { ProfileForm } from './profile-form';

interface ProfileSectionProps {
  initialEmail: string;
  initialName: string;
}

export function ProfileSection({ initialEmail, initialName }: ProfileSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <User size={18} />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{t('common.myProfile')}</h2>
          <p className="text-xs text-slate-500">{t('common.accountInfo')}</p>
        </div>
      </div>
      <div className="p-6">
        <ProfileForm
          initialEmail={initialEmail}
          initialName={initialName}
        />
      </div>
    </section>
  );
}
