/**
 * Onboarding Tasks API Tests
 * 
 * Tests for onboarding CRUD operations
 * Requirements: 7.3, 7.7
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock dependencies
vi.mock("@/lib/auth/index", () => ({
  getSession: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

describe("Onboarding Tasks API", () => {
  let mockSession: any;
  let mockSupabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    mockSession = {
      user: {
        id: "user-123",
      },
    };

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    const { getSession } = await import("@/lib/auth/index");
    const { createClient } = await import("@/lib/supabase/server");

    vi.mocked(getSession).mockResolvedValue(mockSession);
    vi.mocked(createClient).mockResolvedValue(mockSupabase);
  });

  describe("GET /api/onboarding/tasks", () => {
    it("should return all tasks for authenticated user", async () => {
      const { GET } = await import("../tasks/route");
      
      const mockTasks = [
        {
          id: "1",
          user_id: "user-123",
          step_id: "create_first_gallery",
          completed: true,
          completed_at: "2024-01-01T00:00:00Z",
          skipped: false,
          attempts: 1,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          user_id: "user-123",
          step_id: "customize_profile",
          completed: false,
          completed_at: null,
          skipped: false,
          attempts: 0,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockTasks,
        error: null,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tasks).toHaveLength(2);
      expect(data.progress).toBe(25); // 1 out of 4 tasks completed
      expect(data.totalTasks).toBe(4);
      expect(data.completedCount).toBe(1);
    });

    it("should return 401 for unauthenticated user", async () => {
      const { GET } = await import("../tasks/route");
      const { getSession } = await import("@/lib/auth/index");
      
      vi.mocked(getSession).mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("should handle database errors", async () => {
      const { GET } = await import("../tasks/route");
      
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: new Error("Database error"),
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch tasks");
    });
  });

  describe("POST /api/onboarding/tasks", () => {
    it("should create a new task", async () => {
      const { POST } = await import("../tasks/route");
      
      const mockTask = {
        id: "1",
        user_id: "user-123",
        step_id: "create_first_gallery",
        completed: true,
        completed_at: "2024-01-01T00:00:00Z",
        skipped: false,
        attempts: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      // Mock existing task check (no existing task)
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      // Mock upsert
      mockSupabase.single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      });

      // Mock all tasks query
      mockSupabase.eq.mockResolvedValue({
        data: [mockTask],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskId: "create_first_gallery",
          completed: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.task.step_id).toBe("create_first_gallery");
      expect(data.task.completed).toBe(true);
    });

    it("should increment attempts for existing task", async () => {
      const { POST } = await import("../tasks/route");
      
      // Mock existing task with 2 attempts
      mockSupabase.single.mockResolvedValueOnce({
        data: { attempts: 2 },
        error: null,
      });

      const mockTask = {
        id: "1",
        user_id: "user-123",
        step_id: "create_first_gallery",
        completed: true,
        completed_at: "2024-01-01T00:00:00Z",
        skipped: false,
        attempts: 3, // Should be incremented
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockTask,
        error: null,
      });

      mockSupabase.eq.mockResolvedValue({
        data: [mockTask],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskId: "create_first_gallery",
          completed: true,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.attempts).toBe(3);
    });

    it("should return 400 for invalid taskId", async () => {
      const { POST } = await import("../tasks/route");
      
      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "POST",
        body: JSON.stringify({
          taskId: "",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid taskId");
    });
  });

  describe("PUT /api/onboarding/tasks", () => {
    it("should update an existing task", async () => {
      const { PUT } = await import("../tasks/route");
      
      const mockTask = {
        id: "1",
        user_id: "user-123",
        step_id: "create_first_gallery",
        completed: true,
        completed_at: "2024-01-01T00:00:00Z",
        skipped: false,
        attempts: 1,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockTask,
        error: null,
      });

      mockSupabase.eq.mockResolvedValue({
        data: [mockTask],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "PUT",
        body: JSON.stringify({
          taskId: "create_first_gallery",
          completed: true,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.task.completed).toBe(true);
    });

    it("should handle skipped tasks", async () => {
      const { PUT } = await import("../tasks/route");
      
      const mockTask = {
        id: "1",
        user_id: "user-123",
        step_id: "add_logo",
        completed: false,
        completed_at: null,
        skipped: true,
        attempts: 0,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockTask,
        error: null,
      });

      mockSupabase.eq.mockResolvedValue({
        data: [mockTask],
        error: null,
      });

      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "PUT",
        body: JSON.stringify({
          taskId: "add_logo",
          skipped: true,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.task.skipped).toBe(true);
    });
  });

  describe("DELETE /api/onboarding/tasks", () => {
    it("should delete a task", async () => {
      const { DELETE } = await import("../tasks/route");
      
      mockSupabase.delete.mockResolvedValue({
        data: null,
        error: null,
      });

      const request = new NextRequest(
        "http://localhost/api/onboarding/tasks?taskId=create_first_gallery",
        {
          method: "DELETE",
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Task deleted successfully");
    });

    it("should return 400 for missing taskId", async () => {
      const { DELETE } = await import("../tasks/route");
      
      const request = new NextRequest("http://localhost/api/onboarding/tasks", {
        method: "DELETE",
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing taskId parameter");
    });
  });
});
