# Requirements Document

## Introduction

Cette fonctionnalité permet aux visiteurs de créer une galerie photo directement sur la landing page sans créer de compte au préalable. Après l'upload, l'utilisateur voit sa galerie avec trois options de monétisation : garder gratuit (24h, logo PikSend), payer $2.99 pour débloquer cette galerie (one-shot), ou s'abonner à $9.99/mois pour un accès illimité. Un système de traduction maison (anglais/français) avec détection automatique de la langue du navigateur couvre l'ensemble du site. L'interface admin permet de visualiser les galeries guest et leur conversion. Un onboarding guide les nouveaux utilisateurs sans galerie.

## Glossary

- **Guest_Gallery**: Galerie créée par un visiteur non authentifié, stockée temporairement avec un identifiant de session
- **Guest_Session**: Session anonyme identifiée par un token unique stocké en localStorage/cookie
- **Gallery_Unlock**: Paiement one-shot de $2.99 pour débloquer une galerie guest et la convertir en galerie permanente
- **Watermark**: Logo PikSend affiché sur les images des galeries gratuites
- **Translation_System**: Système de traduction maison avec dictionnaires JSON pour chaque langue supportée, couvrant tout le site
- **Language_Detector**: Module détectant la langue préférée via navigator.language ou Accept-Language header
- **Pricing_Modal**: Modal affichant les trois options de monétisation après création d'une galerie guest
- **Upload_Form**: Formulaire de création de galerie intégré à la landing page
- **Onboarding_Guide**: Guide étape par étape pour les nouveaux utilisateurs sans galerie
- **Gallery_Migration**: Processus d'association des galeries guest à un compte utilisateur nouvellement créé

## Requirements

### Requirement 1: Guest Gallery Creation

**User Story:** As a visitor, I want to create a photo gallery without signing up, so that I can test the service before committing.

#### Acceptance Criteria

1. WHEN a visitor accesses the landing page, THE Upload_Form SHALL be visible and accessible without authentication
2. WHEN a visitor uploads photos via the Upload_Form, THE Guest_Gallery SHALL be created with a unique slug and stored with a Guest_Session identifier
3. WHEN a Guest_Gallery is created, THE System SHALL set an expiration of 24 hours from creation time
4. WHEN a visitor completes the upload, THE System SHALL redirect to the gallery preview page showing the result
5. THE Upload_Form SHALL validate that at least 1 photo is uploaded before submission
6. THE Upload_Form SHALL enforce a maximum of 10 photos for guest galleries
7. THE Upload_Form SHALL enforce a maximum file size of 5MB per image for guest galleries

### Requirement 2: Guest Gallery Display with Watermark

**User Story:** As a visitor, I want to see my gallery with a watermark, so that I understand the free tier limitations.

#### Acceptance Criteria

1. WHEN displaying a free Guest_Gallery, THE System SHALL overlay the PikSend Watermark on all images
2. THE Watermark SHALL be positioned in the bottom-right corner with 30% opacity
3. WHEN a gallery is unlocked or user subscribes, THE System SHALL remove the Watermark from all images
4. THE Gallery_Preview SHALL display a banner indicating "Free Gallery - Expires in X hours"

### Requirement 3: Pricing Modal After Upload

**User Story:** As a visitor who just created a gallery, I want to see my monetization options, so that I can decide how to proceed.

#### Acceptance Criteria

1. WHEN a visitor completes a Guest_Gallery upload, THE Pricing_Modal SHALL appear automatically
2. THE Pricing_Modal SHALL display three options:
   - "Keep it Free" (expires in 24h, PikSend logo everywhere)
   - "Unlock This Gallery for $2.99" (one-shot payment with benefits)
   - "Go Unlimited for $9.99/month" (subscription offer)
3. WHEN visitor clicks "Keep it Free", THE Pricing_Modal SHALL close and show the gallery with watermarks
4. WHEN visitor clicks "Unlock This Gallery", THE System SHALL initiate Stripe checkout for $2.99 one-time payment
5. WHEN visitor clicks "Go Unlimited", THE System SHALL initiate Stripe checkout for $9.99/month subscription
6. THE Pricing_Modal SHALL highlight "Go Unlimited" as the recommended option

