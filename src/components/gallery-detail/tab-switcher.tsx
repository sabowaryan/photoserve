"use client";

import { ImageIcon, Settings, Trash2 } from "lucide-react";

interface TabSwitcherProps {
  activeTab: 'content' | 'settings';
  onTabChange: (tab: 'content' | 'settings') => void;
  selectedCount: number;
  onDeleteSelected: () => void;
}

export function TabSwitcher({ activeTab, onTabChange, selectedCount, onDeleteSelected }: TabSwitcherProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex p-1 bg-white rounded-xl w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => onTabChange('content')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'content' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ImageIcon size={14} />
          Contenu
        </button>
        <button 
          onClick={() => onTabChange('settings')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'settings' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Settings size={14} />
          Paramètres
        </button>
      </div>

      {activeTab === 'content' && selectedCount > 0 && (
        <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''}
          </span>
          <button 
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-lg text-xs font-bold hover:from-rose-600 hover:to-pink-600 transition-all shadow-md shadow-rose-500/25"
          >
            <Trash2 size={14} />
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
