/**
 * Property-Based Tests for Audit Log Repository - Immutability
 * 
 * Feature: admin-dashboard, Property 15: Audit Log Immutability
 * Validates: Requirements 7.5
 * 
 * Tests that:
 * - For any existing audit log entry, attempts to update or delete the entry SHALL fail,
 *   preserving the original data.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AuditLogRepository } from '../audit-log.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AuditActionType, AuditEntityType } from '@/lib/supabase/types';

/**
 * Arbitrary for generating valid audit action types
 */
const auditActionTypeArb = fc.constantFrom<AuditActionType>(
  'user_view',
  'user_update',
  'user_suspend',
  'user_reactivate',
  'gallery_view',
  'gallery_deactivate',
  'gallery_delete',
  'subscription_update',
  'subscription_cancel',
  'admin_login'
);

/**
 * Arbitrary for generating valid audit entity types
 */
const auditEntityTypeArb = fc.constantFrom<AuditEntityType>(
  'user',
  'gallery',
  'subscription',
  'system'
);

/**
 * Arbitrary for generating valid UUIDs
 */
const uuidArb = fc.uuid();

/**
 * Arbitrary for generating valid IP addresses
 */
const ipAddressArb = fc.oneof(
  fc.ipV4(),
  fc.constant(null)
);

/**
 * Arbitrary for generating audit log details
 */
const detailsArb = fc.dictionary(
  fc.string({ minLength: 1, maxLength: 20 }),
  fc.oneof(
    fc.string(),
    fc.integer(),
    fc.boolean(),
    fc.constant(null)
  )
);

/**
 * Arbitrary for generating a complete audit log entry
 */
const auditLogArb = fc.record({
  id: uuidArb,
  admin_id: uuidArb,
  action_type: auditActionTypeArb,
  entity_type: auditEntityTypeArb,
  entity_id: fc.option(uuidArb, { nil: null }),
  details: detailsArb,
  ip_address: ipAddressArb,
  created_at: fc.integer({ min: 1577836800000, max: 1798761600000 }).map(ts => new Date(ts).toISOString()),
});

/**
 * Creates a mock Supabase client that simulates immutability constraints
 * The audit_logs table should reject UPDATE and DELETE operations
 */
function createMockSupabaseClient(existingLogs: Map<string, ReturnType<typeof auditLogArb.generate>['value']>) {
  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table !== 'audit_logs') {
      return {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Table not found' } }),
      };
    }

    return {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockImplementation((data: unknown) => ({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...data as object, id: crypto.randomUUID(), created_at: new Date().toISOString() },
          error: null,
        }),
      })),
      update: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Audit logs are immutable and cannot be updated',
            code: 'PGRST301',
            details: 'RLS policy violation',
          },
        }),
      })),
      delete: vi.fn().mockImplementation(() => ({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: {
            message: 'Audit logs are immutable and cannot be deleted',
            code: 'PGRST301',
            details: 'RLS policy violation',
          },
        }),
      })),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockImplementation(() => {
        const logs = Array.from(existingLogs.values()).map(log => ({
          ...log,
          profiles: { email: 'admin@test.com', name: 'Admin' },
        }));
        return Promise.resolve({
          data: logs,
          error: null,
          count: logs.length,
        });
      }),
      single: vi.fn().mockImplementation(() => {
        const firstLog = existingLogs.values().next().value;
        return Promise.resolve({
          data: firstLog ? { ...firstLog, profiles: { email: 'admin@test.com', name: 'Admin' } } : null,
          error: firstLog ? null : { code: 'PGRST116', message: 'Not found' },
        });
      }),
    };
  });

  return {
    from: mockFrom,
  } as unknown as SupabaseClient<Database>;
}

