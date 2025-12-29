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
  Upload,
  X,
  Lock,
  Calendar,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
} from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [password, setPassword] = useState("");
  const [expirationDays, setExpirationDays] = useState(
    durationOptions[durationOptions.length - 1]?.value || 30
  );
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate pending upload size
  const pendingUploadSize = useMemo(() => {
    return images.reduce((acc, img) => acc + img.sizeMb, 0);
  }, [images]);

  // Current and projected storage usage
  const projectedStorageUsed = currentStorageUsed + pendingUploadSize;
  const isStorageExceeded = projectedStorageUsed > storageLimit;

  const validateAndAddFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((file) => {
        if (!file.type.startsWith("image/")) {
          setError(`${file.name} n'est pas une image.`);
          return false;
        }
        const fileSizeMb = file.size / (1024 * 1024);
        if (fileSizeMb > maxImageSizeMb) {
          setError(`${file.name} dépasse la limite de ${maxImageSizeMb} Mo.`);
          return false;
        }
        return true;
      });

      if (images.length + validFiles.length > maxImagesPerGallery) {
        setError(
          `Vous ne pouvez pas ajouter plus de ${maxImagesPerGallery} images.`
        );
        return;
      }

      // Check storage limit
      const newFilesSize = validFiles.reduce(
        (acc, f) => acc + f.size / (1024 * 1024),
        0
      );
      if (currentStorageUsed + pendingUploadSize + newFilesSize > storageLimit) {
        setError(
          `Ces fichiers dépasseraient votre limite de stockage de ${storageLimit} Mo.`
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

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Veuillez entrer un titre pour la galerie.");
      return;
    }

    if (!password.trim()) {
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
      setError(
        "Vous avez atteint votre limite de galeries. Passez à un plan supérieur pour en créer plus."
      );
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
          password: password.trim(),
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
            throw new Error(errorData.error || "Upload failed");
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
    <div className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Titre de la galerie</Label>
        <Input
          id="title"
          placeholder="Ex: Mariage de Marie & Jean"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isCreating}
        />
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Mot de passe
        </Label>
        <Input
          id="password"
          type="text"
          placeholder="Mot de passe pour accéder à la galerie"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isCreating}
        />
        <p className="text-xs text-muted-foreground">
          Ce mot de passe sera demandé aux visiteurs pour accéder à la galerie.
        </p>
      </div>

      {/* Expiration - Select based on plan */}
      <div className="space-y-2">
        <Label htmlFor="expiration" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Durée de validité
        </Label>
        <Select
          value={expirationDays.toString()}
          onValueChange={(value) => setExpirationDays(parseInt(value))}
          disabled={isCreating}
        >
          <SelectTrigger className="w-full">
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
          <p className="text-xs text-muted-foreground">
            Passez à Premium ou Pro pour des durées plus longues.
          </p>
        )}
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Images ({images.length}/{maxImagesPerGallery})
          </Label>
          <span className="text-xs text-muted-foreground">
            Max {maxImageSizeMb} Mo par image
          </span>
        </div>

        {/* Upload Zone with Drag & Drop */}
        <label
          className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload
            className={`h-10 w-10 mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
          />
          <span className="text-sm text-muted-foreground text-center">
            {isDragging ? (
              <span className="text-primary font-medium">
                Déposez vos images ici
              </span>
            ) : (
              <>
                Cliquez ou glissez vos images ici
                <br />
                <span className="text-xs">JPG, PNG, WebP acceptés</span>
              </>
            )}
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

        {/* Pending upload size indicator */}
        {pendingUploadSize > 0 && (
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">{pendingUploadSize.toFixed(1)} Mo</span>{" "}
            à uploader
            {isStorageExceeded && (
              <span className="text-destructive ml-2">
                (dépasse la limite de stockage)
              </span>
            )}
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-1">
                  <span className="text-xs text-foreground">
                    {img.sizeMb.toFixed(1)} Mo
                  </span>
                </div>
                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
                {img.status === "done" && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                    <div className="bg-primary rounded-full p-1">
                      <svg
                        className="h-4 w-4 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
                {img.status === "error" && (
                  <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                  </div>
                )}
                {img.status === "pending" && (
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-2 right-2 p-1 bg-destructive rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4 text-destructive-foreground" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Create Button */}
      <Button
        onClick={handleCreate}
        disabled={
          isCreating ||
          !title.trim() ||
          !password.trim() ||
          images.length === 0 ||
          isStorageExceeded ||
          isGalleryLimitReached
        }
        className="w-full btn-primary"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Création en cours...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Créer la galerie
          </>
        )}
      </Button>
    </div>
  );
}
