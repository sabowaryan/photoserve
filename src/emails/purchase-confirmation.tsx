/**
 * Purchase Confirmation Email Template
 * Sent to clients when they successfully purchase gallery access
 * 
 * Requirement 8.1: Client Notifications
 * - WHEN purchase succeeds, THE System SHALL send confirmation email
 * - THE Email SHALL include: Gallery name, Amount paid, Access link, Receipt/Invoice
 * - THE Email SHALL be sent within 1 minute of purchase
 * - THE Email SHALL use photographer's branding (if configured)
 * - THE Email SHALL include support contact information
 * 
 * @module emails/purchase-confirmation
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

export interface PurchaseConfirmationEmailProps {
  // Client info
  buyerName?: string;
  buyerEmail: string;
  
  // Gallery info
  galleryName: string;
  photoCount: number;
  
  // Payment info
  amountPaid: string; // Formatted amount (e.g., "$29.99")
  transactionId: string;
  purchaseDate: string;
  
  // Access info
  accessLink: string;
  accessExpiresAt?: string; // Optional expiration date
  
  // Photographer branding
  photographerName: string;
  photographerEmail?: string;
  photographerLogo?: string;
  
  // Receipt
  receiptUrl?: string;
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
  successBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: colors.success,
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 12px',
    borderRadius: '9999px',
    display: 'inline-block',
  },
  featureItem: {
    color: colors.text,
    fontSize: '14px',
    lineHeight: '24px',
    margin: '0',
    paddingLeft: '8px',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function PurchaseConfirmationEmail({
  buyerName,
  buyerEmail,
  galleryName,
  photoCount,
  amountPaid,
  transactionId,
  purchaseDate,
  accessLink,
  accessExpiresAt,
  photographerName,
  photographerEmail,
  photographerLogo,
  receiptUrl,
}: PurchaseConfirmationEmailProps) {
  const displayName = buyerName || buyerEmail.split('@')[0];
  
  return (
    <BaseLayout
      preview={`Your purchase of "${galleryName}" is confirmed! Access your photos now.`}
      photographerLogo={photographerLogo}
      photographerName={photographerName}
    >
      {/* Success Badge */}
      <Section style={{ textAlign: 'center', marginBottom: '24px' }}>
        <span style={textStyles.successBadge}>✓ Payment Successful</span>
      </Section>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        Thank you for your purchase!
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {displayName},
      </Text>
      <Text style={textStyles.paragraph}>
        Your purchase of <strong>{galleryName}</strong> has been confirmed. 
        You now have full access to download all {photoCount} high-resolution photos.
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={accessLink} variant="primary">
          Access Your Photos
        </Button>
      </Section>

      <Hr style={dividerStyle} />

      {/* Order Details */}
      <Heading as="h2" style={textStyles.subheading}>
        Order Details
      </Heading>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Gallery</Text>
          <Text style={textStyles.value}>{galleryName}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Photos</Text>
          <Text style={textStyles.value}>{photoCount} HD photos</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Amount Paid</Text>
          <Text style={textStyles.value}>{amountPaid}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Date</Text>
          <Text style={textStyles.value}>{purchaseDate}</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Transaction ID</Text>
          <Text style={{ ...textStyles.value, fontFamily: 'monospace', fontSize: '12px' }}>
            {transactionId}
          </Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Access</Text>
          <Text style={textStyles.value}>
            {accessExpiresAt ? `Until ${accessExpiresAt}` : 'Unlimited'}
          </Text>
        </Column>
      </Row>

      {receiptUrl && (
        <Text style={{ ...textStyles.paragraph, marginTop: '8px' }}>
          <Link href={receiptUrl} style={textStyles.link}>
            View Receipt / Invoice →
          </Link>
        </Text>
      )}

      <Hr style={dividerStyle} />

      {/* What's Included */}
      <Heading as="h2" style={textStyles.subheading}>
        What&apos;s Included
      </Heading>

      <Section style={{ marginBottom: '16px' }}>
        <Text style={textStyles.featureItem}>✓ Full HD resolution photos</Text>
        <Text style={textStyles.featureItem}>✓ No watermarks</Text>
        <Text style={textStyles.featureItem}>✓ Unlimited downloads</Text>
        <Text style={textStyles.featureItem}>✓ Personal use license</Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Support Info */}
      <Heading as="h2" style={textStyles.subheading}>
        Need Help?
      </Heading>

      <Text style={textStyles.paragraph}>
        If you have any questions about your purchase or need assistance accessing your photos, 
        please contact the photographer directly:
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

      <Text style={{ ...textStyles.paragraph, color: colors.textMuted, fontSize: '12px' }}>
        For technical support with PikSend, visit our{' '}
        <Link href="https://piksend.com/help" style={textStyles.link}>
          Help Center
        </Link>
        .
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default PurchaseConfirmationEmail;

// Preview props for development
PurchaseConfirmationEmail.PreviewProps = {
  buyerName: 'John Doe',
  buyerEmail: 'john@example.com',
  galleryName: 'Wedding Photography - Sarah & Michael',
  photoCount: 250,
  amountPaid: '$49.99',
  transactionId: 'pi_3NxYz1234567890',
  purchaseDate: 'January 15, 2026',
  accessLink: 'https://piksend.com/g/sarah-michael-wedding',
  photographerName: 'Jane Smith Photography',
  photographerEmail: 'jane@photography.com',
  photographerLogo: 'https://piksend.com/demo-logo.png',
  receiptUrl: 'https://pay.stripe.com/receipts/xxx',
} as PurchaseConfirmationEmailProps;
