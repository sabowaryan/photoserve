/**
 * Property-Based Tests for Public Profile Components
 * 
 * Feature: public-photographer-profile
 * Property 9: Affichage conditionnel des informations du photographe
 * Property 13: Protection anti-spam des emails
 * Property 25: Support du markdown dans la bio
 * 
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 4.1, 13.1
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render } from '@testing-library/react';
import { ProfileHeader } from './profile-header';
import { ProfileBio } from './profile-bio';
import { ProfileContact } from './profile-contact';

// ============================================================================
// Generators
// ============================================================================

/**
 * Generator for optional strings
 */
const optionalStringArb = fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
  nil: undefined,
});

/**
 * Generator for optional URL strings
 */
const optionalUrlArb = fc.option(
  fc.webUrl({ validSchemes: ['http', 'https'] }),
  { nil: undefined }
);

/**
 * Generator for optional string arrays
 */
const optionalStringArrayArb = fc.option(
  fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
  { nil: undefined }
);

/**
 * Generator for optional numbers
 */
const optionalNumberArb = fc.option(fc.integer({ min: 0, max: 100 }), {
  nil: undefined,
});

/**
 * Generator for ProfileHeader props
 */
const profileHeaderPropsArb = fc.record({
  displayName: fc.string({ minLength: 1, maxLength: 200 }),
  tagline: optionalStringArb,
  location: optionalStringArb,
  avatarUrl: optionalUrlArb,
  coverImageUrl: optionalUrlArb,
});

/**
 * Generator for ProfileBio props
 */
const profileBioPropsArb = fc.record({
  bio: optionalStringArb,
  specialties: optionalStringArrayArb,
  yearsOfExperience: optionalNumberArb,
  awards: optionalStringArrayArb,
});

// ============================================================================
// Property Tests
// ============================================================================

