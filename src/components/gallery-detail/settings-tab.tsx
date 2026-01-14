"use client";

import { useState } from "react";
import {  Lock, Clock, Eye, EyeOff, ChevronDown, Save, Loader2, CheckCircle2, Type, Sparkles, Crown } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";

interface DurationOption {
  value: number;
  label: string;
}

interface SettingsTabProps {
  title: string;
  onTitleChange: (title: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  durationOptions: DurationOption[];
  currentDuration: number;
  onDurationChange: (days: number) => void;
  canChangeDuration: boolean;
  isUpdating: boolean;
  saveSuccess: boolean;
  onSave: () => void;
}

export function SettingsTab({
  title,
  onTitleChange,
  password,
  onPasswordChange,
  durationOptions,
  currentDuration,
  onDurationChange,
  canChangeDuration,
  isUpdating,
  saveSuccess,
  onSave
}: SettingsTabProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-6">
      {/* Left Column - General Settings */}
      <div className="space-y-6">
        {/* Title Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl text-white shadow-lg">
              <Type size={18} />
            </div>
            <span className="font-bold text-slate-900">{t('common.galleryTitle')}</span>
          </div>
          
          <input 
            type="text" 
            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
            value={title} 
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder={t('common.galleryName')}
          />
        </div>

        {/* Password Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white shadow-lg">
              <Lock size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">{t('common.passwordProtection')}</span>
              <p className="text-xs text-slate-500 mt-0.5">{t('common.secureGalleryAccess')}</p>
            </div>
          </div>
          
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none pr-12 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
              value={password} 
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder={t('common.newPassword')}
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-2 transition-colors rounded-lg hover:bg-slate-100"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column - Duration & Save */}
      <div className="space-y-6">
        {/* Duration Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl text-white shadow-lg">
              <Clock size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">{t('common.expirationDuration')}</span>
              <p className="text-xs text-slate-500 mt-0.5">{t('common.setGalleryValidity')}</p>
            </div>
          </div>
          
          <div className="relative">
            <select 
              className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none disabled:bg-slate-100 disabled:text-slate-400 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer" 
              disabled={!canChangeDuration}
              value={currentDuration}
              onChange={(e) => onDurationChange(Number(e.target.value))}
            >
              {durationOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              <ChevronDown size={18} />
            </div>
          </div>
          
          {!canChangeDuration && (
            <Link 
              href="/settings?upgrade=true"
              className="mt-4 flex items-center gap-2 p-3 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600 hover:from-indigo-100 hover:to-violet-100 transition-all"
            >
              <Crown size={16} />
              {t('pricing.upgrade')} {t('dashboard.plans.premium')}
            </Link>
          )}
        </div>

        {/* Save Button Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
          {/* Decorative orb */}
          <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full blur-2xl transition-colors duration-500 ${
            saveSuccess ? 'bg-emerald-500/30' : 'bg-indigo-500/20'
          }`} />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={16} className="text-amber-400" />
              <span className="text-sm font-bold text-white/70">{t('common.saveChanges')}</span>
            </div>
            
            <button 
              onClick={onSave} 
              disabled={isUpdating} 
              className={`relative w-full py-4 rounded-xl font-bold text-base transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden ${
                saveSuccess 
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                  : 'bg-white text-slate-900 hover:bg-slate-50 shadow-lg'
              }`}
            >
              {isUpdating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('common.loading')}
                </>
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={18} />
                  {t('settings.profile.saved')}
                </>
              ) : (
                <>
                  <Save size={18} />
                  {t('common.save')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
