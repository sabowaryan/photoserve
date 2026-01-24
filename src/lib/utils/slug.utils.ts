/**
 * Slug Utilities
 * 
 * Provides utilities for slug normalization, validation, and generation.
 * Implements requirements 1.4, 14.1, 14.6, 14.7, 14.8
 */

import { RESERVED_SLUGS } from '@/types/public-profile';

// Re-export for convenience
export { RESERVED_SLUGS };

/**
 * Regex pattern for valid slug format
 * Only allows lowercase letters, numbers, and hyphens
 */
const SLUG_REGEX = /^[a-z0-9-]+$/;

/**
 * Maximum length for a slug
 */
const MAX_SLUG_LENGTH = 100;

/**
 * Utility class for slug operations
 */
export class SlugUtils {
  /**
   * Normalizes a string into a valid slug format
   * 
   * Normalization steps:
   * 1. Convert to lowercase
   * 2. Remove accents/diacritics
   * 3. Replace spaces with hyphens
   * 4. Remove invalid characters (keep only a-z, 0-9, -)
   * 5. Remove consecutive hyphens
   * 6. Trim hyphens from start and end
   * 7. Truncate to max length
   * 
   * @param input - The string to normalize
   * @returns The normalized slug
   * 
   * @example
   * SlugUtils.normalize('Jean-François Dupont') // 'jean-francois-dupont'
   * SlugUtils.normalize('Café & Restaurant') // 'cafe-restaurant'
   * SlugUtils.normalize('  Hello   World  ') // 'hello-world'
   */
  static normalize(input: string): string {
    return (
      input
        // Convert to lowercase
        .toLowerCase()
        // Remove accents/diacritics using NFD normalization
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace spaces with hyphens
        .replace(/\s+/g, '-')
        // Remove invalid characters (keep only a-z, 0-9, -)
        .replace(/[^a-z0-9-]/g, '')
        // Remove consecutive hyphens
        .replace(/-+/g, '-')
        // Trim hyphens from start and end
        .replace(/^-+|-+$/g, '')
        // Truncate to max length
        .slice(0, MAX_SLUG_LENGTH)
    );
  }

  /**
   * Validates if a slug meets all requirements
   * 
   * Validation checks:
   * 1. Not empty
   * 2. Length <= 100 characters
   * 3. Matches regex pattern (lowercase letters, numbers, hyphens only)
   * 4. Not in reserved slugs list
   * 
   * @param slug - The slug to validate
   * @returns True if valid, false otherwise
   * 
   * @example
   * SlugUtils.isValid('john-doe') // true
   * SlugUtils.isValid('admin') // false (reserved)
   * SlugUtils.isValid('John-Doe') // false (uppercase)
   * SlugUtils.isValid('') // false (empty)
   */
  static isValid(slug: string): boolean {
    // Check if empty
    if (!slug || slug.length === 0) {
      return false;
    }

    // Check length
    if (slug.length > MAX_SLUG_LENGTH) {
      return false;
    }

    // Check format (lowercase letters, numbers, hyphens only)
    if (!SLUG_REGEX.test(slug)) {
      return false;
    }

    // Check if reserved
    if (RESERVED_SLUGS.includes(slug as any)) {
      return false;
    }

    return true;
  }

  /**
   * Generates unique slug suggestions based on a base slug
   * 
   * Generates 3 suggestions with numeric suffixes plus one with the current year
   * 
   * @param baseSlug - The base slug to generate suggestions from
   * @returns Array of 4 suggested slugs
   * 
   * @example
   * SlugUtils.generateUnique('john-doe')
   * // ['john-doe-1', 'john-doe-2', 'john-doe-3', 'john-doe-2024']
   */
  static generateUnique(baseSlug: string): string[] {
    const suggestions: string[] = [];

    // Normalize the base slug first
    const normalizedBase = this.normalize(baseSlug);

    // Add numeric suffixes (1, 2, 3)
    for (let i = 1; i <= 3; i++) {
      suggestions.push(`${normalizedBase}-${i}`);
    }

    // Add year suffix
    const year = new Date().getFullYear();
    suggestions.push(`${normalizedBase}-${year}`);

    return suggestions;
  }

  /**
   * Checks if a slug is reserved
   * 
   * @param slug - The slug to check
   * @returns True if reserved, false otherwise
   */
  static isReserved(slug: string): boolean {
    return RESERVED_SLUGS.includes(slug as any);
  }

  /**
   * Gets the maximum allowed slug length
   * 
   * @returns The maximum slug length
   */
  static getMaxLength(): number {
    return MAX_SLUG_LENGTH;
  }

  /**
   * Gets the list of reserved slugs
   * 
   * @returns Array of reserved slugs
   */
  static getReservedSlugs(): readonly string[] {
    return RESERVED_SLUGS;
  }
}
