"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Copy,
  Trash2,
  ExternalLink,
  Loader2,
  Image as ImageIcon,
  Lock,
  Calendar,
  Save,
  Edit3,
  X,
} from "lucide-react";
import { formatDateFr } from "@/lib/date";

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
}

interface DurationOption {
  value: number;
  label: string;
}

interface UploadingImage {
  id: string;
  url: string;
  file: File;
  status: "uploading" | "done" | "error";
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

  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  // Edit states
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [editTitle, setEditTitle] = useState(gallery.title);
  const [editPassword, setEditPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentExpirationDays, setCurrentExpirationDays] = useState(
    gallery.expiration_days || 30
  );

  const copyLink = () => {
    const url = `${window.location.origin}/g/${gallery.unique_slug}`;
    navigator.clipboard.writeText(url);
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim() }),
      });

      if (!response.ok) throw new Error("Failed to update title");

      setIsEditingTitle(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating title:", error);
      alert("Impossible de modifier le titre.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async () => {
    if (!editPassword.trim() || editPassword.trim().length < 4) {
      alert("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword.trim() }),
      });

      if (!response.ok) throw new Error("Failed to update password");

      setIsEditingPassword(false);
      setEditPassword("");
      router.refresh();
    } catch (error) {
      console.error("Error updating password:", error);
      alert("Impossible de modifier le mot de passe.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangeDuration = async (days: string) => {
    if (!canChangeDuration) return;

    const daysNum = parseInt(days);
    setCurrentExpirationDays(daysNum);

    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expirationDays: daysNum }),
      });

      if (!response.ok) throw new Error("Failed to update duration");

      router.refresh();
    } catch (error) {
      console.error("Error updating duration:", error);
      alert("Impossible de modifier la durée.");
    }
  };

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const maxImagesPerGallery = profile?.max_images_per_gallery || 30;
      const maxImageSizeMb = profile?.max_image_size_mb || 1;

      if (images.length + files.length > maxImagesPerGallery) {
        alert(
          `Vous ne pouvez pas ajouter plus de ${maxImagesPerGallery} images.`
        );
        return;
      }

      for (const file of files) {
        if (!file.type.startsWith("image/")) {
          alert(`${file.name} n'est pas une image.`);
          continue;
        }

        if (file.size > maxImageSizeMb * 1024 * 1024) {
          alert(`${file.name} dépasse la limite de ${maxImageSizeMb} Mo.`);
          continue;
        }

        const uploadId = crypto.randomUUID();
        const uploadingImage: UploadingImage = {
          id: uploadId,
          url: URL.createObjectURL(file),
          file,
          status: "uploading",
        };

        setUploadingImages((prev) => [...prev, uploadingImage]);

        try {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("galleryId", gallery.id);
          formData.append(
            "orderIndex",
            (images.length + uploadingImages.length).toString()
          );

          const response = await fetch("/api/images/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Upload failed");
          }

          const { data: newImage } = await response.json();

          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadId ? { ...img, status: "done" } : img
            )
          );

          // Add the new image to the list
          if (newImage) {
            setImages((prev) => [...prev, newImage]);
          }

          setTimeout(() => {
            setUploadingImages((prev) =>
              prev.filter((img) => img.id !== uploadId)
            );
          }, 1000);

          router.refresh();
        } catch (error) {
          console.error("Upload error:", error);
          setUploadingImages((prev) =>
            prev.map((img) =>
              img.id === uploadId ? { ...img, status: "error" } : img
            )
          );
          alert("Impossible d'uploader l'image.");
        }
      }
    },
    [gallery.id, images.length, uploadingImages.length, profile, router]
  );

  const deleteImage = async (imageId: string) => {
    setDeletingImageId(imageId);
    try {
      const response = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }

      setImages((prev) => prev.filter((img) => img.id !== imageId));
      router.refresh();
    } catch (error) {
      console.error("Error deleting image:", error);
      alert("Impossible de supprimer l'image.");
    } finally {
      setDeletingImageId(null);
    }
  };

  const deleteGallery = async () => {
    try {
      const response = await fetch(`/api/galleries/${gallery.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete gallery");

      router.push("/dashboard");
    } catch (error) {
      console.error("Error deleting gallery:", error);
      alert("Impossible de supprimer la galerie.");
    }
  };

  return (
    <>
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-8">
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4 mr-2" />
          Copier le lien
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={`/g/${gallery.unique_slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Voir
          </a>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer la galerie ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Toutes les images seront
                définitivement supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={deleteGallery}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Gallery Settings Card */}
      <Card className="glass-card mb-8">
        <CardContent className="pt-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Title Edit */}
            <div>
              <Label className="text-muted-foreground text-xs">Titre</Label>
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSaveTitle}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditTitle(gallery.title);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm font-medium">{gallery.title}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Mot de passe
              </Label>
              {isEditingPassword ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="text"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Nouveau mot de passe"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleSavePassword}
                    disabled={isSaving || !editPassword.trim()}
                  >
                    {isSaving ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Save className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setEditPassword("");
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <p className="font-mono text-sm text-muted-foreground">
                    ••••••••
                  </p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => setIsEditingPassword(true)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Expiration Date */}
            <div>
              <Label className="text-muted-foreground text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Date d&apos;expiration
              </Label>
              <p className="text-sm mt-1">
                {formatDateFr(gallery.expires_at)}
              </p>
            </div>

            {/* Duration Selector */}
            <div>
              <Label className="text-muted-foreground text-xs">
                Durée de vie
              </Label>
              {canChangeDuration ? (
                <Select
                  value={currentExpirationDays.toString()}
                  onValueChange={handleChangeDuration}
                >
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm mt-1 text-muted-foreground">
                  {currentExpirationDays} jours
                  <span className="text-xs block">
                    Passez à Premium pour modifier
                  </span>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Images */}
      <div className="mb-6">
        <label className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
          <span className="text-sm text-muted-foreground">
            Ajouter des images ({images.length}/
            {profile?.max_images_per_gallery || 30})
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            Max {profile?.max_image_size_mb || 1} Mo par image
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {/* Images Grid */}
      {images.length === 0 && uploadingImages.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-display text-lg font-semibold mb-2">
              Aucune image
            </h3>
            <p className="text-muted-foreground">
              Ajoutez des images à votre galerie pour commencer.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {/* Existing images */}
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <img
                src={image.cloudinary_url}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/80 to-transparent p-2">
                <span className="text-xs text-foreground">
                  {(image.file_size_mb || 0).toFixed(1)} Mo
                </span>
              </div>
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/40 transition-colors flex items-center justify-center">
                <Button
                  variant="destructive"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteImage(image.id)}
                  disabled={deletingImageId === image.id}
                >
                  {deletingImageId === image.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}

          {/* Uploading images */}
          {uploadingImages.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-lg overflow-hidden"
            >
              <img
                src={img.url}
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                {img.status === "uploading" && (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                )}
                {img.status === "done" && (
                  <div className="bg-primary rounded-full p-2">
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
                )}
                {img.status === "error" && (
                  <X className="h-8 w-8 text-destructive" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
