/**
 * Unit Tests for Sender Address Repository
 * 
 * Tests the data access layer for managing verified sender email addresses
 * Validates: Requirements 2.8, 2.9
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SenderAddressRepository } from '../sender-address.repository';
import { NotFoundError } from '@/lib/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type SenderAddressRow = Database['public']['Tables']['sender_addresses']['Row'];
type SenderAddressInsert = Database['public']['Tables']['sender_addresses']['Insert'];

/**
 * Helper to create a sample sender address
 */
function createSampleSender(overrides?: Partial<SenderAddressRow>): SenderAddressRow {
  return {
    id: 'sender-123',
    email: 'noreply@example.com',
    name: 'Example Sender',
    is_verified: false,
    is_default: false,
    domain_records: null,
    verified_at: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    ...overrides,
  };
}

describe('SenderAddressRepository', () => {
  let mockSupabase: any;
  let repository: SenderAddressRepository;

  beforeEach(() => {
    mockSupabase = {} as SupabaseClient<Database>;
    repository = new SenderAddressRepository(mockSupabase);
  });

  describe('create', () => {
    it('should create a new sender address successfully', async () => {
      const newSender: SenderAddressInsert = {
        email: 'noreply@example.com',
        name: 'Example Sender',
      };
      const createdSender = createSampleSender();

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: createdSender,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.create(newSender);

      expect(result).toEqual(createdSender);
      expect(mockSupabase.from).toHaveBeenCalledWith('sender_addresses');
    });

    it('should throw error on database failure', async () => {
      const newSender: SenderAddressInsert = {
        email: 'noreply@example.com',
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.create(newSender)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const newSender: SenderAddressInsert = {
        email: 'existing@example.com',
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'Duplicate key' },
            }),
          }),
        }),
      });

      await expect(repository.create(newSender)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update a sender address successfully', async () => {
      const updatedSender = createSampleSender({ name: 'Updated Name' });

      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: updatedSender,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await repository.update('sender-123', { name: 'Updated Name' });

      expect(result).toEqual(updatedSender);
      expect(mockSupabase.from).toHaveBeenCalledWith('sender_addresses');
    });

    it('should throw NotFoundError when sender does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        }),
      });

      await expect(repository.update('non-existent', { name: 'Test' })).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('delete', () => {
    it('should delete a sender address successfully', async () => {
      // Mock count query for verified senders (more than 1)
      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { is_verified: false },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        });

      await expect(repository.delete('sender-123')).resolves.not.toThrow();
    });

    it('should throw error when deleting the only verified sender', async () => {
      // Mock count query for verified senders (only 1)
      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { is_verified: true },
                error: null,
              }),
            }),
          }),
        });

      await expect(repository.delete('sender-123')).rejects.toThrow(
        'Cannot delete the only verified sender address'
      );
    });

    it('should throw NotFoundError when sender does not exist', async () => {
      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 2,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
              }),
            }),
          }),
        });

      await expect(repository.delete('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('findById', () => {
    it('should find a sender address by ID', async () => {
      const sender = createSampleSender();

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: sender,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.findById('sender-123');

      expect(result).toEqual(sender);
      expect(mockSupabase.from).toHaveBeenCalledWith('sender_addresses');
    });

    it('should return null when sender does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.findById('sender-123')).rejects.toThrow();
    });
  });

  describe('findByEmail', () => {
    it('should find a sender address by email', async () => {
      const sender = createSampleSender();

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: sender,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.findByEmail('noreply@example.com');

      expect(result).toEqual(sender);
      expect(mockSupabase.from).toHaveBeenCalledWith('sender_addresses');
    });

    it('should return null when email does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await repository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all sender addresses', async () => {
      const senders = [
        createSampleSender({ id: 'sender-1', email: 'sender1@example.com' }),
        createSampleSender({ id: 'sender-2', email: 'sender2@example.com' }),
      ];

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: senders,
            error: null,
          }),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual(senders);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no senders exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { code: 'DB_ERROR', message: 'Database error' },
          }),
        }),
      });

      await expect(repository.findAll()).rejects.toThrow();
    });
  });

  describe('updateVerificationStatus', () => {
    it('should update verification status to verified with domain records', async () => {
      const domainRecords = {
        dkim: {
          name: '_domainkey.example.com',
          value: 'v=DKIM1; k=rsa; p=MIGfMA0GCS...',
          type: 'TXT',
        },
        spf: {
          name: 'example.com',
          value: 'v=spf1 include:_spf.example.com ~all',
          type: 'TXT',
        },
      };

      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(
        repository.updateVerificationStatus('sender-123', true, domainRecords)
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith('sender_addresses');
    });

    it('should update verification status to unverified', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      await expect(
        repository.updateVerificationStatus('sender-123', false)
      ).resolves.not.toThrow();
    });

    it('should throw NotFoundError when sender does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            error: { code: 'PGRST116', message: 'Not found' },
          }),
        }),
      });

      await expect(
        repository.updateVerificationStatus('non-existent', true)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('setDefault', () => {
    it('should set a verified sender as default', async () => {
      const verifiedSender = createSampleSender({ is_verified: true });

      mockSupabase.from = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: verifiedSender,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        });

      await expect(repository.setDefault('sender-123')).resolves.not.toThrow();
    });

    it('should throw error when setting unverified sender as default', async () => {
      const unverifiedSender = createSampleSender({ is_verified: false });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: unverifiedSender,
              error: null,
            }),
          }),
        }),
      });

      await expect(repository.setDefault('sender-123')).rejects.toThrow(
        'Cannot set unverified sender as default'
      );
    });

    it('should throw NotFoundError when sender does not exist', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      await expect(repository.setDefault('non-existent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('getDefault', () => {
    it('should return the default sender address', async () => {
      const defaultSender = createSampleSender({ is_default: true, is_verified: true });

      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: defaultSender,
              error: null,
            }),
          }),
        }),
      });

      const result = await repository.getDefault();

      expect(result).toEqual(defaultSender);
      expect(result?.is_default).toBe(true);
    });

    it('should return null when no default sender exists', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      });

      const result = await repository.getDefault();

      expect(result).toBeNull();
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'DB_ERROR', message: 'Database error' },
            }),
          }),
        }),
      });

      await expect(repository.getDefault()).rejects.toThrow();
    });
  });
});
