/**
 * Custom Error Classes for PhotoServe
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: object
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_REQUIRED', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'ACCESS_DENIED', 403);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: object) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfterSeconds: number) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, { retryAfterSeconds });
    this.name = 'RateLimitError';
  }
}

export class StorageLimitError extends AppError {
  constructor(currentUsage: number, limit: number) {
    super('Storage limit exceeded', 'STORAGE_LIMIT_EXCEEDED', 400, { currentUsage, limit });
    this.name = 'StorageLimitError';
  }
}

export class GalleryLimitError extends AppError {
  constructor(currentCount: number, limit: number) {
    super('Gallery limit exceeded', 'GALLERY_LIMIT_EXCEEDED', 400, { currentCount, limit });
    this.name = 'GalleryLimitError';
  }
}

export class ImageLimitError extends AppError {
  constructor(currentCount: number, limit: number) {
    super('Image limit exceeded', 'IMAGE_LIMIT_EXCEEDED', 400, { currentCount, limit });
    this.name = 'ImageLimitError';
  }
}

export class FileSizeError extends AppError {
  constructor(fileSize: number, maxSize: number) {
    super('File size exceeds limit', 'FILE_SIZE_EXCEEDED', 400, { fileSize, maxSize });
    this.name = 'FileSizeError';
  }
}

export class InvalidFileTypeError extends AppError {
  constructor(mimeType: string, allowedTypes: string[]) {
    super('Invalid file type', 'INVALID_FILE_TYPE', 400, { mimeType, allowedTypes });
    this.name = 'InvalidFileTypeError';
  }
}

export class GalleryExpiredError extends AppError {
  constructor(galleryId: string) {
    super('Gallery has expired', 'GALLERY_EXPIRED', 410, { galleryId });
    this.name = 'GalleryExpiredError';
  }
}

export class InvalidPasswordError extends AppError {
  constructor() {
    super('Invalid password', 'INVALID_PASSWORD', 401);
    this.name = 'InvalidPasswordError';
  }
}
