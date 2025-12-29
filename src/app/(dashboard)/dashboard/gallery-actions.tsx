"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface GalleryActionsProps {
  galleryId: string;
  gallerySlug: string;
  galleryTitle?: string;
}

export function GalleryActions({ galleryId, gallerySlug, galleryTitle }: GalleryActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const copyLink = () => {
    const url = `${window.location.origin}/g/${gallerySlug}`;
    navigator.clipboard.writeText(url);
    toast.success("Lien copié dans le presse-papier");
  };

  const deleteGallery = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete gallery");
      }

      setIsOpen(false);
      toast.success("Galerie supprimée");
      router.refresh();
    } catch (error) {
      console.error("Error deleting gallery:", error);
      toast.error("Impossible de supprimer la galerie");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={copyLink} title="Copier le lien">
        <Copy className="h-4 w-4" />
      </Button>
      
      <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isDeleting}
            title="Supprimer"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la galerie ?</AlertDialogTitle>
            <AlertDialogDescription>
              {galleryTitle ? (
                <>Êtes-vous sûr de vouloir supprimer la galerie &quot;{galleryTitle}&quot; ?</>
              ) : (
                <>Êtes-vous sûr de vouloir supprimer cette galerie ?</>
              )}
              <br />
              Cette action est irréversible. Toutes les images seront définitivement supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteGallery}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
