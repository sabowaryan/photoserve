/**
 * Dashboard API Routes Tests
 * 
 * Tests for email dashboard API endpoints:
 * - /api/emails/stats
 * - /api/emails/recent
 * - /api/emails/providers/status
 * - /api/emails/queue/stats
 * - /api/emails/queue/health
 * - /api/emails/queue/status
 * - /api/emails/queue/process
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Supabase client
vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lt: vi.fn(() => ({ count: 0, error: null })),
        })),
        in: vi.fn(() => ({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: { code: "PGRST116" } })),
          not: vi.fn(() => ({
            is: vi.fn(() => ({
              gt: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({ data: [], error: null })),
                })),
              })),
            })),
            gt: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({ data: [], error: null })),
              })),
            })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
        })),
        not: vi.fn(() => ({
          gt: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [], error: null })),
            })),
          })),
        })),
      })),
    })),
  })),
}));

// Mock QueueManager
vi.mock("@/lib/email/queue-manager", () => ({
  QueueManager: class MockQueueManager {
    async getStats() {
      return {
        pending: 0,
        processing: 0,
        sent: 0,
        failed: 0,
        scheduled: 0,
        byPriority: {
          high: 0,
          normal: 0,
          low: 0,
        },
      };
    }
    async getQueueHealth() {
      return {
        status: "healthy" as const,
        queueDepth: 0,
        processingRate: 0,
        errorRate: 0,
        oldestPendingAge: 0,
        issues: [],
        recommendations: [],
      };
    }
    async processBatch() {
      return [];
    }
  },
}));

describe("Dashboard API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/emails/stats", () => {
    it("should return email statistics", async () => {
      const { GET } = await import("@/app/api/emails/stats/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("stats");
      expect(data.stats).toHaveProperty("sentToday");
      expect(data.stats).toHaveProperty("queueSize");
      expect(data.stats).toHaveProperty("deliveryRate");
      expect(data.stats).toHaveProperty("bounceRate");
    });

    it("should return numeric values", async () => {
      const { GET } = await import("@/app/api/emails/stats/route");
      const response = await GET();
      const data = await response.json();

      expect(typeof data.stats.sentToday).toBe("number");
      expect(typeof data.stats.queueSize).toBe("number");
      expect(typeof data.stats.deliveryRate).toBe("number");
      expect(typeof data.stats.bounceRate).toBe("number");
    });
  });

  describe("GET /api/emails/recent", () => {
    it("should return recent email logs", async () => {
      const { GET } = await import("@/app/api/emails/recent/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("logs");
      expect(Array.isArray(data.logs)).toBe(true);
    });
  });

  describe("GET /api/emails/providers/status", () => {
    it("should return provider status", async () => {
      const { GET } = await import("@/app/api/emails/providers/status/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("provider");
      expect(data).toHaveProperty("status");
    });

    it("should return not_configured when no provider", async () => {
      const { GET } = await import("@/app/api/emails/providers/status/route");
      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe("not_configured");
      expect(data.provider).toBeNull();
    });
  });

  describe("GET /api/emails/queue/stats", () => {
    it("should return queue statistics", async () => {
      const { GET } = await import("@/app/api/emails/queue/stats/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("stats");
      expect(data.stats).toHaveProperty("pending");
      expect(data.stats).toHaveProperty("processing");
      expect(data.stats).toHaveProperty("sent");
      expect(data.stats).toHaveProperty("failed");
      expect(data.stats).toHaveProperty("scheduled");
      expect(data.stats).toHaveProperty("byPriority");
    });

    it("should return priority breakdown", async () => {
      const { GET } = await import("@/app/api/emails/queue/stats/route");
      const response = await GET();
      const data = await response.json();

      expect(data.stats.byPriority).toHaveProperty("high");
      expect(data.stats.byPriority).toHaveProperty("normal");
      expect(data.stats.byPriority).toHaveProperty("low");
    });
  });

  describe("GET /api/emails/queue/health", () => {
    it("should return queue health metrics", async () => {
      const { GET } = await import("@/app/api/emails/queue/health/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("health");
      expect(data.health).toHaveProperty("status");
      expect(data.health).toHaveProperty("queueDepth");
      expect(data.health).toHaveProperty("processingRate");
      expect(data.health).toHaveProperty("errorRate");
      expect(data.health).toHaveProperty("oldestPendingAge");
      expect(data.health).toHaveProperty("issues");
      expect(data.health).toHaveProperty("recommendations");
    });

    it("should return valid health status", async () => {
      const { GET } = await import("@/app/api/emails/queue/health/route");
      const response = await GET();
      const data = await response.json();

      expect(["healthy", "degraded", "unhealthy"]).toContain(data.health.status);
    });
  });

  describe("GET /api/emails/queue/status", () => {
    it("should return queue status breakdown", async () => {
      const { GET } = await import("@/app/api/emails/queue/status/route");
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("scheduled");
      expect(data.status).toHaveProperty("pending");
      expect(data.status).toHaveProperty("processing");
      expect(data.status).toHaveProperty("failed");
      expect(Array.isArray(data.scheduled)).toBe(true);
    });
  });

  describe("POST /api/emails/queue/process", () => {
    it("should process queue with default batch size", async () => {
      const { POST } = await import("@/app/api/emails/queue/process/route");
      const request = new NextRequest("http://localhost:3000/api/emails/queue/process", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("success");
      expect(data).toHaveProperty("processed");
      expect(data).toHaveProperty("successful");
      expect(data).toHaveProperty("failed");
      expect(data).toHaveProperty("results");
    });

    it("should process queue with custom batch size", async () => {
      const { POST } = await import("@/app/api/emails/queue/process/route");
      const request = new NextRequest("http://localhost:3000/api/emails/queue/process", {
        method: "POST",
        body: JSON.stringify({ batchSize: 5 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it("should reject invalid batch size (too small)", async () => {
      const { POST } = await import("@/app/api/emails/queue/process/route");
      const request = new NextRequest("http://localhost:3000/api/emails/queue/process", {
        method: "POST",
        body: JSON.stringify({ batchSize: 0 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });

    it("should reject invalid batch size (too large)", async () => {
      const { POST } = await import("@/app/api/emails/queue/process/route");
      const request = new NextRequest("http://localhost:3000/api/emails/queue/process", {
        method: "POST",
        body: JSON.stringify({ batchSize: 101 }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
    });
  });
});