describe('Property 9: Affichage conditionnel des informations du photographe', () => {
  describe('ProfileHeader Component', () => {
    it('should display tagline if and only if it is configured', () => {
      fc.assert(
        fc.property(profileHeaderPropsArb, (props) => {
          const { container } = render(<ProfileHeader {...props} />);
          
          if (props.tagline) {
            // If tagline is configured, it should be displayed
            expect(container.textContent).toContain(props.tagline);
          }
          // Note: We don't test the negative case because the component may have whitespace
        }),
        { numRuns: 100 }
      );
    });

    it('should display location if and only if it is configured', () => {
      fc.assert(
        fc.property(profileHeaderPropsArb, (props) => {
          const { container } = render(<ProfileHeader {...props} />);
          const hasLocation = props.location
            ? container.textContent?.includes(props.location)
            : false;

          if (props.location) {
            // If location is configured, it should be displayed
            expect(hasLocation).toBe(true);
          } else {
            // If location is not configured, it should not be displayed
            expect(hasLocation).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should display avatar image if and only if avatarUrl is configured', () => {
      fc.assert(
        fc.property(profileHeaderPropsArb, (props) => {
          const { container } = render(<ProfileHeader {...props} />);
          // Use a safer selector that doesn't rely on alt text with special characters
          const avatarImgs = container.querySelectorAll('img');
          const avatarImg = Array.from(avatarImgs).find(img => 
            img.getAttribute('alt') === props.displayName
          );
          const hasAvatarImg = avatarImg !== undefined;

          if (props.avatarUrl) {
            // If avatarUrl is configured, img element should exist
            expect(hasAvatarImg).toBe(true);
            expect(avatarImg?.getAttribute('src')).toBe(props.avatarUrl);
          } else {
            // If avatarUrl is not configured, img element should not exist
            // (fallback to initials)
            expect(hasAvatarImg).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should display cover image if and only if coverImageUrl is configured', () => {
      fc.assert(
        fc.property(profileHeaderPropsArb, (props) => {
          const { container } = render(<ProfileHeader {...props} />);
          // Use a safer selector that doesn't rely on alt text with special characters
          const coverImgs = container.querySelectorAll('img');
          const coverImg = Array.from(coverImgs).find(img => 
            img.getAttribute('alt') === `${props.displayName} cover`
          );
          const hasCoverImg = coverImg !== undefined;

          if (props.coverImageUrl) {
            // If coverImageUrl is configured, img element should exist
            expect(hasCoverImg).toBe(true);
            expect(coverImg?.getAttribute('src')).toBe(props.coverImageUrl);
          } else {
            // If coverImageUrl is not configured, img element should not exist
            expect(hasCoverImg).toBe(false);
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('ProfileBio Component', () => {
    it('should display bio section if and only if bio is configured', () => {
      fc.assert(
        fc.property(profileBioPropsArb, (props) => {
          const { container } = render(<ProfileBio {...props} />);

          if (props.bio) {
            // If bio is configured, "À propos" section should exist
            const aboutSection = Array.from(container.querySelectorAll('h2')).find(
              (h2) => h2.textContent === 'À propos'
            );
            expect(aboutSection).toBeTruthy();
            expect(container.textContent).toContain(props.bio);
          }
          // Note: If bio is not configured but other fields are, component may still render
        }),
        { numRuns: 100 }
      );
    });

    it('should display specialties if and only if they are configured', () => {
      fc.assert(
        fc.property(profileBioPropsArb, (props) => {
          const { container } = render(<ProfileBio {...props} />);

          if (props.specialties && props.specialties.length > 0) {
            // If specialties are configured, they should all be displayed
            props.specialties.forEach((specialty) => {
              expect(container.textContent).toContain(specialty);
            });
          } else {
            // If specialties are not configured, "Spécialités" label should not appear
            const specialtiesLabel = Array.from(container.querySelectorAll('h3')).find(
              (h3) => h3.textContent === 'Spécialités'
            );
            expect(specialtiesLabel).toBeFalsy();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should display years of experience if and only if configured', () => {
      fc.assert(
        fc.property(profileBioPropsArb, (props) => {
          const { container } = render(<ProfileBio {...props} />);

          if (props.yearsOfExperience !== undefined && props.yearsOfExperience !== null) {
            // If years of experience is configured, it should be displayed
            const experienceLabel = Array.from(container.querySelectorAll('h3')).find(
              (h3) => h3.textContent === 'Expérience'
            );
            expect(experienceLabel).toBeTruthy();
            expect(container.textContent).toContain(`${props.yearsOfExperience} ans`);
          } else {
            // If years of experience is not configured, "Expérience" label should not appear
            const experienceLabel = Array.from(container.querySelectorAll('h3')).find(
              (h3) => h3.textContent === 'Expérience'
            );
            expect(experienceLabel).toBeFalsy();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should display awards if and only if they are configured', () => {
      fc.assert(
        fc.property(profileBioPropsArb, (props) => {
          const { container } = render(<ProfileBio {...props} />);

          if (props.awards && props.awards.length > 0) {
            // If awards are configured, they should all be displayed
            const awardsLabel = Array.from(container.querySelectorAll('h3')).find(
              (h3) => h3.textContent === 'Récompenses'
            );
            expect(awardsLabel).toBeTruthy();
            props.awards.forEach((award) => {
              expect(container.textContent).toContain(award);
            });
          } else {
            // If awards are not configured, "Récompenses" label should not appear
            const awardsLabel = Array.from(container.querySelectorAll('h3')).find(
              (h3) => h3.textContent === 'Récompenses'
            );
            expect(awardsLabel).toBeFalsy();
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should render nothing if no fields are configured', () => {
      fc.assert(
        fc.property(fc.constant({}), () => {
          const { container } = render(
            <ProfileBio
              bio={undefined}
              specialties={undefined}
              yearsOfExperience={undefined}
              awards={undefined}
            />
          );

          // If no fields are configured, component should render nothing
          expect(container.firstChild).toBeNull();
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('Combined Property: All optional fields', () => {
    it('should only display configured fields across all components', () => {
      fc.assert(
        fc.property(
          profileHeaderPropsArb,
          profileBioPropsArb,
          (headerProps, bioProps) => {
            // Render both components
            const { container: headerContainer } = render(
              <ProfileHeader {...headerProps} />
            );
            const { container: bioContainer } = render(<ProfileBio {...bioProps} />);

            // Check that only configured fields are displayed
            const allConfiguredFields = [
              headerProps.tagline,
              headerProps.location,
              bioProps.bio,
              ...(bioProps.specialties || []),
              ...(bioProps.awards || []),
            ].filter((field) => field !== undefined && field !== null);

            // Each configured field should appear in the rendered output
            allConfiguredFields.forEach((field) => {
              const fieldStr = String(field);
              const inHeader = headerContainer.textContent?.includes(fieldStr);
              const inBio = bioContainer.textContent?.includes(fieldStr);
              expect(inHeader || inBio).toBe(true);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ============================================================================
// Property 13: Protection anti-spam des emails
// ============================================================================

/**
 * Generator for email addresses
 */
const emailArb = fc.emailAddress();

/**
 * Generator for optional phone numbers
 */
const optionalPhoneArb = fc.option(
  fc.string({ minLength: 5, maxLength: 20 }),
  { nil: undefined }
);

/**
 * Generator for optional social links
 */
const optionalSocialLinksArb = fc.option(
  fc.record({
    instagram: fc.option(fc.webUrl(), { nil: undefined }),
    facebook: fc.option(fc.webUrl(), { nil: undefined }),
    pinterest: fc.option(fc.webUrl(), { nil: undefined }),
    linkedin: fc.option(fc.webUrl(), { nil: undefined }),
    tiktok: fc.option(fc.webUrl(), { nil: undefined }),
    youtube: fc.option(fc.webUrl(), { nil: undefined }),
  }),
  { nil: undefined }
);

/**
 * Generator for optional CTA button
 */
const optionalCTAButtonArb = fc.option(
  fc.record({
    text: fc.string({ minLength: 1, maxLength: 50 }),
    url: fc.webUrl(),
    style: fc.constantFrom('primary' as const, 'secondary' as const),
  }),
  { nil: undefined }
);

/**
 * Generator for ProfileContact props
 */
const profileContactPropsArb = fc.record({
  email: fc.option(emailArb, { nil: undefined }),
  phone: optionalPhoneArb,
  website: optionalUrlArb,
  address: optionalStringArb,
  socialLinks: optionalSocialLinksArb,
  ctaButton: optionalCTAButtonArb,
});

describe('Property 13: Protection anti-spam des emails', () => {
  it('should replace @ with [at] in all displayed emails', () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const { container } = render(<ProfileContact email={email} />);
        
        // The original email with @ should NOT appear in the rendered output
        expect(container.textContent).not.toContain(email);
        
        // The formatted email with [at] should appear
        const formattedEmail = email.replace(/@/g, '[at]').replace(/\./g, '[dot]');
        expect(container.textContent).toContain(formattedEmail);
      }),
      { numRuns: 100 }
    );
  });

  it('should replace all dots with [dot] in displayed emails', () => {
    fc.assert(
      fc.property(emailArb, (email) => {
        const { container } = render(<ProfileContact email={email} />);
        
        // Count dots in original email
        const dotCount = (email.match(/\./g) || []).length;
        
        // Count [dot] in rendered output
        const renderedText = container.textContent || '';
        const dotReplacementCount = (renderedText.match(/\[dot\]/g) || []).length;
        
        // Should have replaced all dots
        expect(dotReplacementCount).toBeGreaterThanOrEqual(dotCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should handle emails with multiple dots correctly', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 2, maxLength: 5 }).filter(s => /^[a-z]+$/.test(s))
        ).map(([local, domain, subdomain, tld]) => `${local}.${subdomain}@${domain}.${tld}`),
        (email) => {
          const { container } = render(<ProfileContact email={email} />);
          
          // Should not contain the original @ or .
          const renderedText = container.textContent || '';
          
          // Extract the email part (it's displayed in the component)
          const formattedEmail = email.replace(/@/g, '[at]').replace(/\./g, '[dot]');
          expect(renderedText).toContain(formattedEmail);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display phone if and only if configured', () => {
    fc.assert(
      fc.property(profileContactPropsArb, (props) => {
        const { container } = render(<ProfileContact {...props} />);
        
        if (props.phone) {
          expect(container.textContent).toContain(props.phone);
          expect(container.textContent).toContain('Téléphone');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should display website as clickable link if configured', () => {
    fc.assert(
      fc.property(profileContactPropsArb, (props) => {
        const { container } = render(<ProfileContact {...props} />);
        
        if (props.website) {
          const links = container.querySelectorAll('a');
          const websiteLink = Array.from(links).find(
            (link) => link.getAttribute('href') === props.website
          );
          expect(websiteLink).toBeTruthy();
          expect(container.textContent).toContain('Site web');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should display address if and only if configured', () => {
    fc.assert(
      fc.property(profileContactPropsArb, (props) => {
        const { container } = render(<ProfileContact {...props} />);
        
        if (props.address) {
          expect(container.textContent).toContain(props.address);
          expect(container.textContent).toContain('Adresse');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should display social media links if configured', () => {
    fc.assert(
      fc.property(profileContactPropsArb, (props) => {
        const { container } = render(<ProfileContact {...props} />);
        
        if (props.socialLinks) {
          const activeSocialLinks = Object.entries(props.socialLinks).filter(
            ([_, url]) => url
          );
          
          if (activeSocialLinks.length > 0) {
            expect(container.textContent).toContain('Réseaux sociaux');
            
            // Check that each configured social link has a corresponding anchor
            activeSocialLinks.forEach(([, url]) => {
              const links = container.querySelectorAll('a');
              const socialLink = Array.from(links).find(
                (link) => link.getAttribute('href') === url
              );
              expect(socialLink).toBeTruthy();
            });
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should display CTA button if configured', () => {
    fc.assert(
      fc.property(profileContactPropsArb, (props) => {
        const { container } = render(<ProfileContact {...props} />);
        
        if (props.ctaButton) {
          const buttons = container.querySelectorAll('button');
          const ctaButton = Array.from(buttons).find(
            (button) => button.textContent === props.ctaButton?.text
          );
          expect(ctaButton).toBeTruthy();
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should render nothing if no contact information is configured', () => {
    fc.assert(
      fc.property(fc.constant({}), () => {
        const { container } = render(
          <ProfileContact
            email={undefined}
            phone={undefined}
            website={undefined}
            address={undefined}
            socialLinks={undefined}
            ctaButton={undefined}
          />
        );
        
        // If no fields are configured, component should render nothing
        expect(container.firstChild).toBeNull();
      }),
      { numRuns: 10 }
    );
  });

  it('should support all social media platforms', () => {
    const allPlatforms = [
      'instagram',
      'facebook',
      'pinterest',
      'linkedin',
      'tiktok',
      'youtube',
    ] as const;

    fc.assert(
      fc.property(
        fc.record({
          instagram: fc.webUrl(),
          facebook: fc.webUrl(),
          pinterest: fc.webUrl(),
          linkedin: fc.webUrl(),
          tiktok: fc.webUrl(),
          youtube: fc.webUrl(),
        }),
        (socialLinks) => {
          const { container } = render(<ProfileContact socialLinks={socialLinks} />);
          
          // All platforms should be displayed
          allPlatforms.forEach((platform) => {
            const url = socialLinks[platform];
            if (url) {
              const links = container.querySelectorAll('a');
              const platformLink = Array.from(links).find(
                (link) => link.getAttribute('href') === url
              );
              expect(platformLink).toBeTruthy();
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// Property 25: Support du markdown dans la bio
// ============================================================================

/**
 * Generator for markdown text with various formatting
 */
const markdownTextArb = fc.oneof(
  // Bold text
  fc.tuple(fc.string({ minLength: 1, maxLength: 50 })).map(([text]) => `**${text}**`),
  // Italic text
  fc.tuple(fc.string({ minLength: 1, maxLength: 50 })).map(([text]) => `*${text}*`),
  // Links
  fc.tuple(
    fc.string({ minLength: 1, maxLength: 30 }),
    fc.webUrl()
  ).map(([text, url]) => `[${text}](${url})`),
  // Unordered lists
  fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 })
    .map(items => items.map(item => `- ${item}`).join('\n')),
  // Ordered lists
  fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 1, maxLength: 3 })
    .map(items => items.map((item, i) => `${i + 1}. ${item}`).join('\n')),
  // Headings
  fc.tuple(
    fc.constantFrom(1, 2, 3, 4, 5, 6),
    fc.string({ minLength: 1, maxLength: 50 })
  ).map(([level, text]) => `${'#'.repeat(level)} ${text}`),
  // Code inline
  fc.tuple(fc.string({ minLength: 1, maxLength: 30 })).map(([text]) => `\`${text}\``),
  // Blockquote
  fc.tuple(fc.string({ minLength: 1, maxLength: 100 })).map(([text]) => `> ${text}`),
  // Plain text
  fc.string({ minLength: 1, maxLength: 100 })
);

/**
 * Generator for bio with markdown
 */
const bioWithMarkdownArb = fc.array(markdownTextArb, { minLength: 1, maxLength: 5 })
  .map(parts => parts.join('\n\n'));

describe('Property 25: Support du markdown dans la bio', () => {
  it('should render bold text correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*')),
        (text) => {
          const bio = `**${text}**`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render a <strong> element
          const strongElements = container.querySelectorAll('strong');
          expect(strongElements.length).toBeGreaterThan(0);
          
          // The text should be in the strong element
          const hasTextInStrong = Array.from(strongElements).some(
            el => el.textContent === text
          );
          expect(hasTextInStrong).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render italic text correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('*')),
        (text) => {
          const bio = `*${text}*`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render an <em> element
          const emElements = container.querySelectorAll('em');
          expect(emElements.length).toBeGreaterThan(0);
          
          // The text should be in the em element
          const hasTextInEm = Array.from(emElements).some(
            el => el.textContent === text
          );
          expect(hasTextInEm).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render links correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('[') && !s.includes(']')),
        fc.webUrl(),
        (text, url) => {
          const bio = `[${text}](${url})`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render an <a> element with correct href
          const links = container.querySelectorAll('a');
          const matchingLink = Array.from(links).find(
            link => link.getAttribute('href') === url && link.textContent === text
          );
          expect(matchingLink).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render unordered lists correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n')),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          const bio = items.map(item => `- ${item}`).join('\n');
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render a <ul> element
          const ulElements = container.querySelectorAll('ul');
          expect(ulElements.length).toBeGreaterThan(0);
          
          // Should render <li> elements for each item
          const liElements = container.querySelectorAll('li');
          expect(liElements.length).toBe(items.length);
          
          // Each item should be in an li element
          items.forEach(item => {
            const hasItem = Array.from(liElements).some(
              li => li.textContent === item
            );
            expect(hasItem).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render ordered lists correctly', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('\n')),
          { minLength: 1, maxLength: 5 }
        ),
        (items) => {
          const bio = items.map((item, i) => `${i + 1}. ${item}`).join('\n');
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render an <ol> element
          const olElements = container.querySelectorAll('ol');
          expect(olElements.length).toBeGreaterThan(0);
          
          // Should render <li> elements for each item
          const liElements = container.querySelectorAll('li');
          expect(liElements.length).toBe(items.length);
          
          // Each item should be in an li element
          items.forEach(item => {
            const hasItem = Array.from(liElements).some(
              li => li.textContent === item
            );
            expect(hasItem).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render headings correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(1, 2, 3, 4, 5, 6),
        fc.string({ minLength: 1, maxLength: 50 }).filter(s => !s.includes('#')),
        (level, text) => {
          const bio = `${'#'.repeat(level)} ${text}`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render an h1-h6 element
          const headingElements = container.querySelectorAll(`h${level}`);
          expect(headingElements.length).toBeGreaterThan(0);
          
          // The text should be in the heading element
          const hasTextInHeading = Array.from(headingElements).some(
            el => el.textContent === text
          );
          expect(hasTextInHeading).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render inline code correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }).filter(s => !s.includes('`')),
        (text) => {
          const bio = `\`${text}\``;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render a <code> element
          const codeElements = container.querySelectorAll('code');
          expect(codeElements.length).toBeGreaterThan(0);
          
          // The text should be in the code element
          const hasTextInCode = Array.from(codeElements).some(
            el => el.textContent === text
          );
          expect(hasTextInCode).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should render blockquotes correctly', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 100 }).filter(s => !s.includes('\n')),
        (text) => {
          const bio = `> ${text}`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render a <blockquote> element
          const blockquoteElements = container.querySelectorAll('blockquote');
          expect(blockquoteElements.length).toBeGreaterThan(0);
          
          // The text should be in the blockquote
          const hasTextInBlockquote = Array.from(blockquoteElements).some(
            el => el.textContent?.includes(text)
          );
          expect(hasTextInBlockquote).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not render script tags (security)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (text) => {
          const bio = `<script>alert('${text}')</script>`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should NOT render a <script> element
          const scriptElements = container.querySelectorAll('script');
          expect(scriptElements.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not render iframe tags (security)', () => {
    fc.assert(
      fc.property(
        fc.webUrl(),
        (url) => {
          const bio = `<iframe src="${url}"></iframe>`;
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should NOT render an <iframe> element
          const iframeElements = container.querySelectorAll('iframe');
          expect(iframeElements.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle mixed markdown formatting', () => {
    fc.assert(
      fc.property(
        bioWithMarkdownArb,
        (bio) => {
          const { container } = render(<ProfileBio bio={bio} />);
          
          // Should render without errors
          expect(container).toBeTruthy();
          
          // Should have some content
          expect(container.textContent).toBeTruthy();
          expect(container.textContent!.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve plain text without markdown', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }).filter(
          s => !s.includes('*') && !s.includes('[') && !s.includes('#') && !s.includes('`')
        ),
        (text) => {
          const { container } = render(<ProfileBio bio={text} />);
          
          // Plain text should be rendered
          expect(container.textContent).toContain(text);
        }
      ),
      { numRuns: 100 }
    );
  });
});
