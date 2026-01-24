import { describe, it, expect } from 'vitest';
import {
  PublicProfileSchema,
  RESERVED_SLUGS,
  TEXT_LIMITS,
  ARRAY_LIMITS,
  SocialLinksSchema,
  CTAButtonSchema,
  TestimonialSchema,
} from './public-profile';

describe('PublicProfileSchema', () => {
  describe('slug validation', () => {
    it('should accept valid slugs', () => {
      const validSlugs = ['john-doe', 'photographer-123', 'my-portfolio'];
      
      validSlugs.forEach((slug) => {
        const result = PublicProfileSchema.shape.slug.safeParse(slug);
        expect(result.success).toBe(true);
      });
    });

    it('should reject slugs with uppercase letters', () => {
      const result = PublicProfileSchema.shape.slug.safeParse('John-Doe');
      expect(result.success).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      const result = PublicProfileSchema.shape.slug.safeParse('john_doe');
      expect(result.success).toBe(false);
    });

    it('should reject slugs that are too long', () => {
      const longSlug = 'a'.repeat(TEXT_LIMITS.SLUG + 1);
      const result = PublicProfileSchema.shape.slug.safeParse(longSlug);
      expect(result.success).toBe(false);
    });

    it('should reject reserved slugs', () => {
      RESERVED_SLUGS.forEach((slug) => {
        const result = PublicProfileSchema.shape.slug.safeParse(slug);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty slugs', () => {
      const result = PublicProfileSchema.shape.slug.safeParse('');
      expect(result.success).toBe(false);
    });
  });

  describe('text field length limits', () => {
    it('should enforce displayName length limit', () => {
      const validName = 'a'.repeat(TEXT_LIMITS.DISPLAY_NAME);
      const tooLongName = 'a'.repeat(TEXT_LIMITS.DISPLAY_NAME + 1);

      expect(PublicProfileSchema.shape.displayName.safeParse(validName).success).toBe(true);
      expect(PublicProfileSchema.shape.displayName.safeParse(tooLongName).success).toBe(false);
    });

    it('should enforce tagline length limit', () => {
      const validTagline = 'a'.repeat(TEXT_LIMITS.TAGLINE);
      const tooLongTagline = 'a'.repeat(TEXT_LIMITS.TAGLINE + 1);

      expect(PublicProfileSchema.shape.tagline.safeParse(validTagline).success).toBe(true);
      expect(PublicProfileSchema.shape.tagline.safeParse(tooLongTagline).success).toBe(false);
    });

    it('should enforce bio length limit', () => {
      const validBio = 'a'.repeat(TEXT_LIMITS.BIO);
      const tooLongBio = 'a'.repeat(TEXT_LIMITS.BIO + 1);

      expect(PublicProfileSchema.shape.bio.safeParse(validBio).success).toBe(true);
      expect(PublicProfileSchema.shape.bio.safeParse(tooLongBio).success).toBe(false);
    });

    it('should enforce metaTitle length limit', () => {
      const validTitle = 'a'.repeat(TEXT_LIMITS.META_TITLE);
      const tooLongTitle = 'a'.repeat(TEXT_LIMITS.META_TITLE + 1);

      expect(PublicProfileSchema.shape.metaTitle.safeParse(validTitle).success).toBe(true);
      expect(PublicProfileSchema.shape.metaTitle.safeParse(tooLongTitle).success).toBe(false);
    });

    it('should enforce metaDescription length limit', () => {
      const validDesc = 'a'.repeat(TEXT_LIMITS.META_DESCRIPTION);
      const tooLongDesc = 'a'.repeat(TEXT_LIMITS.META_DESCRIPTION + 1);

      expect(PublicProfileSchema.shape.metaDescription.safeParse(validDesc).success).toBe(true);
      expect(PublicProfileSchema.shape.metaDescription.safeParse(tooLongDesc).success).toBe(false);
    });
  });

  describe('array cardinality limits', () => {
    it('should enforce specialties limit', () => {
      const validSpecialties = Array(ARRAY_LIMITS.SPECIALTIES).fill('Wedding');
      const tooManySpecialties = Array(ARRAY_LIMITS.SPECIALTIES + 1).fill('Wedding');

      expect(PublicProfileSchema.shape.specialties.safeParse(validSpecialties).success).toBe(true);
      expect(PublicProfileSchema.shape.specialties.safeParse(tooManySpecialties).success).toBe(false);
    });

    it('should enforce awards limit', () => {
      const validAwards = Array(ARRAY_LIMITS.AWARDS).fill('Best Photographer 2024');
      const tooManyAwards = Array(ARRAY_LIMITS.AWARDS + 1).fill('Best Photographer 2024');

      expect(PublicProfileSchema.shape.awards.safeParse(validAwards).success).toBe(true);
      expect(PublicProfileSchema.shape.awards.safeParse(tooManyAwards).success).toBe(false);
    });

    it('should enforce testimonials limit', () => {
      const validTestimonial = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        clientName: 'John Doe',
        rating: 5,
        text: 'Great photographer!',
        date: new Date().toISOString(),
      };

      const validTestimonials = Array(ARRAY_LIMITS.TESTIMONIALS).fill(validTestimonial);
      const tooManyTestimonials = Array(ARRAY_LIMITS.TESTIMONIALS + 1).fill(validTestimonial);

      expect(PublicProfileSchema.shape.testimonials.safeParse(validTestimonials).success).toBe(true);
      expect(PublicProfileSchema.shape.testimonials.safeParse(tooManyTestimonials).success).toBe(false);
    });

    it('should enforce metaKeywords limit', () => {
      const validKeywords = Array(ARRAY_LIMITS.META_KEYWORDS).fill('photography');
      const tooManyKeywords = Array(ARRAY_LIMITS.META_KEYWORDS + 1).fill('photography');

      expect(PublicProfileSchema.shape.metaKeywords.safeParse(validKeywords).success).toBe(true);
      expect(PublicProfileSchema.shape.metaKeywords.safeParse(tooManyKeywords).success).toBe(false);
    });
  });

  describe('URL validation', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://example.com',
        'https://example.com/path',
      ];

      validUrls.forEach((url) => {
        expect(PublicProfileSchema.shape.website.safeParse(url).success).toBe(true);
        expect(PublicProfileSchema.shape.avatarUrl.safeParse(url).success).toBe(true);
        expect(PublicProfileSchema.shape.coverImageUrl.safeParse(url).success).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = ['not-a-url', 'just text'];

      invalidUrls.forEach((url) => {
        expect(PublicProfileSchema.shape.website.safeParse(url).success).toBe(false);
      });
    });
  });

  describe('email validation', () => {
    it('should accept valid emails', () => {
      const validEmails = ['test@example.com', 'user+tag@domain.co.uk'];

      validEmails.forEach((email) => {
        expect(PublicProfileSchema.shape.publicEmail.safeParse(email).success).toBe(true);
      });
    });

    it('should reject invalid emails', () => {
      const invalidEmails = ['not-an-email', '@example.com', 'user@'];

      invalidEmails.forEach((email) => {
        expect(PublicProfileSchema.shape.publicEmail.safeParse(email).success).toBe(false);
      });
    });
  });

  describe('complete profile validation', () => {
    it('should accept a valid minimal profile', () => {
      const minimalProfile = {
        isEnabled: true,
        slug: 'john-doe',
        displayName: 'John Doe',
      };

      const result = PublicProfileSchema.safeParse(minimalProfile);
      expect(result.success).toBe(true);
    });

    it('should accept a valid complete profile', () => {
      const completeProfile = {
        isEnabled: true,
        slug: 'john-doe',
        displayName: 'John Doe',
        tagline: 'Professional Wedding Photographer',
        bio: 'I capture beautiful moments',
        location: 'Paris, France',
        avatarUrl: 'https://example.com/avatar.jpg',
        coverImageUrl: 'https://example.com/cover.jpg',
        specialties: ['Wedding', 'Portrait'],
        yearsOfExperience: 10,
        awards: ['Best Photographer 2024'],
        publicEmail: 'john@example.com',
        phone: '+33123456789',
        website: 'https://johndoe.com',
        address: '123 Main St, Paris',
        socialLinks: {
          instagram: 'https://instagram.com/johndoe',
          facebook: 'https://facebook.com/johndoe',
        },
        ctaButton: {
          text: 'Book Now',
          url: 'https://johndoe.com/book',
          style: 'primary' as const,
        },
        testimonials: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            clientName: 'Jane Smith',
            rating: 5,
            text: 'Amazing photographer!',
            date: new Date().toISOString(),
          },
        ],
        featuredGalleries: ['123e4567-e89b-12d3-a456-426614174001'],
        hiddenGalleries: ['123e4567-e89b-12d3-a456-426614174002'],
        metaTitle: 'John Doe - Wedding Photographer',
        metaDescription: 'Professional wedding photographer in Paris',
        metaKeywords: ['wedding', 'photography', 'paris'],
      };

      const result = PublicProfileSchema.safeParse(completeProfile);
      expect(result.success).toBe(true);
    });

    it('should reject profile with missing required fields', () => {
      const invalidProfile = {
        isEnabled: true,
        // Missing slug and displayName
      };

      const result = PublicProfileSchema.safeParse(invalidProfile);
      expect(result.success).toBe(false);
    });
  });
});

