/**
 * Tests for Refund Modal Component
 * 
 * @module components/revenue/__tests__/refund-modal.test
 * Requirements: 7.1 - Refund Management
 * - THE Sales_List SHALL have "Refund" action button
 * - WHEN clicking refund, THE System SHALL show confirmation modal
 * - THE Modal SHALL display: Amount, Client, Reason input
 * - THE Photographer SHALL choose: Full refund or Partial refund
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RefundModal, Sale } from '../refund-modal';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock createPortal to render in the same container
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom');
  return {
    ...actual,
    createPortal: (node: React.ReactNode) => node,
  };
});

// Mock sale data
const mockSale: Sale = {
  id: 'sale-123',
  galleryId: 'gallery-456',
  galleryTitle: 'Wedding Photos 2024',
  buyerEmail: 'client@example.com',
  amount: 15000, // 150.00 EUR
  currency: 'eur',
  platformFee: 1500, // 15.00 EUR
  netAmount: 13500, // 135.00 EUR
  status: 'succeeded',
  purchasedAt: '2024-01-15T10:00:00Z',
};

// Mock refundable amount response
const mockRefundableData = {
  data: {
    purchaseId: 'sale-123',
    originalAmountCents: 15000,
    refundedAmountCents: 0,
    refundableAmountCents: 15000,
    currency: 'eur',
    canRefund: true,
    status: 'succeeded',
  },
};


/* ============================================================================
 * REFUND MODAL COMPONENT TESTS
 * ============================================================================
 */