### Requirement 4: Pay-Per-Gallery ($2.99) Purchase Flow

**User Story:** As a visitor, I want to pay $2.99 to unlock my gallery permanently, so that I can share it without watermarks or expiration.

#### Acceptance Criteria

1. WHEN a visitor initiates Gallery_Unlock payment, THE System SHALL create a Stripe checkout session for $2.99
2. WHEN payment succeeds, THE System SHALL:
   - Remove the 24h expiration (set to 30 days)
   - Remove all Watermarks from the gallery
   - Generate a shareable link without branding
3. WHEN payment succeeds, THE System SHALL prompt the visitor to create an account to manage their gallery
4. IF visitor creates an account after payment, THE System SHALL associate the unlocked gallery with their new profile
5. IF visitor does not create an account, THE System SHALL store the gallery with the Guest_Session for 30 days
6. THE Gallery_Unlock benefits SHALL include:
   - No watermark
   - 30-day expiration instead of 24h
   - Download enabled for recipients
   - Custom gallery title

### Requirement 5: Subscription Upsell ($9.99/month)

**User Story:** As a visitor, I want to subscribe for unlimited access, so that I can create multiple galleries without restrictions.

#### Acceptance Criteria

1. WHEN a visitor initiates subscription from Pricing_Modal, THE System SHALL create a Stripe checkout for $9.99/month
2. WHEN subscription payment succeeds, THE System SHALL require account creation
3. WHEN account is created with active subscription, THE System SHALL:
   - Convert the Guest_Gallery to a permanent gallery
   - Apply Premium plan limits to the new account
   - Remove all watermarks from existing guest galleries
4. THE subscription offer SHALL be presented as "irresistible" with clear value proposition vs pay-per-gallery

### Requirement 6: Translation System (English/French)

**User Story:** As a visitor, I want to see the interface in my preferred language, so that I can understand the service better.

#### Acceptance Criteria

1. THE Translation_System SHALL support English and French languages
2. THE Translation_System SHALL use JSON dictionaries stored in `/src/locales/{lang}.json`
3. WHEN a visitor first accesses the site, THE Language_Detector SHALL detect language from `navigator.language` or `Accept-Language` header
4. THE System SHALL default to English if detected language is not supported
5. THE Translation_System SHALL provide a `useTranslation` hook for React components
6. THE Translation_System SHALL support nested keys (e.g., `pricing.modal.title`)
7. WHEN user manually selects a language, THE System SHALL store preference in localStorage and override auto-detection
8. THE Translation_System architecture SHALL allow easy addition of new languages

### Requirement 7: Language Switcher UI

**User Story:** As a visitor, I want to manually switch languages, so that I can view the site in my preferred language.

#### Acceptance Criteria

1. THE Landing_Header SHALL include a language switcher dropdown
2. THE Language_Switcher SHALL display current language with flag icon
3. WHEN user selects a different language, THE System SHALL immediately update all visible text
4. THE Language_Switcher SHALL persist selection across page navigations and sessions

### Requirement 8: Guest Session Management and Gallery Migration

**User Story:** As a system, I want to track guest sessions and migrate galleries when users create accounts, so that users find their galleries in their dashboard.

#### Acceptance Criteria

1. WHEN a visitor first interacts with the upload form, THE System SHALL generate a unique Guest_Session token
2. THE Guest_Session token SHALL be stored in localStorage and as an HTTP-only cookie
3. THE Guest_Session SHALL be valid for 7 days
4. WHEN a guest creates an account, THE System SHALL automatically migrate all Guest_Galleries to the new profile
5. WHEN Gallery_Migration occurs, THE System SHALL update the gallery's `user_id` and clear `guest_session_id`
6. WHEN Gallery_Migration occurs, THE migrated galleries SHALL appear in the user's dashboard immediately
7. THE System SHALL clean up expired Guest_Sessions and their associated galleries via a scheduled job
8. IF a guest has paid for Gallery_Unlock before creating account, THE unlocked status SHALL be preserved after migration

