/**
 * useOnboarding Hook
 * 
 * React hook for managing onboarding state
 * Requirements: 7.1, 7.2, 7.3, 7.7
 */

import { useState, useEffect, useCallback } from "react";
import type {
  OnboardingTask,
  OnboardingTaskId,
} from "@/types/onboarding";

interface UseOnboardingReturn {
  tasks: OnboardingTask[];
  progress: number;
  totalTasks: number;
  completedCount: number;
  allCompleted: boolean;
  isLoading: boolean;
  error: string | null;
  completeTask: (taskId: OnboardingTaskId) => Promise<void>;
  skipTask: (taskId: OnboardingTaskId) => Promise<void>;
  resetTask: (taskId: OnboardingTaskId) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [tasks, setTasks] = useState<OnboardingTask[]>([]);
  const [progress, setProgress] = useState(0);
  const [totalTasks, setTotalTasks] = useState(4);
  const [completedCount, setCompletedCount] = useState(0);
  const [allCompleted, setAllCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/onboarding/tasks");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tasks");
      }

      setTasks(data.tasks || []);
      setProgress(data.progress || 0);
      setTotalTasks(data.totalTasks || 4);
      setCompletedCount(data.completedCount || 0);

      // Check if all tasks are completed
      const requiredTasks = [
        "create_first_gallery",
        "customize_profile",
        "add_logo",
        "invite_test_client",
      ];
      const completed = requiredTasks.every((taskId) =>
        data.tasks?.some((t: OnboardingTask) => t.step_id === taskId && t.completed)
      );
      setAllCompleted(completed);
    } catch (err) {
      console.error("Error fetching onboarding tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const completeTask = useCallback(
    async (taskId: OnboardingTaskId) => {
      try {
        setError(null);

        const response = await fetch("/api/onboarding/tasks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            completed: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to complete task");
        }

        // Refresh tasks
        await fetchTasks();
      } catch (err) {
        console.error("Error completing task:", err);
        setError(err instanceof Error ? err.message : "Failed to complete task");
        throw err;
      }
    },
    [fetchTasks]
  );

  const skipTask = useCallback(
    async (taskId: OnboardingTaskId) => {
      try {
        setError(null);

        const response = await fetch("/api/onboarding/tasks", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            taskId,
            skipped: true,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to skip task");
        }

        // Refresh tasks
        await fetchTasks();
      } catch (err) {
        console.error("Error skipping task:", err);
        setError(err instanceof Error ? err.message : "Failed to skip task");
        throw err;
      }
    },
    [fetchTasks]
  );

  const resetTask = useCallback(
    async (taskId: OnboardingTaskId) => {
      try {
        setError(null);

        const response = await fetch(`/api/onboarding/tasks?taskId=${taskId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to reset task");
        }

        // Refresh tasks
        await fetchTasks();
      } catch (err) {
        console.error("Error resetting task:", err);
        setError(err instanceof Error ? err.message : "Failed to reset task");
        throw err;
      }
    },
    [fetchTasks]
  );

  return {
    tasks,
    progress,
    totalTasks,
    completedCount,
    allCompleted,
    isLoading,
    error,
    completeTask,
    skipTask,
    resetTask,
    refresh: fetchTasks,
  };
}
