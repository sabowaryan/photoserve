/**
 * Internationalized Email Verification Template
 * Sent to users when they register to verify their email address
 * Supports all PikSend locales with proper translations
 * 
 * Requirements 5.4, 5.5, 5.6, 9.4, 9.5:
 * - Use existing email template infrastructure (React Email components)
 * - Include clear instructions in the confirmation email
 * - Include PikSend branding consistent with other email templates
 * - Add internationalization support to templates
 * 
 * @module emails/i18n-verification-email
 */
import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseLayout, Button, colors } from './components';
import { SupportedLocale } from '@/lib/i18n/types';
import { getTranslation } from '@/lib/i18n/server';

export interface I18nVerificationEmailProps {
  /** User's name (optional, falls back to email) */
  userName?: string;
  
  /** User's email address */
  userEmail: string;
  
  /** Verification link with embedded token */
  verificationLink: string;
  
  /** How long until the link expires (e.g., "24 hours") */
  expiresIn: string;
  
  /** User's preferred locale */
  locale?: SupportedLocale;
}

const textStyles = {
  heading: {
    color: colors.text,
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '32px',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
  },
  paragraph: {
    color: colors.text,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 16px 0',
  },
  warningBox: {
    backgroundColor: '#fef3c7', // amber-100
    border: `1px solid #fbbf24`, // amber-400
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
  },
  warningText: {
    color: '#92400e', // amber-900
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
    wordBreak: 'break-all' as const,
  },
  helpText: {
    color: colors.textMuted,
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function I18nVerificationEmail({
  userName,
  userEmail,
  verificationLink,
  expiresIn,
  locale = 'en',
}: I18nVerificationEmailProps) {
  const displayName = userName || userEmail.split('@')[0] || 'User';
  const t = (key: string, params?: Record<string, string | number>) => 
    getTranslation(locale, key, params);
  
  return (
    <BaseLayout
      preview={t('emails.verification.preview')}
    >
      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        {t('emails.verification.heading')}
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        {t('emails.verification.greeting', { name: displayName })}
      </Text>
      
      <Text style={textStyles.paragraph}>
        {t('emails.verification.intro')}
      </Text>

      <Text style={textStyles.paragraph}>
        {t('emails.verification.instructions')}
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={verificationLink} variant="primary">
          {t('emails.verification.button')}
        </Button>
      </Section>

      {/* Alternative Link */}
      <Text style={textStyles.helpText}>
        {t('emails.verification.alternativeLink')}
      </Text>
      <Text style={{ ...textStyles.helpText, marginBottom: '16px' }}>
        <Link href={verificationLink} style={textStyles.link}>
          {verificationLink}
        </Link>
      </Text>

      {/* Warning Box */}
      <Section style={textStyles.warningBox}>
        <Text style={textStyles.warningText}>
          {t('emails.verification.expiresWarning', { expiresIn })}
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What's Next */}
      <Heading as="h2" style={{ ...textStyles.heading, fontSize: '18px', textAlign: 'left' }}>
        {t('emails.verification.whatsNext')}
      </Heading>

      <Text style={textStyles.paragraph}>
        {t('emails.verification.whatsNextIntro')}
      </Text>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          {t('emails.verification.feature1')}
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          {t('emails.verification.feature2')}
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          {t('emails.verification.feature3')}
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          {t('emails.verification.feature4')}
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Help Section */}
      <Text style={textStyles.paragraph}>
        {t('emails.verification.didntRequest')}
      </Text>

      <Text style={textStyles.helpText}>
        {t('emails.verification.needHelp')}
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default I18nVerificationEmail;

// Preview props for development
I18nVerificationEmail.PreviewProps = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  verificationLink: 'https://piksend.com/verify-email?token=abc123xyz789',
  expiresIn: '24 hours',
  locale: 'en',
} as I18nVerificationEmailProps;