### Requirement 9: Database Schema for Guest Galleries

**User Story:** As a system, I want to store guest galleries properly, so that they can be converted to permanent galleries after payment.

#### Acceptance Criteria

1. THE galleries table SHALL include a `guest_session_id` nullable column
2. THE galleries table SHALL include a `is_unlocked` boolean column (default false)
3. THE galleries table SHALL include a `payment_type` enum column ('free', 'one_time', 'subscription')
4. WHEN a gallery has `user_id` NULL and `guest_session_id` NOT NULL, THE System SHALL treat it as a Guest_Gallery
5. THE System SHALL create a `gallery_payments` table to track one-time payments with Stripe payment_intent_id

### Requirement 10: Error Handling for Guest Upload

**User Story:** As a visitor, I want clear error messages during upload, so that I can fix issues and complete my gallery.

#### Acceptance Criteria

1. IF upload fails due to file size, THE System SHALL display "File too large. Maximum 5MB per image."
2. IF upload fails due to file type, THE System SHALL display "Invalid file type. Please upload JPG, PNG, or WebP images."
3. IF upload fails due to network error, THE System SHALL display "Upload failed. Please check your connection and try again."
4. IF Stripe payment fails, THE System SHALL display the error message from Stripe and allow retry
5. THE System SHALL preserve uploaded files in memory during payment flow to avoid re-upload

### Requirement 11: Admin Dashboard - Guest Gallery Visibility

**User Story:** As an admin, I want to see guest galleries and their conversion status, so that I can monitor the guest-to-user funnel.

#### Acceptance Criteria

1. THE Admin_Gallery_Table SHALL display a "Type" column indicating: "Guest", "User", or "Converted" (guest who became user)
2. THE Admin_Gallery_Table SHALL allow filtering by gallery type (Guest/User/Converted)
3. WHEN viewing a gallery detail, THE Admin SHALL see the guest_session_id if applicable
4. THE Admin_Dashboard SHALL display conversion metrics: total guest galleries, converted galleries, conversion rate
5. THE Admin SHALL be able to see the timeline of a converted gallery (created as guest → user account created → associated)

### Requirement 12: New User Onboarding Guide

**User Story:** As a new user without galleries, I want a step-by-step guide to create my first gallery, so that I understand how to use the service.

#### Acceptance Criteria

1. WHEN a new user logs in for the first time with no galleries, THE Dashboard SHALL display the Onboarding_Guide
2. THE Onboarding_Guide SHALL have an elegant design consistent with the site's aesthetic
3. THE Onboarding_Guide SHALL include steps:
   - Step 1: "Welcome to PikSend" with brief value proposition
   - Step 2: "Upload your photos" with drag-and-drop zone
   - Step 3: "Customize your gallery" with title and settings
   - Step 4: "Share with your clients" with link generation
4. THE Onboarding_Guide SHALL be dismissible and not shown again once dismissed
5. IF user already has galleries (migrated from guest), THE Onboarding_Guide SHALL NOT be displayed
6. THE Onboarding_Guide progress SHALL be saved so user can continue later

### Requirement 13: Site-Wide Translation Coverage

**User Story:** As a visitor or user, I want the entire site translated in my language, so that I have a consistent experience.

#### Acceptance Criteria

1. THE Translation_System SHALL cover all pages: Landing, Auth, Dashboard, Gallery View, Admin, Error pages
2. THE Translation_System SHALL translate all UI elements: buttons, labels, placeholders, tooltips, error messages
3. THE Translation_System SHALL translate dynamic content: plan names, feature descriptions, pricing text
4. THE Translation_System SHALL translate email templates (if applicable)
5. THE Translation_System SHALL maintain consistent terminology across all pages
6. WHEN adding new UI text, developers SHALL add translations to all supported language files
