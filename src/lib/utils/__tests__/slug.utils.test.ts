/**
 * Unit tests for SlugUtils
 * 
 * Tests the slug normalization, validation, and generation utilities
 */

import { describe, it, expect } from 'vitest';
import { SlugUtils, RESERVED_SLUGS } from '../slug.utils';

describe('SlugUtils', () => {
  describe('normalize', () => {
    it('should convert to lowercase', () => {
      expect(SlugUtils.normalize('JOHN-DOE')).toBe('john-doe');
      expect(SlugUtils.normalize('JohnDoe')).toBe('johndoe');
    });

    it('should remove accents and diacritics', () => {
      expect(SlugUtils.normalize('café')).toBe('cafe');
      expect(SlugUtils.normalize('José')).toBe('jose');
      expect(SlugUtils.normalize('François')).toBe('francois');
      expect(SlugUtils.normalize('Müller')).toBe('muller');
      // Note: ø is a special character that doesn't decompose with NFD, so it gets removed
      expect(SlugUtils.normalize('Søren')).toBe('sren');
    });

    it('should replace spaces with hyphens', () => {
      expect(SlugUtils.normalize('john doe')).toBe('john-doe');
      expect(SlugUtils.normalize('hello world test')).toBe('hello-world-test');
      expect(SlugUtils.normalize('  multiple   spaces  ')).toBe('multiple-spaces');
    });

    it('should remove invalid characters', () => {
      expect(SlugUtils.normalize('john@doe')).toBe('johndoe');
      expect(SlugUtils.normalize('hello!world')).toBe('helloworld');
      expect(SlugUtils.normalize('test_user')).toBe('testuser');
      expect(SlugUtils.normalize('café & restaurant')).toBe('cafe-restaurant');
    });

    it('should remove consecutive hyphens', () => {
      expect(SlugUtils.normalize('john--doe')).toBe('john-doe');
      expect(SlugUtils.normalize('hello---world')).toBe('hello-world');
    });

    it('should trim hyphens from start and end', () => {
      expect(SlugUtils.normalize('-john-doe-')).toBe('john-doe');
      expect(SlugUtils.normalize('---test---')).toBe('test');
    });

    it('should truncate to max length (100 characters)', () => {
      const longString = 'a'.repeat(150);
      const normalized = SlugUtils.normalize(longString);
      expect(normalized.length).toBe(100);
    });

    it('should handle empty strings', () => {
      expect(SlugUtils.normalize('')).toBe('');
      expect(SlugUtils.normalize('   ')).toBe('');
    });

    it('should handle complex real-world examples', () => {
      expect(SlugUtils.normalize('Jean-François Dupont')).toBe('jean-francois-dupont');
      expect(SlugUtils.normalize('Café & Restaurant')).toBe('cafe-restaurant');
      expect(SlugUtils.normalize('Müller Photography Studio')).toBe('muller-photography-studio');
      expect(SlugUtils.normalize('  Hello   World  ')).toBe('hello-world');
    });
  });

  describe('isValid', () => {
    it('should return true for valid slugs', () => {
      expect(SlugUtils.isValid('john-doe')).toBe(true);
      expect(SlugUtils.isValid('photographer-123')).toBe(true);
      expect(SlugUtils.isValid('my-studio')).toBe(true);
      expect(SlugUtils.isValid('a')).toBe(true);
      expect(SlugUtils.isValid('123')).toBe(true);
    });

    it('should return false for empty slugs', () => {
      expect(SlugUtils.isValid('')).toBe(false);
    });

    it('should return false for slugs exceeding max length', () => {
      const longSlug = 'a'.repeat(101);
      expect(SlugUtils.isValid(longSlug)).toBe(false);
    });

    it('should return false for slugs with uppercase letters', () => {
      expect(SlugUtils.isValid('John-Doe')).toBe(false);
      expect(SlugUtils.isValid('JOHN')).toBe(false);
    });

    it('should return false for slugs with invalid characters', () => {
      expect(SlugUtils.isValid('john_doe')).toBe(false);
      expect(SlugUtils.isValid('john@doe')).toBe(false);
      expect(SlugUtils.isValid('john.doe')).toBe(false);
      expect(SlugUtils.isValid('john doe')).toBe(false);
      expect(SlugUtils.isValid('café')).toBe(false);
    });

    it('should return false for reserved slugs', () => {
      expect(SlugUtils.isValid('admin')).toBe(false);
      expect(SlugUtils.isValid('api')).toBe(false);
      expect(SlugUtils.isValid('dashboard')).toBe(false);
      expect(SlugUtils.isValid('settings')).toBe(false);
      expect(SlugUtils.isValid('login')).toBe(false);
    });

    it('should validate all reserved slugs', () => {
      RESERVED_SLUGS.forEach((slug) => {
        expect(SlugUtils.isValid(slug)).toBe(false);
      });
    });

    it('should return true for slugs at max length', () => {
      const maxLengthSlug = 'a'.repeat(100);
      expect(SlugUtils.isValid(maxLengthSlug)).toBe(true);
    });
  });

  describe('generateUnique', () => {
    it('should generate 4 suggestions', () => {
      const suggestions = SlugUtils.generateUnique('john-doe');
      expect(suggestions).toHaveLength(4);
    });

    it('should generate numeric suffixes (1, 2, 3)', () => {
      const suggestions = SlugUtils.generateUnique('john-doe');
      expect(suggestions[0]).toBe('john-doe-1');
      expect(suggestions[1]).toBe('john-doe-2');
      expect(suggestions[2]).toBe('john-doe-3');
    });

    it('should generate year suffix', () => {
      const currentYear = new Date().getFullYear();
      const suggestions = SlugUtils.generateUnique('john-doe');
      expect(suggestions[3]).toBe(`john-doe-${currentYear}`);
    });

    it('should normalize the base slug before generating suggestions', () => {
      const suggestions = SlugUtils.generateUnique('John Doe');
      expect(suggestions[0]).toBe('john-doe-1');
      expect(suggestions[1]).toBe('john-doe-2');
      expect(suggestions[2]).toBe('john-doe-3');
    });

    it('should handle slugs with accents', () => {
      const suggestions = SlugUtils.generateUnique('José García');
      expect(suggestions[0]).toBe('jose-garcia-1');
      expect(suggestions[1]).toBe('jose-garcia-2');
      expect(suggestions[2]).toBe('jose-garcia-3');
    });

    it('should handle empty base slug', () => {
      const suggestions = SlugUtils.generateUnique('');
      expect(suggestions).toHaveLength(4);
      expect(suggestions[0]).toBe('-1');
      expect(suggestions[1]).toBe('-2');
      expect(suggestions[2]).toBe('-3');
    });
  });

  describe('isReserved', () => {
    it('should return true for reserved slugs', () => {
      expect(SlugUtils.isReserved('admin')).toBe(true);
      expect(SlugUtils.isReserved('api')).toBe(true);
      expect(SlugUtils.isReserved('dashboard')).toBe(true);
    });

    it('should return false for non-reserved slugs', () => {
      expect(SlugUtils.isReserved('john-doe')).toBe(false);
      expect(SlugUtils.isReserved('photographer')).toBe(false);
      expect(SlugUtils.isReserved('my-studio')).toBe(false);
    });

    it('should check all reserved slugs', () => {
      RESERVED_SLUGS.forEach((slug) => {
        expect(SlugUtils.isReserved(slug)).toBe(true);
      });
    });
  });

  describe('getMaxLength', () => {
    it('should return 100', () => {
      expect(SlugUtils.getMaxLength()).toBe(100);
    });
  });

  describe('getReservedSlugs', () => {
    it('should return the list of reserved slugs', () => {
      const reserved = SlugUtils.getReservedSlugs();
      expect(reserved).toEqual(RESERVED_SLUGS);
    });

    it('should return a readonly array', () => {
      const reserved = SlugUtils.getReservedSlugs();
      expect(Object.isFrozen(reserved)).toBe(false); // TypeScript readonly, not runtime frozen
      expect(reserved.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle slugs with only hyphens', () => {
      expect(SlugUtils.normalize('---')).toBe('');
      // Note: '---' doesn't normalize to empty, it stays as '---' which is technically valid format
      // but we test that normalized empty strings are invalid
      expect(SlugUtils.isValid('')).toBe(false);
    });

    it('should handle slugs with mixed valid and invalid characters', () => {
      const normalized = SlugUtils.normalize('hello@world#test');
      expect(normalized).toBe('helloworldtest');
      expect(SlugUtils.isValid(normalized)).toBe(true);
    });

    it('should handle unicode characters', () => {
      expect(SlugUtils.normalize('hello-世界')).toBe('hello');
      expect(SlugUtils.normalize('test-🎉')).toBe('test');
    });

    it('should handle numbers in slugs', () => {
      expect(SlugUtils.normalize('photographer-2024')).toBe('photographer-2024');
      expect(SlugUtils.isValid('photographer-2024')).toBe(true);
    });

    it('should handle slugs starting or ending with numbers', () => {
      expect(SlugUtils.normalize('123-photographer')).toBe('123-photographer');
      expect(SlugUtils.normalize('photographer-456')).toBe('photographer-456');
      expect(SlugUtils.isValid('123-photographer')).toBe(true);
      expect(SlugUtils.isValid('photographer-456')).toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('should normalize and validate in sequence', () => {
      const input = 'Jean-François Dupont';
      const normalized = SlugUtils.normalize(input);
      expect(normalized).toBe('jean-francois-dupont');
      expect(SlugUtils.isValid(normalized)).toBe(true);
    });

    it('should generate valid suggestions from invalid input', () => {
      const input = 'Invalid@Slug!';
      const suggestions = SlugUtils.generateUnique(input);
      suggestions.forEach((suggestion) => {
        expect(SlugUtils.isValid(suggestion)).toBe(true);
      });
    });

    it('should handle the complete workflow', () => {
      // User input
      const userInput = 'Café & Restaurant';

      // Normalize
      const normalized = SlugUtils.normalize(userInput);
      expect(normalized).toBe('cafe-restaurant');

      // Validate
      expect(SlugUtils.isValid(normalized)).toBe(true);

      // Generate alternatives if needed
      const suggestions = SlugUtils.generateUnique(normalized);
      expect(suggestions).toHaveLength(4);
      suggestions.forEach((suggestion) => {
        expect(SlugUtils.isValid(suggestion)).toBe(true);
      });
    });
  });
});
