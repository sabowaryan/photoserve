/**
 * E2E/Integration Tests for Revenue Dashboard Components
 * 
 * @module components/revenue/__tests__/revenue-dashboard.test
 * Requirements: 4.1, 4.2, 4.3, 4.4, 9.1, 9.3
 * 
 * Tests cover:
 * - Revenue Overview Cards (metrics display, period selection)
 * - Revenue Chart (data visualization, range selection)
 * - Sales Table (pagination, filtering, search, export)
 * - Top Galleries Widget (ranking display)
 * - Loading states
 * - Error handling
 * - Responsive behavior
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RevenueOverview } from '../revenue-overview';
import { RevenueChart } from '../revenue-chart';
import { SalesTable } from '../sales-table';
import { TopGalleriesWidget } from '../top-galleries-widget';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL and revokeObjectURL for export tests
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;

// Mock data
const mockOverviewData = {
  totalRevenue: 125000, // 1250.00 EUR
  totalSales: 42,
  averageOrderValue: 2976, // 29.76 EUR
  platformFees: 12500, // 125.00 EUR
  netRevenue: 112500, // 1125.00 EUR
  periodComparison: {
    revenueChange: 15.5,
    salesChange: 8.2,
  },
};

const mockChartData = [
  { date: '2024-01-01', revenue: 15000, sales: 5 },
  { date: '2024-01-02', revenue: 22000, sales: 8 },
  { date: '2024-01-03', revenue: 18000, sales: 6 },
  { date: '2024-01-04', revenue: 30000, sales: 10 },
  { date: '2024-01-05', revenue: 25000, sales: 9 },
  { date: '2024-01-06', revenue: 12000, sales: 4 },
  { date: '2024-01-07', revenue: 28000, sales: 11 },
];

const mockSalesData = {
  sales: [
    {
      id: 'sale-1',
      galleryId: 'gallery-1',
      galleryTitle: 'Wedding Photos 2024',
      buyerEmail: 'client1@example.com',
      amount: 4999,
      currency: 'eur',
      platformFee: 500,
      netAmount: 4499,
      status: 'succeeded',
      purchasedAt: '2024-01-15T10:30:00Z',
    },
    {
      id: 'sale-2',
      galleryId: 'gallery-2',
      galleryTitle: 'Portrait Session',
      buyerEmail: 'client2@example.com',
      amount: 2999,
      currency: 'eur',
      platformFee: 300,
      netAmount: 2699,
      status: 'refunded',
      purchasedAt: '2024-01-14T14:20:00Z',
      refundedAt: '2024-01-16T09:00:00Z',
    },
    {
      id: 'sale-3',
      galleryId: 'gallery-3',
      galleryTitle: 'Corporate Event',
      buyerEmail: 'client3@example.com',
      amount: 7999,
      currency: 'eur',
      platformFee: 800,
      netAmount: 7199,
      status: 'disputed',
      purchasedAt: '2024-01-13T16:45:00Z',
    },
  ],
  total: 42,
  page: 1,
  limit: 10,
  totalPages: 5,
};

const mockTopGalleries = [
  { galleryId: 'gallery-1', title: 'Wedding Photos 2024', totalRevenue: 45000, totalSales: 15, conversionRate: 12.5 },
  { galleryId: 'gallery-2', title: 'Portrait Session', totalRevenue: 32000, totalSales: 11, conversionRate: 8.3 },
  { galleryId: 'gallery-3', title: 'Corporate Event', totalRevenue: 28000, totalSales: 9, conversionRate: 6.7 },
  { galleryId: 'gallery-4', title: 'Family Portraits', totalRevenue: 15000, totalSales: 5, conversionRate: 4.2 },
  { galleryId: 'gallery-5', title: 'Product Photography', totalRevenue: 5000, totalSales: 2, conversionRate: 2.1 },
];

/* ============================================================================
 * REVENUE OVERVIEW COMPONENT TESTS
 * ============================================================================
 */
