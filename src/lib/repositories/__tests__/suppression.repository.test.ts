/**
 * Suppression Repository Tests
 * 
 * Requirements: 8.7, 8.8
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SuppressionRepository } from '../suppression.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockData = {
    suppressions: new Map<string, any>(),
  };

  return {
    from: (table: string) => ({
      select: (_columns: string, _options?: any) => ({
        eq: (column: string, value: any) => ({
          single: async () => {
            if (table === 'email_suppressions') {
              const suppression = Array.from(mockData.suppressions.values()).find(
                (s: any) => s[column] === value
              );
              return suppression
                ? { data: suppression, error: null }
                : { data: null, error: { code: 'PGRST116' } };
            }
            return { data: null, error: { message: 'Not found' } };
          },
        }),
        order: (_column: string, _options: any) => ({
          range: (from: number, to: number) => ({
            then: async (callback: any) => {
              if (table === 'email_suppressions') {
                const suppressions = Array.from(mockData.suppressions.values());
                return callback({
                  data: suppressions.slice(from, to + 1),
                  error: null,
                  count: suppressions.length,
                });
              }
              return callback({ data: [], error: null, count: 0 });
            },
          }),
        }),
        then: async (callback: any) => {
          if (table === 'email_suppressions') {
            const suppressions = Array.from(mockData.suppressions.values());
            return callback({ data: suppressions, error: null });
          }
          return callback({ data: [], error: null });
        },
      }),
      insert: (data: any) => ({
        select: () => ({
          single: async () => {
            if (table === 'email_suppressions') {
              const suppression = {
                id: `sup_${Date.now()}`,
                ...data,
                count: 1,
                first_occurred_at: new Date().toISOString(),
                last_occurred_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
              };
              mockData.suppressions.set(suppression.id, suppression);
              return { data: suppression, error: null };
            }
            return { data: null, error: { message: 'Failed to insert' } };
          },
        }),
      }),
      delete: () => ({
        eq: (_column: string, value: any) => ({
          then: async (callback: any) => {
            if (table === 'email_suppressions') {
              mockData.suppressions.delete(value);
              return callback({ error: null });
            }
            return callback({ error: { message: 'Failed to delete' } });
          },
        }),
        in: (_column: string, values: any[]) => ({
          then: async (callback: any) => {
            if (table === 'email_suppressions') {
              values.forEach(id => mockData.suppressions.delete(id));
              return callback({ error: null });
            }
            return callback({ error: { message: 'Failed to delete' } });
          },
        }),
      }),
    }),
    mockData,
  } as any;
};

describe('SuppressionRepository', () => {
  let repository: SuppressionRepository;
  let mockClient: any;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    // Clear the mock data
    mockClient.mockData.suppressions.clear();
    repository = new SuppressionRepository(mockClient as SupabaseClient<Database>);
  });

  describe('addSuppression', () => {
    it('should add a new suppression', async () => {
      const suppression = await repository.addSuppression({
        email: 'test@example.com',
        reason: 'bounce',
        bounce_type: 'hard',
      });

      expect(suppression).toBeDefined();
      expect(suppression.email).toBe('test@example.com');
      expect(suppression.reason).toBe('bounce');
      expect(suppression.bounce_type).toBe('hard');
    });

    it('should lowercase email addresses', async () => {
      const suppression = await repository.addSuppression({
        email: 'TEST@EXAMPLE.COM',
        reason: 'bounce',
        bounce_type: 'hard',
      });

      expect(suppression.email).toBe('test@example.com');
    });
  });

  describe('getSuppressionByEmail', () => {
    it('should retrieve suppression by email', async () => {
      // Add a suppression first
      await repository.addSuppression({
        email: 'test@example.com',
        reason: 'bounce',
        bounce_type: 'hard',
      });

      const suppression = await repository.getSuppressionByEmail('test@example.com');
      expect(suppression).toBeDefined();
      expect(suppression?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const suppression = await repository.getSuppressionByEmail('nonexistent@example.com');
      expect(suppression).toBeNull();
    });
  });

  describe('removeSuppression', () => {
    it('should remove a suppression by ID', async () => {
      // Add a suppression first
      const added = await repository.addSuppression({
        email: 'test@example.com',
        reason: 'bounce',
        bounce_type: 'hard',
      });

      await repository.removeSuppression(added.id);

      const suppression = await repository.getSuppressionById(added.id);
      expect(suppression).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return stats with correct structure', async () => {
      const stats = await repository.getStats();

      // Verify the stats object has the correct structure
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('bounces');
      expect(stats).toHaveProperty('hardBounces');
      expect(stats).toHaveProperty('softBounces');
      expect(stats).toHaveProperty('complaints');
      
      // All values should be numbers
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.bounces).toBe('number');
      expect(typeof stats.hardBounces).toBe('number');
      expect(typeof stats.softBounces).toBe('number');
      expect(typeof stats.complaints).toBe('number');
    });
  });
});
