"use client";

import { useState } from "react";
import {  Lock, Clock, Eye, EyeOff, ChevronDown, Save, Loader2, CheckCircle2, Type, Sparkles, Settings, Link as LinkIcon, Film, Music2, Globe } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n/context";
import type { GallerySettings, CTAButtonConfig, SubscriptionPlan } from "@/types";

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
  // New settings props
  settings?: GallerySettings;
  onSettingsChange?: (settings: Partial<GallerySettings>) => void;
  userPlan?: SubscriptionPlan;
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
  onSave,
  settings = {
    enableFavorites: false,
    enableComments: false,
    enableDeadline: false,
    enableLeadMagnet: false,
    noindex: true,
  },
  onSettingsChange = () => {},
  userPlan = 'free',
}: SettingsTabProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  // Helper to check if feature is available for current plan
  const hasFeature = (feature: 'favorites' | 'comments' | 'deadlineTimer' | 'leadMagnet' | 'ctaButton' | 'videoCover' | 'audioGallery') => {
    const featureMap = {
      favorites: userPlan !== 'free',
      comments: userPlan !== 'free',
      deadlineTimer: userPlan !== 'free',
      leadMagnet: userPlan === 'pro',
      ctaButton: userPlan === 'pro',
      videoCover: userPlan === 'pro',
      audioGallery: userPlan === 'pro',
    };
    return featureMap[feature];
  };

  const handleToggle = (key: keyof GallerySettings, value: boolean) => {
    onSettingsChange({ [key]: value });
  };

  const handleCTAChange = (field: keyof CTAButtonConfig, value: string) => {
    const currentCTA = settings.ctaButton || { text: '', url: '', style: 'primary' as const };
    onSettingsChange({
      ctaButton: { ...currentCTA, [field]: value },
    });
  };

  const handleDeadlineChange = (date: string) => {
    onSettingsChange({ deadlineDate: date });
  };

  return (
    <div className="max-w-6xl space-y-6 animate-in slide-in-from-bottom-6">
      {/* Basic Settings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
              <Lock size={16} />
              {t('pricing.upgrade')} {t('dashboard.plans.premium')}
            </Link>
          )}
        </div>
      </div>

      {/* Gallery Features Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Features Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl text-white shadow-lg">
              <Settings size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">Engagement Features</span>
              <p className="text-xs text-slate-500 mt-0.5">Client interaction options</p>
            </div>
          </div>

          <div className="space-y-3">
            {/* Favorites Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 text-sm">Favorites System</p>
                <p className="text-xs text-slate-500">Let clients mark photos</p>
              </div>
              <div className="flex items-center gap-2">
                {!hasFeature('favorites') && (
                  <Lock size={14} className="text-slate-400" />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableFavorites ?? false}
                    onChange={(e) => handleToggle('enableFavorites', e.target.checked)}
                    disabled={!hasFeature('favorites')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            {/* Comments Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 text-sm">Comments</p>
                <p className="text-xs text-slate-500">Allow image feedback</p>
              </div>
              <div className="flex items-center gap-2">
                {!hasFeature('comments') && (
                  <Lock size={14} className="text-slate-400" />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableComments ?? false}
                    onChange={(e) => handleToggle('enableComments', e.target.checked)}
                    disabled={!hasFeature('comments')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            {/* Deadline Timer */}
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-slate-900 text-sm">Deadline Timer</p>
                  <p className="text-xs text-slate-500">Selection countdown</p>
                </div>
                <div className="flex items-center gap-2">
                  {!hasFeature('deadlineTimer') && (
                    <Lock size={14} className="text-slate-400" />
                  )}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={settings.enableDeadline ?? false}
                      onChange={(e) => handleToggle('enableDeadline', e.target.checked)}
                      disabled={!hasFeature('deadlineTimer')}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
              {settings.enableDeadline && hasFeature('deadlineTimer') && (
                <input
                  type="datetime-local"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={settings.deadlineDate ?? ''}
                  onChange={(e) => handleDeadlineChange(e.target.value)}
                />
              )}
            </div>

            {/* Lead Magnet */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900 text-sm">Lead Magnet</p>
                <p className="text-xs text-slate-500">Capture visitor emails</p>
              </div>
              <div className="flex items-center gap-2">
                {!hasFeature('leadMagnet') && (
                  <Lock size={14} className="text-slate-400" />
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.enableLeadMagnet ?? false}
                    onChange={(e) => handleToggle('enableLeadMagnet', e.target.checked)}
                    disabled={!hasFeature('leadMagnet')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Button Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl text-white shadow-lg">
              <LinkIcon size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Call-to-Action</span>
                {!hasFeature('ctaButton') && (
                  <Lock size={14} className="text-slate-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Custom button at gallery end</p>
            </div>
          </div>

          {hasFeature('ctaButton') ? (
            <div className="space-y-3">
              <input
                type="text"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                placeholder="Button Text"
                value={settings.ctaButton?.text ?? ''}
                onChange={(e) => handleCTAChange('text', e.target.value)}
              />
              <input
                type="url"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm"
                placeholder="https://example.com/book"
                value={settings.ctaButton?.url ?? ''}
                onChange={(e) => handleCTAChange('url', e.target.value)}
              />
              <div className="relative">
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer text-sm"
                  value={settings.ctaButton?.style ?? 'primary'}
                  onChange={(e) => handleCTAChange('style', e.target.value)}
                >
                  <option value="primary">Primary Style</option>
                  <option value="secondary">Secondary Style</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>
          ) : (
            <Link 
              href="/settings?upgrade=true"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600 hover:from-indigo-100 hover:to-violet-100 transition-all"
            >
              <Lock size={16} />
              Upgrade to Pro
            </Link>
          )}
        </div>
      </div>

      {/* Media & SEO Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Media Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl text-white shadow-lg">
              <Film size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">Media</span>
                {!hasFeature('videoCover') && (
                  <Lock size={14} className="text-slate-400" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Video cover & audio</p>
            </div>
          </div>

          {hasFeature('videoCover') || hasFeature('audioGallery') ? (
            <div className="space-y-4">
              {/* Video Cover */}
              {hasFeature('videoCover') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Video Cover</label>
                  {settings.videoCoverUrl ? (
                    <div className="relative group">
                      <video
                        src={settings.videoCoverUrl}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                        muted
                      />
                      <button
                        onClick={() => onSettingsChange({ videoCoverUrl: undefined })}
                        className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Video file selected:', file.name);
                          }
                        }}
                      />
                      <Film size={20} className="mx-auto mb-1 text-slate-400" />
                      <p className="text-xs text-slate-600">Upload video (max 50MB)</p>
                    </label>
                  )}
                </div>
              )}

              {/* Audio */}
              {hasFeature('audioGallery') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Background Audio</label>
                  {settings.audioUrl ? (
                    <div className="relative group p-3 bg-slate-50 rounded-lg">
                      <audio
                        src={settings.audioUrl}
                        controls
                        className="w-full h-8"
                      />
                      <button
                        onClick={() => onSettingsChange({ audioUrl: undefined })}
                        className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="audio/mp3,audio/wav,audio/mpeg"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            console.log('Audio file selected:', file.name);
                          }
                        }}
                      />
                      <Music2 size={20} className="mx-auto mb-1 text-slate-400" />
                      <p className="text-xs text-slate-600">Upload audio (max 10MB)</p>
                    </label>
                  )}
                </div>
              )}
            </div>
          ) : (
            <Link 
              href="/settings?upgrade=true"
              className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-600 hover:from-indigo-100 hover:to-violet-100 transition-all"
            >
              <Lock size={16} />
              Upgrade to Pro
            </Link>
          )}
        </div>

        {/* SEO Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl text-white shadow-lg">
              <Globe size={18} />
            </div>
            <div>
              <span className="font-bold text-slate-900">SEO Settings</span>
              <p className="text-xs text-slate-500 mt-0.5">Search engine visibility</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-medium text-slate-900 text-sm">Prevent Indexing</p>
              <p className="text-xs text-slate-500">Keep gallery private</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.noindex ?? true}
                onChange={(e) => handleToggle('noindex', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
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
  );
}
