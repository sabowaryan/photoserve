/**
 * Onboarding Task Tracker
 * 
 * Utility functions to automatically mark onboarding tasks as complete
 * when users perform certain actions.
 * 
 * Requirements: 7.3, 7.4
 */

/**
 * Mark an onboarding task as complete
 * 
 * @param taskId - The task identifier (e.g., "create_first_gallery")
 * @returns Promise that resolves when the task is marked complete
 */
export async function markOnboardingTaskComplete(taskId: string): Promise<void> {
  try {
    const response = await fetch("/api/onboarding/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, completed: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to mark task ${taskId} as complete`);
    }

    const data = await response.json();
    
    // If all tasks are completed, trigger celebration
    if (data.allCompleted) {
      console.log("🎉 All onboarding tasks completed!");
    }

    return data;
  } catch (error) {
    console.error("Error marking onboarding task complete:", error);
    throw error;
  }
}

/**
 * Check if a specific task is completed
 * 
 * @param taskId - The task identifier
 * @returns Promise that resolves to true if the task is completed
 */
export async function isTaskCompleted(taskId: string): Promise<boolean> {
  try {
    const response = await fetch("/api/onboarding/tasks");
    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (!data.success || !data.tasks) {
      return false;
    }

    const task = data.tasks.find((t: any) => t.step_id === taskId);
    return task?.completed || false;
  } catch (error) {
    console.error("Error checking task completion:", error);
    return false;
  }
}

/**
 * Get all completed tasks
 * 
 * @returns Promise that resolves to an array of completed task IDs
 */
export async function getCompletedTasks(): Promise<string[]> {
  try {
    const response = await fetch("/api/onboarding/tasks");
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    if (!data.success || !data.tasks) {
      return [];
    }

    return data.tasks
      .filter((t: any) => t.completed)
      .map((t: any) => t.step_id);
  } catch (error) {
    console.error("Error fetching completed tasks:", error);
    return [];
  }
}

/**
 * Task IDs for reference
 */
export const ONBOARDING_TASKS = {
  CREATE_FIRST_GALLERY: "create_first_gallery",
  CUSTOMIZE_PROFILE: "customize_profile",
  ADD_LOGO: "add_logo",
  INVITE_TEST_CLIENT: "invite_test_client",
} as const;

/**
 * Example usage:
 * 
 * // When user creates their first gallery:
 * await markOnboardingTaskComplete(ONBOARDING_TASKS.CREATE_FIRST_GALLERY);
 * 
 * // When user updates their profile:
 * await markOnboardingTaskComplete(ONBOARDING_TASKS.CUSTOMIZE_PROFILE);
 * 
 * // When user uploads a logo:
 * await markOnboardingTaskComplete(ONBOARDING_TASKS.ADD_LOGO);
 * 
 * // When user shares a gallery with a client:
 * await markOnboardingTaskComplete(ONBOARDING_TASKS.INVITE_TEST_CLIENT);
 */
