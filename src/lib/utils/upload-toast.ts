/**
 * Upload Toast Utilities
 * Provides elegant error messages for image upload operations
 */
import { toast } from "sonner";

export interface UploadErrorOptions {
  fileName?: string;
  currentValue?: number;
  limitValue?: number;
}

/**
 * Display a user-friendly error toast based on the error message
 */
export function showUploadError(errorMessage: string, options: UploadErrorOptions = {}) {
  const { fileName, currentValue, limitValue } = options;

  // Storage limit error
  if (errorMessage.includes("Storage limit")) {
    toast.error("💾 Espace de stockage insuffisant", {
      description: limitValue 
        ? `Vous avez atteint votre limite de ${limitValue} Mo. Supprimez des images ou passez à un plan supérieur.`
        : "Supprimez des images ou passez à un plan supérieur.",
    });
    return;
  }

  // Image count limit error
  if (errorMessage.includes("Image limit")) {
    toast.error("📸 Limite d'images atteinte", {
      description: limitValue
        ? `Maximum ${limitValue} images par galerie. Supprimez des images ou passez à un plan supérieur.`
        : "Supprimez des images ou passez à un plan supérieur.",
    });
    return;
  }

  // File size error
  if (errorMessage.includes("File size")) {
    const name = fileName || "Ce fichier";
    toast.error("⚠️ Fichier trop volumineux", {
      description: limitValue
        ? `${name} dépasse la limite de ${limitValue} Mo`
        : `${name} est trop volumineux`,
    });
    return;
  }

  // Invalid file type error
  if (errorMessage.includes("Invalid file type") || errorMessage.includes("file type")) {
    const name = fileName || "Ce fichier";
    toast.error("❌ Format non valide", {
      description: `${name} n'est pas un format d'image accepté. Formats: JPG, PNG, GIF, WebP`,
    });
    return;
  }

  // Generic error
  toast.error("❌ Erreur d'upload", {
    description: errorMessage || "Une erreur est survenue lors de l'upload",
  });
}

/**
 * Display a success toast for image upload
 */
export function showUploadSuccess(fileName?: string) {
  toast.success("✅ Image uploadée", {
    description: fileName ? `${fileName} a été ajoutée avec succès` : "L'image a été ajoutée avec succès",
  });
}

/**
 * Display a validation error toast
 */
export function showValidationError(message: string, description?: string) {
  toast.error(message, {
    description,
  });
}
