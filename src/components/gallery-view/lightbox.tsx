"use client";

import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, Download, Heart, MessageCircle, Send } from "lucide-react";
import Image from "next/image";
import { WatermarkOverlay } from "@/components/gallery/watermark-overlay";
import type { ImageWithMeta } from "@/types";

interface LightboxProps {
  images: ImageWithMeta[];
  currentIndex: number;
  title: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onDownload: (url: string) => void;
  onFavorite?: (imageId: string) => void;
  onComment?: (imageId: string, comment: string) => void;
  /** Whether to show watermark overlay on images */
  showWatermark?: boolean;
  /** Whether to show favorites button */
  showFavorites?: boolean;
  /** Set of favorited image IDs */
  favorites?: Set<string>;
  /** Whether to show comments section */
  showComments?: boolean;
}

export function Lightbox({ 
  images, 
  currentIndex, 
  title, 
  onClose, 
  onPrev, 
  onNext,
  onDownload,
  onFavorite,
  onComment,
  showWatermark = false,
  showFavorites = false,
  favorites = new Set(),
  showComments = false
}: LightboxProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft" && currentIndex > 0) onPrev();
    if (e.key === "ArrowRight" && currentIndex < images.length - 1) onNext();
  }, [currentIndex, images.length, onClose, onPrev, onNext]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const currentImage = images[currentIndex];
  const isFavorite = currentImage ? favorites.has(currentImage.id) : false;
  const comments = currentImage?.comments || [];

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !onComment || !currentImage) return;
    
    setIsSubmittingComment(true);
    try {
      await onComment(currentImage.id, commentText.trim());
      setCommentText("");
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!currentImage) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300">
      <div 
        className="absolute inset-0 bg-slate-950/98 backdrop-blur-2xl" 
        onClick={onClose}
      />
      
      {/* Header - Sticky */}
      <div className="relative z-[210] flex items-center justify-between px-4 py-4">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/50 to-transparent backdrop-blur-xl pointer-events-none" />
        
        <div className="relative flex items-center gap-3 text-white">
          <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center">
            <Image 
              src="/icons/logo.svg" 
              alt="PikSend" 
              width={18} 
              height={18}
            />
          </div>
          <div className="w-px h-6 bg-white/10 hidden sm:block" />
          <div className="hidden sm:block">
            <h3 className="text-xs font-black uppercase tracking-wider">{title}</h3>
            <p className="text-[9px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
              PikSend Gallery
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="relative p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Navigation Buttons */}
      <button 
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        disabled={currentIndex === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[210] p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronLeft size={32} />
      </button>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        disabled={currentIndex === images.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[210] p-3 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all disabled:opacity-0"
      >
        <ChevronRight size={32} />
      </button>

      {/* Scrollable Image Container */}
      <div className="relative z-[205] flex-1 overflow-y-auto overflow-x-hidden">
        <div className="min-h-full flex items-start justify-center p-4 pb-24">
          <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Image Section */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <img 
                  src={currentImage.cloudinary_url} 
                  className="max-w-full h-auto object-contain rounded-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in zoom-in duration-500" 
                  alt={`Photo ${currentIndex + 1}`} 
                />
                {/* Watermark overlay for free guest galleries - Requirements 2.1, 2.2 */}
                <WatermarkOverlay visible={showWatermark} position="bottom-right" opacity={30} />
              </div>
            </div>
            
            {/* Comments Section - Requirements 3.2.1, 3.2.2 */}
            {showComments && (
              <div className="lg:w-80 xl:w-96 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col max-h-[600px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <MessageCircle size={16} />
                    Commentaires
                  </h3>
                  {comments.length > 0 && (
                    <span className="text-xs text-white/40 font-medium">
                      {comments.length}
                    </span>
                  )}
                </div>
                
                {/* Comments List */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
                  {comments.length === 0 ? (
                    <p className="text-xs text-white/40 text-center py-8">
                      Aucun commentaire pour le moment
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div 
                        key={comment.id}
                        className="bg-white/5 rounded-lg p-3 border border-white/5"
                      >
                        <p className="text-xs text-white/90 leading-relaxed">
                          {comment.content}
                        </p>
                        <p className="text-[10px] text-white/30 mt-2">
                          {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                {onComment && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitComment();
                        }
                      }}
                      placeholder="Ajouter un commentaire..."
                      disabled={isSubmittingComment}
                      className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="p-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-white/10 disabled:text-white/30 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Bottom Controls - Fixed position */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[210] flex items-center gap-6 px-6 py-3 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl">
        <span className="text-xs font-black text-white uppercase tracking-wider">
          {currentIndex + 1} <span className="text-white/30">/ {images.length}</span>
        </span>
        <div className="w-px h-5 bg-white/10" />
        
        {/* Favorite Button */}
        {showFavorites && onFavorite && (
          <>
            <button
              onClick={() => onFavorite(currentImage.id)}
              className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-wider hover:text-red-400 transition-colors"
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart 
                size={14} 
                className={isFavorite ? 'fill-red-500 text-red-500' : ''}
              />
              {isFavorite ? 'Favori' : 'Favoris'}
            </button>
            <div className="w-px h-5 bg-white/10" />
          </>
        )}
        
        <button 
          onClick={() => onDownload(currentImage.cloudinary_url)}
          className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-wider hover:text-indigo-400 transition-colors"
        >
          <Download size={14} /> Télécharger
        </button>
      </div>
    </div>
  );
}