describe('RefundModal - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 7.1: Modal Display
   * Tests modal rendering and display
   */
  describe('Modal Display', () => {
    it('should not render when isOpen is false', () => {
      render(
        <RefundModal
          isOpen={false}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      expect(screen.queryByText('Rembourser cette vente')).not.toBeInTheDocument();
    });

    it('should not render when sale is null', () => {
      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={null}
        />
      );

      expect(screen.queryByText('Rembourser cette vente')).not.toBeInTheDocument();
    });

    it('should render modal when isOpen is true and sale is provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Rembourser cette vente')).toBeInTheDocument();
      });
    });

    it('should display sale details', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
        expect(screen.getByText('client@example.com')).toBeInTheDocument();
      });
    });

    it('should display refundable amount', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Montant remboursable')).toBeInTheDocument();
        // 15000 cents = 150.00 EUR - use getAllByText since amount appears in multiple places
        const amountElements = screen.getAllByText(/150,00[\s\u00A0]?€/);
        expect(amountElements.length).toBeGreaterThan(0);
      });
    });
  });


  /**
   * Requirement 7.1: Full/Partial Refund Selection
   * Tests refund type selection functionality
   */
  describe('Refund Type Selection', () => {
    it('should default to full refund', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Full refund should be selected by default
      const fullRefundButton = screen.getByText('Remboursement total').closest('button');
      expect(fullRefundButton).toHaveClass('border-rose-500');
    });

    it('should allow switching to partial refund', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      // Partial refund should now be selected
      expect(partialRefundButton).toHaveClass('border-rose-500');
    });

    it('should show amount input when partial refund is selected', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      await waitFor(() => {
        expect(screen.getByLabelText(/Montant à rembourser/)).toBeInTheDocument();
      });
    });

    it('should not show amount input when full refund is selected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      expect(screen.queryByLabelText(/Montant à rembourser/)).not.toBeInTheDocument();
    });
  });


  /**
   * Requirement 7.1: Reason Input
   * Tests reason input functionality
   */
  describe('Reason Input', () => {
    it('should display reason textarea', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Raison du remboursement/)).toBeInTheDocument();
      });
    });

    it('should allow entering a reason', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Raison du remboursement/)).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/Raison du remboursement/);
      await user.type(reasonInput, 'Customer requested refund');

      expect(reasonInput).toHaveValue('Customer requested refund');
    });

    it('should show character count', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('0/500')).toBeInTheDocument();
      });

      const reasonInput = screen.getByLabelText(/Raison du remboursement/);
      await user.type(reasonInput, 'Test reason');

      expect(screen.getByText('11/500')).toBeInTheDocument();
    });
  });


  /**
   * Requirement 7.1: Validation
   * Tests validation for refund modal
   */
  describe('Validation', () => {
    it('should validate partial refund amount is required', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      // Switch to partial refund
      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      // Submit button should be disabled without amount
      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      expect(submitButton).toBeDisabled();
    });

    it('should validate partial refund amount does not exceed refundable amount', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      // Switch to partial refund
      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      // Enter amount exceeding refundable amount
      const amountInput = screen.getByLabelText(/Montant à rembourser/);
      await user.type(amountInput, '200'); // 200 EUR > 150 EUR refundable

      await waitFor(() => {
        expect(screen.getByText(/Le montant ne peut pas dépasser/)).toBeInTheDocument();
      });
    });

    it('should enable submit button with valid partial amount', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      // Switch to partial refund
      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      // Enter valid amount
      const amountInput = screen.getByLabelText(/Montant à rembourser/);
      await user.type(amountInput, '50'); // 50 EUR < 150 EUR refundable

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      expect(submitButton).not.toBeDisabled();
    });
  });


  /**
   * Requirement 7.1: Loading States
   * Tests loading states for refund modal
   */
  describe('Loading States', () => {
    it('should show loading state while fetching refundable amount', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as unknown as Response);

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      // Should show loading indicator
      expect(screen.getByText('Chargement...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockRefundableData,
      });

      await waitFor(() => {
        expect(screen.queryByText('Chargement...')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during refund submission', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock the refund API call to be slow
      let resolveRefund: (value: unknown) => void;
      const refundPromise = new Promise((resolve) => {
        resolveRefund = resolve;
      });
      mockFetch.mockReturnValueOnce(refundPromise as unknown as Response);

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText('Traitement...')).toBeInTheDocument();

      // Resolve the refund
      resolveRefund!({
        ok: true,
        json: async () => ({ success: true }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Traitement...')).not.toBeInTheDocument();
      });
    });

    it('should disable buttons during loading', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock slow refund API
      let resolveRefund: (value: unknown) => void;
      const refundPromise = new Promise((resolve) => {
        resolveRefund = resolve;
      });
      mockFetch.mockReturnValueOnce(refundPromise as unknown as Response);

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      // Cancel button should be disabled
      const cancelButton = screen.getByRole('button', { name: /Annuler/i });
      expect(cancelButton).toBeDisabled();

      // Resolve
      resolveRefund!({
        ok: true,
        json: async () => ({ success: true }),
      });

      await waitFor(() => {
        expect(screen.queryByText('Traitement...')).not.toBeInTheDocument();
      });
    });
  });


  /**
   * Requirement 7.1: Refund Submission
   * Tests refund submission functionality
   */
  describe('Refund Submission', () => {
    it('should submit full refund correctly', async () => {
      const user = userEvent.setup();
      const onRefundSuccess = vi.fn();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={onClose}
          sale={mockSale}
          onRefundSuccess={onRefundSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock successful refund
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/photographer/sales/${mockSale.id}/refund`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ type: 'full' }),
          })
        );
      });
    });

    it('should submit partial refund with amount', async () => {
      const user = userEvent.setup();
      const onRefundSuccess = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
          onRefundSuccess={onRefundSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      // Switch to partial refund
      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      // Enter amount
      const amountInput = screen.getByLabelText(/Montant à rembourser/);
      await user.type(amountInput, '50');

      // Mock successful refund
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/photographer/sales/${mockSale.id}/refund`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ type: 'partial', amountCents: 5000 }), // 50 EUR = 5000 cents
          })
        );
      });
    });

    it('should include reason in refund request', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/Raison du remboursement/)).toBeInTheDocument();
      });

      // Enter reason
      const reasonInput = screen.getByLabelText(/Raison du remboursement/);
      await user.type(reasonInput, 'Customer requested');

      // Mock successful refund
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          `/api/photographer/sales/${mockSale.id}/refund`,
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ type: 'full', reason: 'Customer requested' }),
          })
        );
      });
    });

    it('should show success message after refund', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock successful refund
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Remboursement effectué')).toBeInTheDocument();
        expect(screen.getByText(/5-10 jours ouvrés/)).toBeInTheDocument();
      });
    });
  });


  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should display error when fetching refundable amount fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed to fetch refundable amount' }),
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch refundable amount')).toBeInTheDocument();
      });
    });

    it('should display error when refund submission fails', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock failed refund
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Refund failed' }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Refund failed')).toBeInTheDocument();
      });
    });

    it('should display warning when sale cannot be refunded', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            ...mockRefundableData.data,
            canRefund: false,
            status: 'refunded',
          },
        }),
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement impossible')).toBeInTheDocument();
        expect(screen.getByText(/déjà été entièrement remboursée/)).toBeInTheDocument();
      });
    });
  });


  /**
   * Modal Interaction Tests
   */
  describe('Modal Interactions', () => {
    it('should call onClose when clicking cancel button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={onClose}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Annuler/i })).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Annuler/i });
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      const { container } = render(
        <RefundModal
          isOpen={true}
          onClose={onClose}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Rembourser cette vente')).toBeInTheDocument();
      });

      // Find close button (X icon)
      const closeButton = container.querySelector('button svg.lucide-x')?.closest('button');
      if (closeButton) {
        await user.click(closeButton);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should call onClose when clicking backdrop', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      const { container } = render(
        <RefundModal
          isOpen={true}
          onClose={onClose}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Rembourser cette vente')).toBeInTheDocument();
      });

      // Find and click backdrop
      const backdrop = container.querySelector('.bg-slate-900\\/70');
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });

    it('should call onRefundSuccess callback after successful refund', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const onRefundSuccess = vi.fn();
      const onClose = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockRefundableData,
      });

      render(
        <RefundModal
          isOpen={true}
          onClose={onClose}
          sale={mockSale}
          onRefundSuccess={onRefundSuccess}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Mock successful refund
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      const submitButton = screen.getByRole('button', { name: /Confirmer le remboursement/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Remboursement effectué')).toBeInTheDocument();
      });

      // Advance timers to trigger the callback
      vi.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(onRefundSuccess).toHaveBeenCalledWith(mockSale.id);
        expect(onClose).toHaveBeenCalled();
      });

      vi.useRealTimers();
    });

    it('should reset state when modal reopens', async () => {
      const user = userEvent.setup();

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockRefundableData,
      });

      const { rerender } = render(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement partiel')).toBeInTheDocument();
      });

      // Switch to partial refund and enter data
      const partialRefundButton = screen.getByText('Remboursement partiel').closest('button');
      await user.click(partialRefundButton!);

      const amountInput = screen.getByLabelText(/Montant à rembourser/);
      await user.type(amountInput, '50');

      // Close and reopen modal
      rerender(
        <RefundModal
          isOpen={false}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      rerender(
        <RefundModal
          isOpen={true}
          onClose={() => {}}
          sale={mockSale}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Remboursement total')).toBeInTheDocument();
      });

      // Should be back to full refund (default)
      const fullRefundButton = screen.getByText('Remboursement total').closest('button');
      expect(fullRefundButton).toHaveClass('border-rose-500');
    });
  });
});
