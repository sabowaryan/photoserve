"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Loader2 } from "lucide-react";

interface GalleryActionsProps {
  galleryId: string;
  gallerySlug: string;
}

export function GalleryActions({ galleryId, gallerySlug }: GalleryActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}/g/${gallerySlug}`;
    navigator.clipboard.writeText(url);
  };

  const deleteGallery = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette galerie ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete gallery");
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      alert("Impossible de supprimer la galerie.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={copyLink} title="Copier le lien">
        <Copy className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={deleteGallery}
        disabled={isDeleting}
        title="Supprimer"
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4 text-destructive" />
        )}
      </Button>
    </>
  );
}
