"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  TabSwitcher,
  DeleteModal,
  DragOverlay,
  ImageGrid,
  UploadQueue,
  ContentHeader,
  ShareCard,
  QuotaCard,
  SettingsTab,
} from "@/components/gallery-detail";
import { UpgradeModal } from "@/components/shared/upgrade-modal";
import type { GallerySettings } from "@/types";

interface Gallery {
  id: string;
  title: string;
  unique_slug: string;
  expires_at: string;
  expiration_days: number;
  views_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  settings?: GallerySettings;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  file_size_mb: number;
  order_index: number;
}

interface Profile {
  subscription_plan: "free" | "premium" | "pro";
  max_images_per_gallery: number;
  max_image_size_mb: number;
  storage_used_mb: number;
}

interface DurationOption {
  value: number;
  label: string;
}

interface UploadingFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
}

interface GalleryDetailClientProps {
  gallery: Gallery;
  initialImages: GalleryImage[];
  profile: Profile | null;
  durationOptions: DurationOption[];
  canChangeDuration: boolean;
}

export function GalleryDetailClient({
  gallery,
  initialImages,
  profile,
  durationOptions,
  canChangeDuration,
}: GalleryDetailClientProps) {
  const router = useRouter();

  // State management
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [title, setTitle] = useState(gallery.title);
  const [password, setPassword] = useState('');
  const [expirationDays, setExpirationDays] = useState(gallery.expiration_days);
  const [activeTab, setActiveTab] = useState<'content' | 'settings'>('content');
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[], type: 'single' | 'multiple' } | null>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [publicUrl, setPublicUrl] = useState(`/g/${gallery.unique_slug}`);
  
  // Gallery settings state
  const [settings, setSettings] = useState<GallerySettings>((gallery as any).settings || {
    enableFavorites: false,
    enableComments: false,
    enableDeadline: false,
    enableLeadMagnet: false,
    noindex: true,
  });
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    limitType: "gallery" | "storage" | "images" | "imageSize";
    currentValue?: number;
    limitValue?: number;
  }>({
    isOpen: false,
    limitType: "images",
  });

  // Set public URL on client side only
  useEffect(() => {
    setPublicUrl(`${window.location.origin}/g/${gallery.unique_slug}`);
  }, [gallery.unique_slug]);

  const limits = {
    max_images_per_gallery: profile?.max_images_per_gallery || 30,
    max_image_size_mb: profile?.max_image_size_mb || 5,
  };
  
  const isLimitReached = images.length >= limits.max_images_per_gallery;
  const planName = profile?.subscription_plan || 'free';

  // Upgrade modal helpers
  const openUpgradeModal = useCallback((
    limitType: "gallery" | "storage" | "images" | "imageSize",
    currentValue?: number,
    limitValue?: number
  ) => {
    setUpgradeModal({
      isOpen: true,
      limitType,
      currentValue,
      limitValue,
    });
  }, []);

  const closeUpgradeModal = useCallback(() => {
    setUpgradeModal(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Selection handlers
  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === images.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(images.map(img => img.id)));
    }
  };

  // Delete handlers
  const requestDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteConfirm({ ids: Array.from(selectedIds), type: 'multiple' });
  };

  const requestDeleteSingle = (imageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ ids: [imageId], type: 'single' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      for (const id of deleteConfirm.ids) {
        await fetch(`/api/images/${id}`, { method: "DELETE" });
      }
      
      const idsToRemove = new Set(deleteConfirm.ids);
      setImages(prev => prev.filter(img => !idsToRemove.has(img.id)));
      const newSelected = new Set(selectedIds);
      deleteConfirm.ids.forEach(id => newSelected.delete(id));
      setSelectedIds(newSelected);
      setDeleteConfirm(null);
      
      toast.success(`${deleteConfirm.ids.length} image(s) supprimée(s)`);
      router.refresh();
    } catch (error) {
      console.error("Error deleting images:", error);
      toast.error("Impossible de supprimer les images");
    }
  };

  // Settings save handler
  const handleSaveSettings = async () => {
    setIsUpdating(true);
    setSaveSuccess(false);
    
    try {
      const updates: Record<string, unknown> = {};
      if (title.trim() !== gallery.title) {
        updates.title = title.trim();
      }
      if (password.trim()) {
        updates.password = password.trim();
      }
      if (expirationDays !== gallery.expiration_days && canChangeDuration) {
        updates.expiration_days = expirationDays;
      }
      
      // Add settings to updates
      if (JSON.stringify(settings) !== JSON.stringify((gallery as any).settings)) {
        updates.settings = settings;
      }

      if (Object.keys(updates).length > 0) {
        const response = await fetch(`/api/galleries/${gallery.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) throw new Error("Failed to update");

        toast.success("Modifications enregistrées");
        setPassword("");
        router.refresh();
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Impossible d'enregistrer");
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Settings change handler
  const handleSettingsChange = useCallback((newSettings: Partial<GallerySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Upload logic
  const processFiles = useCallback((files: File[]) => {
    setError(null);
    const currentCount = images.length + uploadQueue.length;

    if (currentCount + files.length > limits.max_images_per_gallery) {
      openUpgradeModal("images", currentCount, limits.max_images_per_gallery);
      return;
    }

    const validFiles: File[] = [];
    let tempError: string | null = null;

    files.forEach(file => {
      const sizeMb = file.size / (1024 * 1024);
      
      if (!file.type.startsWith('image/')) {
        tempError = `Le fichier ${file.name} n'est pas une image valide.`;
        return;
      }
      
      if (sizeMb > limits.max_image_size_mb) {
        openUpgradeModal("imageSize", Math.round(sizeMb * 10) / 10, limits.max_image_size_mb);
        return;
      }

      validFiles.push(file);
    });

    if (tempError) {
      setError(tempError);
      if (validFiles.length === 0) return;
    }

    const newQueueItems: UploadingFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading'
    }));

    setUploadQueue(prev => [...prev, ...newQueueItems]);
    newQueueItems.forEach(item => simulateFileUpload(item));
  }, [images.length, uploadQueue.length, limits, openUpgradeModal]);

  const simulateFileUpload = useCallback(async (item: UploadingFile) => {
    try {
      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("galleryId", gallery.id);
      formData.append("orderIndex", images.length.toString());

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20 + 5;
        if (progress >= 90) {
          clearInterval(interval);
        } else {
          setUploadQueue(prev => prev.map(q => 
            q.id === item.id ? { ...q, progress } : q
          ));
        }
      }, 150);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const { data: newImage } = await response.json();

      setUploadQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, progress: 100, status: 'done' } : q
      ));

      setTimeout(() => {
        if (newImage) {
          setImages(prev => [newImage, ...prev]);
        }
        setUploadQueue(prev => prev.filter(q => q.id !== item.id));
      }, 500);

      router.refresh();
    } catch (error) {
      console.error("Upload error:", error);
      setUploadQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'error' } : q
      ));
      toast.error(`Erreur lors de l'upload de ${item.file.name}`);
    }
  }, [gallery.id, images.length, router]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  return (
    <div className="space-y-8 animate-fade-in relative">
      {/* Delete Modal */}
      {deleteConfirm && (
        <DeleteModal
          count={deleteConfirm.ids.length}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      {/* Drag & Drop Overlay */}
      {isDragging && (
        <DragOverlay
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        />
      )}

      {/* Tab Switcher */}
      <TabSwitcher
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedCount={selectedIds.size}
        onDeleteSelected={requestDeleteSelected}
      />

      {/* Content Tab */}
      {activeTab === 'content' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div 
            className="lg:col-span-3 space-y-6"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          >
            {/* Header */}
            <ContentHeader
              imageCount={images.length}
              maxImages={limits.max_images_per_gallery}
              isLimitReached={isLimitReached}
              selectedCount={selectedIds.size}
              totalCount={images.length}
              onToggleSelectAll={toggleSelectAll}
              onUpload={processFiles}
            />

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in shake-in">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {/* Upload Queue */}
            <UploadQueue items={uploadQueue} />

            {/* Images Grid */}
            <ImageGrid
              images={images}
              selectedIds={selectedIds}
              isLimitReached={isLimitReached}
              onToggleSelection={toggleSelection}
              onDeleteSingle={requestDeleteSingle}
              onUpload={processFiles}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <ShareCard publicUrl={publicUrl} />
            <QuotaCard
              currentCount={images.length}
              maxCount={limits.max_images_per_gallery}
              planName={planName}
            />
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <SettingsTab
          title={title}
          onTitleChange={setTitle}
          password={password}
          onPasswordChange={setPassword}
          durationOptions={durationOptions}
          currentDuration={expirationDays}
          onDurationChange={setExpirationDays}
          canChangeDuration={canChangeDuration}
          isUpdating={isUpdating}
          saveSuccess={saveSuccess}
          onSave={handleSaveSettings}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          userPlan={planName}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        limitType={upgradeModal.limitType}
        currentValue={upgradeModal.currentValue}
        limitValue={upgradeModal.limitValue}
        currentPlan={planName}
      />
    </div>
  );
}
