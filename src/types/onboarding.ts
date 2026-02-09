/**
 * Onboarding Types
 * 
 * Type definitions for onboarding state and tasks
 * Requirements: 7.1, 7.2, 7.3, 7.7
 */

export type OnboardingTaskId =
  | "create_first_gallery"
  | "customize_profile"
  | "add_logo"
  | "invite_test_client";

export interface OnboardingTask {
  id: string;
  user_id: string;
  step_id: OnboardingTaskId;
  completed: boolean;
  completed_at: string | null;
  skipped: boolean;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export interface OnboardingTaskDefinition {
  id: OnboardingTaskId;
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  required: boolean;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export interface OnboardingProgress {
  tasks: OnboardingTask[];
  progress: number; // 0-100
  totalTasks: number;
  completedCount: number;
  allCompleted: boolean;
}

export interface OnboardingState {
  isVisible: boolean;
  isDismissed: boolean;
  progress: OnboardingProgress;
}

// API Request/Response types
export interface CompleteTaskRequest {
  taskId: OnboardingTaskId;
  completed?: boolean;
  skipped?: boolean;
}

export interface CompleteTaskResponse {
  success: boolean;
  task: OnboardingTask;
  allCompleted: boolean;
  completedTasks: OnboardingTaskId[];
}

export interface GetTasksResponse {
  success: boolean;
  tasks: OnboardingTask[];
  progress: number;
  totalTasks: number;
  completedCount: number;
}

export interface UpdateTaskRequest {
  taskId: OnboardingTaskId;
  completed?: boolean;
  skipped?: boolean;
}

export interface UpdateTaskResponse {
  success: boolean;
  task: OnboardingTask;
  allCompleted: boolean;
}

export interface DeleteTaskResponse {
  success: boolean;
  message: string;
}