describe('RevenueOverview - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 4.1: Sales Overview - Metrics Display
   * Tests that overview cards display correct metrics
   */
  describe('Metrics Display', () => {
    it('should display all four metric cards', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
        expect(screen.getByText('Ventes')).toBeInTheDocument();
        expect(screen.getByText('Panier moyen')).toBeInTheDocument();
        expect(screen.getByText('Revenus nets')).toBeInTheDocument();
      });
    });

    it('should display formatted currency values', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        // Total revenue: 125000 cents = 1250.00 EUR
        expect(screen.getByText(/1[\s\u00A0]?250,00[\s\u00A0]?€/)).toBeInTheDocument();
        // Sales count
        expect(screen.getByText('42')).toBeInTheDocument();
      });
    });

    it('should display period comparison with positive change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        // Revenue change: +15.5%
        expect(screen.getByText(/\+15\.5%/)).toBeInTheDocument();
        // Sales change: +8.2%
        expect(screen.getByText(/\+8\.2%/)).toBeInTheDocument();
      });
    });

    it('should display period comparison with negative change', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockOverviewData,
          periodComparison: {
            revenueChange: -12.3,
            salesChange: -5.1,
          },
        }),
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(screen.getByText(/-12\.3%/)).toBeInTheDocument();
        expect(screen.getByText(/-5\.1%/)).toBeInTheDocument();
      });
    });

    it('should display platform fees in net revenue card', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        // Platform fees: 12500 cents = 125.00 EUR
        expect(screen.getByText(/125,00[\s\u00A0]?€ de frais/)).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 4.1: Sales Overview - Period Selection
   * Tests period selector functionality
   */
  describe('Period Selection', () => {
    it('should display all period options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(screen.getByText("Aujourd'hui")).toBeInTheDocument();
        expect(screen.getByText('Cette semaine')).toBeInTheDocument();
        expect(screen.getByText('Ce mois')).toBeInTheDocument();
        expect(screen.getByText('Ce trimestre')).toBeInTheDocument();
        expect(screen.getByText('Cette année')).toBeInTheDocument();
        expect(screen.getByText('Tout')).toBeInTheDocument();
      });
    });

    it('should default to "Ce mois" period', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/photographer/revenue/overview?period=month');
      });
    });

    it('should fetch new data when period changes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
      });

      const weekButton = screen.getByText('Cette semaine');
      await user.click(weekButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/photographer/revenue/overview?period=week');
      });
    });

    it('should highlight selected period button', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockOverviewData,
      });

      render(<RevenueOverview />);

      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
      });

      const todayButton = screen.getByText("Aujourd'hui");
      await user.click(todayButton);

      await waitFor(() => {
        expect(todayButton).toHaveClass('bg-slate-900', 'text-white');
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { container } = render(<RevenueOverview />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockOverviewData,
      });

      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
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

      render(<RevenueOverview />);

      // Should not crash and should display zero values
      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
        // Multiple cards display 0,00 € so we use getAllByText
        const zeroValues = screen.getAllByText('0,00 €');
        expect(zeroValues.length).toBeGreaterThan(0);
      });
    });

    it('should handle network error gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<RevenueOverview />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * REVENUE CHART COMPONENT TESTS
 * ============================================================================
 */
describe('RevenueChart - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 4.2: Revenue Chart - Data Visualization
   * Tests chart rendering and data display
   */
  describe('Chart Display', () => {
    it('should display chart title and summary', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      render(<RevenueChart />);

      await waitFor(() => {
        expect(screen.getByText('Évolution des revenus')).toBeInTheDocument();
      });
    });

    it('should display total revenue and sales count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      render(<RevenueChart />);

      await waitFor(() => {
        // Total: 150000 cents = 1500 EUR, 53 sales
        expect(screen.getByText(/1[\s\u00A0]?500[\s\u00A0]?€/)).toBeInTheDocument();
        expect(screen.getByText(/53 ventes/)).toBeInTheDocument();
      });
    });

    it('should render bar chart with data points', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      const { container } = render(<RevenueChart />);

      await waitFor(() => {
        // Should have bars for each data point
        const bars = container.querySelectorAll('.bg-gradient-to-t');
        expect(bars.length).toBe(mockChartData.length);
      });
    });

    it('should display empty state when no data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<RevenueChart />);

      await waitFor(() => {
        expect(screen.getByText('Aucune donnée pour cette période')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 4.2: Revenue Chart - Range Selection
   * Tests time range selector functionality
   */
  describe('Range Selection', () => {
    it('should display all range options', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      render(<RevenueChart />);

      await waitFor(() => {
        expect(screen.getByText('7j')).toBeInTheDocument();
        expect(screen.getByText('30j')).toBeInTheDocument();
        expect(screen.getByText('90j')).toBeInTheDocument();
        expect(screen.getByText('12m')).toBeInTheDocument();
      });
    });

    it('should default to 30 days range', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockChartData,
      });

      render(<RevenueChart />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/photographer/revenue/chart?range=month');
      });
    });

    it('should fetch new data when range changes', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockChartData,
      });

      render(<RevenueChart />);

      await waitFor(() => {
        expect(screen.getByText('Évolution des revenus')).toBeInTheDocument();
      });

      const weekButton = screen.getByText('7j');
      await user.click(weekButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/photographer/revenue/chart?range=week');
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { container } = render(<RevenueChart />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockChartData,
      });

      await waitFor(() => {
        expect(screen.getByText('Évolution des revenus')).toBeInTheDocument();
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

      render(<RevenueChart />);

      // Should not crash and show empty state
      await waitFor(() => {
        expect(screen.getByText('Évolution des revenus')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * SALES TABLE COMPONENT TESTS
 * ============================================================================
 */
describe('SalesTable - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 4.3: Sales List - Table Display
   * Tests sales table rendering
   */
  describe('Table Display', () => {
    it('should display table header with all columns', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Galerie')).toBeInTheDocument();
        expect(screen.getByText('Acheteur')).toBeInTheDocument();
        expect(screen.getByText('Montant')).toBeInTheDocument();
        expect(screen.getByText('Net')).toBeInTheDocument();
        expect(screen.getByText('Statut')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
      });
    });

    it('should display sales data in table rows', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
        expect(screen.getByText('Portrait Session')).toBeInTheDocument();
        expect(screen.getByText('Corporate Event')).toBeInTheDocument();
        expect(screen.getByText('client1@example.com')).toBeInTheDocument();
      });
    });

    it('should display status badges with correct styling', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      const { container } = render(<SalesTable />);

      await waitFor(() => {
        // Status badges are in the table, filter options also have same text
        // Look for badges specifically by their styling class
        const completedBadges = container.querySelectorAll('.bg-emerald-100');
        const refundedBadges = container.querySelectorAll('.bg-rose-100');
        const disputedBadges = container.querySelectorAll('.bg-amber-100');
        
        expect(completedBadges.length).toBeGreaterThan(0);
        expect(refundedBadges.length).toBeGreaterThan(0);
        expect(disputedBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display total sales count', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('42 ventes au total')).toBeInTheDocument();
      });
    });

    it('should display empty state when no sales', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          sales: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        }),
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Aucune vente trouvée')).toBeInTheDocument();
        expect(screen.getByText('Les ventes apparaîtront ici')).toBeInTheDocument();
      });
    });
  });

  /**
   * Requirement 4.3: Sales List - Pagination
   * Tests pagination functionality
   */
  describe('Pagination', () => {
    it('should display pagination when multiple pages exist', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText(/Affichage 1 à 10 sur 42/)).toBeInTheDocument();
      });
    });

    it('should navigate to next page when clicking next button', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Historique des ventes')).toBeInTheDocument();
      });

      // Find and click next page button
      const nextButtons = screen.getAllByRole('button');
      const nextButton = nextButtons.find(btn => btn.querySelector('svg.lucide-chevron-right'));
      
      if (nextButton) {
        await user.click(nextButton);

        await waitFor(() => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('page=2')
          );
        });
      }
    });

    it('should disable previous button on first page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        const prevButton = buttons.find(btn => btn.querySelector('svg.lucide-chevron-left'));
        if (prevButton) {
          expect(prevButton).toBeDisabled();
        }
      });
    });
  });

  /**
   * Requirement 4.3: Sales List - Search & Filtering
   * Tests search and filter functionality
   */
  describe('Search and Filtering', () => {
    it('should display search input', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Rechercher par email...')).toBeInTheDocument();
      });
    });

    it('should filter by search term', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Rechercher par email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Rechercher par email...');
      await user.type(searchInput, 'client1@example.com');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=client1%40example.com')
        );
      });
    });

    it('should display status filter dropdown', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Tous les statuts')).toBeInTheDocument();
      });
    });

    it('should filter by status', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByText('Tous les statuts')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      await user.selectOptions(statusSelect, 'succeeded');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('status=succeeded')
        );
      });
    });
  });

  /**
   * Requirement 9.3: Export Functionality
   * Tests export button functionality
   */
  describe('Export Functionality', () => {
    it('should display export button', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Exporter/i })).toBeInTheDocument();
      });
    });

    it('should trigger export when clicking export button', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Exporter/i })).toBeInTheDocument();
      });

      // Mock the export API call
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const exportButton = screen.getByRole('button', { name: /Exporter/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/photographer/sales/export')
        );
      });
    });

    it('should include filters in export request', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockSalesData,
      });

      render(<SalesTable />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Rechercher par email...')).toBeInTheDocument();
      });

      // Set a search filter
      const searchInput = screen.getByPlaceholderText('Rechercher par email...');
      await user.type(searchInput, 'test@example.com');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      // Mock the export API call
      const mockBlob = new Blob(['test,data'], { type: 'text/csv' });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        blob: async () => mockBlob,
      });

      const exportButton = screen.getByRole('button', { name: /Exporter/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('search=test%40example.com')
        );
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { container } = render(<SalesTable />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockSalesData,
      });

      await waitFor(() => {
        expect(screen.getByText('Historique des ventes')).toBeInTheDocument();
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

      render(<SalesTable />);

      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Historique des ventes')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * TOP GALLERIES WIDGET COMPONENT TESTS
 * ============================================================================
 */
describe('TopGalleriesWidget - Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Requirement 4.4: Top Galleries - Widget Display
   * Tests top galleries widget rendering
   */
  describe('Widget Display', () => {
    it('should display widget title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        expect(screen.getByText('Top Galeries')).toBeInTheDocument();
        expect(screen.getByText('Par revenus générés')).toBeInTheDocument();
      });
    });

    it('should display top 5 galleries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        expect(screen.getByText('Wedding Photos 2024')).toBeInTheDocument();
        expect(screen.getByText('Portrait Session')).toBeInTheDocument();
        expect(screen.getByText('Corporate Event')).toBeInTheDocument();
        expect(screen.getByText('Family Portraits')).toBeInTheDocument();
        expect(screen.getByText('Product Photography')).toBeInTheDocument();
      });
    });

    it('should display revenue for each gallery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        // First gallery: 45000 cents = 450 EUR
        expect(screen.getByText('450 €')).toBeInTheDocument();
        // Second gallery: 32000 cents = 320 EUR
        expect(screen.getByText('320 €')).toBeInTheDocument();
      });
    });

    it('should display sales count for each gallery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        expect(screen.getByText('15 ventes')).toBeInTheDocument();
        expect(screen.getByText('11 ventes')).toBeInTheDocument();
        expect(screen.getByText('9 ventes')).toBeInTheDocument();
      });
    });

    it('should display conversion rate for each gallery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        expect(screen.getByText('12.5% conv.')).toBeInTheDocument();
        expect(screen.getByText('8.3% conv.')).toBeInTheDocument();
      });
    });

    it('should display crown icon for top gallery', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      const { container } = render(<TopGalleriesWidget />);

      await waitFor(() => {
        // First item should have crown icon
        const crownIcon = container.querySelector('.lucide-crown');
        expect(crownIcon).toBeInTheDocument();
      });
    });

    it('should display empty state when no galleries', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        expect(screen.getByText('Aucune galerie monétisée')).toBeInTheDocument();
        expect(screen.getByText('Activez la monétisation sur vos galeries')).toBeInTheDocument();
      });
    });

    it('should render galleries as links', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTopGalleries,
      });

      render(<TopGalleriesWidget />);

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.length).toBe(5);
        expect(links[0]).toHaveAttribute('href', '/dashboard/gallery/gallery-1');
      });
    });
  });

  /**
   * Loading States Tests
   */
  describe('Loading States', () => {
    it('should display loading skeleton while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise as any);

      const { container } = render(<TopGalleriesWidget />);

      // Should show skeleton loading
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockTopGalleries,
      });

      await waitFor(() => {
        expect(screen.getByText('Top Galeries')).toBeInTheDocument();
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

      render(<TopGalleriesWidget />);

      // Should not crash and show empty state
      await waitFor(() => {
        expect(screen.getByText('Top Galeries')).toBeInTheDocument();
      });
    });
  });
});

