/**
 * Password Reset Email Template
 * Sent to users when they request a password reset
 * 
 * Requirements 9.4, 9.5:
 * - Use existing email template infrastructure
 * - Include clear instructions in the reset email
 * - Include PikSend branding consistent with other email templates
 * - Include unique reset token in the password reset email
 * - Include reset link that expires after 1 hour
 * 
 * @module emails/password-reset-email
 */
import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseLayout, Button, colors } from './components';

export interface PasswordResetEmailProps {
  /** User's name (optional, falls back to email) */
  userName?: string;
  
  /** User's email address */
  userEmail: string;
  
  /** Password reset link with embedded token */
  resetLink: string;
  
  /** How long until the link expires (e.g., "1 hour") */
  expiresIn: string;
  
  /** IP address or location where the request was made from (optional) */
  requestedFrom?: string;
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
  securityBox: {
    backgroundColor: '#fee2e2', // red-100
    border: `1px solid #fca5a5`, // red-300
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
  },
  securityText: {
    color: '#991b1b', // red-900
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
  metaText: {
    color: colors.textMuted,
    fontSize: '11px',
    lineHeight: '16px',
    margin: '0',
    fontFamily: 'monospace',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function PasswordResetEmail({
  userName,
  userEmail,
  resetLink,
  expiresIn,
  requestedFrom,
}: PasswordResetEmailProps) {
  const displayName = userName || userEmail.split('@')[0];
  
  return (
    <BaseLayout
      preview={`Reset your PikSend password. This link expires in ${expiresIn}.`}
    >
      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Reset Your Password
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {displayName},
      </Text>
      
      <Text style={textStyles.paragraph}>
        We received a request to reset the password for your PikSend account ({userEmail}).
      </Text>

      <Text style={textStyles.paragraph}>
        Click the button below to choose a new password:
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={resetLink} variant="primary">
          Reset Password
        </Button>
      </Section>

      {/* Alternative Link */}
      <Text style={textStyles.helpText}>
        If the button doesn't work, copy and paste this link into your browser:
      </Text>
      <Text style={{ ...textStyles.helpText, marginBottom: '16px' }}>
        <Link href={resetLink} style={textStyles.link}>
          {resetLink}
        </Link>
      </Text>

      {/* Warning Box */}
      <Section style={textStyles.warningBox}>
        <Text style={textStyles.warningText}>
          ⏰ <strong>Important:</strong> This password reset link will expire in {expiresIn} for security reasons. 
          If it expires, you can request a new one from the login page.
        </Text>
      </Section>

      {/* Security Alert */}
      <Section style={textStyles.securityBox}>
        <Text style={textStyles.securityText}>
          🔒 <strong>Didn't request this?</strong> If you didn't request a password reset, 
          please ignore this email. Your password will remain unchanged. For security, 
          consider changing your password if you suspect unauthorized access.
        </Text>
      </Section>

      {/* Request Details */}
      {requestedFrom && (
        <>
          <Hr style={dividerStyle} />
          <Text style={textStyles.paragraph}>
            <strong>Request Details:</strong>
          </Text>
          <Text style={textStyles.metaText}>
            Requested from: {requestedFrom}
          </Text>
          <Text style={textStyles.metaText}>
            Time: {new Date().toLocaleString('en-US', { 
              dateStyle: 'long', 
              timeStyle: 'short',
              timeZone: 'UTC'
            })} UTC
          </Text>
        </>
      )}

      <Hr style={dividerStyle} />

      {/* Security Tips */}
      <Heading as="h2" style={{ ...textStyles.heading, fontSize: '18px', textAlign: 'left' }}>
        Password Security Tips
      </Heading>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Use at least 8 characters with a mix of letters, numbers, and symbols
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Avoid using personal information or common words
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Don't reuse passwords from other accounts
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Consider using a password manager
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Help Section */}
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
export default PasswordResetEmail;

// Preview props for development
PasswordResetEmail.PreviewProps = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  resetLink: 'https://piksend.com/reset-password?token=xyz789abc123',
  expiresIn: '1 hour',
  requestedFrom: '192.168.1.1 (Paris, France)',
} as PasswordResetEmailProps;
