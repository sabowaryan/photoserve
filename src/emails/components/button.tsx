/**
 * Email Button Component
 * Reusable CTA button for email templates
 * 
 * @module emails/components/button
 */
import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';
import { colors } from './base-layout';

export interface ButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

const variantStyles = {
  primary: {
    backgroundColor: colors.primary,
    color: colors.white,
  },
  secondary: {
    backgroundColor: colors.secondary,
    color: colors.white,
  },
  success: {
    backgroundColor: colors.success,
    color: colors.white,
  },
  warning: {
    backgroundColor: colors.warning,
    color: colors.white,
  },
  error: {
    backgroundColor: colors.error,
    color: colors.white,
  },
};

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      style={{
        ...variantStyles[variant],
        display: 'inline-block',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        textDecoration: 'none',
        textAlign: 'center' as const,
      }}
    >
      {children}
    </EmailButton>
  );
}
