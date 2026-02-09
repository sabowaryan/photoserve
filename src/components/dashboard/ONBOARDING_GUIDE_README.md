# OnboardingGuide Component

Enhanced onboarding guide component for new users with progress tracking, celebration animations, and database persistence.

## Features

✅ **4 Onboarding Tasks** (Requirements 7.1, 7.2)
- Create first gallery
- Customize profile
- Add logo
- Invite test client

✅ **Progress Bar** (Requirement 7.3)
- Real-time calculation (0-100%)
- Visual progress indicator

✅ **Celebration Animations** (Requirements 7.3, 7.5)
- Confetti animation on completion
- Celebration overlay with success message
- Individual task completion animations

✅ **Dismiss Functionality** (Requirement 7.6)
- Dismiss with option to re-show later
- Re-show button in dashboard header
- Separate dismiss vs complete states

✅ **Database Persistence** (Requirement 7.3)
- Tasks saved to `onboarding_states` table
- Synced across devices
- Fallback to localStorage for offline access

## Usage

### Basic Integration

```tsx
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";

function Dashboard() {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const userId = "user-id";

  const handleComplete = async () => {
    setShowOnboarding(false);
    // Update profile.onboarding_completed in database
    await fetch("/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ onboarding_completed: true }),
    });
  };

  const handleDismiss = () => {
    setShowOnboarding(false);
    // Store dismissed state in localStorage (not database)
    localStorage.setItem(`onboarding_dismissed_${userId}`, "true");
  };

  return (
    <div>
      {showOnboarding && (
        <OnboardingGuide
          onComplete={handleComplete}
          onDismiss={handleDismiss}
          userId={userId}
        />
      )}
    </div>
  );
}
```

### Automatic Task Completion

Use the task tracker utility to automatically mark tasks as complete when users perform actions:

```tsx
import { markOnboardingTaskComplete, ONBOARDING_TASKS } from "@/lib/onboarding/task-tracker";

// When user creates their first gallery
async function handleGalleryCreated() {
  await markOnboardingTaskComplete(ONBOARDING_TASKS.CREATE_FIRST_GALLERY);
}

// When user updates their profile
async function handleProfileUpdated() {
  await markOnboardingTaskComplete(ONBOARDING_TASKS.CUSTOMIZE_PROFILE);
}

// When user uploads a logo
async function handleLogoUploaded() {
  await markOnboardingTaskComplete(ONBOARDING_TASKS.ADD_LOGO);
}

// When user shares a gallery with a client
async function handleGalleryShared() {
  await markOnboardingTaskComplete(ONBOARDING_TASKS.INVITE_TEST_CLIENT);
}
```

### Re-showing the Guide

Add a button to allow users to re-show the onboarding guide:

```tsx
{!showOnboarding && !profile?.onboarding_completed && (
  <button
    onClick={() => {
      localStorage.removeItem(`onboarding_dismissed_${userId}`);
      setShowOnboarding(true);
    }}
  >
    Show Onboarding Guide
  </button>
)}
```

## API Routes

### POST /api/onboarding/tasks

Mark a task as completed.

**Request:**
```json
{
  "taskId": "create_first_gallery",
  "completed": true
}
```

**Response:**
```json
{
  "success": true,
  "task": { ... },
  "allCompleted": false,
  "completedTasks": ["create_first_gallery"]
}
```

### GET /api/onboarding/tasks

Get all onboarding tasks for the current user.

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
      "attempts": 1
    }
  ]
}
```

## Database Schema

```sql
CREATE TABLE onboarding_states (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  step_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  skipped BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, step_id)
);
```

## Task IDs

- `create_first_gallery` - Create first gallery (required)
- `customize_profile` - Customize profile (optional)
- `add_logo` - Add logo (optional)
- `invite_test_client` - Invite test client (optional)

## Translations

The component uses the i18n system. Add these keys to your translation files:

```json
{
  "onboarding": {
    "title": "Guide de démarrage",
    "tasksCompleted": "tâches complétées",
    "taskCompleted": "Terminé",
    "dismissWithReshow": "Fermer (réafficher plus tard)",
    "finish": "Terminer",
    "celebration": {
      "title": "Félicitations ! 🎉",
      "description": "Vous avez terminé toutes les tâches d'onboarding !"
    },
    "tasks": {
      "createGallery": {
        "title": "Créer votre première galerie",
        "description": "Uploadez vos photos et créez votre première galerie",
        "action": "Créer une galerie"
      },
      "customizeProfile": {
        "title": "Personnaliser votre profil",
        "description": "Ajoutez vos informations professionnelles",
        "action": "Modifier le profil"
      },
      "addLogo": {
        "title": "Ajouter votre logo",
        "description": "Personnalisez vos galeries avec votre branding",
        "action": "Ajouter un logo"
      },
      "inviteClient": {
        "title": "Inviter un client test",
        "description": "Partagez une galerie avec un client",
        "action": "Partager une galerie"
      }
    }
  },
  "dashboard": {
    "showOnboarding": "Afficher le guide"
  }
}
```

## Requirements Validation

- ✅ **7.1**: Onboarding checklist displays on first login
- ✅ **7.2**: Contains 4 tasks (create gallery, customize profile, add logo, invite client)
- ✅ **7.3**: Progress bar updates and celebration animation on completion
- ✅ **7.4**: Tooltips and animations guide the user
- ✅ **7.5**: Confetti animation on first gallery creation (and full completion)
- ✅ **7.6**: Dismiss functionality with option to re-show later

## Testing

The component includes:
- Loading state while fetching tasks from database
- Fallback to localStorage if API fails
- Automatic sync between database and localStorage
- Celebration animation with confetti
- Progress bar calculation
- Task completion persistence
- Re-show functionality

## Notes

- The component automatically loads completed tasks from the database on mount
- Tasks are persisted to both database and localStorage for offline access
- Dismissing the guide does NOT mark onboarding as completed (allows re-showing)
- Completing all tasks marks onboarding as completed in the profile
- The celebration animation plays for 3 seconds before auto-completing
