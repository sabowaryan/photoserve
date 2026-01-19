# Implementation Tasks: Client Proofing & Contact Management

## Overview

This task list implements the Client Proofing and Contact Management features for PikSend Phase 1. The implementation is divided into two main features, each with database, service, API, and UI components.

**Estimated Duration**: 8 days
- Feature 1 (Client Proofing): 5 days
- Feature 2 (Contact Management): 3 days

## Task List

### Feature 1: Client Proofing (5 days)

#### 1. Database Schema & Migrations (Day 1)

- [ ] 1.1 Create gallery_proofing_config table migration
  - Create table with columns: id, gallery_id, is_enabled, selection_limit, deadline_date, instructions, created_at, updated_at
  - Add check constraint for selection_limit > 0
  - Create index on gallery_id
  - Add RLS policies for gallery owners and public read access
  - **Validates: Requirements 1, 12**

- [ ] 1.2 Create gallery_proofing_sessions table migration
  - Create table with columns: id, gallery_id, session_id, status, selection_count, validated_at, created_at, updated_at
  - Add unique constraint on (gallery_id, session_id)
  - Add check constraint for status enum
  - Create indexes on gallery_id, session_id, and status
  - Add RLS policies for gallery owners and session owners
  - **Validates: Requirements 3, 12**

- [ ] 1.3 Modify favorites table migration
  - Add proofing_session_id column as nullable UUID foreign key
  - Create index on proofing_session_id
  - Test backward compatibility with existing favorites
  - **Validates: Requirements 5, 11**

- [ ] 1.4 Test migrations in development environment
  - Run migrations on clean database
  - Verify all constraints and indexes
  - Test RLS policies with different user roles
  - Verify backward compatibility with existing data
  - **Validates: Requirements 11, 12**

#### 2. Service Layer - ProofingService (Day 2)

- [ ] 2.1 Create ProofingService with configuration methods
  - Implement enableProofing() with validation
  - Implement updateProofingConfig() with ownership check
  - Implement getProofingConfig() for public access
  - Implement disableProofing() with cleanup
  - **Validates: Requirement 1**

- [ ] 2.2 Implement session management methods
  - Implement getOrCreateSession() with auto-creation
  - Implement getProofingStatus() with complete status calculation
  - Implement canAddFavorite() with limit and deadline checks
  - Implement updateSelectionCount() with status transitions
  - **Validates: Requirements 2, 3, 5**

- [ ] 2.3 Implement validation workflow
  - Implement validateSelection() with locking logic
  - Add validation timestamp recording
  - Add notification trigger (placeholder for now)
  - Prevent double validation
  - **Validates: Requirement 3**

- [ ] 2.4 Implement dashboard methods
  - Implement listSessions() with status filtering
  - Implement getSessionDetails() with favorites list
  - Add statistics aggregation
  - **Validates: Requirement 4**

- [ ] 2.5 Write unit tests for ProofingService
  - Test configuration CRUD operations
  - Test session creation and status transitions
  - Test limit enforcement logic
  - Test validation workflow
  - Test edge cases (deadline passed, already validated, etc.)
  - **Validates: All proofing requirements**

#### 3. Service Layer - Enhanced FavoritesService (Day 2)

- [ ] 3.1 Enhance toggleFavorite with proofing integration
  - Check if proofing is enabled for gallery
  - Call ProofingService.canAddFavorite() before adding
  - Link favorite to proofing_session_id
  - Call ProofingService.updateSelectionCount() after toggle
  - Return detailed error messages for limit violations
  - **Validates: Requirements 2, 5**

- [ ] 3.2 Write integration tests for favorites + proofing
  - Test favorite toggle with proofing enabled
  - Test limit enforcement
  - Test validated session blocking
  - Test backward compatibility (proofing disabled)
  - **Validates: Requirements 5, 11**

#### 4. API Routes - Proofing (Day 3)

- [ ] 4.1 Create POST /api/galleries/[id]/proofing
  - Validate photographer ownership
  - Validate request body (selection_limit, deadline_date)
  - Call ProofingService.enableProofing()
  - Return ProofingConfig with proper error handling
  - **Validates: Requirement 1**

