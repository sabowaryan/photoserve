# Requirements Document: Client Proofing & Contact Management

## Introduction

This specification defines two complementary features for PikSend Phase 1:

1. **Client Proofing**: An enhancement to the existing favorites system that adds a structured validation workflow, enabling photographers to set selection limits and deadlines while clients make their photo selections.

2. **Contact Management**: A basic client/contact management system that allows photographers to organize their clients with detailed records, tags, and gallery history tracking.

These features address critical gaps compared to competitors while maintaining PikSend's focus on simplicity and photo delivery. The implementation must be backward compatible with existing favorites functionality and follow established service patterns.

## Glossary

- **Photographer**: The authenticated user who creates and manages galleries
- **Client**: The end-user who views galleries and selects photos (may be anonymous with session ID)
- **Gallery**: A collection of photos shared by a photographer
- **Favorite**: An image marked by a client for selection
- **Proofing_Session**: A client's selection workflow instance for a specific gallery
- **Proofing_Config**: The photographer's configuration for selection limits and deadlines
- **Contact**: A photographer's client record with contact information and history
- **Session_ID**: A unique identifier for an anonymous client viewing a gallery
- **Selection_Limit**: The maximum number of photos a client can select
- **Validation**: The act of locking a client's selection, making it final
- **Tag**: A label used to categorize contacts (e.g., "Wedding", "Portrait", "VIP")

## Requirements

### Requirement 1: Proofing Configuration

**User Story:** As a photographer, I want to enable Client Proofing mode on my galleries with configurable limits, so that I can control how many photos clients select and when selections are due.

#### Acceptance Criteria

1. WHEN a photographer accesses gallery settings, THE System SHALL display a Client Proofing configuration section
2. WHEN a photographer enables Client Proofing, THE System SHALL allow setting a selection limit (positive integer or unlimited)
3. WHEN a photographer enables Client Proofing, THE System SHALL allow setting a deadline date (optional)
4. WHEN a photographer enables Client Proofing, THE System SHALL allow adding custom instructions for the client
5. WHEN a photographer saves proofing configuration, THE System SHALL persist the settings to the gallery_proofing_config table
6. WHEN a photographer disables Client Proofing, THE System SHALL maintain existing selections but stop enforcing limits

### Requirement 2: Client Selection Interface

**User Story:** As a client, I want to see my selection progress and limits clearly, so that I know how many photos I can select and when my selection is due.

#### Acceptance Criteria

1. WHEN a client views a gallery with proofing enabled, THE System SHALL display a sticky banner showing "X/Y selected"
2. WHEN a client views a gallery with proofing enabled, THE System SHALL display the deadline date if configured
3. WHEN a client views a gallery with proofing enabled, THE System SHALL display custom instructions if provided
4. WHEN a client reaches the selection limit, THE System SHALL prevent adding more favorites
5. WHEN a client attempts to exceed the selection limit, THE System SHALL display an error message
6. WHEN a client has made at least one selection, THE System SHALL display a "Validate Selection" button
7. WHEN a client clicks "Validate Selection", THE System SHALL display a confirmation modal
8. WHEN the deadline has passed, THE System SHALL prevent adding or removing favorites

### Requirement 3: Selection Validation Workflow

**User Story:** As a client, I want to validate my final selection, so that the photographer knows I have completed my choices.

#### Acceptance Criteria

1. WHEN a proofing session is created, THE System SHALL set status to "draft"
2. WHEN a client adds their first favorite, THE System SHALL update status to "in_progress"
3. WHEN a client validates their selection, THE System SHALL update status to "validated"
4. WHEN a client validates their selection, THE System SHALL record the validation timestamp
5. WHEN a selection is validated, THE System SHALL prevent any further modifications to favorites
6. WHEN a selection is validated, THE System SHALL send a notification to the photographer
7. IF a client attempts to modify a validated selection, THEN THE System SHALL display an error message

### Requirement 4: Photographer Proofing Dashboard

**User Story:** As a photographer, I want to view all proofing sessions for my galleries, so that I can track client progress and export validated selections.

#### Acceptance Criteria

1. WHEN a photographer views a gallery with proofing enabled, THE System SHALL display a "Selections" tab
2. WHEN a photographer views the Selections tab, THE System SHALL list all proofing sessions with their status
3. WHEN displaying proofing sessions, THE System SHALL show session ID, status, selection count, and validation date
4. WHEN a photographer filters by status, THE System SHALL display only sessions matching that status
5. WHEN a photographer clicks on a validated session, THE System SHALL display the selected photos
6. WHEN a photographer views a validated session, THE System SHALL provide an "Export as ZIP" button
7. WHEN a photographer exports a validated selection, THE System SHALL download a ZIP file containing the selected photos

### Requirement 5: Proofing Integration with Favorites

**User Story:** As a system, I want to integrate proofing validation with the existing favorites system, so that selection limits are enforced seamlessly.

#### Acceptance Criteria

1. WHEN a client toggles a favorite on a proofing-enabled gallery, THE System SHALL check the proofing status
2. WHEN adding a favorite would exceed the selection limit, THE System SHALL reject the operation
3. WHEN a favorite is added or removed, THE System SHALL update the proofing session selection count
4. WHEN a favorite is added to a new session, THE System SHALL create a proofing session record
5. WHEN favorites are toggled, THE System SHALL link them to the proofing session via proofing_session_id

