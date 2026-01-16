/**
 * Refund Confirmation Email Template
 * Sent to clients when a refund is processed for their purchase
 * 
 * Requirement 7.1: Refund Management
 * - THE System SHALL send refund confirmation to client
 * - THE Refund SHALL be processed within 5-10 business days
 * 
 * @module emails/refund-confirmation
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

export type RefundType = 'full' | 'partial';

export interface RefundConfirmationEmailProps {
  // Client info
  buyerName?: string;
  buyerEmail: string;
  
  // Gallery info
  galleryName: string;
  
  // Refund info
  refundId: string;
  refundType: RefundType;
  refundAmount: string; // Formatted amount (e.g., "$29.99")
  originalAmount: string; // Original purchase amount
  refundReason?: string;
  
  // Dates
  purchaseDate: string;
  refundDate: string;
  estimatedArrival: string; // "5-10 business days"
  
  // Photographer info
  photographerName: string;
  photographerEmail?: string;
  photographerLogo?: string;
  
  // Links
  supportLink?: string;
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
  refundBadge: {
    backgroundColor: '#dbeafe', // blue-100
    color: '#3b82f6', // blue-500
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '9999px',
    display: 'inline-block',
  },
  refundAmount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#3b82f6', // blue-500
    textAlign: 'center' as const,
    margin: '16px 0',
  },
  infoEmoji: {
    fontSize: '32px',
    textAlign: 'center' as const,
    margin: '0 0 16px 0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
  },
  infoBox: {
    backgroundColor: '#dbeafe', // blue-100
    borderLeft: `4px solid #3b82f6`, // blue-500
    borderRadius: '4px',
    padding: '16px',
    marginBottom: '16px',
  },
  timelineItem: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  timelineDot: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colors.success,
    marginRight: '12px',
    marginTop: '4px',
    flexShrink: 0,
  },
  timelineDotPending: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: colors.border,
    border: `2px solid ${colors.textMuted}`,
    marginRight: '12px',
    marginTop: '4px',
    flexShrink: 0,
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function RefundConfirmationEmail({
  buyerName,
  buyerEmail,
  galleryName,
  refundId,
  refundType,
  refundAmount,
  originalAmount,
  refundReason,
  purchaseDate,
  refundDate,
  estimatedArrival,
  photographerName,
  photographerEmail,
  photographerLogo,
  supportLink,
}: RefundConfirmationEmailProps) {
  const displayName = buyerName || buyerEmail.split('@')[0];
  const isPartial = refundType === 'partial';
  
  return (
    <BaseLayout
      preview={`Your refund of ${refundAmount} for "${galleryName}" has been processed`}
      photographerLogo={photographerLogo}
      photographerName={photographerName}
    >
      {/* Info Emoji */}
      <Text style={textStyles.infoEmoji}>💸</Text>

      {/* Refund Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '16px' }}>
        <span style={textStyles.refundBadge}>
          {isPartial ? 'Partial Refund' : 'Full Refund'} Processed
        </span>
      </Section>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Your Refund is On Its Way
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {displayName},
      </Text>
      <Text style={textStyles.paragraph}>
        {isPartial ? (
          <>
            A partial refund of <strong>{refundAmount}</strong> has been processed for your 
            purchase of <strong>{galleryName}</strong>.
          </>
        ) : (
          <>
            Your purchase of <strong>{galleryName}</strong> has been fully refunded. 
            We&apos;re sorry it didn&apos;t work out.
          </>
        )}
      </Text>

      {/* Refund Amount */}
      <Section style={{ textAlign: 'center', margin: '24px 0' }}>
        <Text style={textStyles.label}>Refund Amount</Text>
        <Text style={textStyles.refundAmount}>
          {refundAmount}
        </Text>
      </Section>

      {/* Info Box */}
      <Section style={textStyles.infoBox}>
        <Text style={{ ...textStyles.paragraph, margin: '0', color: '#1e40af' }}>
          💳 The refund will be credited to your original payment method within{' '}
          <strong>{estimatedArrival}</strong>.
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Refund Details */}
      <Heading as="h2" style={textStyles.subheading}>
        Refund Details
      </Heading>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Gallery</Text>
          <Text style={textStyles.value}>{galleryName}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Refund Type</Text>
          <Text style={textStyles.value}>
            {isPartial ? 'Partial Refund' : 'Full Refund'}
          </Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Refund Amount</Text>
          <Text style={textStyles.value}>{refundAmount}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Original Amount</Text>
          <Text style={textStyles.value}>{originalAmount}</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Purchase Date</Text>
          <Text style={textStyles.value}>{purchaseDate}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Refund Date</Text>
          <Text style={textStyles.value}>{refundDate}</Text>
        </Column>
      </Row>

      {refundReason && (
        <Section style={{ marginBottom: '16px' }}>
          <Text style={textStyles.label}>Reason</Text>
          <Text style={textStyles.value}>{refundReason}</Text>
        </Section>
      )}

      <Row>
        <Column>
          <Text style={textStyles.label}>Refund ID</Text>
          <Text style={{ ...textStyles.value, fontFamily: 'monospace', fontSize: '12px' }}>
            {refundId}
          </Text>
        </Column>
      </Row>

      <Hr style={dividerStyle} />

      {/* Timeline */}
      <Heading as="h2" style={textStyles.subheading}>
        What Happens Next
      </Heading>

      <Section style={{ marginBottom: '24px' }}>
        <Row style={{ marginBottom: '12px' }}>
          <Column style={{ width: '24px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.success,
            }} />
          </Column>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0' }}>
              <strong>Refund initiated</strong> — {refundDate}
            </Text>
          </Column>
        </Row>
        
        <Row style={{ marginBottom: '12px' }}>
          <Column style={{ width: '24px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.warning,
            }} />
          </Column>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0' }}>
              <strong>Processing</strong> — Your bank is processing the refund
            </Text>
          </Column>
        </Row>
        
        <Row>
          <Column style={{ width: '24px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: colors.border,
              border: `2px solid ${colors.textMuted}`,
            }} />
          </Column>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0', color: colors.textMuted }}>
              <strong>Refund complete</strong> — Expected within {estimatedArrival}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Access Revoked Notice (for full refunds) */}
      {!isPartial && (
        <>
          <Hr style={dividerStyle} />
          <Section style={{
            backgroundColor: '#fef3c7', // amber-100
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <Text style={{ ...textStyles.paragraph, margin: '0', color: '#92400e' }}>
              <strong>Note:</strong> Your access to the gallery has been revoked as part of this refund. 
              If you&apos;d like to purchase access again in the future, you&apos;re welcome to do so.
            </Text>
          </Section>
        </>
      )}

      <Hr style={dividerStyle} />

      {/* Contact Info */}
      <Heading as="h2" style={textStyles.subheading}>
        Questions?
      </Heading>

      <Text style={textStyles.paragraph}>
        If you have any questions about this refund, please contact the photographer:
      </Text>

      <Text style={textStyles.paragraph}>
        <strong>{photographerName}</strong>
        {photographerEmail && (
          <>
            <br />
            <Link href={`mailto:${photographerEmail}`} style={textStyles.link}>
              {photographerEmail}
            </Link>
          </>
        )}
      </Text>

      {supportLink && (
        <Section style={{ textAlign: 'center', margin: '24px 0' }}>
          <Button href={supportLink} variant="secondary">
            Contact Support
          </Button>
        </Section>
      )}

      <Hr style={dividerStyle} />

      {/* Footer Info */}
      <Text style={{ ...textStyles.paragraph, color: colors.textMuted, fontSize: '12px' }}>
        Refund processing times vary by bank and payment method. Credit card refunds typically 
        take 5-10 business days, while debit card refunds may take up to 10 business days. 
        If you don&apos;t see the refund after this period, please contact your bank.
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default RefundConfirmationEmail;

// Preview props for development
RefundConfirmationEmail.PreviewProps = {
  buyerName: 'John Doe',
  buyerEmail: 'john@example.com',
  galleryName: 'Wedding Photography - Sarah & Michael',
  refundId: 're_1NxYz1234567890',
  refundType: 'full',
  refundAmount: '$49.99',
  originalAmount: '$49.99',
  refundReason: 'Customer requested refund',
  purchaseDate: 'January 10, 2026',
  refundDate: 'January 15, 2026',
  estimatedArrival: '5-10 business days',
  photographerName: 'Jane Smith Photography',
  photographerEmail: 'jane@photography.com',
  photographerLogo: 'https://piksend.com/demo-logo.png',
  supportLink: 'https://piksend.com/help',
} as RefundConfirmationEmailProps;