- [ ] 4.2 Create GET /api/galleries/[id]/proofing
  - Allow public access for client view
  - Call ProofingService.getProofingConfig()
  - Return null if not configured
  - **Validates: Requirement 1**

- [ ] 4.3 Create GET /api/galleries/[id]/proofing/status
  - Extract sessionId from query params
  - Call ProofingService.getProofingStatus()
  - Return complete status object
  - **Validates: Requirement 2**

- [ ] 4.4 Create POST /api/galleries/[id]/proofing/validate
  - Extract sessionId from body
  - Call ProofingService.validateSelection()
  - Trigger photographer notification
  - Return updated session
  - **Validates: Requirement 3**

- [ ] 4.5 Create GET /api/galleries/[id]/proofing/sessions
  - Validate photographer ownership
  - Support status filter query param
  - Call ProofingService.listSessions()
  - Return sessions with statistics
  - **Validates: Requirement 4**

- [ ] 4.6 Create GET /api/galleries/[id]/proofing/sessions/[sessionId]
  - Validate photographer ownership
  - Call ProofingService.getSessionDetails()
  - Return session with favorites list
  - **Validates: Requirement 4**

- [ ] 4.7 Write API integration tests
  - Test all routes with valid/invalid inputs
  - Test authentication and authorization
  - Test error handling
  - **Validates: Requirements 1-4, 12**

#### 5. React Components - Photographer UI (Day 4)

- [ ] 5.1 Create ProofingConfigSection component
  - Add toggle for enabling/disabling proofing
  - Add number input for selection limit with validation
  - Add date picker for deadline
  - Add textarea for custom instructions
  - Implement save handler with API call
  - Add loading and error states
  - **Validates: Requirement 1**

- [ ] 5.2 Create ProofingSessionsList component
  - Fetch sessions from API
  - Display table with columns: Session ID, Status, Progress, Date
  - Add status filter dropdown
  - Add status badges with colors
  - Implement row click to view details
  - Add export button for validated sessions
  - **Validates: Requirement 4**

- [ ] 5.3 Create ProofingSessionDetail component
  - Fetch session details with favorites
  - Display session metadata
  - Display grid of selected images
  - Add export as ZIP functionality
  - **Validates: Requirement 4**

- [ ] 5.4 Integrate ProofingConfigSection into gallery settings
  - Add new "Client Proofing" section to gallery settings page
  - Fetch existing config on mount
  - Handle save/update flow
  - **Validates: Requirement 1**

- [ ] 5.5 Add "Selections" tab to gallery dashboard
  - Add new tab to gallery detail page
  - Render ProofingSessionsList component
  - Show empty state when no sessions
  - **Validates: Requirement 4**

#### 6. React Components - Client UI (Day 5)

- [ ] 6.1 Create ProofingBanner component
  - Display sticky banner at top of gallery
  - Show progress indicator "X/Y selected"
  - Show progress bar visual
  - Display deadline countdown if applicable
  - Display custom instructions
  - Add "Validate Selection" button (enabled when count > 0)
  - Show lock icon when validated
  - **Validates: Requirement 2**

- [ ] 6.2 Create ProofingValidationModal component
  - Display confirmation dialog
  - Show selection summary
  - Show warning about finality
  - Implement confirm/cancel handlers
  - Add loading state during validation
  - **Validates: Requirements 2, 3**

- [ ] 6.3 Enhance FavoriteButton component
  - Fetch proofing status on mount
  - Disable button when limit reached
  - Disable button when selection validated
  - Add tooltip explaining disabled state
  - Update toggle handler to check proofing limits
  - Show error toast when limit reached
  - Implement optimistic UI updates
  - **Validates: Requirements 2, 5**

- [ ] 6.4 Integrate ProofingBanner into gallery view
  - Fetch proofing status on gallery load
  - Conditionally render banner when proofing enabled
  - Handle validation flow
  - Refresh gallery state after validation
  - **Validates: Requirement 2**

- [ ] 6.5 Write component tests
  - Test ProofingBanner rendering and interactions
  - Test ProofingValidationModal flow
  - Test FavoriteButton with proofing enabled/disabled
  - Test limit enforcement in UI
  - **Validates: Requirements 2, 3, 5**

#### 7. End-to-End Testing & Documentation (Day 5)

