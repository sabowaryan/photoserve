/**
 * Sale Notification Email Template
 * Sent to photographers when a client purchases their gallery
 * 
 * Requirement 8.2: Photographer Notifications
 * - WHEN sale occurs, THE System SHALL send notification email
 * - THE Email SHALL include: Gallery name, Client email, Amount, Net earnings
 * - THE Email SHALL link to sale details in dashboard
 * 
 * @module emails/sale-notification
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

export interface SaleNotificationEmailProps {
  // Photographer info
  photographerName: string;
  
  // Gallery info
  galleryName: string;
  photoCount: number;
  
  // Client info
  clientEmail: string;
  clientName?: string;
  
  // Payment info
  grossAmount: string; // Total amount paid (e.g., "$29.99")
  platformFee: string; // Platform fee (e.g., "$3.00")
  netEarnings: string; // Net earnings (e.g., "$26.99")
  transactionId: string;
  saleDate: string;
  
  // Links
  dashboardLink: string;
  saleDetailsLink: string;
  
  // Stats (optional)
  totalSalesCount?: number;
  totalRevenue?: string;
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
  earningsBadge: {
    backgroundColor: '#dcfce7', // green-100
    color: colors.success,
    fontSize: '24px',
    fontWeight: '700',
    padding: '16px 24px',
    borderRadius: '12px',
    display: 'inline-block',
    textAlign: 'center' as const,
  },
  celebrationEmoji: {
    fontSize: '32px',
    textAlign: 'center' as const,
    margin: '0 0 16px 0',
  },
  link: {
    color: colors.primary,
    textDecoration: 'none',
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: '8px',
    padding: '16px',
    textAlign: 'center' as const,
  },
  statsValue: {
    color: colors.text,
    fontSize: '20px',
    fontWeight: '700',
    margin: '0',
  },
  statsLabel: {
    color: colors.textMuted,
    fontSize: '12px',
    margin: '4px 0 0 0',
  },
};

const dividerStyle = {
  borderTop: `1px solid ${colors.border}`,
  margin: '24px 0',
};

export function SaleNotificationEmail({
  photographerName,
  galleryName,
  photoCount,
  clientEmail,
  clientName,
  grossAmount,
  platformFee,
  netEarnings,
  transactionId,
  saleDate,
  dashboardLink,
  saleDetailsLink,
  totalSalesCount,
  totalRevenue,
}: SaleNotificationEmailProps) {
  const displayClientName = clientName || clientEmail.split('@')[0];
  
  return (
    <BaseLayout
      preview={`🎉 New sale! You earned ${netEarnings} from "${galleryName}"`}
    >
      {/* Celebration */}
      <Text style={textStyles.celebrationEmoji}>🎉</Text>

      {/* Main Heading */}
      <Heading style={textStyles.heading}>
        You made a sale!
      </Heading>

      {/* Greeting */}
      <Text style={textStyles.paragraph}>
        Hi {photographerName},
      </Text>
      <Text style={textStyles.paragraph}>
        Great news! Someone just purchased access to your gallery <strong>{galleryName}</strong>.
      </Text>

      {/* Earnings Highlight */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Text style={textStyles.label}>Your Earnings</Text>
        <div style={textStyles.earningsBadge}>
          +{netEarnings}
        </div>
      </Section>

      <Hr style={dividerStyle} />

      {/* Sale Details */}
      <Heading as="h2" style={textStyles.subheading}>
        Sale Details
      </Heading>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Gallery</Text>
          <Text style={textStyles.value}>{galleryName}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Photos</Text>
          <Text style={textStyles.value}>{photoCount} photos</Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Client</Text>
          <Text style={textStyles.value}>{displayClientName}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Client Email</Text>
          <Text style={textStyles.value}>
            <Link href={`mailto:${clientEmail}`} style={textStyles.link}>
              {clientEmail}
            </Link>
          </Text>
        </Column>
      </Row>

      <Row>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Date</Text>
          <Text style={textStyles.value}>{saleDate}</Text>
        </Column>
        <Column style={{ width: '50%' }}>
          <Text style={textStyles.label}>Transaction ID</Text>
          <Text style={{ ...textStyles.value, fontFamily: 'monospace', fontSize: '12px' }}>
            {transactionId}
          </Text>
        </Column>
      </Row>

      <Hr style={dividerStyle} />

      {/* Earnings Breakdown */}
      <Heading as="h2" style={textStyles.subheading}>
        Earnings Breakdown
      </Heading>

      <Section style={{ 
        backgroundColor: colors.background, 
        borderRadius: '8px', 
        padding: '16px',
        marginBottom: '16px',
      }}>
        <Row>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0' }}>
              Sale Amount
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0', fontWeight: '600' }}>
              {grossAmount}
            </Text>
          </Column>
        </Row>
        <Row>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0', color: colors.textMuted }}>
              Platform Fee (10%)
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ ...textStyles.paragraph, margin: '0 0 8px 0', color: colors.textMuted }}>
              -{platformFee}
            </Text>
          </Column>
        </Row>
        <Hr style={{ ...dividerStyle, margin: '8px 0' }} />
        <Row>
          <Column>
            <Text style={{ ...textStyles.paragraph, margin: '0', fontWeight: '700', color: colors.success }}>
              Your Earnings
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ ...textStyles.paragraph, margin: '0', fontWeight: '700', color: colors.success }}>
              {netEarnings}
            </Text>
          </Column>
        </Row>
      </Section>

      {/* Stats (if available) */}
      {(totalSalesCount !== undefined || totalRevenue) && (
        <>
          <Hr style={dividerStyle} />
          <Heading as="h2" style={textStyles.subheading}>
            Your Stats
          </Heading>
          <Row>
            {totalSalesCount !== undefined && (
              <Column style={{ width: '50%', paddingRight: '8px' }}>
                <Section style={textStyles.statsCard}>
                  <Text style={textStyles.statsValue}>{totalSalesCount}</Text>
                  <Text style={textStyles.statsLabel}>Total Sales</Text>
                </Section>
              </Column>
            )}
            {totalRevenue && (
              <Column style={{ width: '50%', paddingLeft: '8px' }}>
                <Section style={textStyles.statsCard}>
                  <Text style={textStyles.statsValue}>{totalRevenue}</Text>
                  <Text style={textStyles.statsLabel}>Total Revenue</Text>
                </Section>
              </Column>
            )}
          </Row>
        </>
      )}

      {/* CTA Buttons */}
      <Section style={{ textAlign: 'center', margin: '32px 0' }}>
        <Button href={saleDetailsLink} variant="primary">
          View Sale Details
        </Button>
        <Text style={{ ...textStyles.paragraph, marginTop: '16px', marginBottom: '0' }}>
          <Link href={dashboardLink} style={textStyles.link}>
            Go to Revenue Dashboard →
          </Link>
        </Text>
      </Section>

      <Hr style={dividerStyle} />

      {/* Info */}
      <Text style={{ ...textStyles.paragraph, color: colors.textMuted, fontSize: '12px' }}>
        Your earnings will be automatically transferred to your connected bank account 
        according to your payout schedule. You can view and manage your payouts in the{' '}
        <Link href={dashboardLink} style={textStyles.link}>
          Revenue Dashboard
        </Link>
        .
      </Text>
    </BaseLayout>
  );
}

// Default export for React Email preview
export default SaleNotificationEmail;

// Preview props for development
SaleNotificationEmail.PreviewProps = {
  photographerName: 'Jane',
  galleryName: 'Wedding Photography - Sarah & Michael',
  photoCount: 250,
  clientEmail: 'john@example.com',
  clientName: 'John Doe',
  grossAmount: '$49.99',
  platformFee: '$5.00',
  netEarnings: '$44.99',
  transactionId: 'pi_3NxYz1234567890',
  saleDate: 'January 15, 2026 at 2:30 PM',
  dashboardLink: 'https://piksend.com/revenue',
  saleDetailsLink: 'https://piksend.com/revenue/sales/sale-123',
  totalSalesCount: 42,
  totalRevenue: '$1,847.50',
} as SaleNotificationEmailProps;
