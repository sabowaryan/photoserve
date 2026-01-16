/**
 * Base Email Layout Component
 * Provides consistent styling and structure for all PikSend emails
 * 
 * @module emails/components/base-layout
 */
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface BaseLayoutProps {
  preview: string;
  children: React.ReactNode;
  photographerLogo?: string;
  photographerName?: string;
}

// PikSend brand colors
const colors = {
  primary: '#6366f1', // indigo-500
  secondary: '#8b5cf6', // violet-500
  accent: '#ec4899', // pink-500
  success: '#22c55e', // green-500
  warning: '#f59e0b', // amber-500
  error: '#ef4444', // red-500
  text: '#1e293b', // slate-800
  textMuted: '#64748b', // slate-500
  background: '#f8fafc', // slate-50
  white: '#ffffff',
  border: '#e2e8f0', // slate-200
};

const styles = {
  main: {
    backgroundColor: colors.background,
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  container: {
    margin: '0 auto',
    padding: '40px 20px',
    maxWidth: '600px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logo: {
    margin: '0 auto',
    marginBottom: '16px',
  },
  content: {
    backgroundColor: colors.white,
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${colors.border}`,
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '32px',
    padding: '0 20px',
  },
  footerText: {
    color: colors.textMuted,
    fontSize: '12px',
    lineHeight: '20px',
    margin: '0',
  },
  footerLink: {
    color: colors.primary,
    textDecoration: 'none',
  },
  divider: {
    borderTop: `1px solid ${colors.border}`,
    margin: '24px 0',
  },
};

export function BaseLayout({
  preview,
  children,
  photographerLogo,
  photographerName,
}: BaseLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          {/* Header with Logo */}
          <Section style={styles.header}>
            {photographerLogo ? (
              <Img
                src={photographerLogo}
                alt={photographerName || 'Photographer'}
                width="120"
                height="40"
                style={styles.logo}
              />
            ) : (
              <Img
                src="https://piksend.com/logo.png"
                alt="PikSend"
                width="120"
                height="40"
                style={styles.logo}
              />
            )}
          </Section>

          {/* Main Content */}
          <Section style={styles.content}>
            {children}
          </Section>

          {/* Footer */}
          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Powered by{' '}
              <Link href="https://piksend.com" style={styles.footerLink}>
                PikSend
              </Link>
              {' '}— Professional Photo Galleries
            </Text>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} PikSend. All rights reserved.
            </Text>
            <Text style={{ ...styles.footerText, marginTop: '8px' }}>
              <Link href="https://piksend.com/help" style={styles.footerLink}>
                Help Center
              </Link>
              {' • '}
              <Link href="https://piksend.com/privacy" style={styles.footerLink}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href="https://piksend.com/terms" style={styles.footerLink}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Export colors and common styles for use in other templates
export { colors, styles };
