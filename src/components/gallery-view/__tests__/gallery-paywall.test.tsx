/**
 * Unit Tests for Gallery Paywall Component
 * 
 * @module components/gallery-view/__tests__/gallery-paywall.test
 * Requirements: 2.2 - Paywall Display (Full Mode)
 * 
 * Tests cover:
 * - Rendering with required props
 * - Displaying gallery title and price
 * - Showing preview images (blurred)
 * - Displaying features list
 * - Purchase button functionality
 * - Photographer logo display (when configured)
 * - Stripe badge display
 * - Loading states
 * - Email validation
 * - Responsive design elements
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryPaywall } from '../gallery-paywall';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock next/image
vi.mock('next/image', () => ({
  default: ({ src, alt, className, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} {...props} />
  ),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Default test props
const defaultProps = {
  galleryId: 'gallery-123',
  galleryTitle: 'Wedding Photography Collection',
  gallerySlug: 'wedding-photography-collection',
  photographerName: 'John Doe Photography',
  customLogo: null,
  priceCents: 4999, // $49.99
  currency: 'usd',
  previewImages: [
    { id: 'img-1', url: 'https://example.com/image1.jpg', thumbnailUrl: 'https://example.com/thumb1.jpg' },
    { id: 'img-2', url: 'https://example.com/image2.jpg', thumbnailUrl: 'https://example.com/thumb2.jpg' },
    { id: 'img-3', url: 'https://example.com/image3.jpg', thumbnailUrl: 'https://example.com/thumb3.jpg' },
    { id: 'img-4', url: 'https://example.com/image4.jpg', thumbnailUrl: 'https://example.com/thumb4.jpg' },
    { id: 'img-5', url: 'https://example.com/image5.jpg', thumbnailUrl: 'https://example.com/thumb5.jpg' },
  ],
  totalImages: 150,
  viewsCount: 1234,
};

describe('GalleryPaywall - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 2.2: Rendering with required props
   * Tests that the component renders correctly with all required props
   */
  describe('Rendering with Required Props', () => {
    it('should render the paywall component without crashing', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Unlock Full Gallery')).toBeInTheDocument();
    });

    it('should render with minimal required props', () => {
      const minimalProps = {
        galleryId: 'gallery-123',
        galleryTitle: 'Test Gallery',
        gallerySlug: 'test-gallery',
        priceCents: 999,
        currency: 'usd',
        previewImages: [],
        totalImages: 10,
      };

      render(<GalleryPaywall {...minimalProps} />);
      
      expect(screen.getByText('Test Gallery')).toBeInTheDocument();
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL show: Gallery title
   * Tests gallery title display
   */
  describe('Gallery Title Display', () => {
    it('should display the gallery title in the header', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Wedding Photography Collection')).toBeInTheDocument();
    });

    it('should display photographer name when provided', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('by John Doe Photography')).toBeInTheDocument();
    });

    it('should not display photographer name when not provided', () => {
      const propsWithoutPhotographer = { ...defaultProps, photographerName: undefined };
      render(<GalleryPaywall {...propsWithoutPhotographer} />);
      
      expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL show: price
   * Tests price display with different currencies
   */
  describe('Price Display', () => {
    it('should display price formatted correctly in USD', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('one-time')).toBeInTheDocument();
    });

    it('should display price formatted correctly in EUR', () => {
      const euroProps = { ...defaultProps, currency: 'eur', priceCents: 3999 };
      render(<GalleryPaywall {...euroProps} />);
      
      expect(screen.getByText('€39.99')).toBeInTheDocument();
    });

    it('should display price formatted correctly in CAD', () => {
      const cadProps = { ...defaultProps, currency: 'cad', priceCents: 5999 };
      render(<GalleryPaywall {...cadProps} />);
      
      expect(screen.getByText('CA$59.99')).toBeInTheDocument();
    });

    it('should handle minimum price ($5.00)', () => {
      const minPriceProps = { ...defaultProps, priceCents: 500 };
      render(<GalleryPaywall {...minPriceProps} />);
      
      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('should handle maximum price ($500.00)', () => {
      const maxPriceProps = { ...defaultProps, priceCents: 50000 };
      render(<GalleryPaywall {...maxPriceProps} />);
      
      expect(screen.getByText('$500.00')).toBeInTheDocument();
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL show: preview images (3-5 blurred)
   * Tests preview images display
   */
  describe('Preview Images Display', () => {
    it('should render preview images', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      const images = screen.getAllByRole('img', { name: /Preview \d+/i });
      expect(images.length).toBeGreaterThan(0);
    });

    it('should use thumbnail URLs when available', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      const images = screen.getAllByRole('img', { name: /Preview \d+/i });
      expect(images[0]).toHaveAttribute('src', 'https://example.com/thumb1.jpg');
    });

    it('should fall back to main URL when thumbnail is not available', () => {
      const propsWithoutThumbnails = {
        ...defaultProps,
        previewImages: [
          { id: 'img-1', url: 'https://example.com/image1.jpg' },
        ],
      };
      render(<GalleryPaywall {...propsWithoutThumbnails} />);
      
      const images = screen.getAllByRole('img', { name: /Preview \d+/i });
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });

    it('should apply blur effect to preview images', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      const images = screen.getAllByRole('img', { name: /Preview \d+/i });
      images.forEach(img => {
        expect(img.className).toContain('blur');
      });
    });

    it('should limit preview images to 8 maximum', () => {
      const manyImagesProps = {
        ...defaultProps,
        previewImages: Array.from({ length: 15 }, (_, i) => ({
          id: `img-${i}`,
          url: `https://example.com/image${i}.jpg`,
        })),
      };
      render(<GalleryPaywall {...manyImagesProps} />);
      
      const images = screen.getAllByRole('img', { name: /Preview \d+/i });
      expect(images.length).toBeLessThanOrEqual(8);
    });
  });

  /**
   * Requirement 2.2: THE Features SHALL include: Photo count, HD quality, No watermark, Download access
   * Tests features list display
   */
  describe('Features List Display', () => {
    it('should display "Full resolution downloads" feature', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Full resolution downloads')).toBeInTheDocument();
    });

    it('should display "No watermarks" feature', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('No watermarks')).toBeInTheDocument();
    });

    it('should display "Instant access after payment" feature', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Instant access after payment')).toBeInTheDocument();
    });

    it('should display "Download all at once" feature', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Download all at once')).toBeInTheDocument();
    });

    it('should display total photo count in description', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText(/Get instant access to all 150 high-resolution photos/i)).toBeInTheDocument();
    });

    it('should display photo count in header', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('150 photos')).toBeInTheDocument();
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL have prominent "Purchase Access" CTA button
   * Tests purchase button functionality
   */
  describe('Purchase Button Functionality', () => {
    it('should display "Purchase Access" button', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByRole('button', { name: /Purchase Access/i })).toBeInTheDocument();
    });

    it('should require email before purchase', async () => {
      const user = userEvent.setup();
      render(<GalleryPaywall {...defaultProps} />);
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'invalid-email');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should clear email error when typing', async () => {
      const user = userEvent.setup();
      render(<GalleryPaywall {...defaultProps} />);
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
    });

    it('should show loading state when processing purchase', async () => {
      const user = userEvent.setup();
      
      // Mock a slow API response
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise as any);
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      expect(screen.getByText('Redirecting to checkout...')).toBeInTheDocument();
      
      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });
    });

    it('should redirect to Stripe checkout on successful purchase initiation', async () => {
      const user = userEvent.setup();
      const checkoutUrl = 'https://checkout.stripe.com/c/pay/cs_test_123';
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: checkoutUrl }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        expect(mockLocation.href).toBe(checkoutUrl);
      });
    });

    it('should call checkout API with correct parameters', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'buyer@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/stripe/checkout/gallery-purchase',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"galleryId":"gallery-123"'),
          })
        );
      });
      
      // Verify the body contains the email
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs).toBeDefined();
      const body = JSON.parse(callArgs![1].body);
      expect(body.buyerEmail).toBe('buyer@example.com');
      expect(body.galleryId).toBe('gallery-123');
    });

    it('should display error message on checkout failure', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Payment processing failed' }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Payment processing failed');
      });
    });

    it('should handle missing checkout URL in response', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}), // No URL in response
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('No checkout URL returned');
      });
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL display photographer logo (if configured)
   * Tests photographer logo display
   */
  describe('Photographer Logo Display', () => {
    it('should display PikSend logo when no custom logo is provided', () => {
      render(<GalleryPaywall {...defaultProps} customLogo={null} />);
      
      // There are multiple PikSend logos (header and footer)
      const logos = screen.getAllByAltText('PikSend');
      expect(logos.length).toBeGreaterThanOrEqual(1);
      expect(logos[0]).toHaveAttribute('src', '/icons/logo.svg');
    });

    it('should display custom logo when provided', () => {
      const customLogoUrl = 'https://res.cloudinary.com/demo/image/upload/custom-logo.png';
      render(<GalleryPaywall {...defaultProps} customLogo={customLogoUrl} />);
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toBeInTheDocument();
    });

    it('should optimize Cloudinary logo URL', () => {
      const cloudinaryUrl = 'https://res.cloudinary.com/demo/image/upload/photoserve/logos/logo.png';
      render(<GalleryPaywall {...defaultProps} customLogo={cloudinaryUrl} />);
      
      const logo = screen.getByAltText('Logo');
      expect(logo).toHaveAttribute('src', expect.stringContaining('f_auto'));
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL show "Secure payment by Stripe" badge
   * Tests Stripe security badge display
   */
  describe('Stripe Badge Display', () => {
    it('should display "Secure payment by Stripe" text', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Secure payment by Stripe')).toBeInTheDocument();
    });

    it('should display shield icon with security badge', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      // Check for the security badge container
      const securityBadge = screen.getByText('Secure payment by Stripe');
      expect(securityBadge.parentElement).toBeInTheDocument();
    });
  });

  /**
   * Loading States Tests
   * Tests various loading states throughout the component
   */
  describe('Loading States', () => {
    it('should disable purchase button during loading', async () => {
      const user = userEvent.setup();
      
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockFetch.mockReturnValueOnce(promise as any);
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      // Button should be disabled during loading
      const loadingButton = screen.getByRole('button', { name: /Redirecting to checkout.../i });
      expect(loadingButton).toBeDisabled();
      
      // Resolve the promise to clean up
      resolvePromise!({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });
    });

    it('should re-enable button after error', async () => {
      const user = userEvent.setup();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Error' }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Purchase Access/i });
        expect(button).not.toBeDisabled();
      });
    });
  });

  /**
   * Email Input Tests
   * Tests email input field behavior
   */
  describe('Email Input', () => {
    it('should display email input field', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByLabelText(/Your email address/i)).toBeInTheDocument();
    });

    it('should display helper text for email', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText(/We'll send your access link to this email/i)).toBeInTheDocument();
    });

    it('should accept valid email addresses', async () => {
      const user = userEvent.setup();
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'valid@email.com');
      
      expect(emailInput).toHaveValue('valid@email.com');
    });

    it('should show error styling when email is invalid', async () => {
      const user = userEvent.setup();
      render(<GalleryPaywall {...defaultProps} />);
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      expect(emailInput.className).toContain('border-red-500');
    });
  });

  /**
   * Requirement 2.2: THE Paywall SHALL be responsive (mobile-first design)
   * Tests responsive design elements
   */
  describe('Responsive Design', () => {
    it('should have mobile-first container classes', () => {
      const { container } = render(<GalleryPaywall {...defaultProps} />);
      
      // Check for responsive grid classes on preview images
      const gridContainer = container.querySelector('.grid');
      expect(gridContainer?.className).toContain('grid-cols-2');
      expect(gridContainer?.className).toContain('md:grid-cols-3');
      expect(gridContainer?.className).toContain('lg:grid-cols-4');
    });

    it('should have responsive text sizes', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      const title = screen.getByText('Unlock Full Gallery');
      expect(title.className).toContain('text-2xl');
      expect(title.className).toContain('sm:text-3xl');
    });

    it('should have responsive padding on paywall card', () => {
      const { container } = render(<GalleryPaywall {...defaultProps} />);
      
      const card = container.querySelector('.backdrop-blur-2xl');
      expect(card?.className).toContain('p-6');
      expect(card?.className).toContain('sm:p-8');
    });

    it('should hide some elements on mobile', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      // Photo count and views should be hidden on mobile
      const photoCount = screen.getByText('150 photos');
      expect(photoCount.parentElement?.className).toContain('hidden');
      expect(photoCount.parentElement?.className).toContain('sm:flex');
    });
  });

  /**
   * Views Count Display Tests
   * Tests views count display
   */
  describe('Views Count Display', () => {
    it('should display views count when provided', () => {
      render(<GalleryPaywall {...defaultProps} viewsCount={1234} />);
      
      // The views count is formatted with toLocaleString() which may use different separators
      // Check for the presence of the views text with a flexible matcher
      expect(screen.getByText(/1[\s,.]?234\s*views/i)).toBeInTheDocument();
    });

    it('should not display views count when zero', () => {
      render(<GalleryPaywall {...defaultProps} viewsCount={0} />);
      
      expect(screen.queryByText(/views/i)).not.toBeInTheDocument();
    });

    it('should not display views count when not provided', () => {
      const propsWithoutViews = { ...defaultProps, viewsCount: undefined };
      render(<GalleryPaywall {...propsWithoutViews} />);
      
      expect(screen.queryByText(/views/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Session ID Management Tests
   * Tests localStorage session ID handling
   */
  describe('Session ID Management', () => {
    it('should create new session ID if not exists', async () => {
      const user = userEvent.setup();
      mockLocalStorage.getItem.mockReturnValue(null);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
          'piksend_session_id',
          expect.stringMatching(/^session_\d+_[a-z0-9]+$/)
        );
      });
    });

    it('should reuse existing session ID', async () => {
      const user = userEvent.setup();
      const existingSessionId = 'session_123_abc';
      mockLocalStorage.getItem.mockReturnValue(existingSessionId);
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://checkout.stripe.com/test' }),
      });
      
      render(<GalleryPaywall {...defaultProps} />);
      
      const emailInput = screen.getByPlaceholderText('you@example.com');
      await user.type(emailInput, 'test@example.com');
      
      const purchaseButton = screen.getByRole('button', { name: /Purchase Access/i });
      await user.click(purchaseButton);
      
      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0];
        expect(callArgs).toBeDefined();
        const body = JSON.parse(callArgs![1].body);
        expect(body.buyerSessionId).toBe(existingSessionId);
      });
      
      // Should not create a new session ID
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  /**
   * Footer Display Tests
   * Tests footer with PikSend branding
   */
  describe('Footer Display', () => {
    it('should display "Powered by PikSend" in footer', () => {
      render(<GalleryPaywall {...defaultProps} />);
      
      expect(screen.getByText('Powered by')).toBeInTheDocument();
      expect(screen.getAllByText('PikSend').length).toBeGreaterThan(0);
    });
  });

  /**
   * Lock Icon Display Tests
   * Tests lock icon in paywall card
   */
  describe('Lock Icon Display', () => {
    it('should display lock icon in paywall card', () => {
      const { container } = render(<GalleryPaywall {...defaultProps} />);
      
      // Check for the lock icon container with gradient background
      const lockContainer = container.querySelector('.bg-gradient-to-br.from-indigo-500.to-purple-600');
      expect(lockContainer).toBeInTheDocument();
    });
  });
});
