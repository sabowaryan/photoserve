/**
 * Dispute Alert Email Template
 * Sent to photographers when a dispute/chargeback is created
 * 
 * Requirement 8.4: Issue Alerts
 * - WHEN dispute is created, THE System SHALL send urgent alert
 * - THE Alerts SHALL include clear action steps
 * 
 * Requirement 7.2: Dispute Handling
 * - THE System SHALL notify photographer immediately (email + in-app)
 * - THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
 * 
 * @module emails/dispute-alert
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

export type DisputeReason = 
  | 'duplicate'
  | 'fraudulent'
  | 'subscription_canceled'
  | 'product_unacceptable'
  | 'product_not_received'
  | 'unrecognized'
  | 'credit_not_processed'
  | 'general'
  | 'other';

export interface DisputeAlertEmailProps {
  // Photographer info
  photographerName: string;
  
  // Dispute info
  amount: string; // Disputed amount (e.g., "$49.99")
  reason: DisputeReason;
  reasonDescription?: string;
  
  // Original transaction
  galleryName: string;
  clientEmail: string;
  purchaseDate: string;
  transactionId: string;
  
  // Deadline
  responseDeadline: string;
  daysRemaining: number;
  
  // Evidence needed
  evidenceRequired: string[];
  
  // Links
  dashboardLink: string;
  disputeDetailsLink: string;
  stripeDashboardLink: string;
}

const reasonLabels: Record<DisputeReason, string> = {
  duplicate: 'Duplicate Charge',
  fraudulent: 'Fraudulent Transaction',
  subscription_canceled: 'Subscription Canceled',
  product_unacceptable: 'Product Unacceptable',
  product_not_received: 'Product Not Received',
  unrecognized: 'Unrecognized Transaction',
  credit_not_processed: 'Credit Not Processed',
  general: 'General Dispute',
  other: 'Other',
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
  urgentBadge: {
    backgroundColor: colors.error,
    color: colors.white,
    fontSize: '12px',
    fontWeight: '700',
    padding: '6px 16px',
    borderRadius: '9999px',
    display: 'inline-block',
    textTransform: 'uppercase' as const,
  },
  warningEmoji: {
    fontSize: '40px',
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
  warningBox: {
    backgroundColor: '#fef3c7', // amber-100
    borderLeft: `4px solid ${colors.warning}`,
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px',
  },
  deadlineBox: {
    backgroundColor: colors.error,
    color: colors.white,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
    marginBottom: '24px',
  },
  deadlineValue: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0',
  },
  deadlineLabel: {
    fontSize: '12px',
    margin: '4px 0 0 0',
    opacity: 0.9,
  },
  stepNumber: {
    backgroundColor: colors.primary,
    color: colors.white,
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '700',
    marginRight: '12px',
  },
  evidenceItem: {
    color: colors.text,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0 0 8px 0',
    paddingLeft: '8px',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function DisputeAlertEmail({
  photographerName,
  amount,
  reason,
  reasonDescription,
  galleryName,
  clientEmail,
  purchaseDate,
  transactionId,
  responseDeadline,
  daysRemaining,
  evidenceRequired,
  disputeDetailsLink,
  stripeDashboardLink,
}: DisputeAlertEmailProps) {
  const reasonLabel = reasonLabels[reason] || reason;
  
  return (
    <BaseLayout
      preview={`⚠️ URGENT: Dispute received for ${amount} - Action required within ${daysRemaining} days`}
    >
      {/* Warning Emoji */}
      <Text style={textStyles.warningEmoji}>⚠️</Text>

      {/* Urgent Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={textStyles.urgentBadge}>⚡ Urgent Action Required</span>
      </Section>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Dispute Received
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {photographerName},
      </Text>
      <Text style={textStyles.paragraph}>
        A client has filed a dispute (chargeback) for a purchase from your gallery. 
        <strong> You must respond before the deadline to avoid losing the funds.</strong>
      </Text>

      {/* Deadline Box */}
      <Section style={textStyles.deadlineBox}>
        <Text style={textStyles.deadlineValue}>
          {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'} Remaining
        </Text>
        <Text style={textStyles.deadlineLabel}>
          Respond by {responseDeadline}
        </Text>
      </Section>

      {/* Alert Box */}
      <Section style={textStyles.alertBox}>
        <Text style={{ ...textStyles.paragraph, margin: '0', fontWeight: '600', color: colors.error }}>
          💰 Amount at Risk: {amount}
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Dispute Details */}
      <Heading as="h2" style={textStyles.subheading}>
        Dispute Details
      </Heading>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Disputed Amount</Text>
          <Text style={{ ...textStyles.value, color: colors.error }}>{amount}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Reason</Text>
          <Text style={textStyles.value}>{reasonLabel}</Text>
        </Column>
      </Row>

      {reasonDescription && (
        <Section style={{ marginBottom: '16px' }}>
          <Text style={textStyles.label}>Client&apos;s Statement</Text>
          <Text style={{ 
            ...textStyles.value, 
            fontStyle: 'italic',
            backgroundColor: colors.background,
            padding: '12px',
            borderRadius: '4px',
          }}>
            &quot;{reasonDescription}&quot;
          </Text>
        </Section>
      )}

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Gallery</Text>
          <Text style={textStyles.value}>{galleryName}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Client Email</Text>
          <Text style={textStyles.value}>{clientEmail}</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Purchase Date</Text>
          <Text style={textStyles.value}>{purchaseDate}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Transaction ID</Text>
          <Text style={{ ...textStyles.value, fontFamily: 'monospace', fontSize: '12px' }}>
            {transactionId}
          </Text>
        </Column>
      </Row>

      <Hr style={dividerStyle} />

      {/* Evidence Required */}
      <Heading as="h2" style={textStyles.subheading}>
        Evidence to Submit
      </Heading>

      <Text style={textStyles.paragraph}>
        To win this dispute, you should provide the following evidence:
      </Text>

      <Section style={{ marginBottom: '16px' }}>
        {evidenceRequired.map((evidence, index) => (
          <Text key={index} style={textStyles.evidenceItem}>
            ✓ {evidence}
          </Text>
        ))}
      </Section>

      <Hr style={dividerStyle} />

      {/* Action Steps */}
      <Heading as="h2" style={textStyles.subheading}>
        What to Do Now
      </Heading>

      <Section style={{ marginBottom: '24px' }}>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 12px 0' }}>
          <span style={textStyles.stepNumber}>1</span>
          <strong>Review the dispute details</strong> in your Stripe Dashboard
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 12px 0' }}>
          <span style={textStyles.stepNumber}>2</span>
          <strong>Gather evidence</strong> (access logs, confirmation emails, etc.)
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0 0 12px 0' }}>
          <span style={textStyles.stepNumber}>3</span>
          <strong>Submit your response</strong> through Stripe before the deadline
        </Text>
        <Text style={{ ...textStyles.paragraph, margin: '0' }}>
          <span style={textStyles.stepNumber}>4</span>
          <strong>Consider contacting the client</strong> to resolve directly
        </Text>
      </Section>

      {/* CTA Buttons */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={stripeDashboardLink} variant="error">
          Respond to Dispute
        </Button>
        <Text style={{ ...textStyles.paragraph, marginTop: '16px', marginBottom: '0' }}>
          <Link href={disputeDetailsLink} style={textStyles.link}>
            View in PikSend Dashboard →
          </Link>
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Warning Box */}
      <Section style={textStyles.warningBox}>
        <Text style={{ ...textStyles.paragraph, margin: '0', fontWeight: '600', color: '#92400e' }}>
          ⏰ Important: If you don&apos;t respond by {responseDeadline}, the dispute will be 
          automatically decided in the client&apos;s favor and you will lose {amount}.
        </Text>
      </Section>

      {/* Help Info */}
      <Text style={{ ...textStyles.paragraph, color: colors.textMuted, fontSize: '12px' }}>
        Need help responding to this dispute? Visit our{' '}
        <Link href="https://piksend.com/help/disputes" style={textStyles.link}>
          Dispute Guide
        </Link>
        {' '}or contact{' '}
        <Link href="mailto:support@piksend.com" style={textStyles.link}>
          support@piksend.com
        </Link>
        .
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default DisputeAlertEmail;

// Preview props for development
DisputeAlertEmail.PreviewProps = {
  photographerName: 'Jane',
  amount: '$49.99',
  reason: 'product_not_received',
  reasonDescription: 'I never received access to the photos after payment.',
  galleryName: 'Wedding Photography - Sarah & Michael',
  clientEmail: 'john@example.com',
  purchaseDate: 'January 10, 2026',
  transactionId: 'pi_3NxYz1234567890',
  responseDeadline: 'January 25, 2026',
  daysRemaining: 7,
  evidenceRequired: [
    'Proof of delivery (access logs showing client viewed gallery)',
    'Purchase confirmation email sent to client',
    'Terms of service / refund policy',
    'Any communication with the client',
  ],
  disputeDetailsLink: 'https://piksend.com/revenue/disputes/dp_1NxYz1234567890',
  stripeDashboardLink: 'https://dashboard.stripe.com/disputes/dp_1NxYz1234567890',
} as DisputeAlertEmailProps;
