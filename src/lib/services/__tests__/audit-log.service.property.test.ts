/**
 * Property-Based Tests for Audit Log Service - Filtering
 * 
 * Feature: admin-dashboard, Property 14: Audit Log Filtering
 * Validates: Requirements 7.3
 * 
 * Tests that:
 * - For any audit log filter combination (adminId, actionType, dateFrom, dateTo),
 *   all entries returned SHALL match all specified filter criteria.
 */

import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import { AuditLogService } from '../audit-log.service';
import type { IAuditLogRepository } from '@/lib/repositories/audit-log.repository';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, AuditActionType, AuditEntityType } from '@/lib/supabase/types';
import type { AuditLogWithAdmin, AuditLogFilters, PaginatedResult } from '@/types/admin';

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
 * Arbitrary for generating a complete audit log entry with admin info
 */
const auditLogWithAdminArb = fc.record({
  id: uuidArb,
  admin_id: uuidArb,
  action_type: auditActionTypeArb,
  entity_type: auditEntityTypeArb,
  entity_id: fc.option(uuidArb, { nil: null }),
  details: detailsArb,
  ip_address: ipAddressArb,
  created_at: fc.integer({ min: 1704067200000, max: 1798761600000 }).map(ts => new Date(ts).toISOString()),
  admin_email: fc.emailAddress(),
  admin_name: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: null }),
});

/**
 * Arbitrary for generating filter options
 */
const filtersArb = fc.record({
  adminId: fc.option(uuidArb, { nil: undefined }),
  actionType: fc.option(auditActionTypeArb, { nil: undefined }),
  entityType: fc.option(auditEntityTypeArb, { nil: undefined }),
  entityId: fc.option(uuidArb, { nil: undefined }),
  dateFrom: fc.option(
    fc.integer({ min: 1704067200000, max: 1719792000000 }).map(ts => new Date(ts).toISOString()),
    { nil: undefined }
  ),
  dateTo: fc.option(
    fc.integer({ min: 1719792000000, max: 1798761600000 }).map(ts => new Date(ts).toISOString()),
    { nil: undefined }
  ),
  page: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
  limit: fc.option(fc.integer({ min: 1, max: 50 }), { nil: undefined }),
});

/**
 * Helper function to check if a log matches the given filters
 */
function logMatchesFilters(log: AuditLogWithAdmin, filters: AuditLogFilters): boolean {
  // Check adminId filter
  if (filters.adminId && log.admin_id !== filters.adminId) {
    return false;
  }

  // Check actionType filter
  if (filters.actionType && log.action_type !== filters.actionType) {
    return false;
  }

  // Check entityType filter
  if (filters.entityType && log.entity_type !== filters.entityType) {
    return false;
  }

  // Check entityId filter
  if (filters.entityId && log.entity_id !== filters.entityId) {
    return false;
  }

  // Check dateFrom filter
  if (filters.dateFrom) {
    const logDate = new Date(log.created_at);
    const fromDate = new Date(filters.dateFrom);
    if (logDate < fromDate) {
      return false;
    }
  }

  // Check dateTo filter
  if (filters.dateTo) {
    const logDate = new Date(log.created_at);
    const toDate = new Date(filters.dateTo);
    if (logDate > toDate) {
      return false;
    }
  }

  return true;
}

/**
 * Creates a mock repository that filters logs based on the provided filters
 */
function createMockRepository(allLogs: AuditLogWithAdmin[]): IAuditLogRepository {
  return {
    create: vi.fn().mockImplementation(async (log) => ({
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    })),
    list: vi.fn().mockImplementation(async (filters: AuditLogFilters) => {
      // Filter logs based on criteria
      const filteredLogs = allLogs.filter(log => logMatchesFilters(log, filters));
      
      // Apply pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);
      
      return {
        data: paginatedLogs,
        total: filteredLogs.length,
        page,
        limit,
        totalPages: Math.ceil(filteredLogs.length / limit),
      } as PaginatedResult<AuditLogWithAdmin>;
    }),
    getByEntityId: vi.fn().mockImplementation(async (entityId: string) => {
      return allLogs.filter(log => log.entity_id === entityId);
    }),
  };
}

/**
 * Creates a mock Supabase client (not used directly but required for service instantiation)
 */
function createMockSupabaseClient(): SupabaseClient<Database> {
  return {
    from: vi.fn(),
  } as unknown as SupabaseClient<Database>;
}

