/**
 * Sanitize and normalize text for database storage
 * Handles accents, special characters, and formatting
 */

/**
 * Sanitize gallery title
 * - Trims whitespace
 * - Normalizes unicode characters (NFD -> NFC)
 * - Removes control characters
 * - Collapses multiple spaces
 * - Limits length
 */
export function sanitizeTitle(title: string, maxLength = 100): string {
  if (!title) return '';

  return title
    // Trim whitespace
    .trim()
    // Normalize unicode (compose accented characters)
    .normalize('NFC')
    // Remove control characters (keep printable chars, accents, emojis)
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Limit length
    .slice(0, maxLength);
}

/**
 * Sanitize slug (URL-safe string)
 * - Converts to lowercase
 * - Replaces accented characters with ASCII equivalents
 * - Removes special characters
 * - Replaces spaces with hyphens
 */
export function sanitizeSlug(text: string): string {
  if (!text) return '';

  return text
    .trim()
    .toLowerCase()
    // Normalize and decompose accented characters
    .normalize('NFD')
    // Remove diacritical marks (accents)
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and underscores with hyphens
    .replace(/[\s_]+/g, '-')
    // Remove all non-alphanumeric characters except hyphens
    .replace(/[^a-z0-9-]/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Sanitize password (basic cleanup)
 * - Trims whitespace
 * - Removes control characters
 */
export function sanitizePassword(password: string): string {
  if (!password) return '';

  return password
    .trim()
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '');
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';

  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}
