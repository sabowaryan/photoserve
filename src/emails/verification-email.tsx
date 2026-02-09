/**
 * Email Verification Template
 * Sent to users when they register to verify their email address
 * 
 * Requirements 5.4, 5.5, 5.6:
 * - Use existing email template infrastructure (React Email components)
 * - Include clear instructions in the confirmation email
 * - Include PikSend branding consistent with other email templates
 * - Include unique verification token in the confirmation email
 * - Include verification link that expires after 24 hours
 * 
 * @module emails/verification-email
 */
import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseLayout, Button, colors } from './components';

export interface VerificationEmailProps {
  /** User's name (optional, falls back to email) */
  userName?: string;
  
  /** User's email address */
  userEmail: string;
  
  /** Verification link with embedded token */
  verificationLink: string;
  
  /** How long until the link expires (e.g., "24 hours") */
  expiresIn: string;
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
  highlight: {
    color: colors.primary,
    fontWeight: '600',
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

export function VerificationEmail({
  userName,
  userEmail,
  verificationLink,
  expiresIn,
}: VerificationEmailProps) {
  const displayName = userName || userEmail.split('@')[0];
  
  return (
    <BaseLayout
      preview={`Welcome to PikSend! Please verify your email address to get started.`}
    >
      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Welcome to PikSend! 🎉
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {displayName},
      </Text>
      
      <Text style={textStyles.paragraph}>
        Thank you for signing up for PikSend! We're excited to have you join our community 
        of professional photographers.
      </Text>

      <Text style={textStyles.paragraph}>
        To get started and access all features, please verify your email address by clicking 
        the button below:
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={verificationLink} variant="primary">
          Verify Email Address
        </Button>
      </Section>

      {/* Alternative Link */}
      <Text style={textStyles.helpText}>
        If the button doesn't work, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...textStyles.helpText, marginBottom: '16px' }}>
        <Link href={verificationLink} style={textStyles.link}>
          {verificationLink}
        </Link>
      </Text>

      {/* Warning Box */}
      <Section style={textStyles.warningBox}>
        <Text style={textStyles.warningText}>
          ⏰ <strong>Important:</strong> This verification link will expire in {expiresIn}. 
          If it expires, you can request a new verification email from your account.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* What's Next */}
      <Heading as="h2" style={{ ...textStyles.heading, fontSize: '18px', textAlign: 'left' }}>
        What's Next?
      </Heading>

      <Text style={textStyles.paragraph}>
        Once your email is verified, you'll be able to:
      </Text>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Create and share beautiful photo galleries
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Sell your photos with secure payment processing
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Track views and analytics for your galleries
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Customize your galleries with your branding
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Help Section */}
      <Text style={textStyles.paragraph}>
        If you didn't create an account with PikSend, you can safely ignore this email.
      </Text>

      <Text style={textStyles.helpText}>
        Need help? Visit our{' '}
        <Link href="https://piksend.com/help" style={textStyles.link}>
          Help Center
        </Link>
        {' '}or contact our support team.
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default VerificationEmail;

// Preview props for development
VerificationEmail.PreviewProps = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  verificationLink: 'https://piksend.com/verify-email?token=abc123xyz789',
  expiresIn: '24 hours',
} as VerificationEmailProps;
