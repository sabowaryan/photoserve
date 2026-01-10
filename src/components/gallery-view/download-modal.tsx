"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Image as ImageIcon, FolderDown, Loader2, CheckCircle2 } from "lucide-react";

interface DownloadModalProps {
  imageUrl: string;
  imageName?: string;
  onClose: () => void;
}

export function DownloadModal({ imageUrl, imageName = "photo", onClose }: DownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState<'gallery' | 'file' | null>(null);
  const [success, setSuccess] = useState<'gallery' | 'file' | null>(null);

  // Download to Files (standard download)
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
      // Fallback
      window.open(imageUrl, '_blank');
    } finally {
      setIsDownloading(null);
    }
  };

  // Save to Gallery (uses Web Share API or opens image for long-press)
  const handleSaveToGallery = async () => {
    setIsDownloading('gallery');
    
    try {
      // Try Web Share API with files (works on modern mobile browsers)
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
      
      // Fallback: Download the image (on iOS/Android it will prompt to save to gallery)
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${imageName}.jpg`;
      
      // On mobile, this often triggers the "Save to Photos" option
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      
      setSuccess('gallery');
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error('Save to gallery error:', error);
      // Ultimate fallback: open image in new tab
      window.open(imageUrl, '_blank');
      onClose();
    } finally {
      setIsDownloading(null);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900">Enregistrer la photo</h3>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* Save to Gallery */}
          <button
            onClick={handleSaveToGallery}
            disabled={isDownloading !== null}
            className="w-full flex items-center gap-4 p-5 bg-indigo-50 hover:bg-indigo-100 border-2 border-indigo-100 rounded-2xl transition-all group disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
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
          </button>

          {/* Save to Files */}
          <button
            onClick={handleDownloadToFiles}
            disabled={isDownloading !== null}
            className="w-full flex items-center gap-4 p-5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-100 rounded-2xl transition-all group disabled:opacity-50"
          >
            <div className="w-14 h-14 bg-slate-700 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
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
        <div className="px-6 pb-6">
          <p className="text-xs text-slate-400 text-center">
            Choisissez où enregistrer votre photo
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
