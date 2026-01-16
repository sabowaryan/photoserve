/**
 * Payout Notification Email Template
 * Sent to photographers when payouts are created, paid, or failed
 * 
 * Requirement 8.3: Payout Notifications
 * - WHEN payout is created, THE System SHALL send notification
 * - THE Email SHALL include: Amount, Arrival date, Bank account (last 4)
 * - WHEN payout is paid, THE System SHALL send confirmation
 * - WHEN payout fails, THE System SHALL send alert with action steps
 * 
 * @module emails/payout-notification
 */
import {
  Column,
  Heading,
  Hr,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components';

import { BaseLayout, Button, colors } from './components';

export type PayoutStatus = 'pending' | 'in_transit' | 'paid' | 'failed';

export interface PayoutNotificationEmailProps {
  // Photographer info
  photographerName: string;
  
  // Payout info
  payoutId: string;
  amount: string; // Formatted amount (e.g., "$1,234.56")
  currency: string;
  status: PayoutStatus;
  
  // Bank info
  bankName?: string;
  bankAccountLast4: string;
  
  // Dates
  createdDate: string;
  arrivalDate?: string; // Expected or actual arrival date
  
  // Failure info (for failed payouts)
  failureReason?: string;
  failureCode?: string;
  
  // Links
  dashboardLink: string;
  payoutDetailsLink: string;
  stripeDashboardLink?: string;
  
  // Balance info (optional)
  remainingBalance?: string;
}

const statusConfig = {
  pending: {
    emoji: '⏳',
    title: 'Payout Initiated',
    badge: {
      backgroundColor: '#fef3c7', // amber-100
      color: colors.warning,
    },
    description: 'Your payout has been initiated and is being processed.',
  },
  in_transit: {
    emoji: '🚀',
    title: 'Payout On Its Way',
    badge: {
      backgroundColor: '#dbeafe', // blue-100
      color: '#3b82f6', // blue-500
    },
    description: 'Your payout is on its way to your bank account.',
  },
  paid: {
    emoji: '✅',
    title: 'Payout Complete',
    badge: {
      backgroundColor: '#dcfce7', // green-100
      color: colors.success,
    },
    description: 'Your payout has been successfully deposited to your bank account.',
  },
  failed: {
    emoji: '⚠️',
    title: 'Payout Failed',
    badge: {
      backgroundColor: '#fee2e2', // red-100
      color: colors.error,
    },
    description: 'There was an issue with your payout. Please review the details below.',
  },
};

const textStyles = {
  heading: {
    color: colors.text,
    fontSize: '24px',
    fontWeight: '700',
    lineHeight: '32px',
    margin: '0 0 16px 0',
    textAlign: 'center' as const,
  },
  subheading: {
    color: colors.text,
    fontSize: '18px',
    fontWeight: '600',
    lineHeight: '24px',
    margin: '24px 0 12px 0',
  },
  paragraph: {
    color: colors.text,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 16px 0',
  },
  label: {
    color: colors.textMuted,
    fontSize: '12px',
    fontWeight: '500',
    lineHeight: '16px',
    margin: '0 0 4px 0',
    textTransform: 'uppercase' as const,
  },
  value: {
    color: colors.text,
    fontSize: '14px',
    fontWeight: '600',
    lineHeight: '20px',
    margin: '0 0 16px 0',
  },
  amountHighlight: {
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center' as const,
    margin: '16px 0',
  },
  emoji: {
    fontSize: '32px',
    textAlign: 'center' as const,
    margin: '0 0 16px 0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
  },
  alertBox: {
    backgroundColor: '#fee2e2', // red-100
    borderLeft: `4px solid ${colors.error}`,
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px',
  },
  alertTitle: {
    color: colors.error,
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  alertText: {
    color: colors.text,
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function PayoutNotificationEmail({
  photographerName,
  payoutId,
  amount,
  currency,
  status,
  bankName,
  bankAccountLast4,
  createdDate,
  arrivalDate,
  failureReason,
  failureCode,
  dashboardLink,
  payoutDetailsLink,
  stripeDashboardLink,
  remainingBalance,
}: PayoutNotificationEmailProps) {
  const config = statusConfig[status];
  
  return (
    <BaseLayout
      preview={`${config.emoji} ${config.title}: ${amount} ${status === 'paid' ? 'deposited' : status === 'failed' ? 'failed' : 'processing'}`}
    >
      {/* Status Emoji */}
      <Text style={textStyles.emoji}>{config.emoji}</Text>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        {config.title}
      </Heading>

      {/* Status Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={{
          ...config.badge,
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 12px',
          borderRadius: '9999px',
          display: 'inline-block',
          textTransform: 'uppercase',
        }}>
          {status.replace('_', ' ')}
        </span>
      </Section>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {photographerName},
      </Text>
      <Text style={textStyles.paragraph}>
        {config.description}
      </Text>

      {/* Amount Highlight */}
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Text style={{
          ...textStyles.amountHighlight,
          color: status === 'failed' ? colors.error : colors.success,
        }}>
          {amount}
        </Text>
      </Section>

      {/* Failure Alert (for failed payouts) */}
      {status === 'failed' && failureReason && (
        <Section style={textStyles.alertBox}>
          <Text style={textStyles.alertTitle}>
            ⚠️ What went wrong
          </Text>
          <Text style={textStyles.alertText}>
            {failureReason}
            {failureCode && (
              <span style={{ color: colors.textMuted }}> (Code: {failureCode})</span>
            )}
          </Text>
        </Section>
      )}

      <Hr style={dividerStyle} />

      {/* Payout Details */}
      <Heading as="h2" style={textStyles.subheading}>
        Payout Details
      </Heading>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Amount</Text>
          <Text style={textStyles.value}>{amount}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Currency</Text>
          <Text style={textStyles.value}>{currency.toUpperCase()}</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Bank Account</Text>
          <Text style={textStyles.value}>
            {bankName ? `${bankName} ` : ''}••••{bankAccountLast4}
          </Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>
            {status === 'paid' ? 'Deposited On' : 'Expected Arrival'}
          </Text>
          <Text style={textStyles.value}>
            {arrivalDate || 'Processing'}
          </Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Payout ID</Text>
          <Text style={{ ...textStyles.value, fontFamily: 'monospace', fontSize: '12px' }}>
            {payoutId}
          </Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Initiated</Text>
          <Text style={textStyles.value}>{createdDate}</Text>
        </Column>
      </Row>

      {remainingBalance && (
        <>
          <Hr style={dividerStyle} />
          <Row>
            <Column>
              <Text style={textStyles.label}>Remaining Balance</Text>
              <Text style={textStyles.value}>{remainingBalance}</Text>
            </Column>
          </Row>
        </>
      )}

      {/* Action Steps for Failed Payouts */}
      {status === 'failed' && (
        <>
          <Hr style={dividerStyle} />
          <Heading as="h2" style={textStyles.subheading}>
            What to do next
          </Heading>
          <Section style={{ marginBottom: '16px' }}>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
              1. <strong>Verify your bank details</strong> in your Stripe Dashboard
            </Text>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
              2. <strong>Ensure your account is active</strong> and can receive deposits
            </Text>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
              3. <strong>Contact your bank</strong> if the issue persists
            </Text>
            <Text style={{ ...textStyles.paragraph, margin: '0' }}>
              4. <strong>Retry the payout</strong> once the issue is resolved
            </Text>
          </Section>
        </>
      )}

      {/* CTA Buttons */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        {status === 'failed' && stripeDashboardLink ? (
          <Button href={stripeDashboardLink} variant="error">
            Update Bank Details
          </Button>
        ) : (
          <Button href={payoutDetailsLink} variant="primary">
            View Payout Details
          </Button>
        )}
        <Text style={{ ...textStyles.paragraph, marginTop: '16px', marginBottom: '0' }}>
          <Link href={dashboardLink} style={textStyles.link}>
            Go to Revenue Dashboard →
          </Link>
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Info */}
      <Text style={{ ...textStyles.paragraph, color: colors.textMuted, fontSize: '12px' }}>
        {status === 'paid' ? (
          <>
            This payout has been deposited to your bank account. It may take 1-2 business days 
            to appear in your account depending on your bank.
          </>
        ) : status === 'failed' ? (
          <>
            The funds from this failed payout will remain in your PikSend balance. 
            Once you resolve the issue, the payout will be retried automatically.
          </>
        ) : (
          <>
            Payouts typically arrive within 2-5 business days depending on your bank. 
            You can track the status in your{' '}
            <Link href={dashboardLink} style={textStyles.link}>
              Revenue Dashboard
            </Link>
            .
          </>
        )}
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default PayoutNotificationEmail;

// Preview props for development
PayoutNotificationEmail.PreviewProps = {
  photographerName: 'Jane',
  payoutId: 'po_1NxYz1234567890',
  amount: '$1,234.56',
  currency: 'USD',
  status: 'paid',
  bankName: 'Chase',
  bankAccountLast4: '4242',
  createdDate: 'January 15, 2026',
  arrivalDate: 'January 17, 2026',
  dashboardLink: 'https://piksend.com/revenue',
  payoutDetailsLink: 'https://piksend.com/revenue/payouts/po_1NxYz1234567890',
  stripeDashboardLink: 'https://dashboard.stripe.com/payouts',
  remainingBalance: '$567.89',
} as PayoutNotificationEmailProps;