describe('Audit Log Service - Filtering (Property 14)', () => {
  /**
   * Feature: admin-dashboard, Property 14: Audit Log Filtering
   * Validates: Requirements 7.3
   * 
   * For any audit log filter combination (adminId, actionType, dateFrom, dateTo),
   * all entries returned SHALL match all specified filter criteria.
   */

  it('should return only logs matching adminId filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        uuidArb,
        async (allLogs, targetAdminId) => {
          // Ensure at least one log has the target admin ID
          if (allLogs.length > 0 && allLogs[0]) {
            const firstLog = allLogs[0];
            allLogs[0] = {
              id: firstLog.id,
              admin_id: targetAdminId,
              action_type: firstLog.action_type,
              entity_type: firstLog.entity_type,
              entity_id: firstLog.entity_id,
              details: firstLog.details,
              ip_address: firstLog.ip_address,
              created_at: firstLog.created_at,
              admin_email: firstLog.admin_email,
              admin_name: firstLog.admin_name,
            };
          }

          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { adminId: targetAdminId };
          const result = await service.list(filters);

          // All returned logs should have the target admin ID
          for (const log of result.data) {
            expect(log.admin_id).toBe(targetAdminId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only logs matching actionType filter', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        auditActionTypeArb,
        async (allLogs, targetActionType) => {
          // Ensure at least one log has the target action type
          if (allLogs.length > 0 && allLogs[0]) {
            const firstLog = allLogs[0];
            allLogs[0] = {
              id: firstLog.id,
              admin_id: firstLog.admin_id,
              action_type: targetActionType,
              entity_type: firstLog.entity_type,
              entity_id: firstLog.entity_id,
              details: firstLog.details,
              ip_address: firstLog.ip_address,
              created_at: firstLog.created_at,
              admin_email: firstLog.admin_email,
              admin_name: firstLog.admin_name,
            };
          }

          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { actionType: targetActionType };
          const result = await service.list(filters);

          // All returned logs should have the target action type
          for (const log of result.data) {
            expect(log.action_type).toBe(targetActionType);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only logs within date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 1704067200000, max: 1719792000000 }).map(ts => new Date(ts)),
        fc.integer({ min: 1719792000000, max: 1798761600000 }).map(ts => new Date(ts)),
        async (allLogs, fromDate, toDate) => {
          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = {
            dateFrom: fromDate.toISOString(),
            dateTo: toDate.toISOString(),
          };
          const result = await service.list(filters);

          // All returned logs should be within the date range
          for (const log of result.data) {
            const logDate = new Date(log.created_at);
            expect(logDate >= fromDate).toBe(true);
            expect(logDate <= toDate).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return only logs matching combined filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 10, maxLength: 30 }),
        filtersArb,
        async (allLogs, filters) => {
          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const result = await service.list(filters);

          // All returned logs should match ALL specified filters
          for (const log of result.data) {
            expect(logMatchesFilters(log, filters)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return empty result when no logs match filters', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        uuidArb,
        async (allLogs, nonExistentAdminId) => {
          // Ensure no log has the non-existent admin ID
          const logsWithoutTarget = allLogs.map(log => ({
            ...log,
            admin_id: log.admin_id === nonExistentAdminId ? crypto.randomUUID() : log.admin_id,
          }));

          const mockRepo = createMockRepository(logsWithoutTarget);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { adminId: nonExistentAdminId };
          const result = await service.list(filters);

          // Should return empty array when no matches
          expect(result.data.length).toBe(0);
          expect(result.total).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should respect pagination limits', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 20, maxLength: 50 }),
        fc.integer({ min: 1, max: 10 }),
        async (allLogs, limit) => {
          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { limit };
          const result = await service.list(filters);

          // Should not return more than the specified limit
          expect(result.data.length).toBeLessThanOrEqual(limit);
          expect(result.limit).toBe(limit);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should cap pagination limit at 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        fc.integer({ min: 101, max: 500 }),
        async (allLogs, requestedLimit) => {
          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { limit: requestedLimit };
          const result = await service.list(filters);

          // Limit should be capped at 100
          expect(result.limit).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return correct pagination metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 10, maxLength: 50 }),
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 5, max: 15 }),
        async (allLogs, page, limit) => {
          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const filters: AuditLogFilters = { page, limit };
          const result = await service.list(filters);

          // Pagination metadata should be correct
          expect(result.page).toBe(page);
          expect(result.limit).toBe(limit);
          expect(result.totalPages).toBe(Math.ceil(result.total / limit));
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return logs for specific entity when using getByEntityId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(auditLogWithAdminArb, { minLength: 5, maxLength: 20 }),
        uuidArb,
        async (allLogs, targetEntityId) => {
          // Ensure at least one log has the target entity ID
          if (allLogs.length > 0 && allLogs[0]) {
            const firstLog = allLogs[0];
            allLogs[0] = {
              id: firstLog.id,
              admin_id: firstLog.admin_id,
              action_type: firstLog.action_type,
              entity_type: firstLog.entity_type,
              entity_id: targetEntityId,
              details: firstLog.details,
              ip_address: firstLog.ip_address,
              created_at: firstLog.created_at,
              admin_email: firstLog.admin_email,
              admin_name: firstLog.admin_name,
            };
          }

          const mockRepo = createMockRepository(allLogs);
          const mockClient = createMockSupabaseClient();
          const service = new AuditLogService(mockClient, mockRepo);

          const result = await service.getByEntityId(targetEntityId);

          // All returned logs should have the target entity ID
          for (const log of result) {
            expect(log.entity_id).toBe(targetEntityId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
