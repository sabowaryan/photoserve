"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  X,
  Lock,
  Clock,
  Loader2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  UploadCloud,
  Shield,
  Zap,
} from "lucide-react";
import { showUploadError } from "@/lib/utils/upload-toast";
import { UpgradeModal } from "@/components/shared/upgrade-modal";

interface UploadedImage {
  id: string;
  url: string;
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  sizeMb: number;
}

interface DurationOption {
  value: number;
  label: string;
}

interface GalleryCreateFormProps {
  maxImagesPerGallery: number;
  maxImageSizeMb: number;
  storageLimit: number;
  currentStorageUsed: number;
  isGalleryLimitReached: boolean;
  durationOptions: DurationOption[];
  subscriptionPlan: string;
}

export function GalleryCreateForm({
  maxImagesPerGallery,
  maxImageSizeMb,
  storageLimit,
  currentStorageUsed,
  isGalleryLimitReached,
  durationOptions,
  subscriptionPlan,
}: GalleryCreateFormProps) {
  const router = useRouter();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(true);
  const [expirationDays, setExpirationDays] = useState(
    durationOptions[durationOptions.length - 1]?.value || 30
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Upgrade modal state
  const [upgradeModal, setUpgradeModal] = useState<{
    isOpen: boolean;
    limitType: "gallery" | "storage" | "images" | "imageSize";
    currentValue?: number;
    limitValue?: number;
  }>({
    isOpen: false,
    limitType: "gallery",
  });

  // Calculate pending upload size
  const pendingUploadSize = useMemo(() => {
    return images.reduce((acc, img) => acc + img.sizeMb, 0);
  }, [images]);

  // Current and projected storage usage
  const projectedStorageUsed = currentStorageUsed + pendingUploadSize;
  const isStorageExceeded = projectedStorageUsed > storageLimit;

  // Open upgrade modal helper
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

  const validateAndAddFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((file) => {
        if (!file.type.startsWith("image/")) {
          setError(`❌ ${file.name} n'est pas une image valide. Formats acceptés: JPG, PNG, GIF, WebP`);
          return false;
        }
        const fileSizeMb = file.size / (1024 * 1024);
        if (fileSizeMb > maxImageSizeMb) {
          openUpgradeModal("imageSize", Math.round(fileSizeMb * 10) / 10, maxImageSizeMb);
          return false;
        }
        return true;
      });

      if (images.length + validFiles.length > maxImagesPerGallery) {
        openUpgradeModal("images", images.length, maxImagesPerGallery);
        return;
      }

      // Check storage limit
      const newFilesSize = validFiles.reduce(
        (acc, f) => acc + f.size / (1024 * 1024),
        0
      );
      if (currentStorageUsed + pendingUploadSize + newFilesSize > storageLimit) {
        openUpgradeModal(
          "storage",
          Math.round((currentStorageUsed + pendingUploadSize) * 10) / 10,
          storageLimit
        );
        return;
      }

      setError(null);

      const newImages: UploadedImage[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(file),
        file,
        status: "pending",
        progress: 0,
        sizeMb: file.size / (1024 * 1024),
      }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [
      images.length,
      maxImagesPerGallery,
      maxImageSizeMb,
      currentStorageUsed,
      pendingUploadSize,
      storageLimit,
      openUpgradeModal,
    ]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      validateAndAddFiles(files);
    },
    [validateAndAddFiles]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      validateAndAddFiles(files);
    },
    [validateAndAddFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const generateAITitle = () => {
    const suggestions = [
      "Souvenirs d'été 2024",
      "Voyage en Italie",
      "Mariage de Sophie & Marc",
      "Anniversaire des 30 ans",
      "Week-end à la montagne",
      "Photos de famille",
    ];
    const randomTitle = suggestions[Math.floor(Math.random() * suggestions.length)];
    if (randomTitle) {
      setTitle(randomTitle);
    }
  };

  const canProceedToStep2 = title.trim().length > 0;
  const canProceedToStep3 = !isPasswordEnabled || password.trim().length > 0;

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Veuillez entrer un titre pour la galerie.");
      return;
    }

    if (isPasswordEnabled && !password.trim()) {
      setError("Veuillez définir un mot de passe pour protéger la galerie.");
      return;
    }

    if (images.length === 0) {
      setError("Veuillez ajouter au moins une image.");
      return;
    }

    if (isStorageExceeded) {
      setError("Supprimez des images ou passez à un plan supérieur.");
      return;
    }

    if (isGalleryLimitReached) {
      openUpgradeModal("gallery");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Create gallery via API
      const createResponse = await fetch("/api/galleries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          password: isPasswordEnabled ? password.trim() : undefined,
          expirationDays,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || "Failed to create gallery");
      }

      const { gallery } = await createResponse.json();

      // Upload images
      for (const img of images) {
        const currentImg = img;
        setImages((prev) =>
          prev.map((p) =>
            p.id === currentImg.id ? { ...p, status: "uploading", progress: 0 } : p
          )
        );

        try {
          const formData = new FormData();
          formData.append("file", currentImg.file);
          formData.append("galleryId", gallery.id);
          formData.append("orderIndex", images.indexOf(currentImg).toString());

          const uploadResponse = await fetch("/api/images/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            const errorMessage = errorData.error || "Upload failed";
            
            // Display user-friendly error messages
            showUploadError(errorMessage, {
              fileName: currentImg.file.name,
              limitValue: maxImageSizeMb,
            });
            
            throw new Error(errorMessage);
          }

          setImages((prev) =>
            prev.map((p) =>
              p.id === currentImg.id ? { ...p, status: "done", progress: 100 } : p
            )
          );
        } catch (uploadErr) {
          console.error("Error uploading image:", uploadErr);
          setImages((prev) =>
            prev.map((p) =>
              p.id === currentImg.id ? { ...p, status: "error", progress: 0 } : p
            )
          );
          throw uploadErr;
        }
      }

      router.push(`/dashboard/gallery/${gallery.id}`);
    } catch (err: unknown) {
      console.error("Error creating gallery:", err);
      setError(err instanceof Error ? err.message : "Impossible de créer la galerie.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-4 mb-12">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg transition-all ${
                currentStep === step
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110"
                  : currentStep > step
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}
            >
              {currentStep > step ? (
                <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
              ) : (
                step
              )}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 rounded-full transition-all ${
                  currentStep > step ? "bg-emerald-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-indigo-100/30 p-10 space-y-10">
        {/* Step 1: Informations Générales */}
        {currentStep === 1 && (
          <div className="space-y-8 animate-slide-up">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                Informations générales
              </h2>
              <p className="text-slate-500 font-medium">
                Donnez un titre et choisissez la durée de votre galerie
              </p>
            </div>

            {/* Title with AI Generator */}
            <div className="space-y-3">
              <Label htmlFor="title" className="text-slate-900 font-bold text-base">
                Titre de la galerie
              </Label>
              <div className="flex gap-3">
                <Input
                  id="title"
                  placeholder="Ex: Mariage de Marie & Jean"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                  className="flex-1 bg-slate-50 border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none rounded-2xl py-6 text-base"
                />
                <Button
                  type="button"
                  onClick={generateAITitle}
                  variant="outline"
                  className="px-6 rounded-2xl border-2 border-slate-200 hover:border-indigo-600 hover:bg-indigo-50 transition-all"
                >
                  <Sparkles className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                </Button>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-3">
              <Label htmlFor="expiration" className="text-slate-900 font-bold text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                Durée de validité
              </Label>
              <Select
                value={expirationDays.toString()}
                onValueChange={(value) => setExpirationDays(parseInt(value))}
                disabled={isCreating}
              >
                <SelectTrigger className="w-full bg-slate-50 border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none rounded-2xl py-6 text-base">
                  <SelectValue placeholder="Sélectionnez une durée" />
                </SelectTrigger>
                <SelectContent>
                  {durationOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {subscriptionPlan === "free" && (
                <p className="text-sm text-slate-500 font-medium">
                  💎 Passez à Premium pour des durées plus longues
                </p>
              )}
            </div>

            <Button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 px-10 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 text-base"
            >
              Continuer
              <CheckCircle2 className="w-5 h-5 ml-2" strokeWidth={2.5} />
            </Button>
          </div>
        )}

        {/* Step 2: Sécurité */}
        {currentStep === 2 && (
          <div className="space-y-8 animate-slide-up">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                Sécurité
              </h2>
              <p className="text-slate-500 font-medium">
                Protégez votre galerie avec un mot de passe
              </p>
            </div>

            {/* Password Toggle Block */}
            <div
              className={`p-8 rounded-[2rem] border-2 transition-all ${
                isPasswordEnabled
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      Protection par mot de passe
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      Seules les personnes avec le mot de passe pourront voir vos photos
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordEnabled(!isPasswordEnabled)}
                  className={`relative w-16 h-8 rounded-full transition-all ${
                    isPasswordEnabled ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all ${
                      isPasswordEnabled ? "left-9" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Password Input - Animated */}
              {isPasswordEnabled && (
                <div className="space-y-3 animate-slide-up">
                  <Label htmlFor="password" className="text-slate-900 font-bold text-base flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                    Mot de passe visiteur
                  </Label>
                  <Input
                    id="password"
                    type="text"
                    placeholder="Entrez un mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isCreating}
                    className="bg-white border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none rounded-2xl py-6 text-base"
                  />
                  <p className="text-sm text-slate-500 font-medium">
                    Ce mot de passe sera demandé aux visiteurs pour accéder à la galerie
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                className="flex-1 border-2 border-slate-200 hover:border-slate-300 py-6 rounded-2xl font-black text-base"
              >
                Retour
              </Button>
              <Button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 px-10 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 text-base"
              >
                Continuer
                <CheckCircle2 className="w-5 h-5 ml-2" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Upload */}
        {currentStep === 3 && (
          <div className="space-y-8 animate-slide-up">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 mb-2">
                Ajoutez vos photos
              </h2>
              <p className="text-slate-500 font-medium">
                Glissez-déposez ou cliquez pour ajouter vos images HD
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <label
              className={`border-dashed border-2 rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-slate-300 hover:border-indigo-600 hover:bg-slate-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-100 flex items-center justify-center mb-6">
                <UploadCloud
                  className={`w-12 h-12 transition-colors ${
                    isDragging ? "text-indigo-600" : "text-indigo-500"
                  }`}
                  strokeWidth={2.5}
                />
              </div>
              <span className="text-lg font-bold text-slate-900 mb-2">
                {isDragging ? "Déposez vos images ici" : "Cliquez ou glissez vos images"}
              </span>
              <span className="text-sm text-slate-500 font-medium">
                JPG, PNG, WebP • Max {maxImageSizeMb} Mo par image • {images.length}/{maxImagesPerGallery} images
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isCreating}
              />
            </label>

            {/* Storage Indicator */}
            {pendingUploadSize > 0 && (
              <div className={`p-4 rounded-2xl ${isStorageExceeded ? "bg-rose-50 border-2 border-rose-200" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900">
                    Stockage utilisé
                  </span>
                  <span className={`text-sm font-black ${isStorageExceeded ? "text-rose-600" : "text-slate-900"}`}>
                    {projectedStorageUsed.toFixed(1)} / {storageLimit} Mo
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStorageExceeded ? "bg-rose-600" : "bg-indigo-600"
                    }`}
                    style={{ width: `${Math.min((projectedStorageUsed / storageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Image Grid Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-2xl overflow-hidden group bg-slate-100"
                  >
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Size Badge */}
                    <div className="absolute top-2 left-2 px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-xl">
                      <span className="text-xs font-black text-white">
                        {img.sizeMb.toFixed(1)} Mo
                      </span>
                    </div>

                    {/* Status Overlays */}
                    {img.status === "uploading" && (
                      <div className="absolute inset-0 bg-indigo-600/90 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-2" strokeWidth={2.5} />
                          <span className="text-xs font-bold text-white">Upload...</span>
                        </div>
                      </div>
                    )}
                    
                    {img.status === "done" && (
                      <div className="absolute inset-0 bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={2.5} />
                        </div>
                      </div>
                    )}
                    
                    {img.status === "error" && (
                      <div className="absolute inset-0 bg-rose-600/90 backdrop-blur-sm flex items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-white" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Delete Button */}
                    {img.status === "pending" && (
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                      >
                        <X className="w-4 h-4 text-white" strokeWidth={2.5} />
                      </button>
                    )}

                    {/* Progress Bar for uploading */}
                    {img.status === "uploading" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                          className="h-full bg-white transition-all"
                          style={{ width: `${img.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="text-sm font-bold text-rose-900">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setCurrentStep(2)}
                variant="outline"
                disabled={isCreating}
                className="flex-1 border-2 border-slate-200 hover:border-slate-300 py-6 rounded-2xl font-black text-base"
              >
                Retour
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  isCreating ||
                  images.length === 0 ||
                  isStorageExceeded ||
                  isGalleryLimitReached
                }
                className="flex-1 btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 px-10 rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 active:scale-95 text-base relative overflow-hidden group"
              >
                {/* Shine Effect */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {isCreating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" strokeWidth={2.5} />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" strokeWidth={2.5} />
                    Créer la galerie
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Gallery Limit Reached Banner */}
        {isGalleryLimitReached && (
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-100">
                <AlertTriangle className="w-6 h-6 text-amber-600" strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-slate-900 mb-1">
                  Limite de galeries atteinte
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  Vous avez atteint le nombre maximum de galeries pour votre plan. 
                  Passez à un plan supérieur pour créer plus de galeries.
                </p>
                <button
                  onClick={() => openUpgradeModal("gallery")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                >
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  Voir les plans
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModal.isOpen}
        onClose={closeUpgradeModal}
        limitType={upgradeModal.limitType}
        currentValue={upgradeModal.currentValue}
        limitValue={upgradeModal.limitValue}
        currentPlan={subscriptionPlan}
      />
    </div>
  );
}
