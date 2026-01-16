/**
 * Gallery Purchase Checkout API Integration Tests
 * 
 * @module app/api/stripe/checkout/__tests__/gallery-purchase.integration.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../gallery-purchase/route';

// Mock Supabase
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  insert: vi.fn().mockReturnThis(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock Stripe
const mockStripeCheckoutCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(() => ({
    checkout: {
      sessions: {
        create: mockStripeCheckoutCreate,
      },
    },
  })),
}));

// Mock gallery purchase service
const mockCreateCheckoutSession = vi.fn();
vi.mock('@/lib/services/gallery-purchase.service', () => ({
  createGalleryPurchaseService: vi.fn(() => ({
    createCheckoutSession: mockCreateCheckoutSession,
  })),
}));

describe('POST /api/stripe/checkout/gallery-purchase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create checkout session with valid data', async () => {
    const galleryId = '123e4567-e89b-12d3-a456-426614174000';
    const buyerEmail = 'buyer@example.com';

    mockCreateCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/pay/cs_test_123',
    });

    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({
        galleryId,
        buyerEmail,
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.sessionId).toBe('cs_test_123');
    expect(data.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      galleryId,
      buyerEmail,
      undefined
    );
  });

  it('should include buyerSessionId when provided', async () => {
    const galleryId = '123e4567-e89b-12d3-a456-426614174000';
    const buyerEmail = 'buyer@example.com';
    const buyerSessionId = 'session_abc123';

    mockCreateCheckoutSession.mockResolvedValue({
      sessionId: 'cs_test_456',
      url: 'https://checkout.stripe.com/pay/cs_test_456',
    });

    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({
        galleryId,
        buyerEmail,
        buyerSessionId,
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(mockCreateCheckoutSession).toHaveBeenCalledWith(
      galleryId,
      buyerEmail,
      buyerSessionId
    );
  });

  it('should return 400 for invalid gallery ID', async () => {
    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({
        galleryId: 'invalid-uuid',
        buyerEmail: 'buyer@example.com',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid email', async () => {
    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({
        galleryId: '123e4567-e89b-12d3-a456-426614174000',
        buyerEmail: 'invalid-email',
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for missing required fields', async () => {
    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  it('should handle service errors', async () => {
    mockCreateCheckoutSession.mockRejectedValue(
      new Error('Photographer has not connected Stripe')
    );

    const request = new NextRequest('http://localhost/api/stripe/checkout/gallery-purchase', {
      method: 'POST',
      body: JSON.stringify({
        galleryId: '123e4567-e89b-12d3-a456-426614174000',
        buyerEmail: 'buyer@example.com',
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(500);
  });
});
