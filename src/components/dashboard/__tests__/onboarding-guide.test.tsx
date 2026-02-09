/**
 * Unit tests for OnboardingGuide component
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.6
 */

import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OnboardingGuide } from "../onboarding-guide";

// Mock the translation hook
vi.mock("@/lib/i18n/context", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock canvas-confetti
vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

// Mock fetch
global.fetch = vi.fn();

describe("OnboardingGuide", () => {
  const mockOnComplete = vi.fn();
  const mockOnDismiss = vi.fn();
  const userId = "test-user-id";

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, tasks: [] }),
    });
  });

  it("should render loading state initially", () => {
    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    expect(screen.getByText("onboarding.title")).toBeInTheDocument();
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("should load completed tasks from API on mount", async () => {
    const completedTasks = [
      { step_id: "create_first_gallery", completed: true },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, tasks: completedTasks }),
    });

    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/onboarding/tasks");
    });
  });

  it("should display all 4 onboarding tasks", async () => {
    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("onboarding.tasks.createGallery.title")).toBeInTheDocument();
      expect(screen.getByText("onboarding.tasks.customizeProfile.title")).toBeInTheDocument();
      expect(screen.getByText("onboarding.tasks.addLogo.title")).toBeInTheDocument();
      expect(screen.getByText("onboarding.tasks.inviteClient.title")).toBeInTheDocument();
    });
  });

  it("should calculate progress correctly", async () => {
    const completedTasks = [
      { step_id: "create_first_gallery", completed: true },
      { step_id: "customize_profile", completed: true },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, tasks: completedTasks }),
    });

    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    await waitFor(() => {
      // 2 out of 4 tasks = 50%
      expect(screen.getByText("50% common.complete")).toBeInTheDocument();
    });
  });

  it("should show dismiss button", async () => {
    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("onboarding.dismissWithReshow")).toBeInTheDocument();
    });
  });

  it("should fallback to localStorage if API fails", async () => {
    (global.fetch as any).mockRejectedValue(new Error("API error"));

    const localStorageMock = {
      getItem: vi.fn(() => JSON.stringify(["create_first_gallery"])),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
      writable: true,
    });

    render(
      <OnboardingGuide
        onComplete={mockOnComplete}
        onDismiss={mockOnDismiss}
        userId={userId}
      />
    );

    await waitFor(() => {
      expect(localStorageMock.getItem).toHaveBeenCalledWith(
        `onboarding_tasks_${userId}`
      );
    });
  });
});
