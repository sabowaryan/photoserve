/**
 * File Preservation Service
 * 
 * Preserves uploaded file state during payment checkout flow.
 * When a user initiates payment, their uploaded files are stored in sessionStorage
 * so they can be restored if the payment is cancelled.
 * 
 * Requirements: 10.5 - Preserve uploaded files in memory during payment flow
 */

/**
 * Preserved file data structure
 */
export interface PreservedFileData {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  /** Base64 encoded file data for small files, or null for large files */
  dataUrl: string | null;
}

/**
 * Preserved upload state
 */
export interface PreservedUploadState {
  gallerySlug: string;
  galleryTitle: string;
  files: PreservedFileData[];
  timestamp: number;
  expiresAt: string;
}

const STORAGE_KEY = 'piksend_preserved_upload';
const MAX_FILE_SIZE_FOR_STORAGE = 5 * 1024 * 1024; // 5MB - only store files smaller than this
const PRESERVATION_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

/**
 * File Preservation Manager
 * 
 * Handles storing and restoring file state during payment flow.
 */
export class FilePreservationManager {
  /**
   * Preserves the current upload state before redirecting to payment
   * 
   * @param gallerySlug - The slug of the created gallery
   * @param galleryTitle - The title of the gallery
   * @param files - Array of File objects to preserve
   * @param expiresAt - Gallery expiration date
   */
  async preserveUploadState(
    gallerySlug: string,
    galleryTitle: string,
    files: File[],
    expiresAt: string
  ): Promise<void> {
    try {
      const preservedFiles: PreservedFileData[] = await Promise.all(
        files.map(async (file) => {
          let dataUrl: string | null = null;
          
          // Only store file data for small files to avoid storage limits
          if (file.size <= MAX_FILE_SIZE_FOR_STORAGE) {
            dataUrl = await this.fileToDataUrl(file);
          }
          
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            dataUrl,
          };
        })
      );

      const state: PreservedUploadState = {
        gallerySlug,
        galleryTitle,
        files: preservedFiles,
        timestamp: Date.now(),
        expiresAt,
      };

      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to preserve upload state:', error);
      // Don't throw - preservation is best-effort
    }
  }

  /**
   * Retrieves the preserved upload state if it exists and is still valid
   * 
   * @returns The preserved state or null if not found/expired
   */
  getPreservedState(): PreservedUploadState | null {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const state: PreservedUploadState = JSON.parse(stored);
      
      // Check if preservation has expired
      if (Date.now() - state.timestamp > PRESERVATION_EXPIRY_MS) {
        this.clearPreservedState();
        return null;
      }

      return state;
    } catch (error) {
      console.error('Failed to retrieve preserved state:', error);
      return null;
    }
  }

  /**
   * Restores File objects from preserved state
   * Note: Only files that were small enough to store will be fully restored
   * 
   * @param state - The preserved state to restore from
   * @returns Array of restored File objects (only for files with stored data)
   */
  async restoreFiles(state: PreservedUploadState): Promise<File[]> {
    const restoredFiles: File[] = [];

    for (const fileData of state.files) {
      if (fileData.dataUrl) {
        try {
          const file = await this.dataUrlToFile(
            fileData.dataUrl,
            fileData.name,
            fileData.type,
            fileData.lastModified
          );
          restoredFiles.push(file);
        } catch (error) {
          console.error(`Failed to restore file ${fileData.name}:`, error);
        }
      }
    }

    return restoredFiles;
  }

  /**
   * Clears the preserved upload state
   */
  clearPreservedState(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear preserved state:', error);
    }
  }

  /**
   * Checks if there is a preserved state for a specific gallery
   * 
   * @param gallerySlug - The gallery slug to check
   * @returns True if there is preserved state for this gallery
   */
  hasPreservedStateForGallery(gallerySlug: string): boolean {
    const state = this.getPreservedState();
    return state !== null && state.gallerySlug === gallerySlug;
  }

  /**
   * Converts a File to a data URL
   */
  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Converts a data URL back to a File
   */
  private async dataUrlToFile(
    dataUrl: string,
    name: string,
    type: string,
    lastModified: number
  ): Promise<File> {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new File([blob], name, { type, lastModified });
  }
}

// Export singleton instance
export const filePreservationManager = new FilePreservationManager();

/**
 * Hook-friendly functions for use in React components
 */

/**
 * Preserves upload state before payment redirect
 */
export async function preserveUploadState(
  gallerySlug: string,
  galleryTitle: string,
  files: File[],
  expiresAt: string
): Promise<void> {
  return filePreservationManager.preserveUploadState(gallerySlug, galleryTitle, files, expiresAt);
}

/**
 * Gets preserved upload state
 */
export function getPreservedUploadState(): PreservedUploadState | null {
  return filePreservationManager.getPreservedState();
}

/**
 * Restores files from preserved state
 */
export async function restorePreservedFiles(state: PreservedUploadState): Promise<File[]> {
  return filePreservationManager.restoreFiles(state);
}

/**
 * Clears preserved upload state
 */
export function clearPreservedUploadState(): void {
  filePreservationManager.clearPreservedState();
}

/**
 * Checks if there's preserved state for a gallery
 */
export function hasPreservedStateForGallery(gallerySlug: string): boolean {
  return filePreservationManager.hasPreservedStateForGallery(gallerySlug);
}
