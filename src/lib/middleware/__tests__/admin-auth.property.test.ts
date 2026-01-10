/**
 * Property-Based Tests for Admin Authentication Middleware
 * 
 * Feature: admin-dashboard, Property 2: Authentication Audit Logging
 * Validates: Requirements 1.4
 * 
 * Tests that:
 * - For any admin authentication attempt (successful or failed),
 *   an audit log entry SHALL be created with the correct action type and admin ID.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  checkIsAdmin,
  logAdminAuthAttempt,
  getIpAddress,
} from '../admin-auth';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';
import type { IAuditLogService } from '@/lib/services/audit-log.service';
import { NextRequest } from 'next/server';

/**
 * Type for captured log entry
 */
interface CapturedLogEntry {
  adminId: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, unknown>;
  ipAddress: string | null | undefined;
}

/**
 * Arbitrary generators for test data
 */
const ipAddressArb = fc.oneof(
  // IPv4 addresses
  fc.tuple(
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 }),
    fc.integer({ min: 0, max: 255 })
  ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
  // null
  fc.constant(null)
);

/**
 * Helper to create a mock audit log service that captures log entries
 */
function createMockAuditLogService(onLog: (entry: CapturedLogEntry) => void): IAuditLogService {
  return {
    log: vi.fn().mockImplementation(
      async (
        adminId: string,
        actionType: string,
        entityType: string,
        entityId: string | null,
        details: Record<string, unknown>,
        ip?: string | null
      ) => {
        onLog({
          adminId,
          actionType,
          entityType,
          entityId,
          details,
          ipAddress: ip,
        });
        return {
          id: 'audit-log-id',
          admin_id: adminId,
          action_type: actionType,
          entity_type: entityType,
          entity_id: entityId,
          details,
          ip_address: ip ?? null,
          created_at: new Date().toISOString(),
        };
      }
    ),
    list: vi.fn(),
    getByEntityId: vi.fn(),
  };
}

