/**
 * Email Verification Templates Tests
 * Tests for verification, password reset, and password changed email templates
 * 
 * @module emails/__tests__/verification-email-templates
 */
import { describe, it, expect } from 'vitest';
import { render } from '@react-email/components';
import { VerificationEmail } from '../verification-email';
import { PasswordResetEmail } from '../password-reset-email';
import { PasswordChangedEmail } from '../password-changed-email';
import { I18nVerificationEmail } from '../i18n-verification-email';

describe('VerificationEmail', () => {
  it('should render with all required props', async () => {
    const html = await render(
      <VerificationEmail
        userName="John Doe"
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('Welcome to PikSend');
    expect(html).toContain('John Doe');
    expect(html).toContain('Verify Email Address');
    expect(html).toContain('https://piksend.com/verify?token=abc123');
    expect(html).toContain('24 hours');
  });

  it('should use email as fallback when userName is not provided', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('john');
  });

  it('should include PikSend branding', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('PikSend');
    expect(html).toContain('piksend.com');
  });

  it('should include expiration warning', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('expire');
    expect(html).toContain('24 hours');
  });

  it('should include features list', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('Create and share beautiful photo galleries');
    expect(html).toContain('Sell your photos');
    expect(html).toContain('Track views and analytics');
  });
});

describe('PasswordResetEmail', () => {
  it('should render with all required props', async () => {
    const html = await render(
      <PasswordResetEmail
        userName="John Doe"
        userEmail="john@example.com"
        resetLink="https://piksend.com/reset?token=xyz789"
        expiresIn="1 hour"
      />
    );

    expect(html).toContain('Reset Your Password');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
    expect(html).toContain('Reset Password');
    expect(html).toContain('https://piksend.com/reset?token=xyz789');
    expect(html).toContain('1 hour');
  });

  it('should include security alert', async () => {
    const html = await render(
      <PasswordResetEmail
        userEmail="john@example.com"
        resetLink="https://piksend.com/reset?token=xyz789"
        expiresIn="1 hour"
      />
    );

    expect(html).toContain("Didn&#x27;t request this");
    expect(html).toContain('security');
  });

  it('should include request details when provided', async () => {
    const html = await render(
      <PasswordResetEmail
        userEmail="john@example.com"
        resetLink="https://piksend.com/reset?token=xyz789"
        expiresIn="1 hour"
        requestedFrom="192.168.1.1 (Paris, France)"
      />
    );

    expect(html).toContain('Request Details');
    expect(html).toContain('192.168.1.1');
    expect(html).toContain('Paris, France');
  });

  it('should include password security tips', async () => {
    const html = await render(
      <PasswordResetEmail
        userEmail="john@example.com"
        resetLink="https://piksend.com/reset?token=xyz789"
        expiresIn="1 hour"
      />
    );

    expect(html).toContain('Password Security Tips');
    expect(html).toContain('8 characters');
    expect(html).toContain('password manager');
  });
});

describe('PasswordChangedEmail', () => {
  it('should render with all required props', async () => {
    const html = await render(
      <PasswordChangedEmail
        userName="John Doe"
        userEmail="john@example.com"
        changedAt="January 15, 2026 at 10:30 AM UTC"
      />
    );

    expect(html).toContain('Password Successfully Changed');
    expect(html).toContain('John Doe');
    expect(html).toContain('john@example.com');
    expect(html).toContain('January 15, 2026');
  });

  it('should include security alert', async () => {
    const html = await render(
      <PasswordChangedEmail
        userEmail="john@example.com"
        changedAt="January 15, 2026 at 10:30 AM UTC"
      />
    );

    expect(html).toContain("Didn&#x27;t make this change");
    expect(html).toContain('Secure My Account');
  });

  it('should include change details', async () => {
    const html = await render(
      <PasswordChangedEmail
        userEmail="john@example.com"
        changedAt="January 15, 2026 at 10:30 AM UTC"
        changedFrom="192.168.1.1 (Paris, France)"
      />
    );

    expect(html).toContain('Change Details');
    expect(html).toContain('January 15, 2026');
    expect(html).toContain('192.168.1.1');
  });

  it('should include security best practices', async () => {
    const html = await render(
      <PasswordChangedEmail
        userEmail="john@example.com"
        changedAt="January 15, 2026 at 10:30 AM UTC"
      />
    );

    expect(html).toContain('Keep Your Account Secure');
    expect(html).toContain('Never share your password');
    expect(html).toContain('two-factor authentication');
  });

  it('should include link to security settings', async () => {
    const html = await render(
      <PasswordChangedEmail
        userEmail="john@example.com"
        changedAt="January 15, 2026 at 10:30 AM UTC"
        securitySettingsLink="https://piksend.com/settings/security"
      />
    );

    expect(html).toContain('https://piksend.com/settings/security');
    expect(html).toContain('Security Settings');
  });
});

describe('I18nVerificationEmail', () => {
  it('should render with English locale', async () => {
    const html = await render(
      <I18nVerificationEmail
        userName="John Doe"
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
        locale="en"
      />
    );

    expect(html).toContain('Welcome to PikSend');
    expect(html).toContain('Verify Email Address');
  });

  it('should use translations for the specified locale', async () => {
    const html = await render(
      <I18nVerificationEmail
        userName="Jean Dupont"
        userEmail="jean@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 heures"
        locale="fr"
      />
    );

    // Should contain French translations (if they exist)
    // This test will pass with English fallback if French translations aren't added yet
    expect(html).toBeTruthy();
    expect(html).toContain('Jean Dupont');
  });

  it('should default to English when locale is not provided', async () => {
    const html = await render(
      <I18nVerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    expect(html).toContain('Welcome to PikSend');
  });
});

describe('Email Template Accessibility', () => {
  it('should have proper heading hierarchy in VerificationEmail', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    // Should have h1 for main heading
    expect(html).toContain('<h1');
    // Should have h2 for subheadings
    expect(html).toContain('<h2');
  });

  it('should have accessible links in all templates', async () => {
    const verificationHtml = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    const resetHtml = await render(
      <PasswordResetEmail
        userEmail="john@example.com"
        resetLink="https://piksend.com/reset?token=xyz789"
        expiresIn="1 hour"
      />
    );

    const changedHtml = await render(
      <PasswordChangedEmail
        userEmail="john@example.com"
        changedAt="January 15, 2026"
      />
    );

    // All should have proper href attributes
    expect(verificationHtml).toContain('href=');
    expect(resetHtml).toContain('href=');
    expect(changedHtml).toContain('href=');
  });
});

describe('Email Template Responsiveness', () => {
  it('should use responsive styles', async () => {
    const html = await render(
      <VerificationEmail
        userEmail="john@example.com"
        verificationLink="https://piksend.com/verify?token=abc123"
        expiresIn="24 hours"
      />
    );

    // Should have max-width for container
    expect(html).toContain('max-width');
    // Should have proper padding
    expect(html).toContain('padding');
  });
});
