/**
 * Tests for Disputes UI Components
 * 
 * @module components/revenue/__tests__/disputes-ui.test
 * Requirements: 7.2 - Dispute Handling
 * - THE Dashboard SHALL display dispute alert banner
 * - THE Dispute_Details SHALL show: Amount, Reason, Deadline, Evidence required
 * - THE System SHALL provide link to Stripe Dashboard for full dispute management
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DisputeAlert } from '../dispute-alert';
import { DisputeList } from '../dispute-list';
import { DisputeDetails } from '../dispute-details';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Next.js Link component
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock dispute data
const mockDispute = {
  id: 'dp_123',
  chargeId: 'ch_456',
  purchaseId: 'purchase_789',
  galleryId: 'gallery_abc',
  galleryTitle: 'Wedding Photos 2024',
  amount: 15000, // 150.00 EUR
  currency: 'eur',
  reason: 'fraudulent',
  status: 'needs_response',
  evidenceDueBy: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  createdAt: '2024-01-15T10:00:00Z',
  buyerEmail: 'client@example.com',
};

const mockDisputeDetails = {
  ...mockDispute,
  reasonDescription: 'The customer claims this charge is fraudulent.',
  hasEvidence: false,
  evidenceSubmissionCount: 0,
  evidenceRequired: [
    'Customer communication',
    'Receipt or proof of purchase',
    'Service documentation',
    'Customer signature',
    'IP address and device info',
    'Previous successful transactions',
  ],
  buyerName: 'John Doe',
  stripeDashboardUrl: 'https://dashboard.stripe.com/disputes/dp_123',
  networkReasonCode: '10.4',
  balanceTransactionId: 'txn_xyz',
  isRefundable: true,
};

const mockDisputesListResponse = {
  data: {
    disputes: [mockDispute],
    hasMore: false,
    totalCount: 1,
  },
};


/* ============================================================================
 * DISPUTE ALERT COMPONENT TESTS
 * ============================================================================
 */
describe('DisputeAlert - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 7.2: Alert Banner Display
   * Tests alert banner rendering
   */
  describe('Alert Banner Display', () => {
    it('should not render when there are no disputes needing response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { disputes: [] } }),
      });

      const { container } = render(<DisputeAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });

    it('should render alert when there are disputes needing response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        expect(screen.getByText(/litige en attente de réponse/i)).toBeInTheDocument();
      });
    });

    it('should display total amount of disputes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        expect(screen.getByText(/150,00[\s\u00A0]?€/)).toBeInTheDocument();
      });
    });

    it('should display plural text for multiple disputes', async () => {
      const multipleDisputes = {
        data: {
          disputes: [
            mockDispute,
            { ...mockDispute, id: 'dp_456', amount: 10000 },
          ],
          hasMore: false,
          totalCount: 2,
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => multipleDisputes,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        expect(screen.getByText(/2 litiges en attente de réponse/i)).toBeInTheDocument();
      });
    });

    it('should show urgent indicator for disputes with deadline within 3 days', async () => {
      const urgentDispute = {
        ...mockDispute,
        evidenceDueBy: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { disputes: [urgentDispute] } }),
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        expect(screen.getByText(/Urgent/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 7.2: Alert Actions
   * Tests alert action buttons
   */
  describe('Alert Actions', () => {
    it('should have link to disputes page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Voir les litiges/i });
        expect(link).toHaveAttribute('href', '/revenue/disputes');
      });
    });

    it('should have link to Stripe Dashboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Stripe Dashboard/i });
        expect(link).toHaveAttribute('href', 'https://dashboard.stripe.com/disputes');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('should allow dismissing the alert', async () => {
      const user = userEvent.setup();
      const onDismiss = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      const { container } = render(<DisputeAlert onDismiss={onDismiss} />);

      await waitFor(() => {
        expect(screen.getByText(/litige en attente de réponse/i)).toBeInTheDocument();
      });

      // Find and click dismiss button
      const dismissButton = screen.getByLabelText(/Fermer l'alerte/i);
      await user.click(dismissButton);

      expect(onDismiss).toHaveBeenCalled();
      expect(container.firstChild).toBeNull();
    });
  });

  /**
   * Error Handling
   */
  describe('Error Handling', () => {
    it('should not render when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { container } = render(<DisputeAlert />);

      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});


/* ============================================================================
 * DISPUTE LIST COMPONENT TESTS
 * ============================================================================
 */
describe('DisputeList - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 7.2: Disputes List Display
   * Tests disputes list rendering
   */
  describe('List Display', () => {
    it('should show loading skeleton initially', () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      const { container } = render(<DisputeList />);

      // Loading skeleton should be visible
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should display empty state when no disputes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { disputes: [], hasMore: false, totalCount: 0 } }),
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByText('Aucun litige')).toBeInTheDocument();
        expect(screen.getByText(/bonne nouvelle/i)).toBeInTheDocument();
      });
    });

    it('should display disputes list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
        expect(screen.getByText('client@example.com')).toBeInTheDocument();
      });
    });

    it('should display dispute amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByText(/150,00[\s\u00A0]?€/)).toBeInTheDocument();
      });
    });

    it('should display dispute status badge', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        // Use getAllByText since the status appears in both the badge and the filter dropdown
        const statusElements = screen.getAllByText('Réponse requise');
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });

    it('should display dispute reason', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByText('Fraude')).toBeInTheDocument();
      });
    });

    it('should display deadline for disputes needing response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByText('Échéance')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 7.2: Status Filtering
   * Tests status filter functionality
   */
  describe('Status Filtering', () => {
    it('should have status filter dropdown', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });
    });

    it('should filter disputes by status', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      // Change filter
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { disputes: [], hasMore: false, totalCount: 0 } }),
      });

      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'won');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=won')
        );
      });
    });
  });

  /**
   * Requirement 7.2: Dispute Selection
   * Tests dispute selection functionality
   */
  describe('Dispute Selection', () => {
    it('should call onSelectDispute when clicking a dispute', async () => {
      const user = userEvent.setup();
      const onSelectDispute = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList onSelectDispute={onSelectDispute} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
      });

      const disputeItem = screen.getByText('Wedding Photos 2024').closest('div[class*="cursor-pointer"]');
      await user.click(disputeItem!);

      expect(onSelectDispute).toHaveBeenCalledWith('dp_123');
    });

    it('should highlight selected dispute', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList selectedDisputeId="dp_123" />);

      await waitFor(() => {
        const disputeItem = screen.getByText('Wedding Photos 2024').closest('div[class*="cursor-pointer"]');
        expect(disputeItem).toHaveClass('border-amber-500');
      });
    });
  });

  /**
   * Pagination
   */
  describe('Pagination', () => {
    it('should show load more button when hasMore is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            disputes: [mockDispute],
            hasMore: true,
            totalCount: 1,
          },
        }),
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Charger plus/i })).toBeInTheDocument();
      });
    });

    it('should not show load more button when hasMore is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /Charger plus/i })).not.toBeInTheDocument();
      });
    });
  });
});