- [ ] 7.1 Write E2E tests for proofing workflow
  - Test photographer enables proofing
  - Test client views gallery with proofing
  - Test client selects photos up to limit
  - Test client cannot exceed limit
  - Test client validates selection
  - Test selection is locked after validation
  - Test photographer views validated selection
  - **Validates: Requirements 1-5**

- [ ] 7.2 Test backward compatibility
  - Test existing galleries without proofing
  - Test existing favorites continue to work
  - Test migration from non-proofing to proofing
  - **Validates: Requirement 11**

- [ ] 7.3 Write user documentation
  - Create photographer guide for enabling proofing
  - Create client guide for making selections
  - Add FAQ section
  - Create video tutorial script
  - **Validates: All proofing requirements**

### Feature 2: Contact Management (3 days)

#### 8. Database Schema & Migrations (Day 6)

- [ ] 8.1 Create photographer_contacts table migration
  - Create table with columns: id, photographer_id, name, email, phone, address, tags, notes, total_galleries, total_revenue_cents, last_gallery_date, created_at, updated_at
  - Add unique constraint on (photographer_id, email)
  - Create indexes on photographer_id, email, name, tags
  - Create full-text search index
  - Add RLS policies for photographer ownership
  - **Validates: Requirements 6, 12**

- [ ] 8.2 Modify galleries table migration
  - Add contact_id column as nullable UUID foreign key
  - Create index on contact_id
  - Test backward compatibility
  - **Validates: Requirement 10**

- [ ] 8.3 Create update_contact_stats trigger function
  - Create function to update total_galleries, total_revenue_cents, last_gallery_date
  - Create trigger on galleries INSERT/UPDATE/DELETE
  - Test trigger with various scenarios
  - **Validates: Requirement 8**

- [ ] 8.4 Test migrations in development environment
  - Run migrations on clean database
  - Verify all constraints and indexes
  - Test RLS policies
  - Test trigger functionality
  - **Validates: Requirements 6, 8, 10, 12**

#### 9. Service Layer & API Routes (Day 7)

- [ ] 9.1 Create ContactsService with CRUD methods
  - Implement createContact() with validation
  - Implement updateContact() with ownership check
  - Implement deleteContact() with cleanup
  - Implement getContact() with gallery history
  - **Validates: Requirements 6, 8**

- [ ] 9.2 Implement search and filter methods
  - Implement listContacts() with pagination
  - Implement searchContacts() with full-text search
  - Implement tag filtering
  - Implement sorting (name, date, revenue, galleries)
  - **Validates: Requirements 7, 9**

- [ ] 9.3 Implement gallery linking methods
  - Implement linkGalleryToContact() with validation
  - Implement unlinkGalleryFromContact()
  - Implement getTags() for autocomplete
  - **Validates: Requirements 7, 10**

- [ ] 9.4 Write unit tests for ContactsService
  - Test CRUD operations
  - Test duplicate email validation
  - Test search and filter logic
  - Test gallery linking
  - Test statistics calculation
  - **Validates: Requirements 6-10**

- [ ] 9.5 Create API routes for contacts
  - POST /api/contacts (create)
  - GET /api/contacts (list with filters)
  - GET /api/contacts/[id] (get with history)
  - PUT /api/contacts/[id] (update)
  - DELETE /api/contacts/[id] (delete)
  - GET /api/contacts/tags (get all tags)
  - POST /api/galleries/[id]/link-contact (link)
  - DELETE /api/galleries/[id]/link-contact (unlink)
  - **Validates: Requirements 6-10**

- [ ] 9.6 Write API integration tests
  - Test all routes with valid/invalid inputs
  - Test authentication and authorization
  - Test error handling
  - **Validates: Requirements 6-10, 12**

#### 10. React Components & Integration (Day 8)

- [ ] 10.1 Create ContactsList component
  - Implement search input with debounce
  - Implement multi-select tag filter
  - Implement sort dropdown
  - Display data table with all columns
  - Implement pagination
  - Add "New Contact" button
  - **Validates: Requirements 6, 7, 9**

- [ ] 10.2 Create ContactForm component
  - Add form fields for all contact properties
  - Implement tag input with autocomplete
  - Add validation for required fields
  - Implement save handler with API call
  - Add loading and error states
  - **Validates: Requirements 6, 7**

