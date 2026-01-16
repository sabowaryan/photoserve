/**
 * Tests for In-App Notification Service
 * @module lib/services/__tests__/in-app-notification.service.test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InAppNotificationService } from '../in-app-notification.service';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
};

describe('InAppNotificationService', () => {
  let service: InAppNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InAppNotificationService(mockSupabase as any);
  });

  describe('createNotification', () => {
    it('creates a notification successfully', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'sale',
        title: 'Nouvelle vente !',
        message: 'Test message',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: {},
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.createNotification({
        userId: 'user-1',
        type: 'sale',
        title: 'Nouvelle vente !',
        message: 'Test message',
      });

      expect(result.id).toBe('notif-1');
      expect(result.type).toBe('sale');
      expect(result.title).toBe('Nouvelle vente !');
    });

    it('throws error when creation fails', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      });

      await expect(
        service.createNotification({
          userId: 'user-1',
          type: 'sale',
          title: 'Test',
          message: 'Test',
        })
      ).rejects.toThrow('Failed to create notification');
    });
  });

  describe('getNotifications', () => {
    it('returns notifications for a user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          type: 'sale',
          title: 'Sale 1',
          message: 'Message 1',
          is_read: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
        },
        {
          id: 'notif-2',
          user_id: 'user-1',
          type: 'payout',
          title: 'Payout 1',
          message: 'Message 2',
          is_read: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {},
        },
      ];

      // The query chain ends with order() when no filters are provided
      // We need to mock the final await to return the data
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => Promise.resolve({ data: mockNotifications, error: null })),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      const result = await service.getNotifications('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]?.type).toBe('sale');
      expect(result[1]?.type).toBe('payout');
    });

    it('filters by type', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getNotifications('user-1', { type: 'sale' });

      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'sale');
    });

    it('filters by read status', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      mockSupabase.from.mockReturnValue(mockQuery);

      await service.getNotifications('user-1', { isRead: false });

      expect(mockQuery.eq).toHaveBeenCalledWith('is_read', false);
    });
  });

  describe('getUnreadCount', () => {
    it('returns the count of unread notifications', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          }),
        }),
      });

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(5);
    });

    it('returns 0 on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Error' } }),
          }),
        }),
      });

      const count = await service.getUnreadCount('user-1');

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('marks a notification as read', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      await expect(service.markAsRead('notif-1', 'user-1')).resolves.not.toThrow();
    });

    it('throws error when marking fails', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: { message: 'Error' } }),
          }),
        }),
      });

      await expect(service.markAsRead('notif-1', 'user-1')).rejects.toThrow(
        'Failed to mark notification as read'
      );
    });
  });

  describe('markAllAsRead', () => {
    it('marks all notifications as read', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      });

      await expect(service.markAllAsRead('user-1')).resolves.not.toThrow();
    });
  });

  describe('notifySale', () => {
    it('creates a sale notification with formatted currency', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'sale',
        title: 'Nouvelle vente !',
        message: 'Vous avez vendu l\'accès à "Test Gallery" pour 50,00 €',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { galleryName: 'Test Gallery', amount: 5000, currency: 'eur' },
        related_entity_type: 'purchase',
        related_entity_id: 'purchase-1',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifySale('user-1', 'Test Gallery', 5000, 'eur', 'purchase-1');

      expect(result.type).toBe('sale');
      expect(result.title).toBe('Nouvelle vente !');
    });
  });

  describe('notifyPayout', () => {
    it('creates a pending payout notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'payout',
        title: 'Virement en cours',
        message: 'Un virement de 100,00 € est en cours de traitement',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { amount: 10000, currency: 'eur', status: 'pending' },
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyPayout('user-1', 10000, 'eur', 'pending');

      expect(result.type).toBe('payout');
      expect(result.title).toBe('Virement en cours');
    });

    it('creates a paid payout notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'payout',
        title: 'Virement reçu !',
        message: 'Vous avez reçu un virement de 100,00 €',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { amount: 10000, currency: 'eur', status: 'paid' },
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyPayout('user-1', 10000, 'eur', 'paid');

      expect(result.title).toBe('Virement reçu !');
    });

    it('creates a failed payout notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'payout',
        title: 'Échec du virement',
        message: 'Le virement de 100,00 € a échoué. Veuillez vérifier vos informations bancaires.',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { amount: 10000, currency: 'eur', status: 'failed' },
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyPayout('user-1', 10000, 'eur', 'failed');

      expect(result.title).toBe('Échec du virement');
    });
  });

  describe('notifyDispute', () => {
    it('creates a dispute notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'dispute',
        title: '⚠️ Litige ouvert',
        message: 'Un litige de 50,00 € a été ouvert pour "Test Gallery". Action requise.',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { galleryName: 'Test Gallery', amount: 5000, currency: 'eur' },
        related_entity_type: 'dispute',
        related_entity_id: 'dispute-1',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyDispute('user-1', 'Test Gallery', 5000, 'eur', 'dispute-1');

      expect(result.type).toBe('dispute');
      expect(result.title).toBe('⚠️ Litige ouvert');
    });
  });

  describe('notifyRefund', () => {
    it('creates a refund notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'refund',
        title: 'Remboursement effectué',
        message: 'Un remboursement de 50,00 € a été effectué pour "Test Gallery"',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { galleryName: 'Test Gallery', amount: 5000, currency: 'eur' },
        related_entity_type: 'purchase',
        related_entity_id: 'purchase-1',
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyRefund('user-1', 'Test Gallery', 5000, 'eur', 'purchase-1');

      expect(result.type).toBe('refund');
      expect(result.title).toBe('Remboursement effectué');
    });
  });

  describe('notifyAccountUpdate', () => {
    it('creates an account update notification', async () => {
      const mockNotification = {
        id: 'notif-1',
        user_id: 'user-1',
        type: 'account_update',
        title: '✓ Compte vérifié',
        message: 'Votre compte Stripe a été vérifié avec succès.',
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        metadata: { status: 'verified' },
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNotification, error: null }),
          }),
        }),
      });

      const result = await service.notifyAccountUpdate(
        'user-1',
        'verified',
        'Votre compte Stripe a été vérifié avec succès.'
      );

      expect(result.type).toBe('account_update');
      expect(result.title).toBe('✓ Compte vérifié');
    });
  });
});
