"use client";

import { Activity, ChevronRight, Keyboard } from "lucide-react";

interface ActivityItem {
  id: string;
  type: "created" | "viewed" | "expired";
  title: string;
  timestamp: string;
}

interface SidebarSectionProps {
  activities?: ActivityItem[];
}

export function SidebarSection({ activities = [] }: SidebarSectionProps) {
  // Mock activities if none provided
  const displayActivities = activities.length > 0 ? activities : [
    { id: '1', type: 'created' as const, title: 'Galerie "Mariage" consultée', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { id: '2', type: 'viewed' as const, title: 'Galerie "Vacances" consultée', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
    { id: '3', type: 'created' as const, title: 'Galerie "Portfolio" consultée', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
  ];

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Il y a moins d'1 heure";
    if (diffInHours === 1) return "Il y a 1 heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heures`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Il y a 1 jour";
    return `Il y a ${diffInDays} jours`;
  };

  return (
    <div className="space-y-8">
      {/* Activity Card */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
            <Activity size={20} />
          </div>
          <h3 className="font-bold text-slate-900 tracking-tight">Activité récente</h3>
        </div>

        <div className="space-y-6">
          {displayActivities.slice(0, 3).map((activity, i) => (
            <div key={activity.id} className="flex gap-4 relative">
              {i < displayActivities.slice(0, 3).length - 1 && (
                <div className="absolute left-2.5 top-8 bottom-0 w-px bg-slate-100"></div>
              )}
              <div className="w-5 h-5 rounded-full bg-slate-100 border-2 border-white shadow-sm flex-shrink-0 z-10"></div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight mb-1">
                  {activity.title}
                </p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {getTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button className="w-full mt-8 py-3 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center justify-center gap-2 border border-transparent hover:border-indigo-100">
          Voir tout l'historique <ChevronRight size={12} strokeWidth={3} />
        </button>
      </div>

      {/* Help Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col gap-2">
          <h4 className="text-lg font-black">Besoin d'aide ?</h4>
          <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
            Consultez notre documentation ou contactez le support.
          </p>
          <div className="flex flex-col gap-2">
            <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
              Centre d'aide
            </button>
            <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-500 uppercase tracking-widest">
              <Keyboard size={12} />
              Raccourcis: N, S, Esc
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
