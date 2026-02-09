# Checkpoint 29: Template Management UI Verification

## Overview
This document tracks the verification of the template management UI functionality as outlined in task 29.

**Date**: February 5, 2026
**Status**: In Progress

## Test Checklist

### 1. Test Creating a New Template from Scratch

#### 1.1 Navigation and Access
- [ ] Navigate to `/admin/emails/templates`
- [ ] Verify "Create Template" button is visible
- [ ] Click "Create Template" button
- [ ] Verify navigation to `/admin/emails/templates/new`

#### 1.2 Template Settings Form
- [ ] Verify all required fields are present:
  - [ ] Template Name field
  - [ ] Template Slug field (auto-generated from name)
  - [ ] Subject Line field
  - [ ] Template Type dropdown (Transactional/Marketing)
  - [ ] Template Variables section
- [ ] Test auto-slug generation:
  - [ ] Enter "Welcome Email" in name field
  - [ ] Verify slug auto-generates to "welcome-email"
- [ ] Test subject line with variables:
  - [ ] Enter "Welcome to {{appName}}, {{userName}}!"
  - [ ] Verify variable syntax is accepted

#### 1.3 Variable Management
- [ ] Click "Add Variable" button
- [ ] Verify variable inserter modal opens
- [ ] Add a variable (e.g., "userName")
- [ ] Verify variable appears as badge in variables section
- [ ] Click variable badge to remove
- [ ] Verify variable is removed

#### 1.4 Email Editor
- [ ] Verify WYSIWYG editor loads
- [ ] Test drag-and-drop functionality:
  - [ ] Drag text component
  - [ ] Drag image component
  - [ ] Drag button component
  - [ ] Drag divider component
- [ ] Verify components can be edited
- [ ] Verify components can be deleted

#### 1.5 Save Draft
- [ ] Fill in all required fields
- [ ] Click "Save Draft" button
- [ ] Verify loading state shows
- [ ] Verify success toast appears
- [ ] Verify redirect to edit page with template ID
- [ ] Verify template appears in template list as inactive

#### 1.6 Publish Template
- [ ] Create a new template
- [ ] Fill in all required fields
- [ ] Click "Publish" button
- [ ] Verify loading state shows
- [ ] Verify success toast appears
- [ ] Verify template appears in template list as active

### 2. Test Editing an Existing Template

#### 2.1 Navigation to Edit
- [ ] Navigate to `/admin/emails/templates`
- [ ] Click "Edit" button on an existing template
- [ ] Verify navigation to `/admin/emails/templates/[id]/edit`
- [ ] Verify template data loads correctly:
  - [ ] Name field populated
  - [ ] Slug field populated and disabled
  - [ ] Subject field populated
  - [ ] Type field populated
  - [ ] Variables populated
  - [ ] Email design loaded in editor

#### 2.2 Modify Template
- [ ] Change template name
- [ ] Verify slug remains unchanged (disabled)
- [ ] Change subject line
- [ ] Add new variable
- [ ] Modify email design in editor
- [ ] Click "Save Draft"
- [ ] Verify success toast appears
- [ ] Verify page refreshes with updated data

#### 2.3 Version Creation
- [ ] Edit an existing template
- [ ] Make changes to content
- [ ] Save the template
- [ ] Verify new version is created
- [ ] Check version history shows new version

### 3. Verify Template Preview Works Correctly

#### 3.1 Preview Modal Access
- [ ] Navigate to template list
- [ ] Click "Preview" button on a template
- [ ] Verify preview modal opens
- [ ] Verify modal shows:
  - [ ] Template name in header
  - [ ] Sample data JSON editor (left panel)
  - [ ] Preview area (right panel)
  - [ ] Desktop/Mobile toggle
  - [ ] HTML/Text toggle
  - [ ] Copy HTML button
  - [ ] Test email section

#### 3.2 Sample Data Editing
- [ ] Edit sample data JSON
- [ ] Click "Refresh Preview" button
- [ ] Verify preview updates with new data
- [ ] Test invalid JSON:
  - [ ] Enter invalid JSON
  - [ ] Click "Refresh Preview"
  - [ ] Verify error message appears

#### 3.3 View Mode Toggle
- [ ] Click "Desktop" view button
- [ ] Verify preview shows full width
- [ ] Click "Mobile" view button
- [ ] Verify preview shows mobile width (375px)

#### 3.4 Content Type Toggle
- [ ] Click "HTML" button
- [ ] Verify HTML preview shows in iframe
- [ ] Click "Text" button
- [ ] Verify plain text version shows

#### 3.5 Copy HTML Functionality
- [ ] Click "Copy HTML" button
- [ ] Verify "Copied!" feedback appears
- [ ] Paste clipboard content
- [ ] Verify HTML is copied correctly

### 4. Test Version History and Rollback

