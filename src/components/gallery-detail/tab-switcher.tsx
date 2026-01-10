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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex p-1 bg-slate-100/80 backdrop-blur-sm rounded-2xl w-fit border border-slate-200 shadow-sm">
        <button 
          onClick={() => onTabChange('content')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'content' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ImageIcon size={18} />
          Contenu
        </button>
        <button 
          onClick={() => onTabChange('settings')}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Settings size={18} />
          Paramètres
        </button>
      </div>

      {activeTab === 'content' && selectedCount > 0 && (
        <div className="flex items-center gap-3 animate-in slide-in-from-right-4">
          <span className="text-sm font-bold text-slate-500">
            {selectedCount} sélectionnée(s)
          </span>
          <button 
            onClick={onDeleteSelected}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all shadow-sm"
          >
            <Trash2 size={16} />
            Supprimer la sélection
          </button>
        </div>
      )}
    </div>
  );
}
