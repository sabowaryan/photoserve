import { NextRequest, NextResponse } from "next/server";
import { getSession, requireSupabaseClient } from "@/lib/auth";

/**
 * POST /api/onboarding/tasks
 * 
 * Create or update an onboarding task
 * 
 * Requirements: 7.3, 7.7
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, completed = true, skipped = false } = body;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json(
        { error: "Invalid taskId" },
        { status: 400 }
      );
    }

    const { supabase, userId } = await requireSupabaseClient();

    // Get existing task to increment attempts
    const { data: existingTask, error: existingError } = await supabase
      .from("onboarding_states")
      .select("attempts")
      .eq("user_id", userId)
      .eq("step_id", taskId)
      .single();

    const attempts = (existingTask && !existingError) ? (existingTask.attempts || 0) + 1 : 1;

    // Upsert the task completion state
    const { data, error } = await supabase
      .from("onboarding_states")
      .upsert(
        {
          user_id: userId,
          step_id: taskId,
          completed,
          completed_at: completed ? new Date().toISOString() : null,
          skipped,
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
      console.error("Error updating onboarding task:", error);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    // Check if all tasks are completed
    const { data: allTasks, error: tasksError } = await supabase
      .from("onboarding_states")
      .select("step_id, completed")
      .eq("user_id", userId);

    if (tasksError) {
      console.error("Error fetching onboarding tasks:", tasksError);
    }

    // Define all required tasks
    const requiredTasks = [
      "create_first_gallery",
      "customize_profile",
      "add_logo",
      "invite_test_client",
    ];

    // Check if all tasks are completed
    const completedTasks = (allTasks || []).filter((t) => t.completed).map((t) => t.step_id);
    const allCompleted = requiredTasks.every((task) => completedTasks.includes(task));

    // If all tasks are completed, update profile.onboarding_completed
    if (allCompleted) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);

      if (profileError) {
        console.error("Error updating profile onboarding status:", profileError);
      }
    }

    return NextResponse.json({
      success: true,
      task: data,
      allCompleted,
      completedTasks,
    });
  } catch (error) {
    console.error("Error in onboarding tasks API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/onboarding/tasks
 * 
 * Get all onboarding tasks for the current user
 * 
 * Requirements: 7.1, 7.2
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { supabase, userId } = await requireSupabaseClient();

    const { data, error } = await supabase
      .from("onboarding_states")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching onboarding tasks:", error);
      return NextResponse.json(
        { error: "Failed to fetch tasks" },
        { status: 500 }
      );
    }

    // Calculate progress
    const requiredTasks = [
      "create_first_gallery",
      "customize_profile",
      "add_logo",
      "invite_test_client",
    ];

    const completedTasks = (data || []).filter((t) => t.completed);
    const progress = Math.round((completedTasks.length / requiredTasks.length) * 100);

    return NextResponse.json({
      success: true,
      tasks: data || [],
      progress,
      totalTasks: requiredTasks.length,
      completedCount: completedTasks.length,
    });
  } catch (error) {
    console.error("Error in onboarding tasks API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/onboarding/tasks
 * 
 * Update an existing onboarding task
 * 
 * Requirements: 7.3, 7.7
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { taskId, completed, skipped } = body;

    if (!taskId || typeof taskId !== "string") {
      return NextResponse.json(
        { error: "Invalid taskId" },
        { status: 400 }
      );
    }

    const { supabase, userId } = await requireSupabaseClient();

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (typeof completed === "boolean") {
      updateData.completed = completed;
      updateData.completed_at = completed ? new Date().toISOString() : null;
    }

    if (typeof skipped === "boolean") {
      updateData.skipped = skipped;
    }

    // Update the task
    const { data, error } = await supabase
      .from("onboarding_states")
      .update(updateData)
      .eq("user_id", userId)
      .eq("step_id", taskId)
      .select()
      .single();

    if (error) {
      console.error("Error updating onboarding task:", error);
      return NextResponse.json(
        { error: "Failed to update task" },
        { status: 500 }
      );
    }

    // Check if all tasks are completed
    const { data: allTasks } = await supabase
      .from("onboarding_states")
      .select("step_id, completed")
      .eq("user_id", userId);

    const requiredTasks = [
      "create_first_gallery",
      "customize_profile",
      "add_logo",
      "invite_test_client",
    ];

    const completedTasks = (allTasks || []).filter((t) => t.completed).map((t) => t.step_id);
    const allCompleted = requiredTasks.every((task) => completedTasks.includes(task));

    // Update profile if all tasks completed
    if (allCompleted) {
      await supabase
        .from("profiles")
        .update({ onboarding_completed: true })
        .eq("id", userId);
    }

    return NextResponse.json({
      success: true,
      task: data,
      allCompleted,
    });
  } catch (error) {
    console.error("Error in onboarding tasks PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/onboarding/tasks
 * 
 * Delete an onboarding task (reset task state)
 * 
 * Requirements: 7.7
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "Missing taskId parameter" },
        { status: 400 }
      );
    }

    const { supabase, userId } = await requireSupabaseClient();

    // Delete the task
    const { error } = await supabase
      .from("onboarding_states")
      .delete()
      .eq("user_id", userId)
      .eq("step_id", taskId);

    if (error) {
      console.error("Error deleting onboarding task:", error);
      return NextResponse.json(
        { error: "Failed to delete task" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error in onboarding tasks DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
