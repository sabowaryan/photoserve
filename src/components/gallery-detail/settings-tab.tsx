"use client";

import { useState } from "react";
import { Settings, Lock, Clock, Eye, EyeOff, ChevronRight, Save, Loader2, CheckCircle2 } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-6">
      {/* Left Column - General Settings */}
      <div className="space-y-8 bg-white rounded-[3rem] p-8 sm:p-10 border border-slate-200 shadow-sm">
        <div className="space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
            <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
              <Settings size={22} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Général</h3>
          </div>
          
          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
              Titre de la galerie
            </label>
            <input 
              type="text" 
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
              value={title} 
              onChange={(e) => onTitleChange(e.target.value)} 
            />
          </div>
          
          {/* Password Section */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Lock size={18} />
              </div>
              <span className="text-lg font-bold text-slate-900">Sécurité</span>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Mot de passe visiteur
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none pr-14 font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  value={password} 
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="Nouveau mot de passe"
                />
                <button 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 p-2 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column - Duration & Save */}
      <div className="flex flex-col gap-8">
        {/* Duration Card */}
        <div className="bg-white rounded-[3rem] p-8 sm:p-10 border border-slate-200 shadow-sm flex-1">
          <div className="flex items-center gap-3 border-b border-slate-50 pb-6 mb-8">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600 shadow-inner">
              <Clock size={22} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Expiration</h3>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                Délai d'expiration
              </label>
              <div className="relative">
                <select 
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none appearance-none disabled:bg-slate-100 font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all" 
                  disabled={!canChangeDuration}
                  value={currentDuration}
                  onChange={(e) => onDurationChange(Number(e.target.value))}
                >
                  {durationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronRight size={18} className="rotate-90" />
                </div>
              </div>
              {!canChangeDuration && (
                <p className="text-sm text-slate-500 font-medium mt-2">
                  💎 Passez à Premium pour modifier la durée
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Save Button Card */}
        <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 flex flex-col gap-4">
            <button 
              onClick={onSave} 
              disabled={isUpdating} 
              className={`relative w-full py-5 rounded-2xl font-black text-base transition-all duration-500 flex items-center justify-center gap-3 shadow-xl overflow-hidden ${
                saveSuccess 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white text-slate-900 hover:text-indigo-600 shadow-white/5'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shine_1.5s_infinite] pointer-events-none" />
              {isUpdating ? (
                <Loader2 size={20} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={20} />
              ) : (
                <Save size={20} />
              )}
              <span className="relative z-10">
                {saveSuccess ? 'Sauvegardé' : isUpdating ? 'Mise à jour...' : 'Appliquer'}
              </span>
            </button>
          </div>
          <div className={`absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-[80px] transition-colors duration-1000 ${
            saveSuccess ? 'bg-emerald-500/20' : 'bg-indigo-500/10'
          }`} />
        </div>
      </div>
    </div>
  );
}
