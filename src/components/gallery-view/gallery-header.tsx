"use client";

import { Download, Eye, Share2, Calendar, ImageIcon, Check, Moon, Sun, MoreVertical } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
import { hasFeatureAccess } from "@/config/plan-features";
import { optimizeLogoUrl } from "@/lib/utils/image-optimization";
import type { SubscriptionPlan } from "@/types";

interface GalleryHeaderProps {
  title: string;
  viewsCount: number;
  imagesCount: number;
  expiresAt: string;
  isDownloading: boolean;
  isUnlocked: boolean;
  ownerPlan?: SubscriptionPlan;
  selectedCount?: number;
  isDownloadingSelection?: boolean;
  favoritesCount?: number;
  isDownloadingFavorites?: boolean;
  allSelected?: boolean;
  customLogo?: string | null;
  onDownloadAll: () => void;
  onDownloadSelection?: () => void;
  onDownloadFavorites?: () => void;
  onToggleSelectAll?: () => void;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

export function GalleryHeader({ 
  title, 
  viewsCount, 
  imagesCount,
  expiresAt,
  isDownloading, 
  isUnlocked,
  ownerPlan = 'free',
  selectedCount = 0,
  isDownloadingSelection = false,
  favoritesCount = 0,
  isDownloadingFavorites = false,
  allSelected = false,
  customLogo = null,
  onDownloadAll,
  onDownloadSelection,
  onDownloadFavorites,
  onToggleSelectAll,
  onToggleTheme,
  isDark = false,
}: GalleryHeaderProps) {
  const [copied, setCopied] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Check if bulk download is available based on owner's plan
  const canDownloadZip = hasFeatureAccess(ownerPlan, 'bulkDownload');

  // Optimize logo URL for WebP format and quality (Requirements 5.9, 9.4)
  const optimizedLogoUrl = optimizeLogoUrl(customLogo);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié !");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiresDate = new Date(expiresAt);
  const daysRemaining = Math.max(0, Math.ceil((expiresDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <header className="fixed top-0 left-0 right-0 z-[100]">
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-white/95 to-white/0 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-900/0 pointer-events-none h-32" />
      
      <nav className="relative mx-3 md:mx-4 mt-3 md:mt-4">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl border border-slate-200/80 dark:border-slate-700/80 rounded-xl md:rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50">
          {/* Main header content */}
          <div className="px-3 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">
            {/* Left: Logo + Title */}
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 bg-white dark:bg-slate-700 rounded-lg md:rounded-xl flex items-center justify-center shadow-md border border-slate-100 dark:border-slate-600">
                {optimizedLogoUrl ? (
                  <Image 
                    src={optimizedLogoUrl} 
                    alt="Logo" 
                    width={40}
                    height={40}
                    className="w-full h-full object-contain p-1"
                    loading="lazy"
                    quality={90}
                  />
                ) : (
                  <Image 
                    src="/icons/logo.svg" 
                    alt="PikSend" 
                    width={20} 
                    height={20}
                    className="md:w-6 md:h-6"
                  />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  {title}
                </h1>
                <div className="flex items-center gap-2 md:gap-3 mt-0.5">
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <Eye size={10} />
                    <span className="text-[9px] md:text-[10px] font-bold">{viewsCount.toLocaleString()}</span>
                  </div>
                  <div className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
                    <ImageIcon size={10} />
                    <span className="text-[9px] md:text-[10px] font-bold">{imagesCount}</span>
                  </div>
                  {isUnlocked && (
                    <>
                      <div className="w-0.5 h-0.5 bg-slate-300 dark:bg-slate-600 rounded-full hidden sm:block" />
                      <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
                        <Check size={8} />
                        <span className="text-[8px] font-black uppercase tracking-wider">HD</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
              {/* Mobile: More menu button */}
              <div className="md:hidden">
                <button 
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition-all"
                  title="Plus d'options"
                >
                  <MoreVertical size={14} />
                </button>
                
                {/* Mobile dropdown menu - Using fixed positioning to avoid clipping */}
                {showMobileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[110]" 
                      onClick={() => setShowMobileMenu(false)}
                    />
                    <div className="fixed right-4 top-20 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-[120]">
                      <button
                        onClick={() => {
                          onToggleTheme?.();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        {isDark ? <Sun size={14} /> : <Moon size={14} />}
                        {isDark ? "Mode clair" : "Mode sombre"}
                      </button>
                      <button
                        onClick={() => {
                          handleShare();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                      >
                        <Share2 size={14} />
                        Partager
                      </button>
                      {onToggleSelectAll && selectedCount > 0 && (
                        <button
                          onClick={() => {
                            onToggleSelectAll();
                            setShowMobileMenu(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300"
                        >
                          {allSelected ? "Désélectionner tout" : "Tout sélectionner"}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
              
              {/* Desktop: Theme toggle button */}
              <button 
                onClick={onToggleTheme}
                className="hidden md:block p-2 md:p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl transition-all"
                title={isDark ? "Mode clair" : "Mode sombre"}
              >
                {isDark ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              
              {/* Desktop: Share button */}
              <button 
                onClick={handleShare}
                className="hidden md:block p-2 md:p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl transition-all"
                title="Partager"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
              </button>
              
              {/* Desktop: Select all / Deselect all button */}
              {onToggleSelectAll && selectedCount > 0 && (
                <button
                  onClick={onToggleSelectAll}
                  className="hidden md:block px-3 md:px-4 py-2 md:py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg md:rounded-xl transition-all text-xs font-bold"
                  title={allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                >
                  {allSelected ? "Désélectionner tout" : "Tout sélectionner"}
                </button>
              )}
              
              {/* Download favorites button - Show when favorites exist */}
              {favoritesCount > 0 && onDownloadFavorites && (
                <LoadingButton 
                  onClick={onDownloadFavorites}
                  disabled={isDownloadingFavorites}
                  isLoading={isDownloadingFavorites}
                  loadingText="Préparation..."
                  spinnerSize="sm"
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg md:rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Favoris ({favoritesCount})</span>
                  <span className="sm:hidden">{favoritesCount}</span>
                </LoadingButton>
              )}
              
              {/* Download selection button - Show when images are selected */}
              {selectedCount > 0 && onDownloadSelection && (
                <LoadingButton 
                  onClick={onDownloadSelection}
                  disabled={isDownloadingSelection}
                  isLoading={isDownloadingSelection}
                  loadingText="Préparation..."
                  spinnerSize="sm"
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg md:rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Sélection ({selectedCount})</span>
                  <span className="sm:hidden">{selectedCount}</span>
                </LoadingButton>
              )}
              
              {/* Download all button - Only show if owner has Premium or Pro plan */}
              {canDownloadZip && (
                <LoadingButton 
                  onClick={onDownloadAll}
                  disabled={isDownloading}
                  isLoading={isDownloading}
                  loadingText="Préparation..."
                  spinnerSize="sm"
                  className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 text-white font-bold rounded-lg md:rounded-xl transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                  style={{
                    background: `linear-gradient(to right, var(--brand-primary, rgb(99 102 241)), var(--brand-secondary, rgb(139 92 246)))`,
                    boxShadow: '0 10px 15px -3px rgba(var(--brand-primary, 99 102 241) / 0.25)',
                  }}
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Tout</span>
                </LoadingButton>
              )}
            </div>
          </div>
          
          {/* Bottom info bar */}
          <div className="px-3 md:px-5 py-1.5 md:py-2 bg-slate-50/80 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Calendar size={11} />
              <span className="text-[9px] md:text-[10px] font-medium">
                Expire le {expiresDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {daysRemaining <= 7 && (
              <div className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-wider ${
                daysRemaining <= 1 
                  ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400' 
                  : daysRemaining <= 3 
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
              }`}>
                {daysRemaining === 0 ? "Expire aujourd'hui" : `${daysRemaining}j restant${daysRemaining > 1 ? 's' : ''}`}
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
