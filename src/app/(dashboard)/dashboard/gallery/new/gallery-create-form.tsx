"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
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
  Type,
  ChevronDown,
  Crown,
  ImageIcon,
  ArrowRight,
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
          setError(`${file.name} n'est pas une image valide`);
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
      "Shooting portrait",
      "Événement corporate",
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

  const steps = [
    { number: 1, title: "Infos", icon: Type },
    { number: 2, title: "Sécurité", icon: Shield },
    { number: 3, title: "Photos", icon: ImageIcon },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <div key={step.number} className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => {
                  if (step.number < currentStep) setCurrentStep(step.number);
                }}
                disabled={step.number > currentStep}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm transition-all ${
                  currentStep === step.number
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                    : currentStep > step.number
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Icon size={16} />
                )}
                <span className="hidden sm:inline">{step.title}</span>
                <span className="sm:hidden">{step.number}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={`w-6 sm:w-12 h-0.5 rounded-full ${
                  currentStep > step.number ? "bg-emerald-400" : "bg-slate-200"
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Form Container */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
        {/* Step 1: Informations Générales */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
                Informations générales
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                Donnez un titre et choisissez la durée de votre galerie
              </p>
            </div>

            {/* Title Input */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Type size={16} className="text-indigo-600" />
                Titre de la galerie
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: Mariage de Marie & Jean"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                  className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={generateAITitle}
                  className="px-4 rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"
                  title="Générer un titre"
                >
                  <Sparkles size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </button>
              </div>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock size={16} className="text-indigo-600" />
                Durée de validité
              </label>
              <div className="relative">
                <select
                  value={expirationDays.toString()}
                  onChange={(e) => setExpirationDays(parseInt(e.target.value))}
                  disabled={isCreating}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none appearance-none font-bold text-slate-800 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {durationOptions.map((option) => (
                    <option key={option.value} value={option.value.toString()}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
              {subscriptionPlan === "free" && (
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                  <Crown size={12} className="text-amber-500" />
                  Passez à Premium pour des durées plus longues
                </p>
              )}
            </div>

            <button
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none flex items-center justify-center gap-2"
            >
              Continuer
              <ArrowRight size={18} />
            </button>
          </div>
        )}

        {/* Step 2: Sécurité */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
                Sécurité
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                Protégez votre galerie avec un mot de passe
              </p>
            </div>

            {/* Password Toggle Block */}
            <div className={`p-5 rounded-2xl border-2 transition-all ${
              isPasswordEnabled
                ? "border-indigo-500 bg-gradient-to-br from-indigo-50 to-violet-50"
                : "border-slate-200 bg-slate-50"
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${isPasswordEnabled ? 'bg-indigo-600' : 'bg-slate-300'} transition-colors`}>
                    <Shield size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Protection par mot de passe</h3>
                    <p className="text-xs text-slate-500">Seules les personnes avec le mot de passe pourront voir vos photos</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPasswordEnabled(!isPasswordEnabled)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    isPasswordEnabled ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
                    isPasswordEnabled ? "left-8" : "left-1"
                  }`} />
                </button>
              </div>

              {isPasswordEnabled && (
                <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Lock size={14} className="text-indigo-600" />
                    Mot de passe visiteur
                  </label>
                  <input
                    type="text"
                    placeholder="Entrez un mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isCreating}
                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl outline-none font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all"
              >
                Retour
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none flex items-center justify-center gap-2"
              >
                Continuer
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900 mb-1">
                Ajoutez vos photos
              </h2>
              <p className="text-slate-500 font-medium text-sm">
                Glissez-déposez ou cliquez pour ajouter vos images HD
              </p>
            </div>

            {/* Drag & Drop Zone */}
            <label
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                isDragging 
                  ? "bg-indigo-600 text-white scale-110" 
                  : "bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-500"
              }`}>
                <UploadCloud size={32} />
              </div>
              <span className="text-base font-bold text-slate-900 mb-1">
                {isDragging ? "Déposez vos images ici" : "Cliquez ou glissez vos images"}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                JPG, PNG, WebP • Max {maxImageSizeMb} Mo • {images.length}/{maxImagesPerGallery} images
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
              <div className={`p-4 rounded-xl ${isStorageExceeded ? "bg-rose-50 border border-rose-200" : "bg-slate-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-700">Stockage prévu</span>
                  <span className={`text-sm font-black ${isStorageExceeded ? "text-rose-600" : "text-slate-900"}`}>
                    {projectedStorageUsed.toFixed(1)} / {storageLimit} Mo
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isStorageExceeded ? "bg-rose-500" : "bg-gradient-to-r from-indigo-500 to-violet-500"
                    }`}
                    style={{ width: `${Math.min((projectedStorageUsed / storageLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Image Grid Preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="relative aspect-square rounded-xl overflow-hidden group bg-slate-100"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    
                    {/* Size Badge */}
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/70 backdrop-blur-sm">
                      <span className="text-[10px] font-bold text-white">
                        {img.sizeMb.toFixed(1)} Mo
                      </span>
                    </div>

                    {/* Status Overlays */}
                    {img.status === "uploading" && (
                      <div className="absolute inset-0 bg-indigo-600/90 flex items-center justify-center">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                    
                    {img.status === "done" && (
                      <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 size={24} className="text-white" />
                      </div>
                    )}
                    
                    {img.status === "error" && (
                      <div className="absolute inset-0 bg-rose-600/90 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-white" />
                      </div>
                    )}

                    {/* Delete Button */}
                    {img.status === "pending" && (
                      <button
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 rounded-md bg-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm font-bold text-rose-900">{error}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep(2)}
                disabled={isCreating}
                className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                Retour
              </button>
              <button
                onClick={handleCreate}
                disabled={
                  isCreating ||
                  images.length === 0 ||
                  isStorageExceeded ||
                  isGalleryLimitReached
                }
                className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 disabled:shadow-none flex items-center justify-center gap-2 relative overflow-hidden group"
              >
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                {isCreating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Créer la galerie
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Gallery Limit Reached Banner */}
        {isGalleryLimitReached && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-amber-100 text-amber-600">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 mb-1">Limite de galeries atteinte</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Passez à un plan supérieur pour créer plus de galeries.
                </p>
                <button
                  onClick={() => openUpgradeModal("gallery")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:from-indigo-700 hover:to-violet-700 transition-all shadow-lg shadow-indigo-500/25"
                >
                  <Zap size={16} />
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
