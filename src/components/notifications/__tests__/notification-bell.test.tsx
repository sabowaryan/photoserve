/**
 * Tests for NotificationBell component
 * @module components/notifications/__tests__/notification-bell.test
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationBell } from '../notification-bell';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockNotifications = [
  {
    id: '1',
    userId: 'user-1',
    type: 'sale',
    title: 'Nouvelle vente !',
    message: 'Vous avez vendu l\'accès à "Ma Galerie" pour 50,00 €',
    isRead: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: {},
  },
  {
    id: '2',
    userId: 'user-1',
    type: 'payout',
    title: 'Virement reçu !',
    message: 'Vous avez reçu un virement de 45,00 €',
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    metadata: {},
  },
];

describe('NotificationBell', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders the bell icon', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('shows unread count badge when there are unread notifications', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications, unreadCount: 1 }),
    });

    render(<NotificationBell />);
    
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens dropdown when clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications, unreadCount: 1 }),
    });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('displays notifications in the dropdown', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications, unreadCount: 1 }),
    });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Nouvelle vente !')).toBeInTheDocument();
      expect(screen.getByText('Virement reçu !')).toBeInTheDocument();
    });
  });

  it('shows empty state when no notifications', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: [], unreadCount: 0 }),
    });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Aucune notification')).toBeInTheDocument();
    });
  });

  it('marks notification as read when clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notifications: mockNotifications, unreadCount: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Nouvelle vente !')).toBeInTheDocument();
    });

    // Click the mark as read button
    const markAsReadButton = screen.getByTitle('Marquer comme lu');
    fireEvent.click(markAsReadButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/1/read', {
        method: 'POST',
      });
    });
  });

  it('marks all as read when button clicked', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ notifications: mockNotifications, unreadCount: 1 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    render(<NotificationBell />);
    
    const button = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Tout lire')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Tout lire'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/notifications/read-all', {
        method: 'POST',
      });
    });
  });

  it('handles 99+ unread count', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ notifications: mockNotifications, unreadCount: 150 }),
    });

    render(<NotificationBell />);
    
    await waitFor(() => {
      expect(screen.getByText('99+')).toBeInTheDocument();
    });
  });
});
