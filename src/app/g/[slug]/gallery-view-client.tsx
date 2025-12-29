"use client";

/**
 * Gallery View Client Component
 * Handles password verification, image display, lightbox, and downloads
 * 
 * Requirements: 8.3 - Public gallery view with password protection
 */
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoIcon } from "@/components/shared/logo";
import {
  Lock,
  Eye,
  Calendar,
  Download,
  ChevronLeft,
  ChevronRight,
  X,
  ImageOff,
  Loader2,
} from "lucide-react";
import { formatDateFr, formatDistanceFr } from "@/lib/date";

interface GalleryInfo {
  id: string;
  title: string;
  expires_at: string;
  views_count: number;
  is_active: boolean;
}

interface GalleryImage {
  id: string;
  cloudinary_url: string;
  order_index: number;
}

interface GalleryViewClientProps {
  slug: string;
  initialGallery: GalleryInfo;
  isExpired: boolean;
  isInactive: boolean;
}

export function GalleryViewClient({
  slug,
  initialGallery,
  isExpired,
  isInactive,
}: GalleryViewClientProps) {
  const [gallery, setGallery] = useState<GalleryInfo>(initialGallery);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowLeft" && lightboxIndex > 0)
        setLightboxIndex(lightboxIndex - 1);
      if (e.key === "ArrowRight" && lightboxIndex < images.length - 1)
        setLightboxIndex(lightboxIndex + 1);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, images.length]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || isSubmitting || !password) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            `Trop de tentatives. Veuillez réessayer dans ${result.details?.retryAfterSeconds || 900} secondes.`
          );
        } else {
          setError(result.error || "Mot de passe incorrect");
          if (result.details?.remainingAttempts !== undefined) {
            setRemainingAttempts(result.details.remainingAttempts);
          }
        }
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsAuthenticated(true);
      setGallery((prev) => ({
        ...prev,
        views_count: result.gallery?.views_count || prev.views_count,
      }));
      setImages(result.images || []);
    } catch (err) {
      console.error("Error verifying password:", err);
      setError("Une erreur est survenue. Veuillez réessayer.");
    }
    setIsSubmitting(false);
  };


  const downloadImage = useCallback(
    async (url: string, index: number, showError = true) => {
      try {
        setDownloadingIndex(index);
        const response = await fetch(url);
        const blob = await response.blob();
        const fileName = `${gallery?.title || "photo"}-${index + 1}.jpg`;

        // Try Web Share API for mobile (saves to gallery)
        if (
          navigator.canShare &&
          navigator.canShare({
            files: [new File([blob], fileName, { type: blob.type })],
          })
        ) {
          const file = new File([blob], fileName, { type: blob.type });
          try {
            await navigator.share({
              files: [file],
              title: fileName,
            });
            return;
          } catch (shareErr) {
            // User cancelled or share failed, fall back to download
            if ((shareErr as Error).name === "AbortError") {
              return; // User cancelled, don't show error
            }
          }
        }

        // Fallback: standard download
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (err) {
        if (showError) {
          console.error("Download error:", err);
        }
      } finally {
        setDownloadingIndex(null);
      }
    },
    [gallery?.title]
  );

  const downloadAll = async () => {
    if (downloadingAll) return;

    setDownloadingAll(true);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      if (image) {
        await downloadImage(image.cloudinary_url, i, false);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    setDownloadingAll(false);
  };

  // Expired state
  if (isExpired || isInactive) {
    const expiredMessage = isExpired
      ? `Cette galerie a expiré le ${formatDateFr(gallery.expires_at)}`
      : "Cette galerie n'est plus disponible";

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 rounded-full bg-destructive/10 mx-auto flex items-center justify-center mb-6">
              <Calendar className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-3">
              Galerie expirée
            </h1>
            <p className="text-muted-foreground">{expiredMessage}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border border-border mb-6">
            <p className="text-sm text-muted-foreground">
              Contactez le photographe pour obtenir un nouveau lien d&apos;accès
              à vos photos.
            </p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link href="/">
              <LogoIcon size={16} />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Password form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <LogoIcon size={20} />
              <span className="font-display text-xl font-bold gradient-text">
                PhotoServe
              </span>
            </Link>
          </div>

          {/* Card */}
          <div className="glass-card rounded-2xl p-8 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
                <Lock className="h-7 w-7 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold mb-2">
                {gallery.title}
              </h1>
              <p className="text-muted-foreground text-sm">
                Entrez le mot de passe pour accéder aux photos
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="sr-only">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-center h-12 text-lg"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive text-center">
                  {error}
                  {remainingAttempts !== null && remainingAttempts > 0 && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      {remainingAttempts} tentative
                      {remainingAttempts > 1 ? "s" : ""} restante
                      {remainingAttempts > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 btn-primary text-base font-medium"
                disabled={isSubmitting || !password}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Accéder aux photos"
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Expire{" "}
                  {formatDistanceFr(gallery.expires_at)}
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Lien privé • Partagé par le photographe
          </p>
        </div>
      </div>
    );
  }


  // Main gallery view (authenticated)
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
            >
              <LogoIcon size={16} />
              <span className="font-display text-lg font-bold gradient-text hidden sm:inline">
                PhotoServe
              </span>
            </Link>
            <span className="text-border">/</span>
            <h1 className="font-display font-semibold truncate max-w-[200px] sm:max-w-none">
              {gallery.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              {gallery.views_count}
            </span>
            <Button
              onClick={downloadAll}
              size="sm"
              disabled={downloadingAll || images.length === 0}
              className="gap-2"
            >
              {downloadingAll ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Tout télécharger</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Gallery info */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {images.length} photo{images.length > 1 ? "s" : ""} • Expire le{" "}
            {formatDateFr(gallery.expires_at)}
          </p>
        </div>

        {/* Masonry Grid */}
        {images.length > 0 ? (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 sm:gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                className="break-inside-avoid mb-3 sm:mb-4 group relative rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={image.cloudinary_url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground/90">
                      Photo {index + 1}
                    </span>
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(image.cloudinary_url, index);
                      }}
                      disabled={downloadingIndex === index}
                    >
                      {downloadingIndex === index ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <ImageOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Aucune photo dans cette galerie
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Photos partagées via{" "}
            <span className="font-medium text-foreground">PhotoServe</span>
          </p>
        </div>
      </footer>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-background/98 backdrop-blur-xl flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-3 hover:bg-muted rounded-full transition-colors z-10"
            aria-label="Fermer"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(Math.max(0, lightboxIndex - 1));
            }}
            disabled={lightboxIndex === 0}
            className="absolute left-2 sm:left-6 p-3 hover:bg-muted rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Photo précédente"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1));
            }}
            disabled={lightboxIndex === images.length - 1}
            className="absolute right-2 sm:right-6 p-3 hover:bg-muted rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
            aria-label="Photo suivante"
          >
            <ChevronRight className="h-8 w-8" />
          </button>

          {/* Image container */}
          <div
            className="max-w-6xl max-h-[85vh] w-full h-full flex items-center justify-center p-4 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]!.cloudinary_url}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Bottom bar */}
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-full bg-card/90 backdrop-blur border border-border/50 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-sm font-medium">
              {lightboxIndex + 1}{" "}
              <span className="text-muted-foreground">/ {images.length}</span>
            </span>
            <div className="w-px h-5 bg-border" />
            <Button
              size="sm"
              variant="ghost"
              className="gap-2"
              onClick={() =>
                downloadImage(images[lightboxIndex]!.cloudinary_url, lightboxIndex)
              }
              disabled={downloadingIndex === lightboxIndex}
            >
              {downloadingIndex === lightboxIndex ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Télécharger
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
