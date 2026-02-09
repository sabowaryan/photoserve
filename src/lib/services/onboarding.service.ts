/**
 * Onboarding Service
 * 
 * Provides methods for managing user onboarding state
 * Requirements: 7.1, 7.2, 7.3, 7.7
 */

import { requireSupabaseClient } from "@/lib/auth";

export interface OnboardingTask {
  id: string;
  user_id: string;
  step_id: string;
  completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingProgress {
  tasks: OnboardingTask[];
  progress: number;
  totalTasks: number;
  completedCount: number;
  allCompleted: boolean;
}

export const ONBOARDING_TASKS = {
  CREATE_FIRST_GALLERY: "create_first_gallery",
  CUSTOMIZE_PROFILE: "customize_profile",
  ADD_LOGO: "add_logo",
  INVITE_TEST_CLIENT: "invite_test_client",
} as const;

export const REQUIRED_TASKS = Object.values(ONBOARDING_TASKS);

export class OnboardingService {
  /**
   * Get all onboarding tasks for a user
   */
  static async getUserTasks(userId: string): Promise<OnboardingProgress> {
    const { supabase } = await requireSupabaseClient();

    const { data, error } = await supabase
      .from("onboarding_states")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching onboarding tasks:", error);
      throw new Error("Failed to fetch onboarding tasks");
    }

    const tasks = (data || []) as OnboardingTask[];
    const completedTasks = tasks.filter((t) => t.completed);
    const progress = Math.round((completedTasks.length / REQUIRED_TASKS.length) * 100);
    const allCompleted = REQUIRED_TASKS.every((taskId) =>
      completedTasks.some((t) => t.step_id === taskId)
    );

    return {
      tasks,
      progress,
      totalTasks: REQUIRED_TASKS.length,
      completedCount: completedTasks.length,
      allCompleted,
    };
  }

  /**
   * Mark a task as completed
   */
  static async completeTask(userId: string, taskId: string): Promise<OnboardingTask> {
    const { supabase } = await requireSupabaseClient();

    // Get existing task to increment attempts
    const { data: existingTask, error: existingError } = await supabase
      .from("onboarding_states")
      .select("attempts")
      .eq("user_id", userId)
      .eq("step_id", taskId)
      .single();

    const attempts = (existingTask && !existingError) ? (existingTask.attempts || 0) + 1 : 1;

    const { data, error } = await supabase
      .from("onboarding_states")
      .upsert(
        {
          user_id: userId,
          step_id: taskId,
          completed: true,
          completed_at: new Date().toISOString(),
          attempts,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,step_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error completing onboarding task:", error);
      throw new Error("Failed to complete task");
    }

    // Check if all tasks are completed and update profile
    await this.checkAndUpdateCompletion(userId);

    return data as OnboardingTask;
  }

  /**
   * Skip a task
   */
  static async skipTask(userId: string, taskId: string): Promise<OnboardingTask> {
    const { supabase } = await requireSupabaseClient();

    const { data, error } = await supabase
      .from("onboarding_states")
      .upsert(
        {
          user_id: userId,
          step_id: taskId,
          skipped: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,step_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error skipping onboarding task:", error);
      throw new Error("Failed to skip task");
    }

    return data as OnboardingTask;
  }

  /**
   * Reset a task
   */
  static async resetTask(userId: string, taskId: string): Promise<void> {
    const { supabase } = await requireSupabaseClient();

    const { error } = await supabase
      .from("onboarding_states")
      .delete()
      .eq("user_id", userId)
      .eq("step_id", taskId);

    if (error) {
      console.error("Error resetting onboarding task:", error);
      throw new Error("Failed to reset task");
    }
  }

  /**
   * Check if all tasks are completed and update profile
   */
  private static async checkAndUpdateCompletion(userId: string): Promise<boolean> {
    const { supabase } = await requireSupabaseClient();

    const { data: allTasks } = await supabase
      .from("onboarding_states")
      .select("step_id, completed")
      .eq("user_id", userId);

    const completedTasks =
      (allTasks || []).filter((t) => t.completed).map((t) => t.step_id);
    const allCompleted = REQUIRED_TASKS.every((task) => completedTasks.includes(task));

    if (allCompleted) {
      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (error) {
        console.error("Error updating profile onboarding status:", error);
      }
    }

    return allCompleted;
  }

  /**
   * Check if a specific task is completed
   */
  static async isTaskCompleted(userId: string, taskId: string): Promise<boolean> {
    const { supabase } = await requireSupabaseClient();

    const { data, error } = await supabase
      .from("onboarding_states")
      .select("completed")
      .eq("user_id", userId)
      .eq("step_id", taskId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.completed === true;
  }

  /**
   * Get onboarding progress percentage
   */
  static async getProgress(userId: string): Promise<number> {
    const progress = await this.getUserTasks(userId);
    return progress.progress;
  }

  /**
   * Initialize onboarding for a new user
   */
  static async initializeOnboarding(userId: string): Promise<void> {
    const { supabase } = await requireSupabaseClient();

    // Create initial task records
    const tasks = REQUIRED_TASKS.map((taskId) => ({
      user_id: userId,
      step_id: taskId,
      completed: false,
      skipped: false,
      attempts: 0,
    }));

    const { error } = await supabase
      .from("onboarding_states")
      .insert(tasks)
      .select();

    if (error) {
      console.error("Error initializing onboarding:", error);
      // Don't throw - this is not critical
    }
  }
}