describe('Admin Auth Middleware - Authentication Audit Logging (Property 2)', () => {
  /**
   * Feature: admin-dashboard, Property 2: Authentication Audit Logging
   * Validates: Requirements 1.4
   * 
   * For any admin authentication attempt (successful or failed),
   * an audit log entry SHALL be created with the correct action type and admin ID.
   */

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create audit log entry for successful admin authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        ipAddressArb,
        async (userId, ipAddress) => {
          const capturedEntries: CapturedLogEntry[] = [];
          const mockAuditLogService = createMockAuditLogService((entry) => {
            capturedEntries.push(entry);
          });

          // Log successful authentication
          await logAdminAuthAttempt(mockAuditLogService, userId, true, ipAddress);

          // Verify audit log was created with correct data
          expect(capturedEntries.length).toBe(1);
          const entry = capturedEntries[0]!;
          expect(entry.adminId).toBe(userId);
          expect(entry.actionType).toBe('admin_login');
          expect(entry.entityType).toBe('system');
          expect(entry.entityId).toBeNull();
          expect(entry.details.success).toBe(true);
          expect(entry.details.timestamp).toBeDefined();
          expect(entry.ipAddress).toBe(ipAddress);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should create audit log entry for failed admin authentication', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        ipAddressArb,
        async (userId, ipAddress) => {
          const capturedEntries: CapturedLogEntry[] = [];
          const mockAuditLogService = createMockAuditLogService((entry) => {
            capturedEntries.push(entry);
          });

          // Log failed authentication
          await logAdminAuthAttempt(mockAuditLogService, userId, false, ipAddress);

          // Verify audit log was created with correct data
          expect(capturedEntries.length).toBe(1);
          const entry = capturedEntries[0]!;
          expect(entry.adminId).toBe(userId);
          expect(entry.actionType).toBe('admin_login');
          expect(entry.entityType).toBe('system');
          expect(entry.entityId).toBeNull();
          expect(entry.details.success).toBe(false);
          expect(entry.details.timestamp).toBeDefined();
          expect(entry.ipAddress).toBe(ipAddress);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should always log with admin_login action type regardless of success/failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        ipAddressArb,
        async (userId, success, ipAddress) => {
          const capturedEntries: CapturedLogEntry[] = [];
          const mockAuditLogService = createMockAuditLogService((entry) => {
            capturedEntries.push(entry);
          });

          await logAdminAuthAttempt(mockAuditLogService, userId, success, ipAddress);

          // Action type should always be 'admin_login'
          expect(capturedEntries.length).toBe(1);
          expect(capturedEntries[0]!.actionType).toBe('admin_login');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include timestamp in audit log details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        async (userId, success) => {
          const capturedEntries: CapturedLogEntry[] = [];
          const mockAuditLogService = createMockAuditLogService((entry) => {
            capturedEntries.push(entry);
          });

          await logAdminAuthAttempt(mockAuditLogService, userId, success, null);

          // Details should include a valid timestamp
          expect(capturedEntries.length).toBe(1);
          const details = capturedEntries[0]!.details;
          expect(details.timestamp).toBeDefined();
          expect(typeof details.timestamp).toBe('string');
          
          // Timestamp should be a valid ISO date string
          const timestamp = details.timestamp as string;
          const parsedDate = new Date(timestamp);
          expect(parsedDate.toString()).not.toBe('Invalid Date');
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Admin Auth Middleware - checkIsAdmin function', () => {
  /**
   * Tests for the checkIsAdmin function that verifies admin status
   */

  it('should return true only for users with is_admin = true', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        fc.boolean(),
        async (userId, isAdmin) => {
          // Create mock Supabase client
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    eq: vi.fn().mockImplementation(() => ({
                      single: vi.fn().mockReturnValue(
                        Promise.resolve({
                          data: { is_admin: isAdmin },
                          error: null,
                        })
                      ),
                    })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const result = await checkIsAdmin(mockClient, userId);

          // Result should match the is_admin field exactly
          expect(result).toBe(isAdmin === true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false when user is not found', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),
        async (userId) => {
          // Create mock Supabase client that returns not found
          const mockClient = {
            from: vi.fn().mockImplementation((table: string) => {
              if (table === 'profiles') {
                return {
                  select: vi.fn().mockImplementation(() => ({
                    eq: vi.fn().mockImplementation(() => ({
                      single: vi.fn().mockReturnValue(
                        Promise.resolve({
                          data: null,
                          error: { code: 'PGRST116', message: 'Not found' },
                        })
                      ),
                    })),
                  })),
                };
              }
              return { select: vi.fn().mockReturnValue(Promise.resolve({ data: [], error: null })) };
            }),
          } as unknown as SupabaseClient<Database>;

          const result = await checkIsAdmin(mockClient, userId);

          // Non-existent users should not have admin access
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Admin Auth Middleware - getIpAddress function', () => {
  /**
   * Tests for IP address extraction from requests
   */

  it('should extract IP from x-forwarded-for header', () => {
    fc.assert(
      fc.property(
        // Generate valid IPv4 addresses
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
        (ip) => {
          const request = new NextRequest('http://localhost/api/admin', {
            headers: {
              'x-forwarded-for': ip,
            },
          });

          const result = getIpAddress(request);
          expect(result).toBe(ip);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract first IP from x-forwarded-for with multiple IPs', () => {
    fc.assert(
      fc.property(
        // Generate multiple IPv4 addresses
        fc.array(
          fc.tuple(
            fc.integer({ min: 1, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 }),
            fc.integer({ min: 0, max: 255 })
          ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
          { minLength: 2, maxLength: 5 }
        ),
        (ips) => {
          const forwardedFor = ips.join(', ');
          const request = new NextRequest('http://localhost/api/admin', {
            headers: {
              'x-forwarded-for': forwardedFor,
            },
          });

          const result = getIpAddress(request);
          expect(result).toBe(ips[0]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should extract IP from x-real-ip header when x-forwarded-for is absent', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
        (ip) => {
          const request = new NextRequest('http://localhost/api/admin', {
            headers: {
              'x-real-ip': ip,
            },
          });

          const result = getIpAddress(request);
          expect(result).toBe(ip);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null when no IP headers are present', () => {
    const request = new NextRequest('http://localhost/api/admin');
    const result = getIpAddress(request);
    expect(result).toBeNull();
  });

  it('should prefer x-forwarded-for over x-real-ip', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
        fc.tuple(
          fc.integer({ min: 1, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        ).map(([a, b, c, d]) => `${a}.${b}.${c}.${d}`),
        (forwardedIp, realIp) => {
          const request = new NextRequest('http://localhost/api/admin', {
            headers: {
              'x-forwarded-for': forwardedIp,
              'x-real-ip': realIp,
            },
          });

          const result = getIpAddress(request);
          expect(result).toBe(forwardedIp);
        }
      ),
      { numRuns: 100 }
    );
  });
});
