# Design Document: Client Proofing & Contact Management

## Overview

This design implements two complementary features for PikSend Phase 1:

**Client Proofing** enhances the existing favorites system by adding a structured validation workflow. Photographers can configure selection limits and deadlines, while clients see real-time progress indicators and can validate their final selections. The system tracks three states (draft, in_progress, validated) and prevents modifications after validation.

**Contact Management** provides photographers with a basic CRM system to organize clients. Photographers can create contact records with tags, search and filter contacts, view gallery history and revenue statistics, and link galleries to contacts for better organization.

Both features integrate seamlessly with existing PikSend infrastructure, maintaining backward compatibility with the current favorites system while adding opt-in enhancements.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Photographer UI  │  │   Client UI      │                │
│  │ - Proofing Config│  │ - Proofing Banner│                │
│  │ - Sessions List  │  │ - Favorite Button│                │
│  │ - Contacts CRUD  │  │ - Validation     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  /api/galleries/[id]/proofing/*                             │
│  /api/contacts/*                                             │
│  /api/galleries/[id]/link-contact                           │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ ProofingService  │  │ ContactsService  │                │
│  │ - Config CRUD    │  │ - Contact CRUD   │                │
│  │ - Session Mgmt   │  │ - Search/Filter  │                │
│  │ - Validation     │  │ - Stats Update   │                │
│  └──────────────────┘  └──────────────────┘                │
│           │                      │                           │
│           ▼                      ▼                           │
│  ┌──────────────────────────────────────┐                  │
│  │     FavoritesService (Enhanced)      │                  │
│  │     - Proofing validation            │                  │
│  │     - Limit checking                 │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ gallery_proofing │  │ photographer_    │                │
│  │ _config          │  │ contacts         │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ gallery_proofing │  │ galleries        │                │
│  │ _sessions        │  │ (+ contact_id)   │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐                                       │
│  │ favorites        │                                       │
│  │ (+ proofing_     │                                       │
│  │  session_id)     │                                       │
│  └──────────────────┘                                       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

**Proofing Configuration Flow:**
1. Photographer enables proofing via dashboard
2. ProofingService creates gallery_proofing_config record
3. Client views gallery, sees proofing banner
4. ProofingService checks config and creates/retrieves session
5. Client toggles favorites with limit validation
6. FavoritesService checks ProofingService.canAddFavorite()
7. ProofingService updates session selection_count

**Contact Management Flow:**
1. Photographer creates contact via dashboard
2. ContactsService validates and stores in photographer_contacts
3. Photographer creates/edits gallery
4. Gallery form includes contact selector
5. Gallery saved with contact_id foreign key
6. Database trigger updates contact statistics
7. Photographer views contact detail page
8. ContactsService aggregates gallery history and revenue

## Components and Interfaces

### Database Schema

#### New Table: gallery_proofing_config

```sql
CREATE TABLE public.gallery_proofing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL UNIQUE REFERENCES public.galleries(id) ON DELETE CASCADE,
  
  -- Configuration
  is_enabled BOOLEAN DEFAULT false,
  selection_limit INTEGER, -- NULL = unlimited
  deadline_date TIMESTAMP WITH TIME ZONE,
  instructions TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT check_selection_limit CHECK (selection_limit IS NULL OR selection_limit > 0)
);

CREATE INDEX idx_gallery_proofing_config_gallery_id 
  ON public.gallery_proofing_config(gallery_id);
```

#### New Table: gallery_proofing_sessions

```sql
CREATE TABLE public.gallery_proofing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft', -- 'draft' | 'in_progress' | 'validated'
  
  -- Metadata
  selection_count INTEGER DEFAULT 0,
  validated_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_gallery_session UNIQUE(gallery_id, session_id),
  CONSTRAINT check_status CHECK (status IN ('draft', 'in_progress', 'validated'))
);

CREATE INDEX idx_gallery_proofing_sessions_gallery_id 
  ON public.gallery_proofing_sessions(gallery_id);
CREATE INDEX idx_gallery_proofing_sessions_session_id 
  ON public.gallery_proofing_sessions(session_id);
CREATE INDEX idx_gallery_proofing_sessions_status 
  ON public.gallery_proofing_sessions(status);
```

#### New Table: photographer_contacts

```sql
CREATE TABLE public.photographer_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photographer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Contact Info
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  -- Organization
  tags TEXT[], -- Array of tags: ['wedding', 'vip', 'portrait']
  notes TEXT,
  
  -- Metadata (auto-updated)
  total_galleries INTEGER DEFAULT 0,
  total_revenue_cents INTEGER DEFAULT 0,
  last_gallery_date TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_photographer_email UNIQUE(photographer_id, email)
);

CREATE INDEX idx_photographer_contacts_photographer_id 
  ON public.photographer_contacts(photographer_id);
CREATE INDEX idx_photographer_contacts_email 
  ON public.photographer_contacts(email);
CREATE INDEX idx_photographer_contacts_name 
  ON public.photographer_contacts(name);
CREATE INDEX idx_photographer_contacts_tags 
  ON public.photographer_contacts USING GIN(tags);

-- Full-text search index
CREATE INDEX idx_photographer_contacts_search 
  ON public.photographer_contacts USING GIN(
    to_tsvector('simple', 
      COALESCE(name, '') || ' ' || 
      COALESCE(email, '') || ' ' || 
      COALESCE(phone, '')
    )
  );
```

#### Modified Table: favorites

```sql
-- Add column to link favorites to proofing sessions
ALTER TABLE public.favorites 
  ADD COLUMN proofing_session_id UUID 
  REFERENCES public.gallery_proofing_sessions(id) ON DELETE SET NULL;

CREATE INDEX idx_favorites_proofing_session 
  ON public.favorites(proofing_session_id);
```

#### Modified Table: galleries

```sql
-- Add column to link galleries to contacts
ALTER TABLE public.galleries 
  ADD COLUMN contact_id UUID 
  REFERENCES public.photographer_contacts(id) ON DELETE SET NULL;

CREATE INDEX idx_galleries_contact_id 
  ON public.galleries(contact_id);
```

#### Database Trigger: Update Contact Statistics

```sql
CREATE OR REPLACE FUNCTION update_contact_stats()
RETURNS TRIGGER AS $
DECLARE
  v_contact_id UUID;
BEGIN
  -- Get contact_id from NEW or OLD record
  v_contact_id := COALESCE(NEW.contact_id, OLD.contact_id);
  
  IF v_contact_id IS NOT NULL THEN
    -- Update total_galleries and last_gallery_date
    UPDATE public.photographer_contacts
    SET 
      total_galleries = (
        SELECT COUNT(*) 
        FROM public.galleries 
        WHERE contact_id = v_contact_id
      ),
      last_gallery_date = (
        SELECT MAX(created_at) 
        FROM public.galleries 
        WHERE contact_id = v_contact_id
      ),
      updated_at = NOW()
    WHERE id = v_contact_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contact_stats
AFTER INSERT OR UPDATE OF contact_id OR DELETE ON public.galleries
FOR EACH ROW
EXECUTE FUNCTION update_contact_stats();
```

### Service Layer

#### ProofingService Interface

```typescript
export interface ProofingConfig {
  id: string;
  galleryId: string;
  isEnabled: boolean;
  selectionLimit: number | null;
  deadlineDate: string | null;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProofingSession {
  id: string;
  galleryId: string;
  sessionId: string;
  status: 'draft' | 'in_progress' | 'validated';
  selectionCount: number;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProofingStatus {
  config: ProofingConfig | null;
  session: ProofingSession | null;
  canAddMore: boolean;
  remainingSelections: number | null;
  isLocked: boolean;
  deadlinePassed: boolean;
}

export interface IProofingService {
  // Configuration (Photographer)
  enableProofing(galleryId: string, config: Partial<ProofingConfig>): Promise<ProofingConfig>;
  updateProofingConfig(galleryId: string, config: Partial<ProofingConfig>): Promise<ProofingConfig>;
  getProofingConfig(galleryId: string): Promise<ProofingConfig | null>;
  disableProofing(galleryId: string): Promise<void>;
  
  // Session (Client)
  getOrCreateSession(galleryId: string, sessionId: string): Promise<ProofingSession>;
  getProofingStatus(galleryId: string, sessionId: string): Promise<ProofingStatus>;
  validateSelection(galleryId: string, sessionId: string): Promise<ProofingSession>;
  
  // Validation
  canAddFavorite(galleryId: string, sessionId: string): Promise<boolean>;
  updateSelectionCount(galleryId: string, sessionId: string): Promise<void>;
  
  // Dashboard (Photographer)
  listSessions(galleryId: string, filters?: { status?: string }): Promise<ProofingSession[]>;
  getSessionDetails(sessionId: string): Promise<ProofingSession & { favorites: string[] }>;
}
```

#### ContactsService Interface

```typescript
export interface Contact {
  id: string;
  photographerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[];
  notes: string | null;
  totalGalleries: number;
  totalRevenueCents: number;
  lastGalleryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactWithGalleries extends Contact {
  galleries: Array<{
    id: string;
    title: string;
    createdAt: string;
    viewsCount: number;
    revenueCents: number;
  }>;
}

export interface ContactFilters {
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'date' | 'revenue' | 'galleries';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface IContactsService {
  createContact(photographerId: string, data: Partial<Contact>): Promise<Contact>;
  updateContact(contactId: string, data: Partial<Contact>): Promise<Contact>;
  deleteContact(contactId: string): Promise<void>;
  getContact(contactId: string): Promise<ContactWithGalleries>;
  listContacts(photographerId: string, filters?: ContactFilters): Promise<{ contacts: Contact[]; total: number }>;
  searchContacts(photographerId: string, query: string): Promise<Contact[]>;
  getTags(photographerId: string): Promise<string[]>;
  linkGalleryToContact(galleryId: string, contactId: string): Promise<void>;
  unlinkGalleryFromContact(galleryId: string): Promise<void>;
}
```

#### Enhanced FavoritesService

```typescript
// Add to existing IFavoritesService interface
export interface IFavoritesService {
  // Existing methods
  toggleFavorite(galleryId: string, imageId: string, sessionId: string): Promise<boolean>;
  getFavorites(galleryId: string, sessionId: string): Promise<string[]>;
  exportFavorites(galleryId: string): Promise<FavoriteExport>;
  
  // New methods for proofing integration
  toggleFavoriteWithProofing(
    galleryId: string, 
    imageId: string, 
    sessionId: string
  ): Promise<{ success: boolean; isAdded: boolean; error?: string }>;
}
```

### API Routes

#### Proofing Routes

**POST /api/galleries/[id]/proofing**
- Enable/configure proofing for a gallery
- Auth: Photographer (gallery owner)
- Body: `{ isEnabled: boolean, selectionLimit?: number, deadlineDate?: string, instructions?: string }`
- Response: `ProofingConfig`

**GET /api/galleries/[id]/proofing**
- Get proofing configuration
- Auth: Public (for client view)
- Response: `ProofingConfig | null`

**GET /api/galleries/[id]/proofing/status**
- Get complete proofing status for a client
- Auth: Public
- Query: `?sessionId=xxx`
- Response: `ProofingStatus`

**POST /api/galleries/[id]/proofing/validate**
- Validate and lock selection
- Auth: Public (with session ID)
- Body: `{ sessionId: string }`
- Response: `ProofingSession`

**GET /api/galleries/[id]/proofing/sessions**
- List all proofing sessions for a gallery
- Auth: Photographer (gallery owner)
- Query: `?status=validated`
- Response: `{ sessions: ProofingSession[], stats: { total, validated, inProgress, draft } }`

**GET /api/galleries/[id]/proofing/sessions/[sessionId]**
- Get session details with favorites
- Auth: Photographer (gallery owner)
- Response: `ProofingSession & { favorites: string[] }`

#### Contact Routes

**POST /api/contacts**
- Create a new contact
- Auth: Photographer
- Body: `{ name: string, email?: string, phone?: string, address?: string, tags?: string[], notes?: string }`
- Response: `Contact`

**GET /api/contacts**
- List contacts with filters
- Auth: Photographer
- Query: `?search=xxx&tags=wedding,vip&sortBy=name&sortOrder=asc&limit=20&offset=0`
- Response: `{ contacts: Contact[], total: number }`

**GET /api/contacts/[id]**
- Get contact details with gallery history
- Auth: Photographer (contact owner)
- Response: `ContactWithGalleries`

**PUT /api/contacts/[id]**
- Update a contact
- Auth: Photographer (contact owner)
- Body: `Partial<Contact>`
- Response: `Contact`

**DELETE /api/contacts/[id]**
- Delete a contact
- Auth: Photographer (contact owner)
- Response: `{ success: boolean }`

**GET /api/contacts/tags**
- Get all unique tags used by photographer
- Auth: Photographer
- Response: `{ tags: string[] }`

**POST /api/galleries/[id]/link-contact**
- Link a gallery to a contact
- Auth: Photographer (gallery owner)
- Body: `{ contactId: string }`
- Response: `{ success: boolean }`

**DELETE /api/galleries/[id]/link-contact**
- Unlink gallery from contact
- Auth: Photographer (gallery owner)
- Response: `{ success: boolean }`

### React Components

#### Photographer Components

**ProofingConfigSection**
- Location: Gallery settings page
- Props: `{ galleryId: string, config: ProofingConfig | null, onUpdate: (config: ProofingConfig) => void }`
- Features:
  - Toggle to enable/disable proofing
  - Number input for selection limit
  - Date picker for deadline
  - Textarea for custom instructions
  - Save button with validation

**ProofingSessionsList**
- Location: Gallery dashboard tab
- Props: `{ galleryId: string }`
- Features:
  - Table of all proofing sessions
  - Columns: Session ID, Status badge, Progress (X/Y), Validation date
  - Filter by status (all, draft, in_progress, validated)
  - Click row to view session details
  - Export button for validated sessions

**ContactsList**
- Location: Dashboard /contacts page
- Props: `{ photographerId: string }`
- Features:
  - Search input (name, email, phone)
  - Multi-select tag filter
  - Sort dropdown (name, date, revenue, galleries)
  - Data table with columns: Name, Email, Tags, Galleries, Revenue, Actions
  - Pagination controls
  - "New Contact" button

**ContactForm**
- Location: Modal or dedicated page
- Props: `{ contact?: Contact, onSave: (contact: Contact) => void, onCancel: () => void }`
- Features:
  - Text input for name (required)
  - Email input with validation
  - Phone input
  - Textarea for address
  - Tag input with autocomplete
  - Textarea for notes
  - Save/Cancel buttons

**ContactDetail**
- Location: /contacts/[id] page
- Props: `{ contactId: string }`
- Features:
  - Header with contact info and tags
  - Stats cards (Total Galleries, Total Revenue, Last Gallery)
  - Notes section
  - Gallery history table
  - Edit/Delete buttons

**ContactSelector**
- Location: Gallery form
- Props: `{ photographerId: string, selectedContactId?: string, onChange: (contactId: string | null) => void }`
- Features:
  - Combobox with search
  - Display name + email
  - "Create new contact" option
  - "No contact" option

#### Client Components

**ProofingBanner**
- Location: Gallery view (sticky top)
- Props: `{ status: ProofingStatus, onValidate: () => void }`
- Features:
  - Progress indicator "X/Y selected"
  - Progress bar visual
  - Deadline countdown if applicable
  - Custom instructions display
  - "Validate Selection" button (enabled when count > 0)
  - Lock icon when validated

**ProofingValidationModal**
- Location: Overlay on gallery view
- Props: `{ selectionCount: number, limit: number | null, onConfirm: () => void, onCancel: () => void }`
- Features:
  - Confirmation message
  - Summary: "You have selected X photos"
  - Warning: "This action is final and cannot be undone"
  - Confirm/Cancel buttons

**Enhanced FavoriteButton**
- Location: Image card in gallery
- Props: `{ galleryId: string, imageId: string, sessionId: string, isFavorite: boolean, proofingStatus: ProofingStatus }`
- Features:
  - Heart icon (filled/outline)
  - Disabled state when limit reached
  - Disabled state when selection validated
  - Tooltip explaining why disabled
  - Optimistic UI updates

## Data Models

### TypeScript Types

```typescript
// Proofing Types
type ProofingStatus = 'draft' | 'in_progress' | 'validated';

interface ProofingConfig {
  id: string;
  galleryId: string;
  isEnabled: boolean;
  selectionLimit: number | null;
  deadlineDate: string | null;
  instructions: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProofingSession {
  id: string;
  galleryId: string;
  sessionId: string;
  status: ProofingStatus;
  selectionCount: number;
  validatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProofingStatusResponse {
  config: ProofingConfig | null;
  session: ProofingSession | null;
  canAddMore: boolean;
  remainingSelections: number | null;
  isLocked: boolean;
  deadlinePassed: boolean;
}

// Contact Types
interface Contact {
  id: string;
  photographerId: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tags: string[];
  notes: string | null;
  totalGalleries: number;
  totalRevenueCents: number;
  lastGalleryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactGallery {
  id: string;
  title: string;
  createdAt: string;
  viewsCount: number;
  revenueCents: number;
}

interface ContactWithGalleries extends Contact {
  galleries: ContactGallery[];
}

interface ContactFilters {
  search?: string;
  tags?: string[];
  sortBy?: 'name' | 'date' | 'revenue' | 'galleries';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Enhanced Favorite Type
interface Favorite {
  id: string;
  galleryId: string;
  imageId: string;
  sessionId: string;
  proofingSessionId: string | null;
  createdAt: string;
}
```

### Database Relationships

```
profiles (photographer)
    │
    ├──< photographer_contacts (one-to-many)
    │       │
    │       └──< galleries (one-to-many via contact_id)
    │
    └──< galleries (one-to-many via user_id)
            │
            ├──< gallery_proofing_config (one-to-one)
            │
            ├──< gallery_proofing_sessions (one-to-many)
            │       │
            │       └──< favorites (one-to-many via proofing_session_id)
            │
            ├──< images (one-to-many)
            │       │
            │       └──< favorites (one-to-many via image_id)
            │
            └──< favorites (one-to-many via gallery_id)
```

