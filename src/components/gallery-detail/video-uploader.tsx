"use client";

import { useState, useRef } from "react";
import { Film, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface VideoUploaderProps {
  currentVideoUrl?: string;
  onVideoChange: (url: string | undefined) => void;
  maxSizeMB?: number;
  disabled?: boolean;
}

export function VideoUploader({
  currentVideoUrl,
  onVideoChange,
  maxSizeMB = 50,
  disabled = false,
}: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(currentVideoUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error("Le fichier doit être une vidéo (MP4, WebM)");
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      toast.error(`La vidéo ne doit pas dépasser ${maxSizeMB}MB (taille: ${fileSizeMB.toFixed(1)}MB)`);
      return;
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload to Cloudinary
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'photoserve');
      formData.append('folder', 'photoserve/videos');
      formData.append('resource_type', 'video');

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const videoUrl = response.secure_url;
          
          setPreviewUrl(videoUrl);
          onVideoChange(videoUrl);
          toast.success("Vidéo uploadée avec succès !");
        } else {
          throw new Error('Upload failed');
        }
        setIsUploading(false);
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        toast.error("Erreur lors de l'upload de la vidéo");
        setIsUploading(false);
        setPreviewUrl(currentVideoUrl);
      });

      // Send request
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`);
      xhr.send(formData);

    } catch (error) {
      console.error('Video upload error:', error);
      toast.error("Erreur lors de l'upload de la vidéo");
      setIsUploading(false);
      setPreviewUrl(currentVideoUrl);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(undefined);
    onVideoChange(undefined);
    toast.success("Vidéo supprimée");
  };

  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-2">
        Video Cover
      </label>

      {previewUrl ? (
        <div className="relative group">
          <video
            src={previewUrl}
            className="w-full h-32 object-cover rounded-lg border border-slate-200"
            controls
            muted
            loop
          />
          
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg">
              <div className="relative w-16 h-16 mb-2">
                <svg className="w-full h-full transform -rotate-90">
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="transparent" 
                    className="text-white/30" 
                  />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray={175.9} 
                    strokeDashoffset={175.9 - (175.9 * uploadProgress) / 100} 
                    strokeLinecap="round"
                    className="text-indigo-500 transition-all duration-300" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-white">{uploadProgress}%</span>
                </div>
              </div>
              <span className="text-xs font-medium text-white">Upload en cours...</span>
            </div>
          )}

          {!isUploading && (
            <button
              onClick={handleRemove}
              disabled={disabled}
              className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <X size={14} />
              Supprimer
            </button>
          )}
        </div>
      ) : (
        <label className={`block border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-indigo-400 hover:bg-indigo-50/50 transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Film size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Cliquez pour uploader</p>
              <p className="text-xs text-slate-500 mt-1">
                MP4, WebM • Max {maxSizeMB}MB
              </p>
            </div>
          </div>
        </label>
      )}

      <div className="mt-2 flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          Recommandé : 1920x1080, max 30 secondes, format MP4
        </p>
      </div>
    </div>
  );
}