### Requirement 6: Contact Creation and Management

**User Story:** As a photographer, I want to create and manage client contact records, so that I can organize my clients and track their information.

#### Acceptance Criteria

1. WHEN a photographer accesses the Contacts section, THE System SHALL display a list of all their contacts
2. WHEN a photographer clicks "New Contact", THE System SHALL display a contact creation form
3. WHEN creating a contact, THE System SHALL require a name field
4. WHEN creating a contact, THE System SHALL allow optional email, phone, address, tags, and notes fields
5. WHEN a photographer saves a contact with a duplicate email, THE System SHALL reject the operation with an error message
6. WHEN a photographer edits a contact, THE System SHALL update the contact record and set updated_at timestamp
7. WHEN a photographer deletes a contact, THE System SHALL remove the contact record and unlink associated galleries

### Requirement 7: Contact Tags and Categorization

**User Story:** As a photographer, I want to add tags to my contacts, so that I can categorize and filter them by project type or importance.

#### Acceptance Criteria

1. WHEN a photographer creates or edits a contact, THE System SHALL allow adding multiple tags
2. WHEN a photographer types a tag, THE System SHALL suggest existing tags for autocomplete
3. WHEN a photographer saves a contact with tags, THE System SHALL store tags as an array
4. WHEN a photographer views the contacts list, THE System SHALL display tags as badges for each contact
5. WHEN a photographer filters by tags, THE System SHALL display only contacts containing all selected tags
6. WHEN a photographer views available tags, THE System SHALL display all unique tags used across their contacts

### Requirement 8: Contact History and Statistics

**User Story:** As a photographer, I want to view a contact's gallery history and statistics, so that I can track our business relationship and revenue.

#### Acceptance Criteria

1. WHEN a photographer views a contact detail page, THE System SHALL display all galleries linked to that contact
2. WHEN displaying gallery history, THE System SHALL show gallery title, creation date, view count, and revenue
3. WHEN a photographer views a contact, THE System SHALL display total galleries count
4. WHEN a photographer views a contact, THE System SHALL display total revenue from all linked galleries
5. WHEN a photographer views a contact, THE System SHALL display the date of the most recent gallery
6. WHEN a gallery is created or linked to a contact, THE System SHALL update the contact's statistics automatically
7. WHEN a gallery purchase is completed, THE System SHALL update the contact's total revenue

### Requirement 9: Contact Search and Filtering

**User Story:** As a photographer, I want to search and filter my contacts, so that I can quickly find specific clients or groups of clients.

#### Acceptance Criteria

1. WHEN a photographer types in the search field, THE System SHALL filter contacts by name, email, or phone
2. WHEN a photographer selects tag filters, THE System SHALL display only contacts with those tags
3. WHEN a photographer selects a sort option, THE System SHALL reorder contacts by name, date, revenue, or gallery count
4. WHEN a photographer selects sort order, THE System SHALL display contacts in ascending or descending order
5. WHEN search or filter criteria match no contacts, THE System SHALL display an empty state message
6. WHEN a photographer clears search and filters, THE System SHALL display all contacts

### Requirement 10: Gallery-Contact Linking

**User Story:** As a photographer, I want to link galleries to contacts, so that I can track which galleries belong to which clients.

#### Acceptance Criteria

1. WHEN a photographer creates a new gallery, THE System SHALL display a contact selector field
2. WHEN a photographer selects a contact, THE System SHALL link the gallery to that contact via contact_id
3. WHEN a photographer edits an existing gallery, THE System SHALL allow changing the linked contact
4. WHEN a photographer views a gallery, THE System SHALL display the linked contact name if present
5. WHEN a photographer links a gallery to a contact, THE System SHALL verify the contact belongs to the photographer
6. WHEN a gallery is linked to a contact, THE System SHALL trigger an update to the contact's statistics
7. WHEN a photographer unlinks a gallery from a contact, THE System SHALL set contact_id to NULL and update statistics

### Requirement 11: Backward Compatibility

**User Story:** As a system, I want to maintain backward compatibility with existing favorites functionality, so that current users experience no disruption.

#### Acceptance Criteria

1. WHEN proofing is not enabled for a gallery, THE System SHALL allow unlimited favorites
2. WHEN existing favorites are accessed, THE System SHALL continue to function without proofing validation
3. WHEN a gallery has no proofing configuration, THE System SHALL treat it as proofing disabled
4. WHEN a contact is deleted, THE System SHALL preserve associated galleries with contact_id set to NULL
5. WHEN the favorites table is queried, THE System SHALL return results regardless of proofing_session_id value

### Requirement 12: Data Validation and Security

**User Story:** As a system, I want to validate all inputs and enforce security policies, so that data integrity and user privacy are maintained.

#### Acceptance Criteria

1. WHEN a selection limit is set, THE System SHALL validate it is a positive integer or NULL
2. WHEN a deadline date is set, THE System SHALL validate it is a valid future date
3. WHEN a contact email is provided, THE System SHALL validate it follows email format
4. WHEN a user accesses proofing configuration, THE System SHALL verify they own the gallery
5. WHEN a user accesses contact records, THE System SHALL verify they own the contacts
6. WHEN a client accesses a proofing session, THE System SHALL verify the session_id matches
7. WHEN database operations are performed, THE System SHALL enforce Row Level Security policies
