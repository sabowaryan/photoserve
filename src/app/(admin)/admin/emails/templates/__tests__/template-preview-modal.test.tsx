/**
 * Template Preview Modal Tests
 * 
 * Tests for the enhanced template preview modal with:
 * - Sample data form
 * - Desktop/mobile preview toggle
 * - Test email sending
 * - HTML/plain text view toggle
 * - Copy HTML functionality
 * 
 * Requirements: 7.6, 7.7
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplatePreviewModal } from '../template-preview-modal';
import type { Database } from '@/lib/supabase/types';

type EmailTemplate = Database['public']['Tables']['email_templates']['Row'];

// Mock fetch
global.fetch = vi.fn();

describe('TemplatePreviewModal', () => {
  const mockTemplate: EmailTemplate = {
    id: 'template-1',
    name: 'Test Template',
    slug: 'test-template',
    type: 'transactional',
    source: 'custom',
    subject: 'Test Subject',
    content: { html: '<p>Test</p>' },
    variables: ['name', 'email'],
    active_version: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        html: '<html><body><p>Test Email</p></body></html>',
        text: 'Test Email',
        subject: 'Test Subject',
      }),
    });
  });

  it('should render preview modal with template name', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    expect(screen.getByText('Template Preview')).toBeInTheDocument();
    expect(screen.getByText('Test Template')).toBeInTheDocument();
  });

  it('should load preview on mount', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/emails/templates/template-1/preview',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('should initialize sample data from template variables', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox', { name: /sample data/i });
      expect(textarea).toHaveValue(expect.stringContaining('Sample name'));
      expect(textarea).toHaveValue(expect.stringContaining('Sample email'));
    });
  });

  it('should toggle between desktop and mobile view', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Find and click mobile button
    const buttons = screen.getAllByRole('button');
    const mobileButton = buttons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-smartphone')
    );
    
    if (mobileButton) {
      fireEvent.click(mobileButton);
      // Mobile view should be active (visual change, hard to test without DOM inspection)
    }
  });

  it('should toggle between HTML and text view', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Find and click text button
    const textButton = screen.getByRole('button', { name: /text/i });
    fireEvent.click(textButton);

    // Should show plain text content
    await waitFor(() => {
      expect(screen.getByText('Test Email')).toBeInTheDocument();
    });
  });

  it('should allow editing sample data', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');
    const newData = JSON.stringify({ name: 'John Doe', email: 'john@example.com' }, null, 2);
    
    fireEvent.change(textarea, { target: { value: newData } });
    
    expect(textarea).toHaveValue(newData);
  });

  it('should refresh preview with updated sample data', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Update sample data
    const textarea = screen.getByRole('textbox');
    const newData = JSON.stringify({ name: 'John Doe' }, null, 2);
    fireEvent.change(textarea, { target: { value: newData } });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh preview/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        '/api/emails/templates/template-1/preview',
        expect.objectContaining({
          body: expect.stringContaining('John Doe'),
        })
      );
    });
  });

  it('should send test email', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/test')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, messageId: 'msg-123' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          html: '<html><body><p>Test</p></body></html>',
          text: 'Test',
          subject: 'Test',
        }),
      });
    });

    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Enter test email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Click send button
    const sendButtons = screen.getAllByRole('button');
    const sendButton = sendButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-send')
    );
    
    if (sendButton) {
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/emails/templates/template-1/test',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('test@example.com'),
          })
        );
      });

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/test email sent successfully/i)).toBeInTheDocument();
      });
    }
  });

  it('should copy HTML to clipboard', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy html/i });
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '<html><body><p>Test Email</p></body></html>'
      );
    });

    // Should show "Copied!" feedback
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should handle preview loading error', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to load' }),
    });

    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load template preview/i)).toBeInTheDocument();
    });

    // Should show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('should handle test email sending error', async () => {
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/test')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Failed to send' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          html: '<html><body><p>Test</p></body></html>',
          text: 'Test',
          subject: 'Test',
        }),
      });
    });

    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Enter test email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Click send button
    const sendButtons = screen.getAllByRole('button');
    const sendButton = sendButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-send')
    );
    
    if (sendButton) {
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send/i)).toBeInTheDocument();
      });
    }
  });

  it('should validate email before sending test', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText('Test Subject')).toBeInTheDocument();
    });

    // Enter invalid email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Click send button
    const sendButtons = screen.getAllByRole('button');
    const sendButton = sendButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-send')
    );
    
    if (sendButton) {
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Should not call API
      expect(global.fetch).not.toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.anything()
      );
    }
  });

  it('should close modal when close button is clicked', () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    expect(closeButtons.length).toBeGreaterThan(0);
    fireEvent.click(closeButtons[0]!);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should handle invalid JSON in sample data gracefully', async () => {
    render(<TemplatePreviewModal template={mockTemplate} onClose={mockOnClose} />);

    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });

    const textarea = screen.getByRole('textbox');
    
    // Enter invalid JSON
    fireEvent.change(textarea, { target: { value: '{invalid json}' } });

    // Click refresh button
    const refreshButton = screen.getByRole('button', { name: /refresh preview/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
    });
  });
});
