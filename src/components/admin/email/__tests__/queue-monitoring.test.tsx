import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueueMonitoring } from '../queue-monitoring';

// Mock fetch
global.fetch = vi.fn();

describe('QueueMonitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    // Mock pending fetch
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<QueueMonitoring />);

    // Should show skeleton loader
    expect(document.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('should render queue stats after loading', async () => {
    // Mock successful API responses
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/queue/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stats: {
              pending: 5,
              processing: 2,
              sent: 100,
              failed: 3,
              scheduled: 10,
              byPriority: {
                high: 2,
                normal: 2,
                low: 1,
              },
            },
          }),
        });
      }
      if (url.includes('/queue/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            health: {
              status: 'healthy',
              queueDepth: 7,
              processingRate: 5.2,
              errorRate: 2.5,
              oldestPendingAge: 15,
              issues: [],
              recommendations: [],
            },
          }),
        });
      }
      if (url.includes('/queue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            scheduled: [],
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<QueueMonitoring />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('5')).toBeTruthy();
    });

    // Check that stats are displayed
    expect(screen.getByText('En attente')).toBeTruthy();
    expect(screen.getByText('Traitement')).toBeTruthy();
    expect(screen.getByText('Échoués')).toBeTruthy();
  });

  it('should render error state when fetch fails', async () => {
    // Mock failed API response
    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    render(<QueueMonitoring />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Erreur de chargement/i)).toBeTruthy();
    });
  });

  it('should render health status badge', async () => {
    // Mock successful API responses with degraded health
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/queue/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stats: {
              pending: 150,
              processing: 5,
              sent: 100,
              failed: 10,
              scheduled: 20,
              byPriority: { high: 50, normal: 75, low: 25 },
            },
          }),
        });
      }
      if (url.includes('/queue/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            health: {
              status: 'degraded',
              queueDepth: 155,
              processingRate: 3.5,
              errorRate: 8.5,
              oldestPendingAge: 45,
              issues: ['High queue depth: 155 emails'],
              recommendations: ['Monitor queue processing rate'],
            },
          }),
        });
      }
      if (url.includes('/queue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ scheduled: [] }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<QueueMonitoring />);

    // Wait for health badge to appear
    await waitFor(() => {
      expect(screen.getByText('Dégradé')).toBeTruthy();
    });
  });

  it('should render scheduled emails when available', async () => {
    // Mock successful API responses with scheduled emails
    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes('/queue/stats')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            stats: {
              pending: 5,
              processing: 0,
              sent: 100,
              failed: 0,
              scheduled: 3,
              byPriority: { high: 1, normal: 3, low: 1 },
            },
          }),
        });
      }
      if (url.includes('/queue/health')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            health: {
              status: 'healthy',
              queueDepth: 5,
              processingRate: 5.0,
              errorRate: 0,
              oldestPendingAge: 5,
              issues: [],
              recommendations: [],
            },
          }),
        });
      }
      if (url.includes('/queue/status')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            scheduled: [
              {
                id: '1',
                to_address: 'test@example.com',
                subject: 'Test Email',
                scheduled_at: new Date(Date.now() + 3600000).toISOString(),
                priority: 'high',
              },
            ],
          }),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<QueueMonitoring />);

    // Wait for scheduled emails to appear
    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeTruthy();
    });

    expect(screen.getByText('Test Email')).toBeTruthy();
  });
});
