/**
 * Delete Profile Confirmation Dialog
 * 
 * Provides a confirmation dialog for deleting a public profile.
 * Implements GDPR right to be forgotten with clear warnings.
 * 
 * Requirements:
 * - 13.5: Implement confirmation before deletion
 * - 13.5: Respect GDPR right to be forgotten
 */

'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface DeleteProfileDialogProps {
  onDeleteSuccess?: () => void;
  disabled?: boolean;
}

export function DeleteProfileDialog({
  onDeleteSuccess,
  disabled = false,
}: DeleteProfileDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = async () => {
    try {
      setIsDeleting(true);

      const response = await fetch('/api/public-profile/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Échec de la suppression');
      }

      toast.success('Profil public supprimé avec succès');
      setIsOpen(false);
      
      // Call the success callback if provided
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Échec de la suppression du profil'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={disabled || isDeleting}
          className="gap-2"
        >
          <Trash2 size={16} />
          Supprimer le profil
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              Supprimer le profil public ?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription asChild className="space-y-3 text-left">
            <div>
              <p className="text-slate-700 font-medium">
                Cette action est irréversible et supprimera définitivement :
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-600 ml-2">
                <li>Votre profil public et toutes ses informations</li>
                <li>Toutes les données analytics associées (vues, clics, etc.)</li>
                <li>L'accès public à votre profil via son URL</li>
              </ul>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
                <p className="text-xs text-amber-800 font-medium">
                  <strong>Note RGPD :</strong> Conformément au droit à l'oubli, toutes vos données 
                  seront définitivement supprimées de nos serveurs.
                </p>
              </div>
              <p className="text-sm text-slate-600 mt-4">
                Êtes-vous sûr de vouloir continuer ?
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel disabled={isDeleting}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer définitivement
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