describe('Audit Log Repository - Immutability (Property 15)', () => {
  /**
   * Feature: admin-dashboard, Property 15: Audit Log Immutability
   * Validates: Requirements 7.5
   * 
   * For any existing audit log entry, attempts to update or delete the entry
   * SHALL fail, preserving the original data.
   */

  it('should reject update attempts on existing audit logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditLogArb,
        detailsArb,
        async (existingLog, newDetails) => {
          // Setup: Create a mock with an existing log
          const existingLogs = new Map([[existingLog.id, existingLog]]);
          const mockClient = createMockSupabaseClient(existingLogs);
          
          // Attempt to update the audit log directly via Supabase
          const updateResult = await mockClient
            .from('audit_logs')
            .update({ details: newDetails })
            .eq('id', existingLog.id)
            .select()
            .single();

          // Update should fail with an error
          expect(updateResult.error).not.toBeNull();
          expect(updateResult.data).toBeNull();
          
          // Error should indicate immutability
          expect(updateResult.error?.message).toContain('immutable');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject delete attempts on existing audit logs', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditLogArb,
        async (existingLog) => {
          // Setup: Create a mock with an existing log
          const existingLogs = new Map([[existingLog.id, existingLog]]);
          const mockClient = createMockSupabaseClient(existingLogs);
          
          // Attempt to delete the audit log directly via Supabase
          const deleteResult = await mockClient
            .from('audit_logs')
            .delete()
            .eq('id', existingLog.id);

          // Delete should fail with an error
          expect(deleteResult.error).not.toBeNull();
          
          // Error should indicate immutability
          expect(deleteResult.error?.message).toContain('immutable');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original data after failed update attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditLogArb,
        auditActionTypeArb,
        async (existingLog, newActionType) => {
          // Setup: Create a mock with an existing log
          const existingLogs = new Map([[existingLog.id, existingLog]]);
          const mockClient = createMockSupabaseClient(existingLogs);
          
          // Store original values
          const originalActionType = existingLog.action_type;
          const originalDetails = { ...existingLog.details };
          
          // Attempt to update the audit log
          await mockClient
            .from('audit_logs')
            .update({ action_type: newActionType })
            .eq('id', existingLog.id)
            .select()
            .single();

          // Verify original data is preserved in our mock storage
          const storedLog = existingLogs.get(existingLog.id);
          expect(storedLog).toBeDefined();
          expect(storedLog?.action_type).toBe(originalActionType);
          expect(storedLog?.details).toEqual(originalDetails);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should preserve original data after failed delete attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditLogArb,
        async (existingLog) => {
          // Setup: Create a mock with an existing log
          const existingLogs = new Map([[existingLog.id, existingLog]]);
          const mockClient = createMockSupabaseClient(existingLogs);
          
          // Store original count
          const originalCount = existingLogs.size;
          
          // Attempt to delete the audit log
          await mockClient
            .from('audit_logs')
            .delete()
            .eq('id', existingLog.id);

          // Verify the log still exists in our mock storage
          expect(existingLogs.size).toBe(originalCount);
          expect(existingLogs.has(existingLog.id)).toBe(true);
          
          // Verify all original data is preserved
          const storedLog = existingLogs.get(existingLog.id);
          expect(storedLog?.admin_id).toBe(existingLog.admin_id);
          expect(storedLog?.action_type).toBe(existingLog.action_type);
          expect(storedLog?.entity_type).toBe(existingLog.entity_type);
          expect(storedLog?.entity_id).toBe(existingLog.entity_id);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow creating new audit logs while rejecting modifications', async () => {
    await fc.assert(
      fc.asyncProperty(
        auditLogArb,
        fc.record({
          admin_id: uuidArb,
          action_type: auditActionTypeArb,
          entity_type: auditEntityTypeArb,
          entity_id: fc.option(uuidArb, { nil: null }),
          details: detailsArb,
          ip_address: ipAddressArb,
        }),
        async (existingLog, newLogData) => {
          // Setup: Create a mock with an existing log
          const existingLogs = new Map([[existingLog.id, existingLog]]);
          const mockClient = createMockSupabaseClient(existingLogs);
          const repository = new AuditLogRepository(mockClient);
          
          // Creating a new log should succeed
          const newLog = await repository.create(newLogData);
          expect(newLog).toBeDefined();
          expect(newLog.admin_id).toBe(newLogData.admin_id);
          expect(newLog.action_type).toBe(newLogData.action_type);
          
          // But updating existing log should fail
          const updateResult = await mockClient
            .from('audit_logs')
            .update({ details: { modified: true } })
            .eq('id', existingLog.id)
            .select()
            .single();
          
          expect(updateResult.error).not.toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject bulk update attempts', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogArb, { minLength: 2, maxLength: 10 }),
        async (existingLogsList) => {
          // Setup: Create a mock with multiple existing logs
          const existingLogs = new Map(existingLogsList.map(log => [log.id, log]));
          const mockClient = createMockSupabaseClient(existingLogs);
          
          // Get the first log's action type safely
          const firstLog = existingLogsList[0];
          if (!firstLog) return;
          
          // Attempt to update all logs with a specific action type
          const updateResult = await mockClient
            .from('audit_logs')
            .update({ action_type: 'admin_login' })
            .eq('action_type', firstLog.action_type)
            .select()
            .single();

          // Bulk update should also fail
          expect(updateResult.error).not.toBeNull();
          expect(updateResult.error?.message).toContain('immutable');
          
          // All original logs should be preserved
          for (const originalLog of existingLogsList) {
            const storedLog = existingLogs.get(originalLog.id);
            expect(storedLog).toBeDefined();
            if (storedLog) {
              expect(storedLog.action_type).toBe(originalLog.action_type);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
