/**
 * Guest Module Exports
 * 
 * Provides guest session management functionality for visitors
 * who create galleries without an account.
 */

export {
  GuestSessionManager,
  type GuestSession,
  type IGuestSessionManager,
  isValidUUID,
  calculateExpirationDate,
  isSessionExpired,
  createSessionCookie,
  createClearSessionCookie,
  getTokenFromCookies,
  createServerSession,
  SESSION_CONFIG,
} from './session';

export {
  FilePreservationManager,
  filePreservationManager,
  preserveUploadState,
  getPreservedUploadState,
  restorePreservedFiles,
  clearPreservedUploadState,
  hasPreservedStateForGallery,
  type PreservedFileData,
  type PreservedUploadState,
} from './file-preservation';
