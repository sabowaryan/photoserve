# Onboarding API

API endpoints for managing user onboarding state and task completion.

## Requirements

- 7.1: Display onboarding checklist for new users
- 7.2: Track onboarding task completion
- 7.3: Update progress bar and celebrate task completion
- 7.7: Persist onboarding state in database

## Database Schema

The `onboarding_states` table tracks individual task completion:

```sql
CREATE TABLE public.onboarding_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  skipped BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, step_id)
);
```

## Endpoints

### GET /api/onboarding/tasks

Get all onboarding tasks for the current user.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "tasks": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "step_id": "create_first_gallery",
      "completed": true,
      "completed_at": "2024-01-01T00:00:00Z",
      "skipped": false,
      "attempts": 1,
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "progress": 25,
  "totalTasks": 4,
  "completedCount": 1
}
```

### POST /api/onboarding/tasks

Create or update an onboarding task.

**Authentication:** Required

**Request Body:**
```json
{
  "taskId": "create_first_gallery",
  "completed": true,
  "skipped": false
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "user_id": "uuid",
    "step_id": "create_first_gallery",
    "completed": true,
    "completed_at": "2024-01-01T00:00:00Z",
    "skipped": false,
    "attempts": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "allCompleted": false,
  "completedTasks": ["create_first_gallery"]
}
```

### PUT /api/onboarding/tasks

Update an existing onboarding task.

**Authentication:** Required

**Request Body:**
```json
{
  "taskId": "create_first_gallery",
  "completed": true,
  "skipped": false
}
```

**Response:**
```json
{
  "success": true,
  "task": {
    "id": "uuid",
    "user_id": "uuid",
    "step_id": "create_first_gallery",
    "completed": true,
    "completed_at": "2024-01-01T00:00:00Z",
    "skipped": false,
    "attempts": 1,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "allCompleted": false
}
```

### DELETE /api/onboarding/tasks

Delete (reset) an onboarding task.

**Authentication:** Required

**Query Parameters:**
- `taskId` (required): The task ID to delete

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Task IDs

The following task IDs are supported:

- `create_first_gallery` - Create first gallery (required)
- `customize_profile` - Customize profile (optional)
- `add_logo` - Add logo (optional)
- `invite_test_client` - Invite test client (optional)

## Usage Examples

### Using the React Hook

```typescript
import { useOnboarding } from "@/hooks/use-onboarding";

function OnboardingComponent() {
  const {
    tasks,
    progress,
    completedCount,
    totalTasks,
    allCompleted,
    isLoading,
    error,
    completeTask,
    skipTask,
    resetTask,
    refresh,
  } = useOnboarding();

  const handleCompleteTask = async (taskId: string) => {
    try {
      await completeTask(taskId);
      // Task completed successfully
    } catch (error) {
      // Handle error
    }
  };

  return (
    <div>
      <h2>Onboarding Progress: {progress}%</h2>
      <p>{completedCount} of {totalTasks} tasks completed</p>
      {/* Render tasks */}
    </div>
  );
}
```

### Using the Service

```typescript
import { OnboardingService } from "@/lib/services/onboarding.service";

// Get user tasks
const progress = await OnboardingService.getUserTasks(userId);

// Complete a task
await OnboardingService.completeTask(userId, "create_first_gallery");

// Skip a task
await OnboardingService.skipTask(userId, "add_logo");

// Reset a task
await OnboardingService.resetTask(userId, "customize_profile");

// Check if task is completed
const isCompleted = await OnboardingService.isTaskCompleted(
  userId,
  "create_first_gallery"
);

// Initialize onboarding for new user
await OnboardingService.initializeOnboarding(userId);
```

## Error Handling

All endpoints return standard error responses:

```json
{
  "error": "Error message"
}
```

Common error codes:
- `401` - Unauthorized (not authenticated)
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error (database or server error)

## Testing

Run the test suite:

```bash
npm test src/app/api/onboarding/__tests__/tasks.test.ts
```

## Related Files

- Database migration: `supabase/migrations/20260125120000_create_onboarding_states.sql`
- API routes: `src/app/api/onboarding/tasks/route.ts`
- Service: `src/lib/services/onboarding.service.ts`
- Hook: `src/hooks/use-onboarding.ts`
- Types: `src/types/onboarding.ts`
- Component: `src/components/dashboard/onboarding-guide.tsx`
