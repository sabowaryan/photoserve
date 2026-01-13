# Implementation Plan: Guest Upload & Monetization

## Overview

Ce plan implémente le système de guest upload avec monétisation et traduction. L'approche est incrémentale : d'abord l'infrastructure (DB, types, sessions), puis les composants UI, ensuite les flux de paiement, et enfin la traduction site-wide.

## Tasks

- [x] 1. Database Schema and Types
  - [x] 1.1 Create migration for guest gallery support
    - Add `guest_session_id`, `is_unlocked`, `payment_type` columns to galleries
    - Create `gallery_payments` table
    - Add `onboarding_completed` to profiles
    - Update RLS policies for guest access
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 1.2 Update TypeScript types
    - Add `GuestGallery`, `GalleryPayment`, `PaymentType` types
    - Add `SupportedLocale`, `LocaleConfig` types
    - Update `Gallery` interface with new fields
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 2. Guest Session Management
  - [x] 2.1 Implement GuestSessionManager class
    - Create `src/lib/guest/session.ts`
    - Implement token generation, storage (localStorage + cookie), validation
    - Implement session expiration (7 days)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 2.2 Write property test for guest session uniqueness
    - **Property 10: Guest Session Management**
    - **Validates: Requirements 8.1, 8.2, 8.3**

  - [x] 2.3 Create guest session API endpoint
    - POST `/api/guest/session` - Create or retrieve session
    - Set HTTP-only cookie in response
    - _Requirements: 8.1, 8.2_

- [x] 3. Guest Gallery API
  - [x] 3.1 Create guest gallery service
    - Create `src/lib/services/guest-gallery.service.ts`
    - Implement create, getBySession, unlock methods
    - Enforce guest limits (10 photos, 5MB, 24h expiration)
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7_

  - [ ]* 3.2 Write property tests for guest gallery creation
    - **Property 1: Guest Gallery Creation Uniqueness**
    - **Property 2: Guest Gallery Expiration**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 3.3 Write property test for upload validation
    - **Property 3: Guest Upload Validation**
    - **Validates: Requirements 1.5, 1.6, 1.7**

  - [x] 3.4 Create guest gallery API routes
    - POST `/api/guest/galleries` - Create guest gallery
    - GET `/api/guest/galleries/[slug]` - Get guest gallery
    - POST `/api/guest/galleries/[slug]/images` - Upload images
    - _Requirements: 1.2, 1.4_

- [ ] 4. Checkpoint - Guest Gallery Backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Translation System
  - [x] 5.1 Create translation infrastructure
    - Create `src/lib/i18n/types.ts` with locale types
    - Create `src/lib/i18n/detector.ts` for language detection
    - Create `src/lib/i18n/context.tsx` with I18nProvider and useTranslation hook
    - _Requirements: 6.1, 6.3, 6.5_

  - [x] 5.2 Create translation dictionaries
    - Create `src/locales/en.json` with all English translations
    - Create `src/locales/fr.json` with all French translations
    - Include all pages: landing, auth, dashboard, gallery, admin, errors
    - _Requirements: 6.2, 13.1, 13.2, 13.3_

  - [ ]* 5.3 Write property tests for translation system
    - **Property 8: Translation System Behavior**
    - **Validates: Requirements 6.4, 6.6, 6.7**

  - [x] 5.4 Integrate I18nProvider in app layout
    - Wrap app with I18nProvider
    - Implement language persistence in localStorage
    - _Requirements: 6.7, 7.4_

- [x] 6. Language Switcher Component
  - [x] 6.1 Create LanguageSwitcher component
    - Create `src/components/shared/language-switcher.tsx`
    - Display current language with flag
    - Dropdown with available languages
    - _Requirements: 7.1, 7.2_

  - [x] 6.2 Integrate LanguageSwitcher in headers
    - Add to LandingHeader
    - Add to DashboardHeader
    - Add to AdminHeader
    - _Requirements: 7.1_

  - [ ]* 6.3 Write property test for language switching
    - **Property 9: Language Switching Reactivity**
    - **Validates: Requirements 7.3, 7.4**

- [ ] 7. Checkpoint - Translation System
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Guest Upload Form Component
  - [x] 8.1 Create GuestUploadForm component
    - Create `src/components/guest/guest-upload-form.tsx`
    - Drag-and-drop zone with file validation
    - Progress indicator during upload
    - Gallery title input
    - _Requirements: 1.1, 1.5, 1.6, 1.7_

  - [x] 8.2 Integrate GuestUploadForm in landing page
    - Add form section after hero or in dedicated section
    - Maintain elegant design consistent with site
    - _Requirements: 1.1_

  - [ ]* 8.3 Write unit tests for file validation
    - Test file size validation
    - Test file type validation
    - Test file count validation
    - _Requirements: 1.5, 1.6, 1.7_

- [x] 9. Watermark Overlay Component
  - [x] 9.1 Create WatermarkOverlay component
    - Create `src/components/gallery/watermark-overlay.tsx`
    - CSS-based overlay with PikSend logo
    - 30% opacity, bottom-right position
    - _Requirements: 2.1, 2.2_

  - [x] 9.2 Integrate watermark in gallery view
    - Conditionally render based on is_unlocked and payment_type
    - _Requirements: 2.1, 2.3_

  - [ ]* 9.3 Write property test for watermark visibility
    - **Property 4: Watermark Visibility Based on Unlock Status**
    - **Validates: Requirements 2.1, 2.3**

