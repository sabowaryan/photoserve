'use client';

/**
 * Guest Upload Form Component
 * 
 * Allows visitors to upload photos without creating an account.
 * Features drag-and-drop, file validation, and progress indication.
 * If user is authenticated, redirects to dashboard gallery creation.
 * 
 * Requirements: 1.1, 1.5, 1.6, 1.7
 */

import { useState, useCallback, useRef } from 'react';
import { useCachedSession } from '@/hooks/use-cached-session';
import { useRouter } from 'next/navigation';
import { UploadCloud, X, Image as ImageIcon, AlertCircle, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/context';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { GuestSessionManager } from '@/lib/guest/session';
import { ErrorDisplay, type ErrorCode, getErrorCodeFromResponse } from '@/components/shared/error-display';

// Guest upload limits (matching backend)
const GUEST_UPLOAD_LIMITS = {
  maxFiles: 5,
  maxFileSizeMB: 50,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
};

interface FileWithPreview {
  file: File;
  preview: string;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  progress: number;
}

interface GuestUploadFormProps {
  onUploadComplete: (gallerySlug: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function GuestUploadForm({ onUploadComplete, onError, className }: GuestUploadFormProps) {
  const { t } = useTranslation();
  const { data: session, status } = useCachedSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [galleryTitle, setGalleryTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<{ code?: ErrorCode; message?: string; params?: Record<string, string> } | null>(null);

  // Check if user is authenticated - if so, they should use the dashboard
  const isAuthenticated = status === 'authenticated' && !!session?.user;

  /**
   * Validates a single file against guest upload limits
   * Requirements: 1.5, 1.6, 1.7
   */
  const validateFile = useCallback((file: File): { valid: boolean; errorCode?: ErrorCode; errorParams?: Record<string, string> } => {
    // Check file type (Requirement 1.7)
    if (!GUEST_UPLOAD_LIMITS.allowedTypes.includes(file.type as typeof GUEST_UPLOAD_LIMITS.allowedTypes[number])) {
      return { 
        valid: false, 
        errorCode: 'INVALID_FILE_TYPE'
      };
    }

    // Check file size (Requirement 1.6)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > GUEST_UPLOAD_LIMITS.maxFileSizeMB) {
      return { 
        valid: false, 
        errorCode: 'FILE_TOO_LARGE',
        errorParams: { size: String(GUEST_UPLOAD_LIMITS.maxFileSizeMB) }
      };
    }

    return { valid: true };
  }, []);

  /**
   * Processes selected files and adds them to the list
   */
  const processFiles = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // Check total file count (Requirement 1.5)
    const totalFiles = files.length + fileArray.length;
    if (totalFiles > GUEST_UPLOAD_LIMITS.maxFiles) {
      setError({ code: 'TOO_MANY_FILES', params: { count: String(GUEST_UPLOAD_LIMITS.maxFiles) } });
      return;
    }

    const newFiles: FileWithPreview[] = [];
    
    for (const file of fileArray) {
      const validation = validateFile(file);
      
      const fileWithPreview: FileWithPreview = {
        file,
        preview: URL.createObjectURL(file),
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        status: validation.valid ? 'pending' : 'error',
        error: validation.errorCode ? t(`errors.upload.${validation.errorCode === 'FILE_TOO_LARGE' ? 'fileTooLarge' : 'invalidFileType'}`, validation.errorParams) : undefined,
        progress: 0,
      };
      
      newFiles.push(fileWithPreview);
    }

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, [files.length, validateFile, t]);

  /**
   * Handles file input change
   */
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [processFiles]);

  /**
   * Handles drag events
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  /**
   * Removes a file from the list
   */
  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  /**
   * Opens file picker
   */
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  /**
   * Creates gallery and uploads all files
   */
  const handleSubmit = useCallback(async () => {
    // Validate at least one file (Requirement 1.5)
    const validFiles = files.filter(f => f.status !== 'error');
    if (validFiles.length === 0) {
      setError({ code: 'NO_FILES' });
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Get or create guest session
      const sessionManager = new GuestSessionManager();
      const session = sessionManager.getOrCreateSession();

      // Create session on server (sets HTTP-only cookie)
      const sessionResponse = await fetch('/api/guest/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
      });

      if (!sessionResponse.ok) {
        const errorData = await sessionResponse.json().catch(() => ({}));
        throw { code: getErrorCodeFromResponse(errorData), message: errorData.error };
      }

      // Create gallery
      const title = galleryTitle.trim() || t('gallery.create.titlePlaceholder');
      const galleryResponse = await fetch('/api/guest/galleries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });

      if (!galleryResponse.ok) {
        const errorData = await galleryResponse.json().catch(() => ({}));
        throw { code: 'GALLERY_CREATION_FAILED' as ErrorCode, message: errorData.error };
      }

      const { gallery } = await galleryResponse.json();

      // Upload files one by one
      const totalFiles = validFiles.length;
      let uploadedCount = 0;

      for (let i = 0; i < validFiles.length; i++) {
        const fileItem = validFiles[i];
        if (!fileItem) continue;
        
        const currentFileId = fileItem.id;
        
        // Update file status to uploading
        setFiles(prev => prev.map(f => 
          f.id === currentFileId ? { ...f, status: 'uploading' as const } : f
        ));

        try {
          const formData = new FormData();
          formData.append('file', fileItem.file);
          formData.append('orderIndex', String(i));

          const uploadResponse = await fetch(`/api/guest/galleries/${gallery.unique_slug}/images`, {
            method: 'POST',
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Upload failed');
          }

          // Update file status to success
          setFiles(prev => prev.map(f => 
            f.id === currentFileId ? { ...f, status: 'success' as const, progress: 100 } : f
          ));

          uploadedCount++;
          setUploadProgress(Math.round((uploadedCount / totalFiles) * 100));
        } catch (uploadError) {
          // Update file status to error
          setFiles(prev => prev.map(f => 
            f.id === currentFileId 
              ? { ...f, status: 'error' as const, error: (uploadError as Error).message } 
              : f
          ));
        }
      }

      // Check if at least one file was uploaded successfully
      if (uploadedCount > 0) {
        onUploadComplete(gallery.unique_slug);
      } else {
        throw { code: 'NETWORK_ERROR' as ErrorCode };
      }
    } catch (err) {
      const typedError = err as { code?: ErrorCode; message?: string };
      if (typedError.code) {
        setError({ code: typedError.code, message: typedError.message });
      } else {
        setError({ code: 'UNEXPECTED_ERROR', message: (err as Error).message });
      }
      onError?.((err as Error).message || t('common.error'));
    } finally {
      setIsUploading(false);
    }
  }, [files, galleryTitle, t, onUploadComplete, onError]);

  const validFilesCount = files.filter(f => f.status !== 'error').length;
  const canSubmit = validFilesCount > 0 && !isUploading;
  const remainingSlots = GUEST_UPLOAD_LIMITS.maxFiles - files.length;

  // If user is authenticated, show a message to use the dashboard instead
  if (isAuthenticated) {
    return (
      <div className={cn('w-full max-w-2xl mx-auto text-center', className)}>
        <div className="bg-indigo-50 border border-indigo-200 rounded-3xl p-8 md:p-12">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
            <Check size={32} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-3">
            {t('auth.title')} - {session?.user?.name || session?.user?.email}
          </h3>
          <p className="text-slate-600 font-medium mb-6">
            {t('dashboard.galleriesSection.emptyState')}
          </p>
          <button
            onClick={() => router.push('/dashboard/gallery/new')}
            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
          >
            {t('dashboard.newGallery')}
          </button>
        </div>
      </div>
    );
  }

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className={cn('w-full max-w-2xl mx-auto flex items-center justify-center py-12', className)}>
        <Loader2 size={32} className="text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className={cn('w-full max-w-2xl mx-auto', className)}>
      {/* Title Input */}
      <div className="mb-6">
        <label htmlFor="gallery-title" className="block text-sm font-bold text-slate-700 mb-2">
          {t('gallery.create.titleLabel')}
        </label>
        <Input
          id="gallery-title"
          type="text"
          value={galleryTitle}
          onChange={(e) => setGalleryTitle(e.target.value)}
          placeholder={t('gallery.create.titlePlaceholder')}
          className="h-14 text-lg rounded-2xl border-slate-200 focus:border-indigo-500 focus:ring-indigo-500"
          disabled={isUploading}
        />
      </div>

      {/* Dropzone */}
      <div
        onClick={!isUploading ? openFilePicker : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all duration-300 cursor-pointer',
          isDragging 
            ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' 
            : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50',
          isUploading && 'pointer-events-none opacity-75'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={GUEST_UPLOAD_LIMITS.allowedTypes.join(',')}
          onChange={handleFileChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className={cn(
          'w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 transition-all duration-300',
          isDragging 
            ? 'bg-indigo-600 text-white scale-110' 
            : 'bg-indigo-50 text-indigo-600'
        )}>
          <UploadCloud size={40} className={isDragging ? 'animate-bounce' : ''} />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2">
          {t('guest.upload.dropzone')}
        </h3>
        <p className="text-slate-500 font-medium mb-4">
          {t('guest.upload.dropzoneHint')}
        </p>

        {/* Upload limits info */}
        <div className="flex flex-wrap justify-center gap-3 text-xs font-bold text-slate-400">
          <span className="px-3 py-1 bg-slate-100 rounded-full">
            {t('gallery.create.maxFiles', { count: String(GUEST_UPLOAD_LIMITS.maxFiles) })}
          </span>
          <span className="px-3 py-1 bg-slate-100 rounded-full">
            {t('gallery.create.maxSize', { size: String(GUEST_UPLOAD_LIMITS.maxFileSizeMB) })}
          </span>
          <span className="px-3 py-1 bg-slate-100 rounded-full">
            {t('gallery.create.allowedTypes')}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <ErrorDisplay
          code={error.code}
          message={error.message}
          params={error.params}
          severity="error"
          dismissible
          onDismiss={() => setError(null)}
          className="mt-4"
        />
      )}

      {/* File preview grid */}
      {files.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-700">
              {validFilesCount} / {GUEST_UPLOAD_LIMITS.maxFiles} {t('gallery.detail.images')}
            </span>
            {remainingSlots > 0 && (
              <span className="text-xs text-slate-400">
                {remainingSlots} {t('common.optional').toLowerCase()} slots
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className={cn(
                  'relative aspect-square rounded-2xl overflow-hidden border-2 transition-all',
                  fileItem.status === 'error' 
                    ? 'border-rose-300 bg-rose-50' 
                    : fileItem.status === 'success'
                    ? 'border-emerald-300'
                    : 'border-slate-200'
                )}
              >
                <img
                  src={fileItem.preview}
                  alt=""
                  className={cn(
                    'w-full h-full object-cover',
                    fileItem.status === 'error' && 'opacity-50'
                  )}
                />

                {/* Status overlay */}
                {fileItem.status === 'uploading' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 size={24} className="text-white animate-spin" />
                  </div>
                )}

                {fileItem.status === 'success' && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}

                {fileItem.status === 'error' && (
                  <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center">
                    <AlertCircle size={24} className="text-rose-600" />
                  </div>
                )}

                {/* Remove button */}
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileItem.id);
                    }}
                    className="absolute top-2 left-2 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X size={14} className="text-white" />
                  </button>
                )}
              </div>
            ))}

            {/* Add more button */}
            {remainingSlots > 0 && !isUploading && (
              <button
                onClick={openFilePicker}
                className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 flex items-center justify-center transition-all"
              >
                <ImageIcon size={24} className="text-slate-400" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload progress */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-700">
              {t('guest.upload.uploading')}
            </span>
            <span className="text-sm font-bold text-indigo-600">
              {uploadProgress}%
            </span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          'w-full mt-6 py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3',
          canSubmit
            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200 active:scale-[0.98]'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        )}
      >
        {isUploading ? (
          <>
            <Loader2 size={22} className="animate-spin" />
            {t('guest.upload.processing')}
          </>
        ) : (
          <>
            <UploadCloud size={22} />
            {t('gallery.create.submit')}
          </>
        )}
      </button>
    </div>
  );
}
