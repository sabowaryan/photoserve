/**
 * Input Sanitization Utilities for PikSend
 * Provides XSS protection by sanitizing user inputs
 * 
 * @module lib/security/sanitize
 * Requirements: 11.3 - Sanitize all user inputs to prevent XSS attacks
 */

/**
 * HTML entities that need to be escaped to prevent XSS
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Regex pattern to match HTML entities that need escaping
 */
const HTML_ENTITY_PATTERN = /[&<>"'`=/]/g;

/**
 * Escapes HTML entities in a string to prevent XSS attacks
 * 
 * @param input - The string to escape
 * @returns The escaped string safe for HTML rendering
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input.replace(HTML_ENTITY_PATTERN, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Removes potentially dangerous HTML tags and attributes
 * This is a basic sanitizer - for rich text, consider using DOMPurify
 * 
 * @param input - The string to sanitize
 * @returns The sanitized string with dangerous content removed
 */
export function stripHtmlTags(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  // Remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes a string for safe use in HTML context
 * Combines tag stripping and entity escaping
 * 
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeForHtml(input: string): string {
  return escapeHtml(stripHtmlTags(input));
}

/**
 * Sanitizes a string for safe use in JavaScript context
 * Escapes characters that could break out of string literals
 * 
 * @param input - The string to sanitize
 * @returns The sanitized string safe for JS string literals
 */
export function sanitizeForJs(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(/<\/script/gi, '<\\/script');
}

/**
 * Sanitizes a URL to prevent javascript: and data: protocol attacks
 * 
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if dangerous
 */
export function sanitizeUrl(url: string): string {
  if (typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];
  
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '';
    }
  }
  
  // Allow relative URLs, http, https, mailto, tel
  const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', '//', '/'];
  const hasAllowedProtocol = allowedProtocols.some(p => trimmed.startsWith(p));
  const isRelative = !trimmed.includes(':') || trimmed.indexOf('/') < trimmed.indexOf(':');
  
  if (hasAllowedProtocol || isRelative) {
    return url;
  }
  
  return '';
}

/**
 * Sanitizes an object by applying sanitization to all string values
 * Useful for sanitizing form data or API request bodies
 * 
 * @param obj - The object to sanitize
 * @param sanitizer - The sanitization function to apply (default: sanitizeForHtml)
 * @returns A new object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  sanitizer: (input: string) => string = sanitizeForHtml
): T {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  const result: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizer(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' ? sanitizer(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, sanitizer);
    } else {
      result[key] = value;
    }
  }
  
  return result as T;
}

/**
 * Validates and sanitizes a gallery title
 * 
 * @param title - The gallery title to sanitize
 * @returns The sanitized title
 */
export function sanitizeGalleryTitle(title: string): string {
  return sanitizeForHtml(title).trim().slice(0, 100);
}

/**
 * Validates and sanitizes a user name
 * 
 * @param name - The user name to sanitize
 * @returns The sanitized name
 */
export function sanitizeUserName(name: string): string {
  return sanitizeForHtml(name).trim().slice(0, 100);
}
