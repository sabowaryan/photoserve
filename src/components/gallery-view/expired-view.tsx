"use client";

import { Clock } from "lucide-react";
import Image from "next/image";

interface ExpiredViewProps {
  isExpired: boolean;
}

export function ExpiredView({ isExpired }: ExpiredViewProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans']">
      <div className="max-w-md w-full space-y-8 animate-in zoom-in duration-700">
        <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center text-rose-500 mx-auto border border-rose-500/20 shadow-2xl shadow-rose-500/10">
          <Clock size={48} />
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-black text-white tracking-tight">
            {isExpired ? 'Lien Expiré' : 'Lien Suspendu'}
          </h1>
          <p className="text-slate-400 font-medium leading-relaxed">
            {isExpired 
              ? "Cette galerie a atteint sa date d'expiration. Les photos ont été archivées." 
              : "Cette galerie est actuellement inactive."
            }
          </p>
        </div>
        <div className="pt-10 opacity-30">
          <Image 
            src="/icons/logo.svg" 
            alt="PikSend" 
            width={40} 
            height={40} 
            className="mx-auto invert"
          />
        </div>
      </div>
    </div>
  );
}
