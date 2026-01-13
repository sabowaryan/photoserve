"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Image as ImageIcon, FolderDown, Loader2, CheckCircle2, Download, Sparkles } from "lucide-react";

interface DownloadModalProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export function DownloadModal({ imageUrl, imageName = "photo", onClose }: DownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState<'gallery' | 'file' | null>(null);
  const [success, setSuccess] = useState<'gallery' | 'file' | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleDownloadToFiles = async () => {
    setIsDownloading('file');
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${imageName}_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      
      setSuccess('file');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Download error:', error);
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(null);
    }
  };

  const handleSaveToGallery = async () => {
    setIsDownloading('gallery');
    
    try {
      if (navigator.share && navigator.canShare) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `${imageName}.jpg`, { type: blob.type });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: imageName,
          });
          setSuccess('gallery');
          setTimeout(() => onClose(), 1500);
          return;
        }
      }
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${imageName}.jpg`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      
      setSuccess('gallery');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Save to gallery error:', error);
      window.open(imageUrl, '_blank');
      onClose();
    } finally {
      setIsDownloading(null);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 relative overflow-hidden">
          {/* Decorative orbs */}
          <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-x-1/2 translate-y-1/2" />
          
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Download className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Enregistrer la photo</h3>
                <p className="text-white/70 text-xs font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Qualité HD
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          {/* Save to Gallery - Primary */}
          <button
            onClick={handleSaveToGallery}
            disabled={isDownloading !== null}
            className="w-full flex items-center gap-4 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 border-2 border-indigo-100 rounded-2xl transition-all group disabled:opacity-50"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ${
              success === 'gallery' 
                ? 'bg-emerald-500' 
                : 'bg-gradient-to-br from-indigo-500 to-violet-500'
            }`}>
              {isDownloading === 'gallery' ? (
                <Loader2 size={24} className="animate-spin" />
              ) : success === 'gallery' ? (
                <CheckCircle2 size={24} />
              ) : (
                <ImageIcon size={24} />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-slate-900">Galerie Photos</p>
              <p className="text-sm text-slate-500">Enregistrer dans vos photos</p>
            </div>
            {success !== 'gallery' && (
              <div className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                Recommandé
              </div>
            )}
          </button>

          {/* Save to Files - Secondary */}
          <button
            onClick={handleDownloadToFiles}
            disabled={isDownloading !== null}
            className="w-full flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-2xl transition-all group disabled:opacity-50"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ${
              success === 'file' 
                ? 'bg-emerald-500' 
                : 'bg-slate-700'
            }`}>
              {isDownloading === 'file' ? (
                <Loader2 size={24} className="animate-spin" />
              ) : success === 'file' ? (
                <CheckCircle2 size={24} />
              ) : (
                <FolderDown size={24} />
              )}
            </div>
            <div className="text-left flex-1">
              <p className="font-bold text-slate-900">Fichiers</p>
              <p className="text-sm text-slate-500">Télécharger dans vos fichiers</p>
            </div>
          </button>
        </div>

        {/* Footer hint */}
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-400 text-center bg-slate-50 rounded-xl py-2.5 px-4">
            Choisissez où enregistrer votre photo
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
