/**
 * Unit Tests for Markdown Support in ProfileBio Component
 * 
 * Feature: public-photographer-profile
 * Task 42: Implémenter le support du markdown dans la bio
 * Property 25: Support du markdown dans la bio
 * 
 * Validates: Requirement 2.3
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ProfileBio } from '../profile-bio';

describe('ProfileBio Markdown Support', () => {
  describe('Basic Formatting', () => {
    it('should render bold text', () => {
      const bio = 'This is **bold text**';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const strongElements = container.querySelectorAll('strong');
      expect(strongElements.length).toBeGreaterThan(0);
      expect(strongElements[0]?.textContent).toBe('bold text');
    });

    it('should render italic text', () => {
      const bio = 'This is *italic text*';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const emElements = container.querySelectorAll('em');
      expect(emElements.length).toBeGreaterThan(0);
      expect(emElements[0]?.textContent).toBe('italic text');
    });

    it('should render links', () => {
      const bio = 'Visit [my website](https://example.com)';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const links = container.querySelectorAll('a');
      const link = Array.from(links).find(
        l => l.getAttribute('href') === 'https://example.com'
      );
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe('my website');
    });
  });

  describe('Lists', () => {
    it('should render unordered lists', () => {
      const bio = `My services:
- Wedding Photography
- Portrait Photography
- Event Photography`;
      const { container } = render(<ProfileBio bio={bio} />);
      
      const ulElements = container.querySelectorAll('ul');
      expect(ulElements.length).toBeGreaterThan(0);
      
      const liElements = container.querySelectorAll('li');
      expect(liElements.length).toBe(3);
      expect(container.textContent).toContain('Wedding Photography');
      expect(container.textContent).toContain('Portrait Photography');
      expect(container.textContent).toContain('Event Photography');
    });

    it('should render ordered lists', () => {
      const bio = `My process:
1. Initial consultation
2. Photo session
3. Editing and delivery`;
      const { container } = render(<ProfileBio bio={bio} />);
      
      const olElements = container.querySelectorAll('ol');
      expect(olElements.length).toBeGreaterThan(0);
      
      const liElements = container.querySelectorAll('li');
      expect(liElements.length).toBe(3);
      expect(container.textContent).toContain('Initial consultation');
      expect(container.textContent).toContain('Photo session');
      expect(container.textContent).toContain('Editing and delivery');
    });
  });

  describe('Headings', () => {
    it('should render h1 headings', () => {
      const bio = '# My Photography Journey';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const h1Elements = container.querySelectorAll('h1');
      expect(h1Elements.length).toBeGreaterThan(0);
      expect(h1Elements[0]?.textContent).toBe('My Photography Journey');
    });

    it('should render h2 headings', () => {
      const bio = '## About My Work';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const h2Elements = container.querySelectorAll('h2');
      // Note: There's already an h2 for "À propos", so we check for our specific text
      const ourH2 = Array.from(h2Elements).find(h => h.textContent === 'About My Work');
      expect(ourH2).toBeTruthy();
    });

    it('should render h3 headings', () => {
      const bio = '### My Specialties';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const h3Elements = container.querySelectorAll('h3');
      const ourH3 = Array.from(h3Elements).find(h => h.textContent === 'My Specialties');
      expect(ourH3).toBeTruthy();
    });
  });

  describe('Code and Blockquotes', () => {
    it('should render inline code', () => {
      const bio = 'I use `Adobe Lightroom` for editing';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const codeElements = container.querySelectorAll('code');
      expect(codeElements.length).toBeGreaterThan(0);
      expect(codeElements[0]?.textContent).toBe('Adobe Lightroom');
    });

    it('should render blockquotes', () => {
      const bio = '> Photography is the art of frozen time';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const blockquoteElements = container.querySelectorAll('blockquote');
      expect(blockquoteElements.length).toBeGreaterThan(0);
      expect(container.textContent).toContain('Photography is the art of frozen time');
    });
  });

  describe('Security', () => {
    it('should not render script tags', () => {
      const bio = '<script>alert("XSS")</script>Normal text';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const scriptElements = container.querySelectorAll('script');
      expect(scriptElements.length).toBe(0);
      // The text should still be there, just without the script tag
      expect(container.textContent).toContain('Normal text');
    });

    it('should not render iframe tags', () => {
      const bio = '<iframe src="https://evil.com"></iframe>Normal text';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const iframeElements = container.querySelectorAll('iframe');
      expect(iframeElements.length).toBe(0);
      expect(container.textContent).toContain('Normal text');
    });

    it('should not render object tags', () => {
      const bio = '<object data="malicious.swf"></object>Normal text';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const objectElements = container.querySelectorAll('object');
      expect(objectElements.length).toBe(0);
      expect(container.textContent).toContain('Normal text');
    });

    it('should not render embed tags', () => {
      const bio = '<embed src="malicious.swf">Normal text';
      const { container } = render(<ProfileBio bio={bio} />);
      
      const embedElements = container.querySelectorAll('embed');
      expect(embedElements.length).toBe(0);
      expect(container.textContent).toContain('Normal text');
    });
  });

  describe('Mixed Formatting', () => {
    it('should handle multiple markdown elements together', () => {
      const bio = `# About Me

I'm a **professional photographer** with *10 years* of experience.

## My Services
- Wedding Photography
- Portrait Sessions
- [Contact me](https://example.com)

> "Capturing moments that last forever"`;

      const { container } = render(<ProfileBio bio={bio} />);
      
      // Check for various elements
      expect(container.querySelectorAll('h1').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('strong').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('em').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('ul').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('a').length).toBeGreaterThan(0);
      expect(container.querySelectorAll('blockquote').length).toBeGreaterThan(0);
    });
  });

  describe('Plain Text', () => {
    it('should render plain text without markdown', () => {
      const bio = 'I am a professional photographer based in Paris.';
      const { container } = render(<ProfileBio bio={bio} />);
      
      expect(container.textContent).toContain('I am a professional photographer based in Paris.');
    });

    it('should handle text with line breaks', () => {
      const bio = `Line 1
Line 2
Line 3`;
      const { container } = render(<ProfileBio bio={bio} />);
      
      expect(container.textContent).toContain('Line 1');
      expect(container.textContent).toContain('Line 2');
      expect(container.textContent).toContain('Line 3');
    });
  });
});