describe('SocialLinksSchema', () => {
  it('should accept valid social links', () => {
    const validLinks = {
      instagram: 'https://instagram.com/user',
      facebook: 'https://facebook.com/user',
      pinterest: 'https://pinterest.com/user',
    };

    const result = SocialLinksSchema.safeParse(validLinks);
    expect(result.success).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const invalidLinks = {
      instagram: 'not-a-url',
    };

    const result = SocialLinksSchema.safeParse(invalidLinks);
    expect(result.success).toBe(false);
  });
});

describe('CTAButtonSchema', () => {
  it('should accept valid CTA button', () => {
    const validButton = {
      text: 'Book Now',
      url: 'https://example.com/book',
      style: 'primary' as const,
    };

    const result = CTAButtonSchema.safeParse(validButton);
    expect(result.success).toBe(true);
  });

  it('should reject CTA button with invalid style', () => {
    const invalidButton = {
      text: 'Book Now',
      url: 'https://example.com/book',
      style: 'invalid',
    };

    const result = CTAButtonSchema.safeParse(invalidButton);
    expect(result.success).toBe(false);
  });

  it('should reject CTA button with text too long', () => {
    const invalidButton = {
      text: 'a'.repeat(TEXT_LIMITS.CTA_TEXT + 1),
      url: 'https://example.com/book',
      style: 'primary' as const,
    };

    const result = CTAButtonSchema.safeParse(invalidButton);
    expect(result.success).toBe(false);
  });
});

