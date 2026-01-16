/**
 * Tests for Analytics Tab and Conversion Funnel Components
 * 
 * @module components/revenue/__tests__/analytics-ui.test
 * Requirements: 9.1 - Revenue Analytics, 9.2 - Sales Funnel
 * 
 * Tests cover:
 * - Conversion Funnel visualization
 * - Analytics Tab with metrics, trends, and cohorts
 * - Loading states
 * - Error handling
 * - Responsive behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConversionFunnel } from '../conversion-funnel';
import { AnalyticsTab } from '../analytics-tab';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL for export tests
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock data for conversion funnel
const mockFunnelData = {
  views: 10000,
  paywallViews: 3500,
  checkoutStarts: 1200,
  purchases: 450,
  conversionRates: {
    viewToPaywall: 35.0,
    paywallToCheckout: 34.29,
    checkoutToPurchase: 37.5,
    overall: 4.5,
  },
  dropOffPoints: [
    { step: 'View → Paywall', dropOffRate: 65.0, count: 6500 },
    { step: 'Paywall → Checkout', dropOffRate: 65.71, count: 2300 },
    { step: 'Checkout → Purchase', dropOffRate: 62.5, count: 750 },
  ],
  period: {
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-01-31T23:59:59Z',
  },
};

// Mock data for revenue trends
const mockTrendsData = [
  { period: '2024-01-01', revenue: 15000, sales: 5, averageOrderValue: 3000, growthRate: 0 },
  { period: '2024-01-08', revenue: 22000, sales: 8, averageOrderValue: 2750, growthRate: 46.67 },
  { period: '2024-01-15', revenue: 18000, sales: 6, averageOrderValue: 3000, growthRate: -18.18 },
  { period: '2024-01-22', revenue: 30000, sales: 10, averageOrderValue: 3000, growthRate: 66.67 },
];

// Mock data for cohort analysis
const mockCohortData = {
  cohorts: [
    {
      cohortMonth: '2024-01',
      totalCustomers: 50,
      totalRevenue: 125000,
      averageOrderValue: 2500,
      retentionByMonth: [
        { month: 0, customers: 50, revenue: 125000, retentionRate: 100 },
        { month: 1, customers: 15, revenue: 37500, retentionRate: 30 },
        { month: 2, customers: 8, revenue: 20000, retentionRate: 16 },
      ],
    },
    {
      cohortMonth: '2024-02',
      totalCustomers: 65,
      totalRevenue: 162500,
      averageOrderValue: 2500,
      retentionByMonth: [
        { month: 0, customers: 65, revenue: 162500, retentionRate: 100 },
        { month: 1, customers: 22, revenue: 55000, retentionRate: 33.85 },
      ],
    },
  ],
  summary: {
    averageRetention: 26.62,
    averageLifetimeValue: 287500,
    bestPerformingCohort: '2024-02',
  },
};

// Mock data for advanced analytics summary
const mockSummaryData = {
  revenuePerGallery: 45000,
  conversionRate: 4.5,
  averageTimeToConversion: 24,
  topPerformingDay: 'Saturday',
  peakHour: 14,
};

/* ============================================================================
 * CONVERSION FUNNEL COMPONENT TESTS
 * ============================================================================
 */
