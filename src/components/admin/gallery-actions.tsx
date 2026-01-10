"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Ban,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import type { GalleryDetails } from "@/types/admin";

interface GalleryActionsProps {
  gallery: GalleryDetails;
  onUpdate?: () => void;
}

/**
 * Gallery Actions Component
 * 
 * Provides actions for managing a gallery:
 * - Deactivate gallery
 * - Delete gallery
 * 
 * Requirements: 4.4, 4.5
 */
export function GalleryActions({ gallery, onUpdate }: GalleryActionsProps) {
  const router = useRouter();
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (!deactivateReason.trim()) {
      setError("Veuillez indiquer une raison pour la désactivation");
      return;
    }

    setIsDeactivating(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/galleries/${gallery.id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deactivateReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la désactivation");
      }

      setShowDeactivateDialog(false);
      setDeactivateReason("");
      router.refresh();
      onUpdate?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      setError("Veuillez indiquer une raison pour la suppression");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/galleries/${gallery.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: deleteReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setShowDeleteDialog(false);
      setDeleteReason("");
      router.push("/admin/galleries");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
      <h3 className="text-lg font-semibold text-slate-800">Actions</h3>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Deactivate */}
      {gallery.is_active && (
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
            onClick={() => setShowDeactivateDialog(true)}
          >
            <Ban className="h-4 w-4" />
            Désactiver la galerie
          </Button>
          <p className="text-xs text-slate-500">
            La galerie ne sera plus accessible publiquement mais pourra être réactivée.
          </p>
        </div>
      )}

      {!gallery.is_active && (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-slate-600">
            <Ban className="h-5 w-5" />
            <p className="text-sm font-medium">
              Cette galerie est déjà inactive
            </p>
          </div>
        </div>
      )}

      {/* Delete */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <Button
          variant="outline"
          className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="h-4 w-4" />
          Supprimer la galerie
        </Button>
        <p className="text-xs text-slate-500">
          Cette action est irréversible. Toutes les images seront supprimées et le stockage sera libéré.
        </p>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-2 text-amber-700">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Attention</p>
            <p className="text-xs mt-1">
              Les actions de modération sont enregistrées dans le journal d'audit.
            </p>
          </div>
        </div>
      </div>

      {/* Deactivate Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Désactiver la galerie</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va désactiver la galerie "{gallery.title}" et empêcher
              l'accès public. Le propriétaire pourra toujours voir sa galerie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700">
              Raison de la désactivation
            </label>
            <Input
              className="mt-2"
              placeholder="Ex: Contenu inapproprié"
              value={deactivateReason}
              onChange={(e) => setDeactivateReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeactivating}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={isDeactivating || !deactivateReason.trim()}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isDeactivating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-rose-700">
              Supprimer définitivement la galerie
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La galerie "{gallery.title}" et toutes
              ses {gallery.image_count} images seront définitivement supprimées.
              Le stockage sera libéré pour le propriétaire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium text-slate-700">
              Raison de la suppression
            </label>
            <Input
              className="mt-2"
              placeholder="Ex: Violation des conditions d'utilisation"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting || !deleteReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
