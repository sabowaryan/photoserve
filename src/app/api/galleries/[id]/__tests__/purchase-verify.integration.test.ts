/**
 * Gallery Purchase Status & Verify Access API Integration Tests
 * 
 * @module app/api/galleries/[id]/__tests__/purchase-verify.integration.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPurchaseStatus } from '../purchase-status/route';
import { GET as getVerifyAccess, POST as postVerifyAccess } from '../verify-access/route';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock gallery purchase service
const mockGetPurchase = vi.fn();
const mockCheckAccess = vi.fn();
vi.mock('@/lib/services/gallery-purchase.service', () => ({
  createGalleryPurchaseService: vi.fn(() => ({
    getPurchase: mockGetPurchase,
    checkAccess: mockCheckAccess,
  })),
}));

const validGalleryId = '123e4567-e89b-12d3-a456-426614174000';

describe('GET /api/galleries/[id]/purchase-status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single.mockResolvedValue({
      data: { id: validGalleryId },
      error: null,
    });
  });

  it('should return purchase status when found by email', async () => {
    const mockPurchase = {
      id: 'purchase_123',
      status: 'succeeded',
      amountCents: 2999,
      currency: 'usd',
      purchasedAt: '2026-01-15T10:00:00Z',
      accessGrantedAt: '2026-01-15T10:00:00Z',
      accessExpiresAt: null,
    };

    mockGetPurchase.mockResolvedValue(mockPurchase);

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/purchase-status?email=buyer@example.com`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasPurchased).toBe(true);
    expect(data.purchase.id).toBe('purchase_123');
    expect(data.purchase.status).toBe('succeeded');
  });

  it('should return purchase status when found by sessionId', async () => {
    const mockPurchase = {
      id: 'purchase_456',
      status: 'succeeded',
      amountCents: 1999,
      currency: 'eur',
      purchasedAt: '2026-01-15T11:00:00Z',
      accessGrantedAt: '2026-01-15T11:00:00Z',
      accessExpiresAt: '2026-02-15T11:00:00Z',
    };

    mockGetPurchase.mockResolvedValue(mockPurchase);

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/purchase-status?sessionId=session_abc`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasPurchased).toBe(true);
    expect(data.purchase.accessExpiresAt).toBe('2026-02-15T11:00:00Z');
  });

  it('should return hasPurchased false when no purchase found', async () => {
    mockGetPurchase.mockResolvedValue(null);

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/purchase-status?email=nopurchase@example.com`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasPurchased).toBe(false);
    expect(data.purchase).toBeNull();
  });

  it('should return 400 when neither email nor sessionId provided', async () => {
    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/purchase-status`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid gallery ID', async () => {
    const request = new NextRequest(
      `http://localhost/api/galleries/invalid-id/purchase-status?email=test@example.com`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: 'invalid-id' }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 404 when gallery not found', async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/purchase-status?email=test@example.com`
    );

    const response = await getPurchaseStatus(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/galleries/[id]/verify-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: gallery exists
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { is_enabled: true },
        error: null,
      });
  });

  it('should return hasAccess true for purchased gallery', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      expiresAt: null,
      purchase: {
        id: 'purchase_123',
        purchasedAt: '2026-01-15T10:00:00Z',
        accessGrantedAt: '2026-01-15T10:00:00Z',
      },
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access?email=buyer@example.com`
    );

    const response = await getVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(true);
    expect(data.reason).toBe('purchased');
    expect(data.purchase.id).toBe('purchase_123');
  });

  it('should return hasAccess false for no purchase', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: false,
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access?email=noaccess@example.com`
    );

    const response = await getVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(false);
    expect(data.reason).toBe('no_purchase');
  });

  it('should return hasAccess true for free gallery (no monetization)', async () => {
    // Reset mocks for this test - need to reset the mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single
      .mockReset()
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access?email=anyone@example.com`
    );

    const response = await getVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(true);
    expect(data.reason).toBe('free_gallery');
  });

  it('should return hasAccess true for disabled monetization', async () => {
    // Reset mocks for this test - need to reset the mock chain
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single
      .mockReset()
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { is_enabled: false },
        error: null,
      });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access?email=anyone@example.com`
    );

    const response = await getVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(true);
    expect(data.reason).toBe('free_gallery');
  });

  it('should include expiresAt when access has expiration', async () => {
    // Reset mocks for this test
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single
      .mockReset()
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { is_enabled: true },
        error: null,
      });

    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      expiresAt: '2026-02-15T10:00:00Z',
      purchase: {
        id: 'purchase_123',
        purchasedAt: '2026-01-15T10:00:00Z',
        accessGrantedAt: '2026-01-15T10:00:00Z',
      },
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access?email=buyer@example.com`
    );

    const response = await getVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.expiresAt).toBe('2026-02-15T10:00:00Z');
  });
});

describe('POST /api/galleries/[id]/verify-access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.single
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { is_enabled: true },
        error: null,
      });
  });

  it('should verify access with email in body', async () => {
    // Reset mocks for this test
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single
      .mockReset()
      .mockResolvedValueOnce({
        data: { id: validGalleryId, is_active: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { is_enabled: true },
        error: null,
      });

    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      expiresAt: null,
      purchase: {
        id: 'purchase_123',
        purchasedAt: '2026-01-15T10:00:00Z',
        accessGrantedAt: '2026-01-15T10:00:00Z',
      },
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access`,
      {
        method: 'POST',
        body: JSON.stringify({ email: 'buyer@example.com' }),
      }
    );

    const response = await postVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(true);
    expect(mockCheckAccess).toHaveBeenCalledWith(validGalleryId, 'buyer@example.com');
  });

  it('should verify access with sessionId in body', async () => {
    mockCheckAccess.mockResolvedValue({
      hasAccess: true,
      expiresAt: null,
      purchase: {
        id: 'purchase_456',
        purchasedAt: '2026-01-15T10:00:00Z',
        accessGrantedAt: '2026-01-15T10:00:00Z',
      },
    });

    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access`,
      {
        method: 'POST',
        body: JSON.stringify({ sessionId: 'session_abc123' }),
      }
    );

    const response = await postVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.hasAccess).toBe(true);
    expect(mockCheckAccess).toHaveBeenCalledWith(validGalleryId, 'session_abc123');
  });

  it('should return 400 when neither email nor sessionId in body', async () => {
    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access`,
      {
        method: 'POST',
        body: JSON.stringify({}),
      }
    );

    const response = await postVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email in body', async () => {
    const request = new NextRequest(
      `http://localhost/api/galleries/${validGalleryId}/verify-access`,
      {
        method: 'POST',
        body: JSON.stringify({ email: 'invalid-email' }),
      }
    );

    const response = await postVerifyAccess(request, {
      params: Promise.resolve({ id: validGalleryId }),
    });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });
});
