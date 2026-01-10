# Design Document: Admin Dashboard

## Overview

L'espace d'administration de PikSend est une interface sécurisée permettant aux administrateurs de gérer la plateforme. Il s'intègre dans l'architecture Next.js existante avec un nouveau groupe de routes `(admin)`, des services dédiés, et une nouvelle table `audit_logs` pour la traçabilité.

L'architecture suit les patterns existants : repositories pour l'accès aux données, services pour la logique métier, et composants React Server Components pour le rendu.

## Architecture

```mermaid
graph TB
    subgraph "Frontend - Admin Routes"
        A[/admin/dashboard] --> B[Admin Layout]
        C[/admin/users] --> B
        D[/admin/galleries] --> B
        E[/admin/analytics] --> B
        F[/admin/subscriptions] --> B
        G[/admin/audit-logs] --> B
    end
    
    subgraph "Middleware"
        B --> H[Admin Auth Guard]
        H --> I{Is Admin?}
        I -->|No| J[403 Redirect]
        I -->|Yes| K[Render Page]
    end
    
    subgraph "API Routes"
        L[/api/admin/users]
        M[/api/admin/galleries]
        N[/api/admin/analytics]
        O[/api/admin/subscriptions]
        P[/api/admin/audit-logs]
    end
    
    subgraph "Services"
        Q[AdminService]
        R[AuditLogService]
    end
    
    subgraph "Repositories"
        S[AdminRepository]
        T[AuditLogRepository]
    end
    
    subgraph "Database"
        U[(profiles)]
        V[(galleries)]
        W[(audit_logs)]
    end
    
    K --> L & M & N & O & P
    L & M & N & O & P --> Q & R
    Q --> S
    R --> T
    S --> U & V
    T --> W
```

## Components and Interfaces

### Database Schema Extension

```sql
-- Add admin role to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create audit_logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### TypeScript Interfaces

```typescript
// Admin Types
interface AdminUser {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

type AuditActionType = 
  | 'user_view'
  | 'user_update'
  | 'user_suspend'
  | 'user_reactivate'
  | 'gallery_view'
  | 'gallery_deactivate'
  | 'gallery_delete'
  | 'subscription_update'
  | 'subscription_cancel'
  | 'admin_login';

type AuditEntityType = 'user' | 'gallery' | 'subscription' | 'system';

// Dashboard Stats
interface DashboardStats {
  totalUsers: number;
  totalGalleries: number;
  activeGalleries: number;
  totalStorageUsedMb: number;
  planDistribution: {
    free: number;
    premium: number;
    pro: number;
  };
  recentSignups: number;
  recentGalleries: number;
}

// User Management
interface UserListItem {
  id: string;
  email: string;
  name: string | null;
  subscription_plan: SubscriptionPlan;
  storage_used_mb: number;
  storage_limit_mb: number;
  gallery_count: number;
  is_suspended: boolean;
  created_at: string;
}

interface UserFilters {
  search?: string;
  plan?: SubscriptionPlan;
  status?: 'active' | 'suspended';
  page?: number;
  limit?: number;
}

// Gallery Management
interface GalleryListItem {
  id: string;
  title: string;
  unique_slug: string;
  owner_email: string;
  owner_name: string | null;
  image_count: number;
  views_count: number;
  is_active: boolean;
  expires_at: string;
  created_at: string;
}

interface GalleryFilters {
  search?: string;
  status?: 'active' | 'expired' | 'inactive';
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

// Analytics
interface AnalyticsData {
  userGrowth: TimeSeriesData[];
  storageGrowth: TimeSeriesData[];
  subscriptionConversions: ConversionData;
  topUsers: TopUserData[];
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface ConversionData {
  freeToPremiun: number;
  freeToPro: number;
  premiumToPro: number;
}

interface TopUserData {
  id: string;
  email: string;
  name: string | null;
  gallery_count: number;
  storage_used_mb: number;
}
```

### Repository Interfaces

```typescript
interface IAdminRepository {
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Users
  listUsers(filters: UserFilters): Promise<{ users: UserListItem[]; total: number }>;
  getUserById(id: string): Promise<UserListItem | null>;
  updateUserPlan(id: string, plan: SubscriptionPlan): Promise<void>;
  suspendUser(id: string): Promise<void>;
  reactivateUser(id: string): Promise<void>;
  
  // Galleries
  listGalleries(filters: GalleryFilters): Promise<{ galleries: GalleryListItem[]; total: number }>;
  getGalleryById(id: string): Promise<GalleryListItem | null>;
  deactivateGallery(id: string): Promise<void>;
  deleteGallery(id: string): Promise<void>;
  
