"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ImageIcon, 
  Clock, 
  Eye, 
  ArrowRight, 
  Loader2, 
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Copy,
  Check
} from "lucide-react";
import { GuestSessionManager } from "@/lib/guest/session";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface GuestGallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  views_count: number;
  image_count: number;
  is_unlocked: boolean;
  payment_type: string;
  thumbnail_url: string | null;
}

export function MyGalleriesClient() {
  const { t } = useTranslation();
  const [galleries, setGalleries] = useState<GuestGallery[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  useEffect(() => {
    fetchGuestGalleries();
  }, []);

  const fetchGuestGalleries = async () => {
    try {
      const sessionManager = new GuestSessionManager();
      const token = sessionManager.getSessionToken();

      if (!token) {
        setGalleries([]);
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/guest/galleries', {
        headers: {
          'x-guest-token': token,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch galleries');
      }

      const data = await response.json();
      setGalleries(data.galleries || []);
    } catch (err) {
      console.error('Error fetching guest galleries:', err);
      setError(t('errors.generic.unexpected'));
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/g/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffMs = expiration.getTime() - now.getTime();
    
    if (diffMs <= 0) return { expired: true, text: t('gallery.detail.expired') };
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return { expired: false, text: `${days}j ${hours % 24}h`, urgent: days < 2 };
    }
    return { expired: false, text: `${hours}h`, urgent: hours < 12 };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500 font-medium">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Image 
                  src="/icons/logo.svg" 
                  alt="PikSend" 
                  width={32} 
                  height={32}
                  className="hover:scale-110 transition-transform"
                />
              </Link>
              <div>
                <h1 className="text-xl font-black text-slate-900">
                  {t('myGalleries.title')}
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  {t('myGalleries.subtitle')}
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              {t('myGalleries.createNew')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {galleries.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <FolderOpen className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-2">
              {t('myGalleries.empty.title')}
            </h2>
            <p className="text-slate-500 font-medium mb-8 max-w-md mx-auto">
              {t('myGalleries.empty.description')}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              {t('myGalleries.empty.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Galleries Grid */
          <div className="space-y-4">
            {/* Info Banner */}
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-8">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  {t('myGalleries.warning.title')}
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {t('myGalleries.warning.description')}
                </p>
              </div>
            </div>

            {/* Gallery Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              {galleries.map((gallery) => {
                const timeRemaining = getTimeRemaining(gallery.expires_at);
                
                return (
                  <div
                    key={gallery.id}
                    className={cn(
                      "bg-white rounded-2xl border overflow-hidden transition-all hover:shadow-lg",
                      timeRemaining.expired 
                        ? "border-slate-200 opacity-60" 
                        : "border-slate-200 hover:border-indigo-200"
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-40 bg-slate-100">
                      {gallery.thumbnail_url ? (
                        <Image
                          src={gallery.thumbnail_url}
                          alt={gallery.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-slate-300" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        {gallery.is_unlocked ? (
                          <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            {t('myGalleries.status.unlocked')}
                          </span>
                        ) : timeRemaining.expired ? (
                          <span className="px-2 py-1 bg-slate-500 text-white text-xs font-bold rounded-lg">
                            {t('gallery.detail.expired')}
                          </span>
                        ) : (
                          <span className={cn(
                            "px-2 py-1 text-xs font-bold rounded-lg flex items-center gap-1",
                            timeRemaining.urgent 
                              ? "bg-amber-500 text-white" 
                              : "bg-slate-700 text-white"
                          )}>
                            <Clock className="w-3 h-3" />
                            {timeRemaining.text}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-slate-900 mb-2 truncate">
                        {gallery.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5" />
                          {gallery.image_count} {t('gallery.publicFooter.photos')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {gallery.views_count} {t('gallery.detail.views')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          href={`/g/${gallery.unique_slug}`}
                          className={cn(
                            "flex-1 py-2.5 rounded-xl font-bold text-sm text-center transition-colors flex items-center justify-center gap-2",
                            timeRemaining.expired
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          )}
                        >
                          {t('common.view')}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => copyLink(gallery.unique_slug)}
                          disabled={timeRemaining.expired}
                          className={cn(
                            "px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2",
                            timeRemaining.expired
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          )}
                        >
                          {copiedSlug === gallery.unique_slug ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Create Account CTA */}
            <div className="mt-12 bg-gradient-to-br from-indigo-50 via-violet-50 to-purple-50 rounded-3xl p-8 text-center border border-indigo-100">
              <h3 className="text-lg font-black text-slate-900 mb-2">
                {t('myGalleries.createAccount.title')}
              </h3>
              <p className="text-slate-600 font-medium text-sm mb-6 max-w-md mx-auto">
                {t('myGalleries.createAccount.description')}
              </p>
              <Link
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {t('myGalleries.createAccount.cta')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
