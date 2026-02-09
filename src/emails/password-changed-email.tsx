/**
 * Password Changed Notification Email Template
 * Sent to users after their password has been successfully changed
 * 
 * Requirement 9.9:
 * - WHEN a new password is set, THE Email_Verification_System SHALL send 
 *   a confirmation email notifying the user
 * - Use existing email template infrastructure
 * - Include PikSend branding consistent with other email templates
 * 
 * @module emails/password-changed-email
 */
import {
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import { BaseLayout, Button, colors } from './components';

export interface PasswordChangedEmailProps {
  /** User's name (optional, falls back to email) */
  userName?: string;
  
  /** User's email address */
  userEmail: string;
  
  /** When the password was changed */
  changedAt: string;
  
  /** IP address or location where the change was made from (optional) */
  changedFrom?: string;
  
  /** Link to account security settings */
  securitySettingsLink?: string;
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
  successBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: colors.success,
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '9999px',
    display: 'inline-block',
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
  infoBox: {
    backgroundColor: '#dbeafe', // blue-100
    border: `1px solid #93c5fd`, // blue-300
    borderRadius: '8px',
    padding: '16px',
    margin: '24px 0',
  },
  infoText: {
    color: '#1e40af', // blue-900
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
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

export function PasswordChangedEmail({
  userName,
  userEmail,
  changedAt,
  changedFrom,
  securitySettingsLink = 'https://piksend.com/settings/security',
}: PasswordChangedEmailProps) {
  const displayName = userName || userEmail.split('@')[0];
  
  return (
    <BaseLayout
      preview={`Your PikSend password was successfully changed.`}
    >
      {/* Success Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={textStyles.successBadge}>✓ Password Changed</span>
      </Section>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Password Successfully Changed
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {displayName},
      </Text>
      
      <Text style={textStyles.paragraph}>
        This email confirms that the password for your PikSend account ({userEmail}) 
        was successfully changed.
      </Text>

      {/* Info Box */}
      <Section style={textStyles.infoBox}>
        <Text style={textStyles.infoText}>
          ℹ️ <strong>What this means:</strong> You'll need to use your new password 
          the next time you sign in to PikSend. If you're signed in on other devices, 
          you may need to sign in again with your new password.
        </Text>
      </Section>

      {/* Change Details */}
      <Hr style={dividerStyle} />
      
      <Text style={textStyles.paragraph}>
        <strong>Change Details:</strong>
      </Text>
      <Text style={textStyles.metaText}>
        Changed at: {changedAt}
      </Text>
      {changedFrom && (
        <Text style={textStyles.metaText}>
          Changed from: {changedFrom}
        </Text>
      )}

      {/* Security Alert */}
      <Section style={textStyles.securityBox}>
        <Text style={textStyles.securityText}>
          🔒 <strong>Didn't make this change?</strong> If you didn't change your password, 
          your account may have been compromised. Please secure your account immediately:
        </Text>
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={securitySettingsLink} variant="error">
          Secure My Account
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Security Best Practices */}
      <Heading as="h2" style={{ ...textStyles.heading, fontSize: '18px', textAlign: 'left' }}>
        Keep Your Account Secure
      </Heading>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Never share your password with anyone
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Use a unique password for PikSend
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Enable two-factor authentication for extra security
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
          ✓ Be cautious of phishing emails asking for your credentials
        </Text>
      </Section>

      <Text style={textStyles.paragraph}>
        You can review your account security settings and recent activity at any time:
      </Text>

      <Text style={textStyles.paragraph}>
        <Link href={securitySettingsLink} style={textStyles.link}>
          View Security Settings →
        </Link>
      </Text>

      <Hr style={dividerStyle} />

      {/* Help Section */}
      <Text style={textStyles.helpText}>
        If you have any questions or concerns about your account security, please contact 
        our support team immediately. Visit our{' '}
        <Link href="https://piksend.com/help" style={textStyles.link}>
          Help Center
        </Link>
        {' '}for assistance.
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default PasswordChangedEmail;

// Preview props for development
PasswordChangedEmail.PreviewProps = {
  userName: 'John Doe',
  userEmail: 'john@example.com',
  changedAt: new Date().toLocaleString('en-US', { 
    dateStyle: 'long', 
    timeStyle: 'short',
    timeZone: 'UTC'
  }) + ' UTC',
  changedFrom: '192.168.1.1 (Paris, France)',
  securitySettingsLink: 'https://piksend.com/settings/security',
} as PasswordChangedEmailProps;
