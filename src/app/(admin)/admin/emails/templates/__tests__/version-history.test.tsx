/**
 * Version History Component Tests
 * 
 * Tests for the version history UI component including:
 * - Version list display
 * - Version preview functionality
 * - Version rollback functionality
 * - Version publish functionality
 * 
 * Requirements: 7.8, 7.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { VersionHistory } from '../version-history';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

describe('VersionHistory Component', () => {
  const mockTemplateId = 'test-template-id';
  const mockCurrentVersion = 3;
  const mockOnVersionChange = vi.fn();

  const mockVersions = [
    {
      id: 'v3',
      template_id: mockTemplateId,
      version: 3,
      subject: 'Version 3 Subject',
      content: { html: '<p>Version 3</p>' },
      variables: ['name', 'email'],
      created_by: 'user-1',
      created_at: '2024-01-03T10:00:00Z',
    },
    {
      id: 'v2',
      template_id: mockTemplateId,
      version: 2,
      subject: 'Version 2 Subject',
      content: { html: '<p>Version 2</p>' },
      variables: ['name'],
      created_by: 'user-1',
      created_at: '2024-01-02T10:00:00Z',
    },
    {
      id: 'v1',
      template_id: mockTemplateId,
      version: 1,
      subject: 'Version 1 Subject',
      content: { html: '<p>Version 1</p>' },
      variables: ['name'],
      created_by: 'user-1',
      created_at: '2024-01-01T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockReset();
  });

  it('should render version history button', () => {
    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    expect(screen.getByText('Version History')).toBeInTheDocument();
  });

  it('should fetch and display versions when opened', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    // Click the button to open dialog
    fireEvent.click(screen.getByText('Version History'));

    // Wait for versions to load
    await waitFor(() => {
      expect(screen.getByText('v3')).toBeInTheDocument();
      expect(screen.getByText('v2')).toBeInTheDocument();
      expect(screen.getByText('v1')).toBeInTheDocument();
    });

    // Check that fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      `/api/emails/templates/${mockTemplateId}/versions`
    );
  });

  it('should show active badge for current version', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ versions: mockVersions }),
    });

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    fireEvent.click(screen.getByText('Version History'));

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  it('should handle preview action', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: '<p>Preview HTML</p>',
          text: 'Preview Text',
          subject: 'Preview Subject',
        }),
      });

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    fireEvent.click(screen.getByText('Version History'));

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Click preview button for version 2
    const previewButtons = screen.getAllByText('Preview');
    expect(previewButtons[1]).toBeDefined();
    fireEvent.click(previewButtons[1]!); // Second preview button (for v2)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/emails/templates/${mockTemplateId}/versions/2/preview`,
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should handle publish action', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    fireEvent.click(screen.getByText('Version History'));

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Click publish button for version 2
    const publishButtons = screen.getAllByText('Publish');
    expect(publishButtons[0]).toBeDefined();
    fireEvent.click(publishButtons[0]!); // First publish button (for v2)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/emails/templates/${mockTemplateId}/versions/2/publish`,
        expect.objectContaining({
          method: 'POST',
        })
      );
      expect(mockOnVersionChange).toHaveBeenCalled();
    });
  });

  it('should handle rollback action with confirmation', async () => {
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ versions: mockVersions }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ template: mockVersions[1] }),
      });

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    fireEvent.click(screen.getByText('Version History'));

    await waitFor(() => {
      expect(screen.getByText('v2')).toBeInTheDocument();
    });

    // Click rollback button for version 2
    const rollbackButtons = screen.getAllByText('Rollback');
    expect(rollbackButtons[0]).toBeDefined();
    fireEvent.click(rollbackButtons[0]!); // First rollback button (for v2)

    // Confirmation dialog should appear
    await waitFor(() => {
      expect(screen.getByText(/Rollback to Version 2/)).toBeInTheDocument();
    });

    // Find and click the confirm button in the dialog footer
    const dialogButtons = screen.getAllByRole('button');
    const confirmButton = dialogButtons.find(btn => 
      btn.textContent?.includes('Rollback') && 
      !btn.textContent?.includes('Version History')
    );
    
    expect(confirmButton).toBeDefined();
    
    if (confirmButton) {
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `/api/emails/templates/${mockTemplateId}/versions/2/rollback`,
          expect.objectContaining({
            method: 'POST',
          })
        );
        expect(mockOnVersionChange).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('should handle fetch error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(
      <VersionHistory
        templateId={mockTemplateId}
        currentVersion={mockCurrentVersion}
        onVersionChange={mockOnVersionChange}
      />
    );

    fireEvent.click(screen.getByText('Version History'));

    await waitFor(() => {
      expect(screen.getByText('No version history available')).toBeInTheDocument();
    });
  });
});
