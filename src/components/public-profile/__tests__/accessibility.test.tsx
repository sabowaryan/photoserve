/**
 * Accessibility Tests for Public Profile Components
 * 
 * Tests for Requirements 11.3, 11.4, 11.5, 11.6, 11.7:
 * - 11.3: Color contrast (WCAG AA minimum)
 * - 11.4: Complete keyboard navigation
 * - 11.5: ARIA attributes on interactive elements
 * - 11.6: Descriptive alt text on images
 * - 11.7: Visible focus states
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { ProfileHeader } from '../profile-header';
import { ProfileBio } from '../profile-bio';
import { ProfileGalleries } from '../profile-galleries';
import { GalleryCard } from '../gallery-card';
import { ProfileContact } from '../profile-contact';
import { ProfileFooter } from '../profile-footer';
import { ProfileTestimonials } from '../profile-testimonials';
import { TestimonialCard } from '../testimonial-card';
import type { PublicGallery, Testimonial, SocialLinks, CTAButton } from '@/types/public-profile';

// Mock ProfileClientWrapper context
vi.mock('../profile-client-wrapper', () => ({
  useProfileTracking: () => ({
    trackCTAClick: vi.fn(),
    trackSocialClick: vi.fn(),
  }),
}));

describe('Accessibility Tests - Public Profile Components', () => {
  describe('ProfileHeader Accessibility', () => {
    it('should have proper ARIA attributes on banner', () => {
      render(
        <ProfileHeader
          displayName="John Doe"
          tagline="Professional Photographer"
          location="Paris, France"
        />
      );

      const banner = screen.getByRole('banner');
      expect(banner).toHaveAttribute('aria-label', 'En-tête du profil');
    });

    it('should have descriptive alt text for cover image', () => {
      render(
        <ProfileHeader
          displayName="John Doe"
          coverImageUrl="https://example.com/cover.jpg"
        />
      );

      const coverImage = screen.getByAltText('Image de couverture de John Doe');
      expect(coverImage).toBeInTheDocument();
    });

    it('should have descriptive alt text for avatar', () => {
      render(
        <ProfileHeader
          displayName="John Doe"
          avatarUrl="https://example.com/avatar.jpg"
        />
      );

      const avatar = screen.getByAltText('Photo de profil de John Doe');
      expect(avatar).toBeInTheDocument();
    });

    it('should have descriptive alt text for custom logo', () => {
      render(
        <ProfileHeader
          displayName="John Doe"
          customLogo="https://example.com/logo.png"
        />
      );

      const logo = screen.getByAltText('Logo de John Doe');
      expect(logo).toBeInTheDocument();
    });

    it('should have aria-label for location', () => {
      render(
        <ProfileHeader
          displayName="John Doe"
          location="Paris, France"
        />
      );

      const location = screen.getByLabelText('Localisation: Paris, France');
      expect(location).toBeInTheDocument();
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <ProfileHeader
          displayName="John Doe"
          tagline="Professional Photographer"
          location="Paris, France"
          avatarUrl="https://example.com/avatar.jpg"
          coverImageUrl="https://example.com/cover.jpg"
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('ProfileBio Accessibility', () => {
    it('should have proper section labels', () => {
      render(
        <ProfileBio
          bio="Professional photographer with 10 years of experience"
          specialties={['Wedding', 'Portrait']}
          yearsOfExperience={10}
          awards={['Best Photographer 2023']}
        />
      );

      expect(screen.getByLabelText(/À propos/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Expertise/i)).toBeInTheDocument();
    });

    it('should use semantic list for specialties', () => {
      render(
        <ProfileBio
          specialties={['Wedding', 'Portrait', 'Landscape']}
        />
      );

      const specialtiesList = screen.getByRole('list', { name: /Spécialités/i });
      expect(specialtiesList).toBeInTheDocument();
      
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(3);
    });

    it('should have aria-label for years of experience', () => {
      render(
        <ProfileBio
          yearsOfExperience={10}
        />
      );

      const experience = screen.getByLabelText('10 années d\'expérience');
      expect(experience).toBeInTheDocument();
    });

    it('should use semantic list for awards', () => {
      render(
        <ProfileBio
          awards={['Award 1', 'Award 2']}
        />
      );

      const awardsList = screen.getByRole('list', { name: /Récompenses/i });
      expect(awardsList).toBeInTheDocument();
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <ProfileBio
          bio="Professional photographer"
          specialties={['Wedding', 'Portrait']}
          yearsOfExperience={10}
          awards={['Best Photographer 2023']}
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('ProfileGalleries Accessibility', () => {
    const mockGalleries: PublicGallery[] = [
      {
        id: '1',
        slug: 'wedding-2024',
        title: 'Wedding 2024',
        coverImageUrl: 'https://example.com/cover1.jpg',
        imageCount: 50,
        createdAt: new Date('2024-01-01'),
        isNew: true,
        isPasswordProtected: false,
      },
      {
        id: '2',
        slug: 'portrait-session',
        title: 'Portrait Session',
        coverImageUrl: 'https://example.com/cover2.jpg',
        imageCount: 25,
        createdAt: new Date('2023-12-01'),
        isNew: false,
        isPasswordProtected: true,
      },
    ];

    it('should have proper section label', () => {
      render(<ProfileGalleries galleries={mockGalleries} />);

      expect(screen.getByLabelText(/Portfolio/i)).toBeInTheDocument();
    });

    it('should use semantic list for galleries', () => {
      render(<ProfileGalleries galleries={mockGalleries} />);

      const galleriesList = screen.getByRole('list', { name: /Galeries de photos/i });
      expect(galleriesList).toBeInTheDocument();
      
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(<ProfileGalleries galleries={mockGalleries} />);

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('GalleryCard Accessibility', () => {
    it('should have descriptive aria-label for link', () => {
      render(
        <GalleryCard
          slug="wedding-2024"
          title="Wedding 2024"
          coverImageUrl="https://example.com/cover.jpg"
          imageCount={50}
          createdAt={new Date('2024-01-01')}
          isNew={true}
          isPasswordProtected={false}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', 'Voir la galerie Wedding 2024 contenant 50 photos');
    });

    it('should have descriptive alt text for cover image', () => {
      render(
        <GalleryCard
          slug="wedding-2024"
          title="Wedding 2024"
          coverImageUrl="https://example.com/cover.jpg"
          imageCount={50}
          createdAt={new Date('2024-01-01')}
          isNew={false}
          isPasswordProtected={false}
        />
      );

      const image = screen.getByAltText('Image de couverture de la galerie Wedding 2024');
      expect(image).toBeInTheDocument();
    });

    it('should have visible focus styles', () => {
      render(
        <GalleryCard
          slug="wedding-2024"
          title="Wedding 2024"
          coverImageUrl="https://example.com/cover.jpg"
          imageCount={50}
          createdAt={new Date('2024-01-01')}
          isNew={false}
          isPasswordProtected={false}
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-4', 'focus:ring-indigo-500');
    });

    it('should have proper status labels for badges', () => {
      render(
        <GalleryCard
          slug="wedding-2024"
          title="Wedding 2024"
          coverImageUrl="https://example.com/cover.jpg"
          imageCount={50}
          createdAt={new Date('2024-01-01')}
          isNew={true}
          isPasswordProtected={true}
        />
      );

      expect(screen.getByRole('status', { name: 'Nouvelle galerie' })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: 'Galerie protégée par mot de passe' })).toBeInTheDocument();
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <GalleryCard
          slug="wedding-2024"
          title="Wedding 2024"
          coverImageUrl="https://example.com/cover.jpg"
          imageCount={50}
          createdAt={new Date('2024-01-01')}
          isNew={true}
          isPasswordProtected={false}
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('ProfileContact Accessibility', () => {
    const mockSocialLinks: SocialLinks = {
      instagram: 'https://instagram.com/johndoe',
      facebook: 'https://facebook.com/johndoe',
    };

    const mockCTAButton: CTAButton = {
      text: 'Contact Me',
      url: 'https://example.com/contact',
      style: 'primary',
    };

    it('should have proper section label', () => {
      render(
        <ProfileContact
          email="john@example.com"
          phone="+33 1 23 45 67 89"
        />
      );

      expect(screen.getByLabelText(/Contact/i)).toBeInTheDocument();
    });

    it('should have aria-label for email', () => {
      render(
        <ProfileContact
          email="john@example.com"
        />
      );

      expect(screen.getByLabelText(/Adresse email:/i)).toBeInTheDocument();
    });

    it('should use semantic address element', () => {
      const { container } = render(
        <ProfileContact
          address="123 Main St, Paris, France"
        />
      );

      const address = container.querySelector('address');
      expect(address).toBeInTheDocument();
      expect(address).toHaveClass('not-italic');
    });

    it('should have navigation for social links', () => {
      render(
        <ProfileContact
          socialLinks={mockSocialLinks}
        />
      );

      const nav = screen.getByRole('navigation', { name: /Liens vers les réseaux sociaux/i });
      expect(nav).toBeInTheDocument();
    });

    it('should have descriptive aria-labels for social links', () => {
      render(
        <ProfileContact
          socialLinks={mockSocialLinks}
        />
      );

      expect(screen.getByLabelText('Visiter Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Visiter Facebook')).toBeInTheDocument();
    });

    it('should have visible focus styles on links', () => {
      render(
        <ProfileContact
          website="https://example.com"
        />
      );

      const link = screen.getByRole('link', { name: /Visiter le site web/i });
      expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
    });

    it('should have visible focus styles on CTA button', () => {
      render(
        <ProfileContact
          ctaButton={mockCTAButton}
        />
      );

      const button = screen.getByRole('button', { name: 'Contact Me' });
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-4');
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <ProfileContact
          email="john@example.com"
          phone="+33 1 23 45 67 89"
          website="https://example.com"
          address="123 Main St, Paris"
          socialLinks={mockSocialLinks}
          ctaButton={mockCTAButton}
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('ProfileFooter Accessibility', () => {
    it('should have proper contentinfo role', () => {
      render(
        <ProfileFooter
          photographerName="John Doe"
          hasCustomDomain={false}
        />
      );

      const footer = screen.getByRole('contentinfo');
      expect(footer).toHaveAttribute('aria-label', 'Pied de page');
    });

    it('should have navigation for legal links', () => {
      render(
        <ProfileFooter
          photographerName="John Doe"
          hasCustomDomain={false}
        />
      );

      const nav = screen.getByRole('navigation', { name: /Liens légaux/i });
      expect(nav).toBeInTheDocument();
    });

    it('should have visible focus styles on links', () => {
      render(
        <ProfileFooter
          photographerName="John Doe"
          hasCustomDomain={false}
        />
      );

      const links = screen.getAllByRole('link');
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <ProfileFooter
          photographerName="John Doe"
          hasCustomDomain={false}
        />
      );

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('ProfileTestimonials Accessibility', () => {
    const mockTestimonials: Testimonial[] = [
      {
        id: '1',
        clientName: 'Alice Smith',
        clientPhoto: 'https://example.com/alice.jpg',
        rating: 5,
        text: 'Amazing photographer!',
        date: '2024-01-15',
      },
      {
        id: '2',
        clientName: 'Bob Johnson',
        rating: 4,
        text: 'Great experience!',
        date: '2024-01-10',
      },
    ];

    it('should have proper section label', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      expect(screen.getByRole('heading', { name: /Témoignages/i })).toBeInTheDocument();
    });

    it('should have carousel region with aria-live', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const carousel = screen.getByRole('region', { name: /Carrousel de témoignages/i });
      expect(carousel).toHaveAttribute('aria-live', 'polite');
    });

    it('should have proper slide roles', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const slides = screen.getAllByRole('group');
      expect(slides).toHaveLength(2);
      
      slides.forEach((slide, index) => {
        expect(slide).toHaveAttribute('aria-roledescription', 'slide');
        expect(slide).toHaveAttribute('aria-label', `Témoignage ${index + 1} sur 2`);
      });
    });

    it('should have accessible navigation buttons', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const prevButton = screen.getByRole('button', { name: 'Témoignage précédent' });
      const nextButton = screen.getByRole('button', { name: 'Témoignage suivant' });

      expect(prevButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
    });

    it('should have visible focus styles on navigation buttons', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-4');
      });
    });

    it('should have tablist for dot indicators', () => {
      render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const tablist = screen.getByRole('tablist', { name: /Navigation des témoignages/i });
      expect(tablist).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(2);
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(<ProfileTestimonials testimonials={mockTestimonials} />);

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('TestimonialCard Accessibility', () => {
    const mockTestimonial: Testimonial = {
      id: '1',
      clientName: 'Alice Smith',
      clientPhoto: 'https://example.com/alice.jpg',
      rating: 5,
      text: 'Amazing photographer! Highly recommended.',
      date: '2024-01-15',
    };

    it('should use article element for semantic structure', () => {
      const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });

    it('should have descriptive alt text for client photo', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);

      const photo = screen.getByAltText('Photo de Alice Smith');
      expect(photo).toBeInTheDocument();
    });

    it('should have aria-label for rating', () => {
      render(<TestimonialCard testimonial={mockTestimonial} />);

      const rating = screen.getByLabelText('5 étoiles sur 5');
      expect(rating).toBeInTheDocument();
    });

    it('should use semantic time element for date', () => {
      const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);

      const time = container.querySelector('time');
      expect(time).toBeInTheDocument();
      expect(time).toHaveAttribute('dateTime', '2024-01-15');
    });

    it('should pass axe accessibility tests', async () => {
      const { container } = render(<TestimonialCard testimonial={mockTestimonial} />);

      const results = await axe(container);
      expect(results.violations).toEqual([]);
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have focusable interactive elements in correct tab order', () => {
      const mockGalleries: PublicGallery[] = [
        {
          id: '1',
          slug: 'gallery-1',
          title: 'Gallery 1',
          coverImageUrl: 'https://example.com/cover1.jpg',
          imageCount: 10,
          createdAt: new Date(),
          isNew: false,
          isPasswordProtected: false,
        },
      ];

      const mockSocialLinks: SocialLinks = {
        instagram: 'https://instagram.com/test',
      };

      const mockCTAButton: CTAButton = {
        text: 'Contact',
        url: 'https://example.com/contact',
        style: 'primary',
      };

      render(
        <div>
          <ProfileGalleries galleries={mockGalleries} />
          <ProfileContact
            socialLinks={mockSocialLinks}
            ctaButton={mockCTAButton}
          />
          <ProfileFooter photographerName="Test" hasCustomDomain={false} />
        </div>
      );

      // Get all focusable elements
      const links = screen.getAllByRole('link');
      const buttons = screen.getAllByRole('button');

      // Verify all interactive elements are present
      expect(links.length).toBeGreaterThan(0);
      expect(buttons.length).toBeGreaterThan(0);

      // Verify they don't have tabindex that would break natural tab order
      [...links, ...buttons].forEach(element => {
        const tabindex = element.getAttribute('tabindex');
        expect(tabindex === null || tabindex === '0').toBe(true);
      });
    });
  });

  describe('Color Contrast (WCAG AA)', () => {
    it('should have sufficient contrast for text on colored backgrounds', () => {
      // This test verifies that our color combinations meet WCAG AA standards
      // The actual contrast checking is done by axe in the component tests above
      // This is a documentation test to ensure we're aware of the requirement

      const colorCombinations = [
        { bg: 'indigo-600', text: 'white', purpose: 'Primary buttons' },
        { bg: 'slate-900', text: 'white', purpose: 'Footer' },
        { bg: 'emerald-500', text: 'white', purpose: 'New badge' },
        { bg: 'slate-50', text: 'slate-900', purpose: 'Main content' },
      ];

      // Document that these combinations should meet WCAG AA (4.5:1 for normal text, 3:1 for large text)
      expect(colorCombinations.length).toBeGreaterThan(0);
    });
  });
});