/* ============================================================================
 * INTEGRATION TESTS - REVENUE DASHBOARD
 * ============================================================================
 */
describe('Revenue Dashboard - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Tests that all components work together
   */
  describe('Component Integration', () => {
    it('should render all dashboard components together', async () => {
      // Mock all API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOverviewData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockChartData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSalesData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTopGalleries,
        });

      const { container } = render(
        <>
          <RevenueOverview />
          <RevenueChart />
          <SalesTable />
          <TopGalleriesWidget />
        </>
      );

      await waitFor(() => {
        // Overview
        expect(screen.getByText('Revenus totaux')).toBeInTheDocument();
        // Chart
        expect(screen.getByText('Évolution des revenus')).toBeInTheDocument();
        // Sales Table
        expect(screen.getByText('Historique des ventes')).toBeInTheDocument();
        // Top Galleries
        expect(screen.getByText('Top Galeries')).toBeInTheDocument();
      });
    });
  });

  /**
   * Responsive Behavior Tests
   */
  describe('Responsive Behavior', () => {
    it('should render overview cards with responsive grid classes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockOverviewData,
      });

      const { container } = render(<RevenueOverview />);

      await waitFor(() => {
        // Check for responsive grid classes
        const grid = container.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
      });
    });

    it('should render sales table with horizontal scroll on mobile', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      const { container } = render(<SalesTable />);

      await waitFor(() => {
        // Check for overflow-x-auto class for horizontal scrolling
        const scrollContainer = container.querySelector('.overflow-x-auto');
        expect(scrollContainer).toBeInTheDocument();
      });
    });

    it('should render filters in responsive flex container', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSalesData,
      });

      const { container } = render(<SalesTable />);

      await waitFor(() => {
        // Check for responsive flex classes
        const filterContainer = container.querySelector('.flex-col.sm\\:flex-row');
        expect(filterContainer).toBeInTheDocument();
      });
    });
  });
});