- [x] 10. Pricing Modal Component
  - [x] 10.1 Create PricingModal component
    - Create `src/components/guest/pricing-modal.tsx`
    - Three options: Free, Unlock ($2.99), Subscribe ($9.99/mo)
    - Highlight "Go Unlimited" as recommended
    - Elegant design matching site aesthetic
    - _Requirements: 3.1, 3.2, 3.6_

  - [x] 10.2 Create expiration banner component
    - Create `src/components/gallery/expiration-banner.tsx`
    - Display "Free Gallery - Expires in X hours"
    - _Requirements: 2.4_

  - [ ]* 10.3 Write unit tests for pricing modal
    - Test modal opens after upload
    - Test option selection handlers
    - _Requirements: 3.1, 3.3_

- [ ] 11. Checkpoint - UI Components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Stripe Payment Integration
  - [x] 12.1 Create gallery unlock checkout endpoint
    - POST `/api/stripe/checkout/gallery-unlock`
    - Create Stripe checkout session for $2.99 one-time payment
    - Include gallery_id in metadata
    - _Requirements: 3.4, 4.1_

  - [x] 12.2 Create subscription checkout for guests
    - Update existing checkout to handle guest-to-subscriber flow
    - Include guest_session_id in metadata
    - _Requirements: 3.5, 5.1_

  - [ ]* 12.3 Write property test for payment amounts
    - **Property 5: Payment Checkout Amount Correctness**
    - **Validates: Requirements 3.4, 3.5, 4.1, 5.1**

  - [x] 12.4 Create Stripe webhook handler for gallery payments
    - Handle `checkout.session.completed` for gallery unlock
    - Update gallery: is_unlocked=true, expires_at=+30 days
    - Create gallery_payments record
    - _Requirements: 4.2_

  - [ ]* 12.5 Write property test for unlock benefits
    - **Property 6: Unlock Benefits Application**
    - **Validates: Requirements 4.2, 4.5, 4.6**

- [x] 13. Gallery Migration System
  - [x] 13.1 Create migration service
    - Create `src/lib/services/gallery-migration.service.ts`
    - Implement migrateGuestGalleries(guestToken, userId)
    - Preserve is_unlocked status
    - _Requirements: 8.4, 8.5, 8.8_

  - [x] 13.2 Create migration API endpoint
    - POST `/api/guest/migrate`
    - Called after user account creation
    - _Requirements: 8.4_

  - [x] 13.3 Integrate migration in auth flow
    - Call migration after successful signup
    - Check for guest session token
    - _Requirements: 8.4, 8.6_

  - [ ]* 13.4 Write property test for migration integrity
    - **Property 7: Gallery Migration Data Integrity**
    - **Validates: Requirements 4.4, 8.4, 8.5, 8.8**

- [ ] 14. Checkpoint - Payment and Migration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Onboarding Guide
  - [x] 15.1 Create OnboardingGuide component
    - Create `src/components/dashboard/onboarding-guide.tsx`
    - 4-step guide with elegant design
    - Progress tracking
    - Dismissible
    - _Requirements: 12.1, 12.3, 12.4_

  - [x] 15.2 Integrate onboarding in dashboard
    - Show for new users without galleries
    - Hide for users with migrated galleries
    - Persist completion status
    - _Requirements: 12.1, 12.5, 12.6_

  - [ ]* 15.3 Write property test for onboarding display logic
    - **Property 11: Onboarding Guide Display Logic**
    - **Validates: Requirements 12.1, 12.4, 12.5**

- [x] 16. Admin Dashboard Extensions
  - [x] 16.1 Update gallery table with type column
    - Add "Type" column (Guest/User/Converted)
    - Add filter by gallery type
    - _Requirements: 11.1, 11.2_

  - [x] 16.2 Update gallery detail view
    - Show guest_session_id if applicable
    - Show conversion timeline for converted galleries
    - _Requirements: 11.3, 11.5_

  - [x] 16.3 Add conversion metrics to admin dashboard
    - Total guest galleries
    - Converted galleries count
    - Conversion rate
    - _Requirements: 11.4_

  - [ ]* 16.4 Write property test for gallery type determination
    - **Property 12: Gallery Type Determination**
    - **Validates: Requirements 9.4, 11.1**

- [x] 17. Error Handling
  - [x] 17.1 Create error messages with translations
    - Add error messages to translation dictionaries
    - Create error display components
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 17.2 Implement file preservation during payment
    - Keep uploaded files in memory/state during checkout
    - Restore on payment cancel
    - _Requirements: 10.5_

- [x] 18. Landing Page Integration
  - [x] 18.1 Translate landing page content
    - Update LandingPageClient to use useTranslation
    - Translate all static text
    - _Requirements: 13.1, 13.2_

  - [x] 18.2 Add guest upload section to landing
    - Position after hero or features section
    - Smooth scroll integration
    - _Requirements: 1.1_

- [ ] 19. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify full guest upload flow works end-to-end
  - Verify translation works across all pages
  - Verify admin can see guest/converted galleries

## Notes

- Tasks marked with `*` are optional property-based tests
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library (already installed)
- Translation dictionaries should be comprehensive from the start to avoid missing keys
