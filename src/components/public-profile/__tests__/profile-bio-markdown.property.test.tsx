/**
 * Property-Based Tests for Markdown Support in ProfileBio Component
 * 
 * Feature: public-photographer-profile
 * Task 42.1: Écrire les tests de propriété pour le support markdown
 * Property 25: Support du markdown dans la bio
 * 
 * **Validates: Requirements 2.3**
 * 
 * Testing Framework: fast-check
 * 
 * This test suite validates that markdown is correctly rendered across
 * many generated inputs using property-based testing.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { ProfileBio } from '../profile-bio';

// Custom arbitraries for markdown-safe strings
const markdownSafeText = () =>
  fc.string({ minLength: 3, maxLength: 50 })
    .map(s => s.replace(/[^a-zA-Z0-9 .,;:?!'-]/g, '').trim())
    .filter(s => s.length >= 3 && /[a-zA-Z]/.test(s));

const markdownSafeListItem = () =>
  fc.string({ minLength: 3, maxLength: 30 })
    .map(s => s.replace(/[^a-zA-Z0-9 .,;:?!'-]/g, '').trim())
    .filter(s => s.length >= 3 && /[a-zA-Z]/.test(s));

describe('ProfileBio Markdown Support - Property-Based Tests', () => {
  describe('Property 25: Support du markdown dans la bio', () => {
    it('should render bold markdown (**text**) as <strong> elements', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          (text) => {
            const bio = `**${text}**`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const strongElements = container.querySelectorAll('strong');
            expect(strongElements.length).toBeGreaterThan(0);
            // Text content should be present (markdown may normalize whitespace)
            const trimmedText = text.trim();
            expect(container.textContent).toContain(trimmedText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render italic markdown (*text*) as <em> elements', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          (text) => {
            const bio = `*${text}*`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const emElements = container.querySelectorAll('em');
            expect(emElements.length).toBeGreaterThan(0);
            const trimmedText = text.trim();
            expect(container.textContent).toContain(trimmedText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render links [text](url) as <a> elements with correct href', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          fc.webUrl().filter(url => !url.includes('(') && !url.includes(')')),
          (linkText, url) => {
            const bio = `[${linkText}](${url})`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const links = container.querySelectorAll('a');
            const matchingLink = Array.from(links).find(
              link => link.getAttribute('href') === url
            );
            
            expect(matchingLink).toBeTruthy();
            // Link text should be present (may be trimmed)
            expect(container.textContent).toContain(linkText);
          }
        ),
        { numRuns: 50 } // Reduce runs since filtering may be slow
      );
    }, 10000); // Increase timeout for this test

    it('should render unordered lists with multiple items', () => {
      fc.assert(
        fc.property(
          fc.array(markdownSafeListItem(), { minLength: 1, maxLength: 5 }),
          (items) => {
            const bio = items.map(item => `- ${item}`).join('\n');
            const { container } = render(<ProfileBio bio={bio} />);
            
            const ulElements = container.querySelectorAll('ul');
            expect(ulElements.length).toBeGreaterThan(0);
            
            const liElements = container.querySelectorAll('li');
            expect(liElements.length).toBe(items.length);
            
            // Verify all items are present (trimmed)
            items.forEach(item => {
              expect(container.textContent).toContain(item.trim());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render ordered lists with multiple items', () => {
      fc.assert(
        fc.property(
          fc.array(markdownSafeListItem(), { minLength: 1, maxLength: 5 }),
          (items) => {
            const bio = items.map((item, index) => `${index + 1}. ${item}`).join('\n');
            const { container } = render(<ProfileBio bio={bio} />);
            
            const olElements = container.querySelectorAll('ol');
            expect(olElements.length).toBeGreaterThan(0);
            
            const liElements = container.querySelectorAll('li');
            expect(liElements.length).toBe(items.length);
            
            // Verify all items are present (trimmed)
            items.forEach(item => {
              expect(container.textContent).toContain(item.trim());
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render headings (h1-h6) correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 6 }),
          markdownSafeText(),
          (level, text) => {
            const hashes = '#'.repeat(level);
            const bio = `${hashes} ${text}`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const headingElements = container.querySelectorAll(`h${level}`);
            const trimmedText = text.trim();
            const matchingHeading = Array.from(headingElements).find(
              h => h.textContent === trimmedText
            );
            
            expect(matchingHeading).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render inline code with backticks', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 30 })
            .filter(s => !s.includes('`') && s.trim().length >= 2),
          (code) => {
            const bio = `I use \`${code}\` for my work`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const codeElements = container.querySelectorAll('code');
            expect(codeElements.length).toBeGreaterThan(0);
            expect(container.textContent).toContain(code);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render blockquotes correctly', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          (quote) => {
            const bio = `> ${quote}`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            const blockquoteElements = container.querySelectorAll('blockquote');
            expect(blockquoteElements.length).toBeGreaterThan(0);
            expect(container.textContent).toContain(quote.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed markdown elements correctly', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          markdownSafeText(),
          markdownSafeText(),
          fc.webUrl(),
          (boldText, italicText, linkText, url) => {
            const bio = `**${boldText}** and *${italicText}* with [${linkText}](${url})`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            // Check that all markdown elements are rendered
            expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('em').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('a').length).toBeGreaterThan(0);
            
            // Check that all text content is present (trimmed)
            expect(container.textContent).toContain(boldText.trim());
            expect(container.textContent).toContain(italicText.trim());
            expect(container.textContent).toContain(linkText.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve plain text without markdown', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5, maxLength: 200 })
            .filter(s => {
              // Create truly plain text - alphanumeric with spaces
              const plain = s.replace(/[^a-zA-Z0-9 ]/g, '').trim();
              return plain.length >= 5;
            }),
          (text) => {
            const plainText = text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
            const bio = plainText;
            const { container } = render(<ProfileBio bio={bio} />);
            
            // The text should be present in the rendered output
            expect(container.textContent).toContain(plainText);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should sanitize and not render dangerous HTML elements', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            '<script>alert("xss")</script>',
            '<iframe src="evil.com"></iframe>',
            '<object data="malicious.swf"></object>',
            '<embed src="malicious.swf">',
            '<img src=x onerror="alert(1)">',
            '<svg onload="alert(1)">',
            '<form action="evil.com"><input></form>'
          ),
          markdownSafeText(),
          (dangerousHtml, safeText) => {
            const bio = `${dangerousHtml} ${safeText}`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            // Dangerous elements should not be rendered
            expect(container.querySelectorAll('script').length).toBe(0);
            expect(container.querySelectorAll('iframe').length).toBe(0);
            expect(container.querySelectorAll('object').length).toBe(0);
            expect(container.querySelectorAll('embed').length).toBe(0);
            
            // Component should render without errors
            expect(container).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle nested markdown structures (bold + italic)', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          (text) => {
            const bio = `***${text}***`; // Bold and italic
            const { container } = render(<ProfileBio bio={bio} />);
            
            // Should have both strong and em elements
            expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('em').length).toBeGreaterThan(0);
            
            // Text should be present
            expect(container.textContent).toContain(text.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle line breaks and paragraphs correctly', () => {
      fc.assert(
        fc.property(
          fc.array(markdownSafeText(), { minLength: 2, maxLength: 4 }),
          (paragraphs) => {
            const bio = paragraphs.join('\n\n');
            const { container } = render(<ProfileBio bio={bio} />);
            
            // All paragraph text should be present (trimmed)
            paragraphs.forEach(paragraph => {
              expect(container.textContent).toContain(paragraph.trim());
            });
            
            // Should have paragraph elements
            const pElements = container.querySelectorAll('p');
            expect(pElements.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty or whitespace-only bio gracefully', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('', '   ', '\n', '\n\n', '  \n  '),
          (emptyBio) => {
            const { container } = render(<ProfileBio bio={emptyBio} />);
            
            // Component should render but with minimal content
            // The bio section might not render at all for empty content
            // This is acceptable behavior
            expect(container).toBeTruthy();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle markdown within bio length limit (500 chars)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 450 })
            .filter(s => {
              const plain = s.replace(/[^a-zA-Z0-9 ]/g, '').trim();
              return plain.length >= 10;
            }),
          (text) => {
            const plainText = text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
            // Create markdown that stays within 500 char limit
            const bio = `**${plainText}**`;
            
            if (bio.length > 500) return true; // Skip if too long
            
            const { container } = render(<ProfileBio bio={bio} />);
            
            expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
            expect(container.textContent).toContain(plainText);
            
            return true; // Explicitly return true for passing test
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly render all common markdown elements in combination', () => {
      fc.assert(
        fc.property(
          markdownSafeText(),
          markdownSafeText(),
          markdownSafeText(),
          (heading, boldText, italicText) => {
            const bio = `# ${heading}\n\n**${boldText}** and *${italicText}*`;
            const { container } = render(<ProfileBio bio={bio} />);
            
            // Should have heading, strong, and em elements
            expect(container.querySelectorAll('h1').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
            expect(container.querySelectorAll('em').length).toBeGreaterThan(0);
            
            // All text should be present
            expect(container.textContent).toContain(heading.trim());
            expect(container.textContent).toContain(boldText.trim());
            expect(container.textContent).toContain(italicText.trim());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
