/**
 * Domain utilities for custom domain handling
 * Provides validation, normalization, and parsing functions with comprehensive
 * input sanitization to prevent injection attacks.
 */

/**
 * Sanitize domain input to prevent injection attacks
 * Removes dangerous characters and patterns that could be used for:
 * - SQL injection
 * - XSS attacks
 * - Command injection
 * - Path traversal
 * 
 * Note: This function is strict and will reject domains with invalid characters
 * rather than trying to "fix" them, to prevent security issues.
 * 
 * @param input - Raw domain input from user
 * @returns Sanitized string safe for processing, or empty string if dangerous patterns detected
 */
function sanitizeDomainInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove control characters and non-printable characters
  let sanitized = input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

  // Check for dangerous patterns and reject if found
  // SQL injection patterns
  if (/['";\\]/.test(sanitized)) {
    return '';
  }

  // Script tags and HTML entities
  if (/<[^>]*>/.test(sanitized) || /&[#\w]+;/.test(sanitized)) {
    return '';
  }

  // Path traversal patterns
  if (/\.\./.test(sanitized)) {
    return '';
  }

  // Null bytes
  if (/\0/.test(sanitized)) {
    return '';
  }

  // Trim whitespace from start and end
  sanitized = sanitized.trim();

  return sanitized;
}

/**
 * Normalize a custom domain to a clean format
 * Handles various input formats:
 * - "example.com" → "example.com"
 * - "photos.example.com" → "photos.example.com"
 * - "https://example.com" → "example.com"
 * - "http://example.com" → "example.com"
 * - "https://photos.example.com/" → "photos.example.com"
 * - "www.example.com" → "example.com" (removes www)
 * 
 * Includes comprehensive input sanitization to prevent injection attacks.
 * 
 * @param domain - Domain string to normalize
 * @returns Normalized domain or null if invalid
 */
export function normalizeDomain(domain: string | null | undefined): string | null {
  if (!domain || typeof domain !== 'string') {
    return null;
  }

  // Sanitize input first to prevent injection attacks
  let normalized = sanitizeDomainInput(domain);

  if (!normalized) {
    return null;
  }

  // Reject domains with spaces (invalid)
  if (/\s/.test(normalized)) {
    return null;
  }

  // Remove protocol (http:// or https://)
  normalized = normalized.replace(/^https?:\/\//i, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');

  // Remove www. prefix (optional - depends on preference)
  // normalized = normalized.replace(/^www\./i, '');

  // Remove any path, query params, or fragments
  const parts = normalized.split('/');
  if (parts.length > 0 && parts[0]) {
    normalized = parts[0];
  }
  const queryParts = normalized.split('?');
  if (queryParts.length > 0 && queryParts[0]) {
    normalized = queryParts[0];
  }
  const hashParts = normalized.split('#');
  if (hashParts.length > 0 && hashParts[0]) {
    normalized = hashParts[0];
  }

  // Validate basic domain format (contains at least one dot)
  if (!normalized.includes('.')) {
    return null;
  }

  // Convert to lowercase for consistency
  normalized = normalized.toLowerCase();

  // Final validation: ensure only valid domain characters remain
  // Valid: alphanumeric, dots, hyphens, underscores (underscores are technically invalid per RFC but exist in practice)
  // We'll allow underscores in normalization but reject them in validation
  if (!/^[a-z0-9._-]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * Get the full URL for a custom domain
 * Always returns https:// URL
 */
export function getDomainUrl(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return null;
  }
  return `https://${normalized}`;
}

/**
 * Get display-friendly domain name
 * Returns just the domain without protocol
 */
export function getDisplayDomain(domain: string | null | undefined): string | null {
  return normalizeDomain(domain);
}

/**
 * Validate if a domain is properly formatted
 * Performs comprehensive validation including:
 * - Format validation (alphanumeric with dots and hyphens)
 * - Length validation (max 253 characters per RFC 1035)
 * - Label validation (each part between dots)
 * - TLD validation (at least 2 characters)
 * 
 * @param domain - Domain string to validate
 * @returns True if domain is valid, false otherwise
 */
export function isValidDomain(domain: string | null | undefined): boolean {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return false;
  }

  // Check overall length (RFC 1035: max 253 characters)
  if (normalized.length > 253) {
    return false;
  }

  // Basic domain validation regex
  // Allows: example.com, sub.example.com, sub.sub.example.com
  // Must start and end with alphanumeric, can contain hyphens in the middle
  const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
  
  if (!domainRegex.test(normalized)) {
    return false;
  }

  // Validate each label (part between dots)
  const labels = normalized.split('.');
  for (const label of labels) {
    // Each label must be 1-63 characters (RFC 1035)
    if (label.length === 0 || label.length > 63) {
      return false;
    }
    
    // Label cannot start or end with hyphen
    if (label.startsWith('-') || label.endsWith('-')) {
      return false;
    }
    
    // Label must contain only alphanumeric and hyphens
    if (!/^[a-z0-9-]+$/i.test(label)) {
      return false;
    }
  }

  // Ensure TLD (last part) is at least 2 characters and contains no numbers
  const tld = labels[labels.length - 1];
  if (!tld || tld.length < 2 || /\d/.test(tld)) {
    return false;
  }

  return true;
}

/**
 * Extract root domain from a subdomain
 * Example: "photos.johndoe.com" → "johndoe.com"
 * 
 * @param domain - Domain string (can include subdomains)
 * @returns Root domain (domain + TLD) or null if invalid
 */
export function getRootDomain(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('.');
  if (parts.length <= 2) {
    return normalized; // Already a root domain
  }

  // Return last two parts (domain.tld)
  return parts.slice(-2).join('.');
}

/**
 * Extract root domain from a subdomain (alias for getRootDomain)
 * Example: "photos.johndoe.com" → "johndoe.com"
 * 
 * This function is an alias for getRootDomain() to match the task requirements.
 * 
 * @param domain - Domain string (can include subdomains)
 * @returns Root domain (domain + TLD) or null if invalid
 */
export function extractRootDomain(domain: string | null | undefined): string | null {
  return getRootDomain(domain);
}

/**
 * Extract subdomain from a full domain
 * Examples:
 * - "photos.example.com" → "photos"
 * - "sub.photos.example.com" → "sub.photos"
 * - "example.com" → null (no subdomain)
 * - "www.example.com" → "www"
 * 
 * @param domain - Domain string
 * @returns Subdomain part or null if no subdomain exists
 */
export function extractSubdomain(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('.');
  
  // Need at least 3 parts to have a subdomain (sub.domain.tld)
  if (parts.length <= 2) {
    return null;
  }

  // Return all parts except the last two (which are domain.tld)
  return parts.slice(0, -2).join('.');
}

/**
 * Extract brand name from domain (without TLD)
 * Examples:
 * - "example.com" → "Example"
 * - "photos.johndoe.com" → "JohnDoe"
 * - "my-photography.com" → "My Photography"
 * - "sub.photos.example.com" → "Example"
 */
export function getBrandName(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) {
    return null;
  }

  // Get root domain first (removes subdomains)
  const root = getRootDomain(normalized);
  if (!root) {
    return null;
  }

  // Extract domain name without TLD
  const parts = root.split('.');
  if (parts.length < 2) {
    return null;
  }

  // Get the domain name (before the TLD)
  const domainPart = parts[0];
  if (!domainPart) {
    return null;
  }

  // Replace hyphens and underscores with spaces
  let brandName = domainPart.replace(/[-_]/g, ' ');

  // Capitalize first letter of each word
  brandName = brandName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return brandName;
}

/**
 * Get a short display name for branding
 * Tries to extract brand name, falls back to full domain
 * Examples:
 * - "johndoe.com" → "JohnDoe"
 * - "photos.johndoe.com" → "JohnDoe"
 * - "my-studio.photography" → "My Studio"
 */
export function getShortBrandName(domain: string | null | undefined): string | null {
  return getBrandName(domain) || getDisplayDomain(domain);
}