describe('ConversionFunnel - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 9.2: Sales Funnel - Funnel Display
   * Tests funnel visualization rendering
   */
  describe('Funnel Display', () => {
    it('should display funnel title and overall conversion rate', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
        expect(screen.getByText(/Taux global: 4\.5%/)).toBeInTheDocument();
      });
    });

    it('should display all four funnel steps', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('Vues de galerie')).toBeInTheDocument();
        expect(screen.getByText('Vues du paywall')).toBeInTheDocument();
        expect(screen.getByText('Démarrages checkout')).toBeInTheDocument();
        expect(screen.getByText('Achats complétés')).toBeInTheDocument();
      });
    });

    it('should display step values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('10.0K')).toBeInTheDocument(); // 10000 views
        expect(screen.getByText('3.5K')).toBeInTheDocument(); // 3500 paywall views
        expect(screen.getByText('1.2K')).toBeInTheDocument(); // 1200 checkout starts
        expect(screen.getByText('450')).toBeInTheDocument(); // 450 purchases
      });
    });

    it('should display conversion rates for each step', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        // Conversion rate summary section
        expect(screen.getByText('Vue → Paywall')).toBeInTheDocument();
        expect(screen.getByText('Paywall → Checkout')).toBeInTheDocument();
        expect(screen.getByText('Checkout → Achat')).toBeInTheDocument();
        expect(screen.getByText('Taux global')).toBeInTheDocument();
      });
    });

    it('should display drop-off indicators between steps', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        // Drop-off rates are displayed
        expect(screen.getByText(/-65\.0%/)).toBeInTheDocument();
      });
    });

    it('should display empty state when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockFunnelData,
          views: 0,
          paywallViews: 0,
          checkoutStarts: 0,
          purchases: 0,
        }),
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('Aucune donnée pour cette période')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 9.2: Sales Funnel - Date Range Selection
   * Tests date range selector functionality
   */
  describe('Date Range Selection', () => {
    it('should display all date range options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('7 jours')).toBeInTheDocument();
        expect(screen.getByText('30 jours')).toBeInTheDocument();
        expect(screen.getByText('90 jours')).toBeInTheDocument();
        expect(screen.getByText('Tout')).toBeInTheDocument();
      });
    });

    it('should fetch new data when date range changes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockFunnelData,
      });

      render(<ConversionFunnel />);

      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
      });

      const weekButton = screen.getByText('7 jours');
      await user.click(weekButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as unknown as Promise<Response>);

      const { container } = render(<ConversionFunnel />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockFunnelData,
      });

      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
      });
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      render(<ConversionFunnel />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
      });
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ConversionFunnel />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * ANALYTICS TAB COMPONENT TESTS
 * ============================================================================
 */
