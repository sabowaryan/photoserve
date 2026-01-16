/**
 * Export Utility
 * Provides functionality to export sales data in CSV, Excel, and PDF formats
 * 
 * @module lib/utils/export
 * Requirements: 9.3 - Export & Reports
 * - Export SHALL support formats: CSV, Excel, PDF
 * - Export SHALL include: Date, Gallery, Client, Amount, Fee, Net, Status
 * - Export SHALL support date range selection
 * - Export SHALL support filtering by status, gallery
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale } from '@/lib/services/revenue.service';

/**
 * Supported export formats
 */
export type ExportFormat = 'csv' | 'excel' | 'pdf';

/**
 * Export options
 */
export interface ExportOptions {
  /** Title for the export document */
  title?: string;
  /** Date range for the export */
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  /** Currency symbol to use */
  currencySymbol?: string;
  /** Photographer name for PDF header */
  photographerName?: string;
}

/**
 * Export result
 */
export interface ExportResult {
  /** The exported data as a Buffer or string */
  data: Buffer | string;
  /** The MIME type of the exported file */
  mimeType: string;
  /** The suggested filename */
  filename: string;
}

/**
 * Column headers for export
 */
const EXPORT_HEADERS = [
  'Date',
  'Gallery',
  'Client Email',
  'Amount',
  'Platform Fee',
  'Net Amount',
  'Status',
];

/**
 * Format a sale record for export
 */
function formatSaleForExport(sale: Sale, currencySymbol: string = '$'): string[] {
  return [
    formatDate(sale.purchasedAt),
    sale.galleryTitle,
    sale.buyerEmail,
    formatCurrency(sale.amount, currencySymbol),
    formatCurrency(sale.platformFee, currencySymbol),
    formatCurrency(sale.netAmount, currencySymbol),
    formatStatus(sale.status),
  ];
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format currency amount (cents to dollars)
 */
function formatCurrency(cents: number, symbol: string = '$'): string {
  return `${symbol}${(cents / 100).toFixed(2)}`;
}

/**
 * Format status for display
 */
function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    succeeded: 'Paid',
    refunded: 'Refunded',
    disputed: 'Disputed',
    failed: 'Failed',
    pending: 'Pending',
  };
  return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Generate filename for export
 */
function generateFilename(format: ExportFormat, options?: ExportOptions): string {
  const date = new Date().toISOString().slice(0, 10);
  const prefix = options?.title?.toLowerCase().replace(/\s+/g, '-') || 'sales-export';
  
  const extensions: Record<ExportFormat, string> = {
    csv: 'csv',
    excel: 'xlsx',
    pdf: 'pdf',
  };
  
  return `${prefix}-${date}.${extensions[format]}`;
}

/**
 * Export sales data to CSV format
 * 
 * @param sales - Array of sale records
 * @param options - Export options
 * @returns Export result with CSV data
 */
export function exportToCSV(sales: Sale[], options?: ExportOptions): ExportResult {
  const currencySymbol = options?.currencySymbol || '$';
  
  // Build CSV content
  const rows = sales.map(sale => formatSaleForExport(sale, currencySymbol));
  
  // Escape CSV values
  const escapeCSV = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };
  
  const csvContent = [
    EXPORT_HEADERS.join(','),
    ...rows.map(row => row.map(escapeCSV).join(',')),
  ].join('\n');
  
  return {
    data: csvContent,
    mimeType: 'text/csv',
    filename: generateFilename('csv', options),
  };
}

/**
 * Export sales data to Excel format
 * 
 * @param sales - Array of sale records
 * @param options - Export options
 * @returns Export result with Excel data
 */
export function exportToExcel(sales: Sale[], options?: ExportOptions): ExportResult {
  const currencySymbol = options?.currencySymbol || '$';
  
  // Prepare data for Excel
  const rows = sales.map(sale => formatSaleForExport(sale, currencySymbol));
  const data = [EXPORT_HEADERS, ...rows];
  
  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  
  // Convert to worksheet
  const ws = XLSX.utils.aoa_to_sheet(data);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Date
    { wch: 25 },  // Gallery
    { wch: 30 },  // Client Email
    { wch: 12 },  // Amount
    { wch: 12 },  // Platform Fee
    { wch: 12 },  // Net Amount
    { wch: 10 },  // Status
  ];
  
  // Add worksheet to workbook
  const sheetName = options?.title || 'Sales Export';
  XLSX.utils.book_append_sheet(workbook, ws, sheetName.slice(0, 31)); // Excel sheet names max 31 chars
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return {
    data: Buffer.from(buffer),
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    filename: generateFilename('excel', options),
  };
}

