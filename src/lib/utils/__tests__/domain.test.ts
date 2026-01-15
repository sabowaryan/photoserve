/**
 * Tests for domain utilities
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeDomain,
  getDomainUrl,
  getDisplayDomain,
  isValidDomain,
  getRootDomain,
  getBrandName,
  getShortBrandName,
  extractRootDomain,
  extractSubdomain,
} from '../domain';

describe('Input Sanitization and Security', () => {
  it('should reject SQL injection attempts', () => {
    expect(normalizeDomain("example.com'; DROP TABLE users--")).toBe(null);
    expect(normalizeDomain('example.com" OR 1=1--')).toBe(null);
    expect(normalizeDomain("example.com\\'; DELETE FROM profiles--")).toBe(null);
  });

  it('should reject XSS attempts', () => {
    expect(normalizeDomain('<script>alert("xss")</script>.com')).toBe(null);
    expect(normalizeDomain('example.com<img src=x onerror=alert(1)>')).toBe(null);
    expect(normalizeDomain('&lt;script&gt;.com')).toBe(null);
  });

  it('should reject path traversal attempts', () => {
    expect(normalizeDomain('../../../etc/passwd')).toBe(null);
    expect(normalizeDomain('example.com/../../etc/passwd')).toBe(null);
  });

  it('should handle null byte injection by removing them', () => {
    // Null bytes are removed, resulting in a concatenated domain
    // This is acceptable as it still validates the resulting domain
    const result = normalizeDomain('example.com\0.evil.com');
    // After removing null byte, it becomes 'example.com.evil.com' which is valid
    expect(result).toBe('example.com.evil.com');
  });

  it('should handle control characters by removing them', () => {
    // Control characters are removed, leaving valid domain
    expect(normalizeDomain('example\x00.com')).toBe('example.com');
    expect(normalizeDomain('example\x1F.com')).toBe('example.com');
  });

  it('should accept valid domains after sanitization', () => {
    expect(normalizeDomain('  example.com  ')).toBe('example.com');
    expect(normalizeDomain('https://example.com')).toBe('example.com');
    expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
  });
});

describe('normalizeDomain', () => {
  it('should handle clean domain', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
    expect(normalizeDomain('photos.example.com')).toBe('photos.example.com');
  });

  it('should remove https:// protocol', () => {
    expect(normalizeDomain('https://example.com')).toBe('example.com');
    expect(normalizeDomain('https://photos.example.com')).toBe('photos.example.com');
  });

  it('should remove http:// protocol', () => {
    expect(normalizeDomain('http://example.com')).toBe('example.com');
    expect(normalizeDomain('http://photos.example.com')).toBe('photos.example.com');
  });

  it('should remove trailing slash', () => {
    expect(normalizeDomain('example.com/')).toBe('example.com');
    expect(normalizeDomain('https://example.com/')).toBe('example.com');
    expect(normalizeDomain('example.com///')).toBe('example.com');
  });

  it('should remove paths', () => {
    expect(normalizeDomain('example.com/path')).toBe('example.com');
    expect(normalizeDomain('https://example.com/path/to/page')).toBe('example.com');
  });

  it('should remove query parameters', () => {
    expect(normalizeDomain('example.com?param=value')).toBe('example.com');
    expect(normalizeDomain('https://example.com?foo=bar&baz=qux')).toBe('example.com');
  });

  it('should remove fragments', () => {
    expect(normalizeDomain('example.com#section')).toBe('example.com');
    expect(normalizeDomain('https://example.com#top')).toBe('example.com');
  });

  it('should convert to lowercase', () => {
    expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
    expect(normalizeDomain('Photos.Example.COM')).toBe('photos.example.com');
  });

  it('should handle complex URLs', () => {
    expect(normalizeDomain('https://photos.example.com/gallery?id=123#top')).toBe('photos.example.com');
    expect(normalizeDomain('HTTP://PHOTOS.EXAMPLE.COM/PATH/')).toBe('photos.example.com');
  });

  it('should return null for invalid inputs', () => {
    expect(normalizeDomain(null)).toBe(null);
    expect(normalizeDomain(undefined)).toBe(null);
    expect(normalizeDomain('')).toBe(null);
    expect(normalizeDomain('   ')).toBe(null);
    expect(normalizeDomain('nodot')).toBe(null); // No TLD
  });

  it('should trim whitespace', () => {
    expect(normalizeDomain('  example.com  ')).toBe('example.com');
    expect(normalizeDomain('\texample.com\n')).toBe('example.com');
  });
});

describe('getDomainUrl', () => {
  it('should return full HTTPS URL', () => {
    expect(getDomainUrl('example.com')).toBe('https://example.com');
    expect(getDomainUrl('photos.example.com')).toBe('https://photos.example.com');
  });

  it('should normalize before creating URL', () => {
    expect(getDomainUrl('http://example.com')).toBe('https://example.com');
    expect(getDomainUrl('https://example.com/')).toBe('https://example.com');
    expect(getDomainUrl('EXAMPLE.COM')).toBe('https://example.com');
  });

  it('should return null for invalid inputs', () => {
    expect(getDomainUrl(null)).toBe(null);
    expect(getDomainUrl(undefined)).toBe(null);
    expect(getDomainUrl('')).toBe(null);
  });
});

describe('getDisplayDomain', () => {
  it('should return clean domain for display', () => {
    expect(getDisplayDomain('example.com')).toBe('example.com');
    expect(getDisplayDomain('https://example.com')).toBe('example.com');
    expect(getDisplayDomain('photos.example.com')).toBe('photos.example.com');
  });

  it('should be same as normalizeDomain', () => {
    const testCases = [
      'example.com',
      'https://example.com',
      'photos.example.com/',
      'HTTP://PHOTOS.EXAMPLE.COM',
    ];

    testCases.forEach((domain) => {
      expect(getDisplayDomain(domain)).toBe(normalizeDomain(domain));
    });
  });
});

describe('isValidDomain', () => {
  it('should validate correct domains', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('photos.example.com')).toBe(true);
    expect(isValidDomain('sub.photos.example.com')).toBe(true);
    expect(isValidDomain('example.co.uk')).toBe(true);
    expect(isValidDomain('my-site.com')).toBe(true);
  });

  it('should reject invalid domains', () => {
    expect(isValidDomain('example')).toBe(false); // No TLD
    expect(isValidDomain('.com')).toBe(false); // No domain
    expect(isValidDomain('example.')).toBe(false); // Trailing dot
    expect(isValidDomain('example..com')).toBe(false); // Double dot
    expect(isValidDomain('example .com')).toBe(false); // Space
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain(null)).toBe(false);
    expect(isValidDomain(undefined)).toBe(false);
  });

  it('should normalize before validating', () => {
    expect(isValidDomain('https://example.com')).toBe(true);
    expect(isValidDomain('EXAMPLE.COM')).toBe(true);
    expect(isValidDomain('example.com/')).toBe(true);
  });
});

describe('getRootDomain', () => {
  it('should extract root domain from subdomain', () => {
    expect(getRootDomain('photos.example.com')).toBe('example.com');
    expect(getRootDomain('sub.photos.example.com')).toBe('example.com');
    expect(getRootDomain('a.b.c.example.com')).toBe('example.com');
  });

  it('should return same domain if already root', () => {
    expect(getRootDomain('example.com')).toBe('example.com');
    expect(getRootDomain('example.co.uk')).toBe('co.uk'); // Note: doesn't handle ccTLDs perfectly
  });

  it('should normalize before extracting', () => {
    expect(getRootDomain('https://photos.example.com')).toBe('example.com');
    expect(getRootDomain('PHOTOS.EXAMPLE.COM')).toBe('example.com');
  });

  it('should return null for invalid inputs', () => {
    expect(getRootDomain(null)).toBe(null);
    expect(getRootDomain(undefined)).toBe(null);
    expect(getRootDomain('')).toBe(null);
  });
});

describe('getBrandName', () => {
  it('should extract brand name from simple domain', () => {
    expect(getBrandName('example.com')).toBe('Example');
    expect(getBrandName('johndoe.com')).toBe('Johndoe');
    expect(getBrandName('piksend.com')).toBe('Piksend');
  });

  it('should extract brand name from subdomain', () => {
    expect(getBrandName('photos.johndoe.com')).toBe('Johndoe');
    expect(getBrandName('gallery.piksend.com')).toBe('Piksend');
    expect(getBrandName('sub.photos.example.com')).toBe('Example');
  });

  it('should handle hyphens and underscores', () => {
    expect(getBrandName('my-photography.com')).toBe('My Photography');
    expect(getBrandName('john-doe-studio.com')).toBe('John Doe Studio');
    expect(getBrandName('my_brand.com')).toBe('My Brand');
  });

  it('should capitalize properly', () => {
    expect(getBrandName('EXAMPLE.COM')).toBe('Example');
    expect(getBrandName('example.com')).toBe('Example');
    expect(getBrandName('eXaMpLe.com')).toBe('Example');
  });

  it('should normalize before extracting', () => {
    expect(getBrandName('https://johndoe.com')).toBe('Johndoe');
    expect(getBrandName('HTTPS://PHOTOS.JOHNDOE.COM/')).toBe('Johndoe');
  });

  it('should return null for invalid inputs', () => {
    expect(getBrandName(null)).toBe(null);
    expect(getBrandName(undefined)).toBe(null);
    expect(getBrandName('')).toBe(null);
  });
});

describe('getShortBrandName', () => {
  it('should return brand name when possible', () => {
    expect(getShortBrandName('johndoe.com')).toBe('Johndoe');
    expect(getShortBrandName('my-studio.com')).toBe('My Studio');
  });

  it('should fallback to full domain if brand extraction fails', () => {
    // This would only happen in edge cases
    const result = getShortBrandName('example.com');
    expect(result).toBeTruthy();
  });

  it('should handle subdomains', () => {
    expect(getShortBrandName('photos.johndoe.com')).toBe('Johndoe');
  });

  it('should return null for invalid inputs', () => {
    expect(getShortBrandName(null)).toBe(null);
    expect(getShortBrandName(undefined)).toBe(null);
    expect(getShortBrandName('')).toBe(null);
  });
});

describe('extractRootDomain', () => {
  it('should be an alias for getRootDomain', () => {
    expect(extractRootDomain('photos.example.com')).toBe('example.com');
    expect(extractRootDomain('sub.photos.example.com')).toBe('example.com');
    expect(extractRootDomain('example.com')).toBe('example.com');
  });

  it('should handle same cases as getRootDomain', () => {
    expect(extractRootDomain('https://photos.example.com')).toBe('example.com');
    expect(extractRootDomain(null)).toBe(null);
    expect(extractRootDomain(undefined)).toBe(null);
  });
});

describe('extractSubdomain', () => {
  it('should extract subdomain from full domain', () => {
    expect(extractSubdomain('photos.example.com')).toBe('photos');
    expect(extractSubdomain('www.example.com')).toBe('www');
    expect(extractSubdomain('sub.photos.example.com')).toBe('sub.photos');
    expect(extractSubdomain('a.b.c.example.com')).toBe('a.b.c');
  });

  it('should return null for domains without subdomain', () => {
    expect(extractSubdomain('example.com')).toBe(null);
    // Note: example.co.uk is treated as having a subdomain due to ccTLD complexity
    // Proper handling would require a public suffix list (e.g., publicsuffix.org)
    // For now, this is acceptable behavior for the MVP
    expect(extractSubdomain('example.co.uk')).toBe('example');
  });

  it('should normalize before extracting', () => {
    expect(extractSubdomain('https://photos.example.com')).toBe('photos');
    expect(extractSubdomain('PHOTOS.EXAMPLE.COM')).toBe('photos');
    expect(extractSubdomain('photos.example.com/')).toBe('photos');
  });

  it('should return null for invalid inputs', () => {
    expect(extractSubdomain(null)).toBe(null);
    expect(extractSubdomain(undefined)).toBe(null);
    expect(extractSubdomain('')).toBe(null);
    expect(extractSubdomain('invalid')).toBe(null);
  });
});