describe('AnalyticsTab - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to setup mock fetch for all analytics endpoints
  const setupMockFetch = () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSummaryData,
        });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTrendsData,
        });
      }
      if (url.includes('/cohorts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCohortData,
        });
      }
      if (url.includes('/funnel')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFunnelData,
        });
      }
      if (url.includes('/export')) {
        return Promise.resolve({
          ok: true,
          blob: async () => new Blob(['test,data'], { type: 'text/csv' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  };

  /**
   * Requirement 9.1: Revenue Analytics - Advanced Metrics Display
   * Tests advanced metrics cards rendering
   */
  describe('Advanced Metrics Display', () => {
    it('should display all four metric cards', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Revenu par galerie')).toBeInTheDocument();
        expect(screen.getByText('Taux de conversion')).toBeInTheDocument();
        expect(screen.getByText('Temps moyen conversion')).toBeInTheDocument();
        expect(screen.getByText('Meilleur jour')).toBeInTheDocument();
      });
    });

    it('should display formatted metric values', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        // Revenue per gallery: 45000 cents = 450 EUR
        expect(screen.getByText('450 €')).toBeInTheDocument();
        // Conversion rate
        expect(screen.getByText('4.5%')).toBeInTheDocument();
        // Average time to conversion
        expect(screen.getByText('24h')).toBeInTheDocument();
        // Top performing day
        expect(screen.getByText('Saturday')).toBeInTheDocument();
      });
    });

    it('should display peak hour in subtitle', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Pic à 14h00')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 9.1: Revenue Analytics - Revenue Trends
   * Tests revenue trends chart rendering
   */
  describe('Revenue Trends Chart', () => {
    it('should display trends chart title', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Tendances des revenus')).toBeInTheDocument();
      });
    });

    it('should display period selector for trends', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        // Period selector buttons
        expect(screen.getByText('7j')).toBeInTheDocument();
        expect(screen.getByText('30j')).toBeInTheDocument();
        expect(screen.getByText('90j')).toBeInTheDocument();
        expect(screen.getByText('12m')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 9.1: Revenue Analytics - Cohort Analysis
   * Tests cohort analysis table rendering
   */
  describe('Cohort Analysis Table', () => {
    it('should display cohort analysis title', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Analyse de cohortes')).toBeInTheDocument();
      });
    });

    it('should display cohort summary metrics', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        // Average retention and LTV in subtitle
        expect(screen.getByText(/Rétention moy\./)).toBeInTheDocument();
        expect(screen.getByText(/LTV moy\./)).toBeInTheDocument();
      });
    });

    it('should display empty state when no cohort data', async () => {
      mockFetch.mockImplementation((url: string) => {
        if (url.includes('/cohorts')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              cohorts: [],
              summary: {
                averageRetention: 0,
                averageLifetimeValue: 0,
                bestPerformingCohort: 'N/A',
              },
            }),
          });
        }
        if (url.includes('/trends')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockTrendsData,
          });
        }
        if (url.includes('/summary')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockSummaryData,
          });
        }
        if (url.includes('/funnel')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockFunnelData,
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({}),
        });
      });

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Pas assez de données')).toBeInTheDocument();
      });
    });
  });

  /**
   * Action Buttons Tests
   */
  describe('Action Buttons', () => {
    it('should display refresh button', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Actualiser/i })).toBeInTheDocument();
      });
    });

    it('should display export button', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Exporter CSV/i })).toBeInTheDocument();
      });
    });

    it('should trigger refresh when clicking refresh button', async () => {
      const user = userEvent.setup();
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Actualiser/i })).toBeInTheDocument();
      });

      const refreshButton = screen.getByRole('button', { name: /Actualiser/i });
      await user.click(refreshButton);

      // Should have made additional fetch calls
      await waitFor(() => {
        expect(mockFetch.mock.calls.length).toBeGreaterThan(3);
      });
    });

    it('should trigger export when clicking export button', async () => {
      const user = userEvent.setup();
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Exporter CSV/i })).toBeInTheDocument();
      });

      const exportButton = screen.getByRole('button', { name: /Exporter CSV/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/photographer/sales/export')
        );
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValue(promise as unknown as Promise<Response>);

      const { container } = render(<AnalyticsTab />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockTrendsData,
      });

      await waitFor(() => {
        expect(screen.getByText('Revenu par galerie')).toBeInTheDocument();
      });
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should handle API error gracefully', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(<AnalyticsTab />);

      // Should not crash and display metric cards with default values
      await waitFor(() => {
        expect(screen.getByText('Revenu par galerie')).toBeInTheDocument();
      });
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(<AnalyticsTab />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Revenu par galerie')).toBeInTheDocument();
      });
    });
  });

  /**
   * Integration with ConversionFunnel
   */
  describe('ConversionFunnel Integration', () => {
    it('should render ConversionFunnel component within AnalyticsTab', async () => {
      setupMockFetch();

      render(<AnalyticsTab />);

      await waitFor(() => {
        expect(screen.getByText('Entonnoir de conversion')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * RESPONSIVE BEHAVIOR TESTS
 * ============================================================================
 */
describe('Analytics UI - Responsive Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render ConversionFunnel with responsive classes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => mockFunnelData,
    });

    const { container } = render(<ConversionFunnel />);

    await waitFor(() => {
      // Check for responsive flex classes
      const responsiveElements = container.querySelectorAll('.sm\\:flex-row, .sm\\:items-center');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });
  });

  it('should render AnalyticsTab with responsive grid', async () => {
    // Setup mock fetch for all analytics endpoints
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/summary')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSummaryData,
        });
      }
      if (url.includes('/trends')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockTrendsData,
        });
      }
      if (url.includes('/cohorts')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockCohortData,
        });
      }
      if (url.includes('/funnel')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockFunnelData,
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });

    const { container } = render(<AnalyticsTab />);

    await waitFor(() => {
      // Check for responsive grid classes
      const gridElements = container.querySelectorAll('.md\\:grid-cols-2, .lg\\:grid-cols-4, .lg\\:grid-cols-2');
      expect(gridElements.length).toBeGreaterThan(0);
    });
  });
});