/* ============================================================================
 * DISPUTE DETAILS COMPONENT TESTS
 * ============================================================================
 */
describe('DisputeDetails - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 7.2: Empty State
   * Tests empty state when no dispute selected
   */
  describe('Empty State', () => {
    it('should show empty state when no dispute selected', () => {
      render(<DisputeDetails disputeId={null} />);

      expect(screen.getByText('Sélectionnez un litige')).toBeInTheDocument();
    });

    it('should show back button on mobile when onBack provided', () => {
      const onBack = vi.fn();
      render(<DisputeDetails disputeId={null} onBack={onBack} />);

      expect(screen.getByRole('button', { name: /Retour à la liste/i })).toBeInTheDocument();
    });
  });

  /**
   * Requirement 7.2: Dispute Details Display
   * Tests dispute details rendering
   */
  describe('Details Display', () => {
    it('should show loading state while fetching', () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {})); // Never resolves

      render(<DisputeDetails disputeId="dp_123" />);

      // Should show loading spinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('should display dispute details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
      });
    });

    it('should display dispute amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText(/150,00[\s\u00A0]?€/)).toBeInTheDocument();
      });
    });

    it('should display dispute reason', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        // Use getAllByText since reason appears in multiple places
        const reasonElements = screen.getAllByText(/fraudulent/i);
        expect(reasonElements.length).toBeGreaterThan(0);
      });
    });

    it('should display reason description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText(/customer claims this charge is fraudulent/i)).toBeInTheDocument();
      });
    });

    it('should display buyer information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('client@example.com')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });
    });

    it('should display evidence deadline for disputes needing response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText(/Échéance/i)).toBeInTheDocument();
      });
    });

    it('should display required evidence list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Preuves recommandées')).toBeInTheDocument();
        expect(screen.getByText('Customer communication')).toBeInTheDocument();
        expect(screen.getByText('Receipt or proof of purchase')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 7.2: Status Display
   * Tests status badge display
   */
  describe('Status Display', () => {
    it('should display needs_response status correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Réponse requise')).toBeInTheDocument();
      });
    });

    it('should display won status correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockDisputeDetails, status: 'won' } }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Gagné')).toBeInTheDocument();
      });
    });

    it('should display lost status correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockDisputeDetails, status: 'lost' } }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Perdu')).toBeInTheDocument();
      });
    });

    it('should display under_review status correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockDisputeDetails, status: 'under_review' } }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('En examen')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 7.2: Stripe Dashboard Link
   * Tests link to Stripe Dashboard
   */
  describe('Stripe Dashboard Link', () => {
    it('should have link to Stripe Dashboard', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: /Soumettre des preuves/i });
        expect(link).toHaveAttribute('href', 'https://dashboard.stripe.com/disputes/dp_123');
        expect(link).toHaveAttribute('target', '_blank');
      });
    });

    it('should show different button text for non-needs_response status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { ...mockDisputeDetails, status: 'under_review' } }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByRole('link', { name: /Voir dans Stripe Dashboard/i })).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 7.2: Evidence Status
   * Tests evidence submission status display
   */
  describe('Evidence Status', () => {
    it('should show evidence submitted indicator when hasEvidence is true', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: { 
            ...mockDisputeDetails, 
            hasEvidence: true, 
            evidenceSubmissionCount: 1 
          } 
        }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText(/Preuves soumises/i)).toBeInTheDocument();
      });
    });

    it('should not show evidence indicator when hasEvidence is false', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.queryByText(/Preuves soumises/i)).not.toBeInTheDocument();
      });
    });
  });

  /**
   * Technical Information
   */
  describe('Technical Information', () => {
    it('should display technical details in expandable section', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Informations techniques')).toBeInTheDocument();
      });

      // Expand technical details
      const summary = screen.getByText('Informations techniques');
      await user.click(summary);

      await waitFor(() => {
        expect(screen.getByText('dp_123')).toBeInTheDocument();
        expect(screen.getByText('ch_456')).toBeInTheDocument();
      });
    });
  });

  /**
   * Error Handling
   */
  describe('Error Handling', () => {
    it('should display error state when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      });

      render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Erreur')).toBeInTheDocument();
        expect(screen.getByText(/Impossible de charger/i)).toBeInTheDocument();
      });
    });
  });

  /**
   * Navigation
   */
  describe('Navigation', () => {
    it('should call onBack when back button is clicked', async () => {
      const user = userEvent.setup();
      const onBack = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" onBack={onBack} />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
      });

      // Find and click back button (mobile)
      const backButton = screen.getByText('Retour');
      await user.click(backButton);

      expect(onBack).toHaveBeenCalled();
    });
  });

  /**
   * Refetch on ID change
   */
  describe('Refetch on ID Change', () => {
    it('should refetch when disputeId changes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      const { rerender } = render(<DisputeDetails disputeId="dp_123" />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
      });

      // Change dispute ID
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          data: { 
            ...mockDisputeDetails, 
            id: 'dp_456',
            galleryTitle: 'Birthday Party Photos' 
          } 
        }),
      });

      rerender(<DisputeDetails disputeId="dp_456" />);

      await waitFor(() => {
        expect(screen.getByText('Birthday Party Photos')).toBeInTheDocument();
      });
    });
  });
});


/* ============================================================================
 * RESPONSIVE DESIGN TESTS
 * ============================================================================
 */
describe('Disputes UI - Responsive Design', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 7.4.9: Responsive UI
   * Tests responsive behavior
   */
  describe('DisputeAlert Responsive', () => {
    it('should render correctly on mobile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeAlert />);

      await waitFor(() => {
        // Alert should be visible
        expect(screen.getByText(/litige en attente de réponse/i)).toBeInTheDocument();
      });
    });
  });

  describe('DisputeList Responsive', () => {
    it('should display dispute items in a mobile-friendly format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockDisputesListResponse,
      });

      render(<DisputeList />);

      await waitFor(() => {
        // All key information should be visible
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
        expect(screen.getByText(/150,00[\s\u00A0]?€/)).toBeInTheDocument();
      });
    });
  });

  describe('DisputeDetails Responsive', () => {
    it('should show back button on mobile', async () => {
      const onBack = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDisputeDetails }),
      });

      render(<DisputeDetails disputeId="dp_123" onBack={onBack} />);

      await waitFor(() => {
        // Back button should be visible (for mobile)
        expect(screen.getByText('Retour')).toBeInTheDocument();
      });
    });
  });
});