- [ ] 10.3 Create ContactDetail component
  - Display contact header with info and tags
  - Display stats cards
  - Display notes section
  - Display gallery history table
  - Add edit/delete buttons
  - Implement delete confirmation
  - **Validates: Requirements 6, 8**

- [ ] 10.4 Create ContactSelector component
  - Implement combobox with search
  - Fetch and display contacts
  - Add "Create new contact" option
  - Add "No contact" option
  - Implement onChange handler
  - **Validates: Requirement 10**

- [ ] 10.5 Integrate ContactSelector into GalleryForm
  - Add contact selector field to gallery creation form
  - Add contact selector field to gallery edit form
  - Handle contact linking on save
  - **Validates: Requirement 10**

- [ ] 10.6 Create /contacts page in dashboard
  - Add new route for contacts list
  - Add navigation link in dashboard
  - Render ContactsList component
  - Handle modal for ContactForm
  - **Validates: Requirements 6, 9**

- [ ] 10.7 Create /contacts/[id] page in dashboard
  - Add route for contact detail
  - Render ContactDetail component
  - Handle edit modal
  - Handle delete with redirect
  - **Validates: Requirements 6, 8**

- [ ] 10.8 Write component tests
  - Test ContactsList rendering and interactions
  - Test ContactForm validation and submission
  - Test ContactDetail display and actions
  - Test ContactSelector search and selection
  - **Validates: Requirements 6-10**

#### 11. End-to-End Testing & Documentation (Day 8)

- [ ] 11.1 Write E2E tests for contact management
  - Test photographer creates contact
  - Test photographer searches and filters contacts
  - Test photographer views contact detail
  - Test photographer edits contact
  - Test photographer deletes contact
  - Test photographer links gallery to contact
  - Test contact statistics update automatically
  - **Validates: Requirements 6-10**

- [ ] 11.2 Test integration with existing features
  - Test gallery creation with contact linking
  - Test contact statistics with revenue updates
  - Test contact deletion with gallery unlinking
  - **Validates: Requirements 8, 10**

- [ ] 11.3 Write user documentation
  - Create photographer guide for contact management
  - Add FAQ section
  - Document tag best practices
  - **Validates: Requirements 6-10**

### Final Integration & Deployment

#### 12. Final Testing & Polish (Included in Days 1-8)

- [ ] 12.1 Perform full regression testing
  - Test all existing features still work
  - Test new features in production-like environment
  - Test on multiple browsers and devices
  - Test accessibility compliance

- [ ] 12.2 Performance optimization
  - Optimize database queries with EXPLAIN ANALYZE
  - Add appropriate caching where needed
  - Optimize component re-renders
  - Test with large datasets

- [ ] 12.3 Security audit
  - Review all RLS policies
  - Test authorization on all routes
  - Validate all user inputs
  - Test for SQL injection and XSS

- [ ] 12.4 Update documentation
  - Update API documentation
  - Update database schema documentation
  - Update component library documentation
  - Create changelog entry

#### 13. Deployment Preparation

- [ ] 13.1 Create deployment checklist
  - Database migration plan
  - Rollback plan
  - Monitoring setup
  - Feature flag configuration

- [ ] 13.2 Prepare rollout plan
  - Beta testing with 10% of Pro users
  - Gradual rollout to 50%, then 100%
  - Communication plan for users
  - Support team training

## Success Criteria

### Feature 1: Client Proofing
- [ ] Photographers can enable proofing with limits and deadlines
- [ ] Clients see progress indicators and are blocked at limits
- [ ] Clients can validate selections and selections are locked
- [ ] Photographers can view all sessions and export validated selections
- [ ] Existing favorites system continues to work without proofing

### Feature 2: Contact Management
- [ ] Photographers can create, edit, and delete contacts
- [ ] Photographers can search and filter contacts by tags
- [ ] Contact statistics update automatically when galleries are linked
- [ ] Photographers can view contact history with revenue data
- [ ] Galleries can be linked to contacts during creation or editing

### Overall
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Ready for beta deployment

## Notes

- Maintain backward compatibility throughout implementation
- Follow existing code patterns and conventions
- Write tests alongside implementation, not after
- Document any deviations from the design
- Communicate blockers early
