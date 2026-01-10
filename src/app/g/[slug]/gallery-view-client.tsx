"use client";

import { useState, useEffect, useRef } from "react";
import { Calendar, ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import {
  ExpiredView,
  PasswordForm,
  MasonryGrid,
  GalleryHeader,
  Lightbox,
  DownloadModal,
} from "@/components/gallery-view";

interface GalleryImage {
  id: string;
  url: string;
}

interface GalleryInfo {
  id: string;
  title: string;
  expires_at: string;
  views_count: number;
  images: GalleryImage[];
  has_password: boolean;
}

interface GalleryViewClientProps {
  slug: string;
  initialGallery: GalleryInfo;
  isExpired: boolean;
  isInactive: boolean;
}

export function GalleryViewClient({
  slug,
  initialGallery,
  isExpired,
  isInactive,
}: GalleryViewClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(!initialGallery.has_password);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadModalUrl, setDownloadModalUrl] = useState<string | null>(null);
  const [viewsCount, setViewsCount] = useState(initialGallery.views_count);
  const viewTracked = useRef(false);

  // Track view when user accesses the gallery content
  useEffect(() => {
    if (isAuthenticated && !viewTracked.current && !isExpired && !isInactive) {
      viewTracked.current = true;
      
      // Increment view count
      fetch(`/api/galleries/${initialGallery.id}/view`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.views_count) {
            setViewsCount(data.views_count);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, isExpired, isInactive, initialGallery.id]);

  // Handle password verification
  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  // Handle download all
  const handleDownloadAll = async () => {
    setIsDownloadingAll(true);
    toast.loading("Préparation de l'archive...", { id: "download-zip" });
    
    try {
      const response = await fetch(`/api/galleries/download/${slug}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${initialGallery.title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast.success("Téléchargement démarré !", { id: "download-zip" });
      } else {
        toast.error("Erreur lors du téléchargement", { id: "download-zip" });
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Erreur lors du téléchargement", { id: "download-zip" });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  // Handle single image download - show modal
  const handleDownloadSingle = (url: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadModalUrl(url);
  };

  // Lightbox navigation
  const handleLightboxPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const handleLightboxNext = () => {
    if (lightboxIndex !== null && lightboxIndex < initialGallery.images.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  // Show expired/inactive view
  if (isExpired || isInactive) {
    return <ExpiredView isExpired={isExpired} />;
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <PasswordForm
        title={initialGallery.title}
        expiresAt={initialGallery.expires_at}
        backgroundImage={initialGallery.images[0]?.url}
        onSubmit={handlePasswordSubmit}
      />
    );
  }

  // Main gallery view
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans'] selection:bg-indigo-100 selection:text-indigo-900">
      {/* Download Modal */}
      {downloadModalUrl && (
        <DownloadModal
          imageUrl={downloadModalUrl}
          imageName={initialGallery.title}
          onClose={() => setDownloadModalUrl(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          images={initialGallery.images}
          currentIndex={lightboxIndex}
          title={initialGallery.title}
          onClose={() => setLightboxIndex(null)}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          onDownload={handleDownloadSingle}
        />
      )}

      {/* Floating Header */}
      <GalleryHeader
        title={initialGallery.title}
        viewsCount={viewsCount}
        isDownloading={isDownloadingAll}
        onDownloadAll={handleDownloadAll}
      />

      <main className="max-w-7xl mx-auto px-6 sm:px-12 pt-40 pb-24">
        {/* Gallery Info Header */}
        <div className="flex flex-wrap items-center gap-10 mb-16 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 text-slate-900 font-black text-xs uppercase tracking-widest">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <ImageIcon size={20} />
            </div>
            {initialGallery.images.length} Photos
          </div>
          <div className="flex items-center gap-3 text-slate-900 font-black text-xs uppercase tracking-widest">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Calendar size={20} />
            </div>
            Expire le {new Date(initialGallery.expires_at).toLocaleDateString('fr-FR')}
          </div>
        </div>

        {/* Masonry Grid */}
        <MasonryGrid
          images={initialGallery.images}
          onImageClick={setLightboxIndex}
          onDownload={handleDownloadSingle}
        />

        {/* Professional Footer */}
        <div className="mt-48 pt-20 border-t border-slate-200 text-center space-y-12">
          <div className="flex flex-col items-center gap-6 opacity-40 hover:opacity-100 transition-opacity duration-500 group">
            <Image 
              src="/icons/logo.svg" 
              alt="PikSend" 
              width={48} 
              height={48}
              className="group-hover:scale-110 transition-transform"
            />
            <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-900">
              PikSend Experience
            </p>
          </div>
          
          <div className="max-w-xl mx-auto space-y-6">
            <p className="text-base font-bold text-slate-400 leading-relaxed">
              Vous êtes le créateur de cette galerie ? Accédez à votre console pour gérer vos partages et vos abonnements.
            </p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-10 py-5 bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-[0.2em] text-xs rounded-[2rem] hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all shadow-lg active:scale-95"
            >
              Accéder à ma console
            </button>
          </div>
        </div>
      </main>

      {/* Decorative ambient elements */}
      <div className="fixed -bottom-48 -left-48 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[150px] -z-10 animate-pulse pointer-events-none" />
      <div className="fixed -top-48 -right-48 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] -z-10 animate-pulse delay-700 pointer-events-none" />
    </div>
  );
}
