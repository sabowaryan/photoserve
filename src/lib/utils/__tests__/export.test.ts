/**
 * Export Utility Tests
 * Tests for CSV, Excel, and PDF export functionality
 * 
 * @module lib/utils/__tests__/export.test
 * Requirements: 9.3 - Export & Reports
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  exportToCSV,
  exportToExcel,
  exportToPDF,
  exportSales,
  isValidExportFormat,
  getMimeType,
  ExportFormat,
} from '../export';
import type { Sale } from '@/lib/services/revenue.service';

// Mock sale data for testing
const mockSales: Sale[] = [
  {
    id: 'sale-1',
    galleryId: 'gallery-1',
    galleryTitle: 'Wedding Photos',
    buyerEmail: 'client1@example.com',
    amount: 9900, // $99.00
    currency: 'usd',
    platformFee: 990, // $9.90
    netAmount: 8910, // $89.10
    status: 'succeeded',
    purchasedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'sale-2',
    galleryId: 'gallery-2',
    galleryTitle: 'Portrait Session',
    buyerEmail: 'client2@example.com',
    amount: 4900, // $49.00
    currency: 'usd',
    platformFee: 490, // $4.90
    netAmount: 4410, // $44.10
    status: 'succeeded',
    purchasedAt: '2024-01-16T14:45:00Z',
  },
  {
    id: 'sale-3',
    galleryId: 'gallery-1',
    galleryTitle: 'Wedding Photos',
    buyerEmail: 'client3@example.com',
    amount: 9900, // $99.00
    currency: 'usd',
    platformFee: 990, // $9.90
    netAmount: 8910, // $89.10
    status: 'refunded',
    purchasedAt: '2024-01-17T09:00:00Z',
    refundedAt: '2024-01-18T11:00:00Z',
  },
];

describe('Export Utility', () => {
  describe('exportToCSV', () => {
    it('should export sales data to CSV format', () => {
      const result = exportToCSV(mockSales);
      
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/^sales-export-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(typeof result.data).toBe('string');
    });

    it('should include correct headers in CSV', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      const lines = csvContent.split('\n');
      
      expect(lines[0]).toBe('Date,Gallery,Client Email,Amount,Platform Fee,Net Amount,Status');
    });

    it('should include all sales data in CSV', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      const lines = csvContent.split('\n');
      
      // Header + 3 data rows
      expect(lines.length).toBe(4);
    });

    it('should format currency correctly in CSV', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('$99.00');
      expect(csvContent).toContain('$9.90');
      expect(csvContent).toContain('$89.10');
    });

    it('should format status correctly in CSV', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('Paid');
      expect(csvContent).toContain('Refunded');
    });

    it('should escape CSV values with commas', () => {
      const salesWithComma: Sale[] = [{
        ...mockSales[0]!,
        galleryTitle: 'Wedding, Photos',
      }];
      
      const result = exportToCSV(salesWithComma);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('"Wedding, Photos"');
    });

    it('should escape CSV values with quotes', () => {
      const salesWithQuote: Sale[] = [{
        ...mockSales[0]!,
        galleryTitle: 'Wedding "Special" Photos',
      }];
      
      const result = exportToCSV(salesWithQuote);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('"Wedding ""Special"" Photos"');
    });

    it('should use custom currency symbol', () => {
      const result = exportToCSV(mockSales, { currencySymbol: '€' });
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('€99.00');
    });

    it('should use custom title in filename', () => {
      const result = exportToCSV(mockSales, { title: 'Monthly Report' });
      
      expect(result.filename).toMatch(/^monthly-report-\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it('should handle empty sales array', () => {
      const result = exportToCSV([]);
      const csvContent = result.data as string;
      const lines = csvContent.split('\n');
      
      // Only header row
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('Date,Gallery,Client Email,Amount,Platform Fee,Net Amount,Status');
    });
  });

  describe('exportToExcel', () => {
    it('should export sales data to Excel format', () => {
      const result = exportToExcel(mockSales);
      
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.filename).toMatch(/^sales-export-\d{4}-\d{2}-\d{2}\.xlsx$/);
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should create a valid Excel buffer', () => {
      const result = exportToExcel(mockSales);
      const buffer = result.data as Buffer;
      
      // XLSX files start with PK (ZIP signature)
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4B); // 'K'
    });

    it('should use custom title in filename', () => {
      const result = exportToExcel(mockSales, { title: 'Q1 Sales' });
      
      expect(result.filename).toMatch(/^q1-sales-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it('should handle empty sales array', () => {
      const result = exportToExcel([]);
      
      expect(result.data).toBeInstanceOf(Buffer);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });
  });

  describe('exportToPDF', () => {
    it('should export sales data to PDF format', () => {
      const result = exportToPDF(mockSales);
      
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toMatch(/^sales-export-\d{4}-\d{2}-\d{2}\.pdf$/);
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('should create a valid PDF buffer', () => {
      const result = exportToPDF(mockSales);
      const buffer = result.data as Buffer;
      
      // PDF files start with %PDF
      const header = buffer.slice(0, 4).toString();
      expect(header).toBe('%PDF');
    });

    it('should use custom title in filename', () => {
      const result = exportToPDF(mockSales, { title: 'Annual Report' });
      
      expect(result.filename).toMatch(/^annual-report-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should include photographer name when provided', () => {
      const result = exportToPDF(mockSales, { photographerName: 'John Doe' });
      
      // PDF should be generated without errors
      expect(result.data).toBeInstanceOf(Buffer);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });

    it('should include date range when provided', () => {
      const result = exportToPDF(mockSales, {
        dateRange: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
        },
      });
      
      // PDF should be generated without errors
      expect(result.data).toBeInstanceOf(Buffer);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });

    it('should handle empty sales array', () => {
      const result = exportToPDF([]);
      
      expect(result.data).toBeInstanceOf(Buffer);
      expect((result.data as Buffer).length).toBeGreaterThan(0);
    });
  });

  describe('exportSales', () => {
    it('should export to CSV when format is csv', () => {
      const result = exportSales(mockSales, 'csv');
      
      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/\.csv$/);
    });

    it('should export to Excel when format is excel', () => {
      const result = exportSales(mockSales, 'excel');
      
      expect(result.mimeType).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      expect(result.filename).toMatch(/\.xlsx$/);
    });

    it('should export to PDF when format is pdf', () => {
      const result = exportSales(mockSales, 'pdf');
      
      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toMatch(/\.pdf$/);
    });

    it('should throw error for unsupported format', () => {
      expect(() => exportSales(mockSales, 'xml' as ExportFormat)).toThrow('Unsupported export format: xml');
    });

    it('should pass options to export functions', () => {
      const result = exportSales(mockSales, 'csv', { title: 'Custom Export' });
      
      expect(result.filename).toMatch(/^custom-export-/);
    });
  });

  describe('isValidExportFormat', () => {
    it('should return true for csv', () => {
      expect(isValidExportFormat('csv')).toBe(true);
    });

    it('should return true for excel', () => {
      expect(isValidExportFormat('excel')).toBe(true);
    });

    it('should return true for pdf', () => {
      expect(isValidExportFormat('pdf')).toBe(true);
    });

    it('should return false for invalid formats', () => {
      expect(isValidExportFormat('xml')).toBe(false);
      expect(isValidExportFormat('json')).toBe(false);
      expect(isValidExportFormat('')).toBe(false);
      expect(isValidExportFormat('CSV')).toBe(false); // Case sensitive
    });
  });

  describe('getMimeType', () => {
    it('should return correct MIME type for csv', () => {
      expect(getMimeType('csv')).toBe('text/csv');
    });

    it('should return correct MIME type for excel', () => {
      expect(getMimeType('excel')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    });

    it('should return correct MIME type for pdf', () => {
      expect(getMimeType('pdf')).toBe('application/pdf');
    });
  });

  describe('Date formatting', () => {
    it('should format dates correctly in exports', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      
      // Check that dates are formatted (e.g., "Jan 15, 2024")
      expect(csvContent).toMatch(/Jan \d{1,2}, 2024/);
    });
  });

  describe('Currency formatting', () => {
    it('should convert cents to dollars correctly', () => {
      const result = exportToCSV(mockSales);
      const csvContent = result.data as string;
      
      // 9900 cents = $99.00
      expect(csvContent).toContain('$99.00');
      // 4900 cents = $49.00
      expect(csvContent).toContain('$49.00');
    });

    it('should handle zero amounts', () => {
      const salesWithZero: Sale[] = [{
        ...mockSales[0]!,
        amount: 0,
        platformFee: 0,
        netAmount: 0,
      }];
      
      const result = exportToCSV(salesWithZero);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('$0.00');
    });
  });

  describe('Status formatting', () => {
    it('should format succeeded status as Paid', () => {
      const result = exportToCSV([mockSales[0]!]);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('Paid');
    });

    it('should format refunded status as Refunded', () => {
      const result = exportToCSV([mockSales[2]!]);
      const csvContent = result.data as string;
      
      expect(csvContent).toContain('Refunded');
    });

    it('should handle unknown status', () => {
      const salesWithUnknownStatus: Sale[] = [{
        ...mockSales[0]!,
        status: 'custom_status',
      }];
      
      const result = exportToCSV(salesWithUnknownStatus);
      const csvContent = result.data as string;
      
      // Should capitalize first letter
      expect(csvContent).toContain('Custom_status');
    });
  });
});