  // Analytics
  getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData>;
  
  // Subscriptions
  listSubscriptions(): Promise<SubscriptionListItem[]>;
  cancelSubscription(userId: string): Promise<void>;
}

interface IAuditLogRepository {
  create(log: Omit<AuditLog, 'id' | 'created_at'>): Promise<AuditLog>;
  list(filters: AuditLogFilters): Promise<{ logs: AuditLog[]; total: number }>;
  getByEntityId(entityId: string): Promise<AuditLog[]>;
}
```

### Service Interfaces

```typescript
interface IAdminService {
  // Auth
  isAdmin(userId: string): Promise<boolean>;
  
  // Dashboard
  getDashboardStats(): Promise<DashboardStats>;
  
  // Users
  listUsers(filters: UserFilters): Promise<PaginatedResult<UserListItem>>;
  getUserDetails(id: string): Promise<UserDetails>;
  updateUserPlan(adminId: string, userId: string, plan: SubscriptionPlan): Promise<void>;
  suspendUser(adminId: string, userId: string, reason: string): Promise<void>;
  reactivateUser(adminId: string, userId: string): Promise<void>;
  
  // Galleries
  listGalleries(filters: GalleryFilters): Promise<PaginatedResult<GalleryListItem>>;
  getGalleryDetails(id: string): Promise<GalleryDetails>;
  deactivateGallery(adminId: string, galleryId: string, reason: string): Promise<void>;
  deleteGallery(adminId: string, galleryId: string, reason: string): Promise<void>;
  
  // Analytics
  getAnalytics(dateFrom: string, dateTo: string): Promise<AnalyticsData>;
  