describe('TestimonialSchema', () => {
  it('should accept valid testimonial', () => {
    const validTestimonial = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientName: 'John Doe',
      rating: 5,
      text: 'Great photographer!',
      date: new Date().toISOString(),
    };

    const result = TestimonialSchema.safeParse(validTestimonial);
    expect(result.success).toBe(true);
  });

  it('should reject testimonial with invalid rating', () => {
    const invalidTestimonial = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientName: 'John Doe',
      rating: 6, // Invalid: must be 1-5
      text: 'Great photographer!',
      date: new Date().toISOString(),
    };

    const result = TestimonialSchema.safeParse(invalidTestimonial);
    expect(result.success).toBe(false);
  });

  it('should reject testimonial with text too long', () => {
    const invalidTestimonial = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      clientName: 'John Doe',
      rating: 5,
      text: 'a'.repeat(TEXT_LIMITS.TESTIMONIAL_TEXT + 1),
      date: new Date().toISOString(),
    };

    const result = TestimonialSchema.safeParse(invalidTestimonial);
    expect(result.success).toBe(false);
  });

  it('should reject testimonial with invalid UUID', () => {
    const invalidTestimonial = {
      id: 'not-a-uuid',
      clientName: 'John Doe',
      rating: 5,
      text: 'Great photographer!',
      date: new Date().toISOString(),
    };

    const result = TestimonialSchema.safeParse(invalidTestimonial);
    expect(result.success).toBe(false);
  });
});