#### 4.1 Version History Access
- [ ] Navigate to template edit page
- [ ] Click "Version History" button
- [ ] Verify version history modal opens
- [ ] Verify version list shows:
  - [ ] Version numbers
  - [ ] Subject lines
  - [ ] Created dates
  - [ ] Active/Inactive status badges
  - [ ] Action buttons (Preview, Publish, Rollback)

#### 4.2 Version Preview
- [ ] Click "Preview" button on a version
- [ ] Verify preview modal opens
- [ ] Verify version content displays in iframe
- [ ] Close preview modal
- [ ] Verify return to version history

#### 4.3 Version Publish
- [ ] Select an inactive version
- [ ] Click "Publish" button
- [ ] Verify success toast appears
- [ ] Verify version status changes to "Active"
- [ ] Verify previous active version becomes inactive

#### 4.4 Version Rollback
- [ ] Select an older version
- [ ] Click "Rollback" button
- [ ] Verify confirmation dialog appears with:
  - [ ] Version number
  - [ ] Subject line
  - [ ] Created date
  - [ ] Warning message
- [ ] Click "Rollback" button in dialog
- [ ] Verify success toast appears
- [ ] Verify new version created with old content
- [ ] Verify template editor shows rolled-back content

#### 4.5 Version Comparison
- [ ] Click "Compare Versions" button
- [ ] Verify comparison modal opens
- [ ] Verify two version selectors appear
- [ ] Select left version
- [ ] Select right version
- [ ] Verify side-by-side preview loads
- [ ] Verify both versions display correctly
- [ ] Verify active version badges show correctly

### 5. Test Sending Test Emails

#### 5.1 Test Email from Preview
- [ ] Open template preview modal
- [ ] Enter valid email address in test email field
- [ ] Click send button
- [ ] Verify loading state shows
- [ ] Verify success message appears
- [ ] Check email inbox
- [ ] Verify test email received with [TEST] prefix
- [ ] Verify email content matches preview
- [ ] Verify variables are substituted correctly

#### 5.2 Test Email Validation
- [ ] Open template preview modal
- [ ] Enter invalid email (no @ symbol)
- [ ] Click send button
- [ ] Verify error message appears
- [ ] Enter empty email
- [ ] Verify send button is disabled

#### 5.3 Test Email with Custom Variables
- [ ] Open template preview modal
- [ ] Edit sample data JSON with custom values
- [ ] Click "Refresh Preview"
- [ ] Send test email
- [ ] Check email inbox
- [ ] Verify custom variable values appear in email

### 6. Ensure UI is Responsive and Accessible

#### 6.1 Responsive Design - Desktop (1920x1080)
- [ ] Navigate to template list page
- [ ] Verify layout is appropriate for large screens
- [ ] Navigate to template editor
- [ ] Verify editor layout uses full width
- [ ] Open preview modal
- [ ] Verify modal is properly sized

#### 6.2 Responsive Design - Tablet (768x1024)
- [ ] Navigate to template list page
- [ ] Verify table adapts to tablet width
- [ ] Navigate to template editor
- [ ] Verify form fields stack appropriately
- [ ] Verify editor remains usable

#### 6.3 Responsive Design - Mobile (375x667)
- [ ] Navigate to template list page
- [ ] Verify table becomes scrollable or cards
- [ ] Navigate to template editor
- [ ] Verify all fields are accessible
- [ ] Verify buttons are touch-friendly

#### 6.4 Keyboard Navigation
- [ ] Tab through template list page
- [ ] Verify all interactive elements are reachable
- [ ] Tab through template editor
- [ ] Verify all form fields are reachable
- [ ] Test Enter key to submit forms
- [ ] Test Escape key to close modals

#### 6.5 Screen Reader Compatibility
- [ ] Enable screen reader
- [ ] Navigate template list
- [ ] Verify table headers are announced
- [ ] Navigate template editor
- [ ] Verify form labels are announced
- [ ] Verify button purposes are clear

#### 6.6 Color Contrast
- [ ] Verify text has sufficient contrast
- [ ] Verify buttons have sufficient contrast
- [ ] Verify status badges are distinguishable
- [ ] Verify error messages are visible

#### 6.7 Focus Indicators
- [ ] Tab through all interactive elements
- [ ] Verify focus indicators are visible
- [ ] Verify focus order is logical

## Test Results Summary

### Tests Passed: 0 / TBD
### Tests Failed: 0 / TBD
### Tests Skipped: 0 / TBD

## Issues Found

### Critical Issues
- None identified yet

### Major Issues
- None identified yet

### Minor Issues
- None identified yet

## Recommendations

### Immediate Actions Required
- TBD after testing

### Future Enhancements
- TBD after testing

## Sign-off

- [ ] All critical functionality verified
- [ ] All tests passed or issues documented
- [ ] User acceptance obtained
- [ ] Ready to proceed to Phase 8

---

**Verification Completed By**: [To be filled]
**Date**: [To be filled]
**Approved By**: [To be filled]