  // Subscriptions
  listSubscriptions(): Promise<SubscriptionListItem[]>;
  manualUpgrade(adminId: string, userId: string, plan: SubscriptionPlan): Promise<void>;
  cancelSubscription(adminId: string, userId: string, reason: string): Promise<void>;
}

interface IAuditLogService {
  log(adminId: string, action: AuditActionType, entityType: AuditEntityType, entityId: string | null, details: Record<string, unknown>): Promise<void>;
  list(filters: AuditLogFilters): Promise<PaginatedResult<AuditLogWithAdmin>>;
}
```

## Data Models

### Audit Log Entry

```typescript
interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email?: string;  // Joined from profiles
  admin_name?: string;   // Joined from profiles
  action_type: AuditActionType;
  entity_type: AuditEntityType;
  entity_id: string | null;
  details: {
    reason?: string;
    previous_value?: unknown;
    new_value?: unknown;
    [key: string]: unknown;
  };
  ip_address: string | null;
  created_at: string;
}
```

### User with Admin Details

```typescript
interface UserDetails extends UserListItem {
  galleries: {
    id: string;
    title: string;
    is_active: boolean;
    views_count: number;
  }[];
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  audit_history: AuditLogEntry[];
}
```

### Gallery with Admin Details

```typescript
interface GalleryDetails extends GalleryListItem {
  images: {
    id: string;
    cloudinary_url: string;
    file_size_mb: number;
  }[];
  owner: {
    id: string;
    email: string;
    name: string | null;
    subscription_plan: SubscriptionPlan;
  };
  audit_history: AuditLogEntry[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Admin Authorization

*For any* user attempting to access admin routes, access SHALL be granted if and only if the user's `is_admin` field is `true`.

**Validates: Requirements 1.1, 1.2**

### Property 2: Authentication Audit Logging

*For any* admin authentication attempt (successful or failed), an audit log entry SHALL be created with the correct action type and admin ID.

**Validates: Requirements 1.4**

### Property 3: Dashboard Stats Accuracy

*For any* set of users, galleries, and storage data in the database, the dashboard stats returned by `getDashboardStats()` SHALL accurately reflect:
- Total user count equals the count of profiles
- Active gallery count equals galleries where `is_active = true` and `expires_at > now()`
- Total storage equals the sum of `storage_used_mb` across all profiles
- Plan distribution counts match the actual count per subscription_plan

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: User Search Filtering

*For any* search query and filter combination, all users returned by `listUsers()` SHALL match the search criteria (email contains query OR name contains query) AND match the plan filter if specified.

**Validates: Requirements 3.2**

### Property 5: Plan Update Changes Limits

*For any* user and any target subscription plan, after calling `updateUserPlan()`, the user's limits (storage_limit_mb, max_galleries, max_images_per_gallery, max_image_size_mb) SHALL match the limits defined for that plan.

**Validates: Requirements 3.4, 6.3**

### Property 6: User Suspension Deactivates Galleries

*For any* user with galleries, after calling `suspendUser()`, all galleries owned by that user SHALL have `is_active = false`.

**Validates: Requirements 3.5**

### Property 7: Suspend-Reactivate Round Trip

*For any* active user with active galleries, suspending then reactivating the user SHALL restore the user's access and reactivate their galleries to their previous state.

**Validates: Requirements 3.5, 3.6**

### Property 8: Audit Logging for Modifications

*For any* modification operation (user update, user suspend, user reactivate, gallery deactivate, gallery delete, subscription update, subscription cancel), an audit log entry SHALL be created with the correct action_type, entity_type, entity_id, and admin_id.

**Validates: Requirements 3.7, 4.6, 6.5**

### Property 9: Gallery Filtering

*For any* gallery filter combination (status, userId, dateFrom, dateTo), all galleries returned by `listGalleries()` SHALL match all specified filter criteria.

**Validates: Requirements 4.2**

### Property 10: Gallery Deactivation Prevents Access

*For any* gallery, after calling `deactivateGallery()`, the gallery's `is_active` field SHALL be `false`, and public access attempts SHALL be denied.

**Validates: Requirements 4.4**

### Property 11: Gallery Deletion Frees Storage

*For any* gallery with images, after calling `deleteGallery()`:
- The gallery SHALL no longer exist in the database
- All associated images SHALL be deleted
- The owner's `storage_used_mb` SHALL be decremented by the total size of deleted images

**Validates: Requirements 4.5**

### Property 12: Analytics Date Range Filtering

*For any* date range (dateFrom, dateTo), all time series data returned by `getAnalytics()` SHALL have dates within the specified range (inclusive).

**Validates: Requirements 5.5**

### Property 13: Subscription Cancellation Schedules Downgrade

*For any* user with an active paid subscription, after calling `cancelSubscription()`, the user SHALL be marked for downgrade to the free plan.

**Validates: Requirements 6.4**

### Property 14: Audit Log Filtering

*For any* audit log filter combination (adminId, actionType, dateFrom, dateTo), all entries returned SHALL match all specified filter criteria.

**Validates: Requirements 7.3**

### Property 15: Audit Log Immutability

*For any* existing audit log entry, attempts to update or delete the entry SHALL fail, preserving the original data.

**Validates: Requirements 7.5**

## Error Handling

### Authentication Errors

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Not authenticated | 401 | `{ error: "Authentication required" }` |
| Not admin | 403 | `{ error: "Admin access required" }` |
| Session expired | 401 | `{ error: "Session expired" }` |

### Resource Errors

| Error | HTTP Status | Response |
|-------|-------------|----------|
| User not found | 404 | `{ error: "User not found" }` |
| Gallery not found | 404 | `{ error: "Gallery not found" }` |
| Invalid filter | 400 | `{ error: "Invalid filter parameters" }` |

### Operation Errors

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Cannot suspend admin | 400 | `{ error: "Cannot suspend admin users" }` |
| User already suspended | 400 | `{ error: "User is already suspended" }` |
| Gallery already inactive | 400 | `{ error: "Gallery is already inactive" }` |
| Stripe API error | 500 | `{ error: "Payment service error" }` |

### Audit Log Errors

| Error | HTTP Status | Response |
|-------|-------------|----------|
| Audit log write failed | 500 | `{ error: "Failed to record audit log" }` |
| Modification attempted | 403 | `{ error: "Audit logs are immutable" }` |

## Testing Strategy

### Unit Tests

Unit tests will cover:
- Individual repository methods with mocked Supabase client
- Service methods with mocked repositories
- Input validation for all API endpoints
- Error handling for edge cases

### Property-Based Tests

Property-based tests will use `fast-check` library to verify:
- Authorization properties with randomly generated users
- Data accuracy properties with randomly generated datasets
- Filtering properties with random filter combinations
- State change properties with random operations

Each property test will:
- Run minimum 100 iterations
- Use smart generators that constrain to valid input spaces
- Reference the design document property number
- Tag format: `**Feature: admin-dashboard, Property N: [property_text]**`

### Integration Tests

Integration tests will verify:
- End-to-end admin authentication flow
- Complete user management workflows
- Gallery moderation workflows
- Audit log creation and retrieval

### Test File Structure

```
src/lib/
├── repositories/__tests__/
│   └── admin.repository.property.test.ts
├── services/__tests__/
│   ├── admin.service.property.test.ts
│   └── audit-log.service.property.test.ts
└── middleware/__tests__/
    └── admin-auth.property.test.ts
```

