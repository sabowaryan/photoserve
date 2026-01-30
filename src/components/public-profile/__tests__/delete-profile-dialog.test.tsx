/**
 * Tests for DeleteProfileDialog component
 * 
 * Tests the delete confirmation dialog including:
 * - Rendering and interaction
 * - Confirmation flow
 * - API call on confirmation
 * - Success and error handling
 * - GDPR notice display
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeleteProfileDialog } from '../delete-profile-dialog';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import { toast } from 'sonner';

describe('DeleteProfileDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should render the trigger button', () => {
    render(<DeleteProfileDialog />);
    
    const button = screen.getByRole('button', { name: /supprimer le profil/i });
    expect(button).toBeInTheDocument();
  });

  it('should disable button when disabled prop is true', () => {
    render(<DeleteProfileDialog disabled={true} />);
    
    const button = screen.getByRole('button', { name: /supprimer le profil/i });
    expect(button).toBeDisabled();
  });

  it('should open dialog when trigger button is clicked', async () => {
    render(<DeleteProfileDialog />);
    
    const button = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
  });

  it('should display GDPR notice in dialog', async () => {
    render(<DeleteProfileDialog />);
    
    const button = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/note rgpd/i)).toBeInTheDocument();
      expect(screen.getByText(/droit à l'oubli/i)).toBeInTheDocument();
    });
  });

  it('should list what will be deleted', async () => {
    render(<DeleteProfileDialog />);
    
    const button = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText(/votre profil public et toutes ses informations/i)).toBeInTheDocument();
      expect(screen.getByText(/toutes les données analytics associées/i)).toBeInTheDocument();
      expect(screen.getByText(/l'accès public à votre profil/i)).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel is clicked', async () => {
    render(<DeleteProfileDialog />);
    
    // Open dialog
    const triggerButton = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
    
    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /annuler/i });
    fireEvent.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/supprimer le profil public/i)).not.toBeInTheDocument();
    });
  });

  it('should call API and show success toast on confirmation', async () => {
    const mockOnDeleteSuccess = vi.fn();
    
    // Mock successful API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Profil supprimé' }),
    } as Response);
    
    render(<DeleteProfileDialog onDeleteSuccess={mockOnDeleteSuccess} />);
    
    // Open dialog
    const triggerButton = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /supprimer définitivement/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/public-profile/delete',
        expect.objectContaining({
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(toast.success).toHaveBeenCalledWith('Profil public supprimé avec succès');
      expect(mockOnDeleteSuccess).toHaveBeenCalled();
    });
  });

  it('should show error toast on API failure', async () => {
    // Mock failed API response
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Erreur serveur' }),
    } as Response);
    
    render(<DeleteProfileDialog />);
    
    // Open dialog
    const triggerButton = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /supprimer définitivement/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Erreur serveur');
    });
  });

  it('should show loading state during deletion', async () => {
    // Mock slow API response
    vi.mocked(global.fetch).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Profil supprimé' }),
      } as Response), 100))
    );
    
    render(<DeleteProfileDialog />);
    
    // Open dialog
    const triggerButton = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /supprimer définitivement/i });
    fireEvent.click(confirmButton);
    
    // Check for loading state
    await waitFor(() => {
      expect(screen.getByText(/suppression\.\.\./i)).toBeInTheDocument();
    });
  });

  it('should disable buttons during deletion', async () => {
    // Mock slow API response
    vi.mocked(global.fetch).mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ message: 'Profil supprimé' }),
      } as Response), 100))
    );
    
    render(<DeleteProfileDialog />);
    
    // Open dialog
    const triggerButton = screen.getByRole('button', { name: /supprimer le profil/i });
    fireEvent.click(triggerButton);
    
    await waitFor(() => {
      expect(screen.getByText(/supprimer le profil public/i)).toBeInTheDocument();
    });
    
    // Click confirm
    const confirmButton = screen.getByRole('button', { name: /supprimer définitivement/i });
    fireEvent.click(confirmButton);
    
    // Check that buttons are disabled
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /annuler/i });
      expect(cancelButton).toBeDisabled();
    });
  });
});