/**
 * Export sales data to PDF format
 * 
 * @param sales - Array of sale records
 * @param options - Export options
 * @returns Export result with PDF data
 */
export function exportToPDF(sales: Sale[], options?: ExportOptions): ExportResult {
  const currencySymbol = options?.currencySymbol || '$';
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  // Add title
  const title = options?.title || 'Sales Export';
  doc.setFontSize(18);
  doc.text(title, 14, 15);
  
  // Add photographer name if provided
  if (options?.photographerName) {
    doc.setFontSize(12);
    doc.text(`Photographer: ${options.photographerName}`, 14, 23);
  }
  
  // Add date range if provided
  if (options?.dateRange?.startDate || options?.dateRange?.endDate) {
    doc.setFontSize(10);
    const dateRangeText = `Period: ${options.dateRange.startDate || 'All time'} - ${options.dateRange.endDate || 'Present'}`;
    doc.text(dateRangeText, 14, options?.photographerName ? 30 : 23);
  }
  
  // Add generation date
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, options?.photographerName ? 36 : 30);
  
  // Prepare table data
  const rows = sales.map(sale => formatSaleForExport(sale, currencySymbol));
  
  // Calculate totals
  const totalAmount = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalFees = sales.reduce((sum, sale) => sum + sale.platformFee, 0);
  const totalNet = sales.reduce((sum, sale) => sum + sale.netAmount, 0);
  
  // Add totals row
  const totalsRow = [
    'TOTAL',
    `${sales.length} sales`,
    '',
    formatCurrency(totalAmount, currencySymbol),
    formatCurrency(totalFees, currencySymbol),
    formatCurrency(totalNet, currencySymbol),
    '',
  ];
  
  // Add table using autoTable
  autoTable(doc, {
    head: [EXPORT_HEADERS],
    body: [...rows, totalsRow],
    startY: options?.photographerName ? 40 : 35,
    styles: {
      fontSize: 9,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [66, 66, 66],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    footStyles: {
      fillColor: [240, 240, 240],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    columnStyles: {
      0: { cellWidth: 22 },  // Date
      1: { cellWidth: 40 },  // Gallery
      2: { cellWidth: 50 },  // Client Email
      3: { cellWidth: 22, halign: 'right' },  // Amount
      4: { cellWidth: 22, halign: 'right' },  // Platform Fee
      5: { cellWidth: 22, halign: 'right' },  // Net Amount
      6: { cellWidth: 18 },  // Status
    },
    didParseCell: function(data) {
      // Style the totals row
      if (data.row.index === rows.length) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [230, 230, 230];
      }
    },
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() - 25,
      doc.internal.pageSize.getHeight() - 10
    );
  }
  
  // Generate buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  
  return {
    data: pdfBuffer,
    mimeType: 'application/pdf',
    filename: generateFilename('pdf', options),
  };
}

/**
 * Export sales data to the specified format
 * 
 * @param sales - Array of sale records
 * @param format - Export format (csv, excel, pdf)
 * @param options - Export options
 * @returns Export result
 */
export function exportSales(
  sales: Sale[],
  format: ExportFormat,
  options?: ExportOptions
): ExportResult {
  switch (format) {
    case 'csv':
      return exportToCSV(sales, options);
    case 'excel':
      return exportToExcel(sales, options);
    case 'pdf':
      return exportToPDF(sales, options);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  const mimeTypes: Record<ExportFormat, string> = {
    csv: 'text/csv',
    excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    pdf: 'application/pdf',
  };
  return mimeTypes[format];
}

/**
 * Validate export format
 */
export function isValidExportFormat(format: string): format is ExportFormat {
  return ['csv', 'excel', 'pdf'].includes(format);
}
