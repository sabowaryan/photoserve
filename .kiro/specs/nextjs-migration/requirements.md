# Requirements Document

## Introduction

Migration complète de l'application PhotoServe (actuellement React/Vite + Supabase Edge Functions) vers une architecture Next.js 15+ moderne avec approche microservices. L'objectif est de conserver le design existant tout en améliorant les performances, le SEO, la sécurité et la maintenabilité du code.

## Glossary

- **PhotoServe**: Application de partage de galeries photo sécurisées pour photographes professionnels
- **Gallery**: Collection d'images protégée par mot de passe avec date d'expiration
- **Profile**: Compte utilisateur avec limites de stockage et abonnement
- **Subscription_Plan**: Plan d'abonnement (free, premium, pro) définissant les limites utilisateur
- **Auth_Service**: Service d'authentification basé sur NextAuth.js
- **Gallery_Service**: Microservice gérant les opérations CRUD sur les galeries
- **Image_Service**: Microservice gérant l'upload, l'optimisation et la suppression d'images via Cloudinary
- **Payment_Service**: Microservice gérant les abonnements Stripe
- **SEO_Engine**: Système de génération de métadonnées et données structurées pour le référencement
- **Rate_Limiter**: Système de limitation des tentatives de connexion aux galeries

## Requirements

### Requirement 1: Migration Framework et Architecture

**User Story:** As a developer, I want to migrate the application to Next.js 15+ with App Router, so that I can benefit from modern React features, improved performance, and better SEO capabilities.

#### Acceptance Criteria

1. THE Migration_System SHALL use Next.js 15+ with App Router architecture
2. THE Migration_System SHALL use Tailwind CSS 4+ with the new `import 'tailwindcss'` syntax
3. THE Migration_System SHALL preserve the existing visual design and UI components (shadcn/ui)
4. THE Migration_System SHALL implement TypeScript strict mode for type safety
5. THE Migration_System SHALL use React 19 features (Server Components, Server Actions)
6. WHEN migrating components, THE Migration_System SHALL convert client-side components to Server Components where possible

### Requirement 2: Architecture Microservices

**User Story:** As a developer, I want a microservices architecture, so that the codebase is modular, testable, and maintainable.

#### Acceptance Criteria

1. THE Architecture SHALL organize code into distinct service modules (auth, gallery, image, payment, seo)
2. THE Architecture SHALL implement a service layer pattern with clear interfaces
3. THE Architecture SHALL use dependency injection for service instantiation
4. WHEN a service needs database access, THE Service SHALL use a dedicated repository pattern
5. THE Architecture SHALL implement proper error handling with custom error classes per service
6. THE Architecture SHALL use environment variables for all configuration

### Requirement 3: Système d'Authentification NextAuth.js

**User Story:** As a user, I want to authenticate securely with email/password or Google OAuth, so that I can access my galleries and manage my account.

#### Acceptance Criteria

1. THE Auth_Service SHALL implement NextAuth.js v5 with Supabase adapter for session storage
2. THE Auth_Service SHALL support email/password authentication with secure password hashing (bcrypt)
3. THE Auth_Service SHALL support Google OAuth provider
4. WHEN a user signs up, THE Auth_Service SHALL create a profile record in Supabase with default free plan limits
5. WHEN a user signs in, THE Auth_Service SHALL establish a secure session with JWT tokens
6. THE Auth_Service SHALL implement password reset flow via email
7. IF an authentication attempt fails, THEN THE Auth_Service SHALL return appropriate error messages without exposing sensitive information
8. THE Auth_Service SHALL implement CSRF protection for all authentication endpoints

### Requirement 4: Gestion des Galeries

**User Story:** As a photographer, I want to create, manage, and share password-protected galleries, so that I can deliver photos to my clients securely.

#### Acceptance Criteria

1. THE Gallery_Service SHALL allow authenticated users to create galleries with title, password, and expiration date
2. THE Gallery_Service SHALL generate unique slugs for public gallery URLs
3. THE Gallery_Service SHALL hash gallery passwords using bcrypt before storage
4. WHEN a gallery expires, THE Gallery_Service SHALL mark it as inactive
5. THE Gallery_Service SHALL enforce plan-based limits (max galleries, max images per gallery, max expiration days)
6. THE Gallery_Service SHALL track view counts for each gallery
7. WHEN a visitor accesses a gallery, THE Gallery_Service SHALL verify the password server-side
8. THE Gallery_Service SHALL implement rate limiting for password verification (5 attempts per 15 minutes per IP/gallery)
9. IF rate limit is exceeded, THEN THE Gallery_Service SHALL return a 429 response with retry-after header

### Requirement 5: Gestion des Images

**User Story:** As a photographer, I want to upload, manage, and serve optimized images, so that my clients can view and download photos in high quality.

#### Acceptance Criteria

1. THE Image_Service SHALL upload images to Cloudinary with proper folder organization
2. THE Image_Service SHALL validate image files (MIME type and magic numbers) before upload
3. THE Image_Service SHALL enforce plan-based size limits per image
4. THE Image_Service SHALL track storage usage per user
5. WHEN an image is uploaded, THE Image_Service SHALL generate optimized URLs (thumbnail, display, original)
6. WHEN an image is deleted, THE Image_Service SHALL remove it from both Cloudinary and database
7. THE Image_Service SHALL update user storage usage on upload and delete
8. IF storage limit is exceeded, THEN THE Image_Service SHALL reject the upload with appropriate error

### Requirement 6: Système de Paiement Stripe (Hybride)

**User Story:** As a user, I want to subscribe to premium plans, so that I can access more storage and features.

#### Acceptance Criteria

1. THE Payment_Service SHALL integrate Stripe Checkout via Next.js API route for session creation
2. THE Payment_Service SHALL handle Stripe webhooks via Supabase Edge Function (existing infrastructure)
3. WHEN a subscription is created or updated, THE Payment_Service SHALL update user profile limits accordingly
4. WHEN a subscription is cancelled, THE Payment_Service SHALL downgrade user to free plan
5. THE Payment_Service SHALL provide a customer portal link via Next.js API route
6. THE Edge_Function SHALL verify webhook signatures for security
7. THE Payment_Service SHALL support both monthly and yearly billing cycles

### Requirement 7: SEO et Performance

**User Story:** As a business owner, I want excellent SEO and performance, so that the application ranks well in search engines and provides fast user experience.

#### Acceptance Criteria

1. THE SEO_Engine SHALL generate dynamic metadata for all pages using Next.js Metadata API
2. THE SEO_Engine SHALL implement Open Graph and Twitter Card meta tags
3. THE SEO_Engine SHALL generate JSON-LD structured data (Organization, FAQ, ImageGallery schemas)
4. THE SEO_Engine SHALL generate dynamic sitemap.xml and robots.txt
5. THE Application SHALL implement proper caching strategies (ISR, static generation where applicable)
6. THE Application SHALL achieve Core Web Vitals scores in "Good" range
7. THE Application SHALL implement image optimization using Next.js Image component
8. WHEN rendering gallery pages, THE Application SHALL use noindex meta tag to protect client privacy

### Requirement 8: Pages et Navigation

**User Story:** As a user, I want to navigate through the application seamlessly, so that I can access all features easily.

#### Acceptance Criteria

1. THE Application SHALL implement the following public pages: Landing (/), Auth (/auth), Pricing (/pricing), Legal pages (/legal/[page])
2. THE Application SHALL implement the following protected pages: Dashboard (/dashboard), Settings (/settings), Gallery Create (/dashboard/gallery/new), Gallery Detail (/dashboard/gallery/[id])
3. THE Application SHALL implement public gallery view page (/g/[slug]) with password protection
4. THE Application SHALL implement error pages (401, 403, 404, 500, 503)
5. WHEN an unauthenticated user accesses a protected page, THE Application SHALL redirect to /auth
6. THE Application SHALL preserve the existing visual design and responsive behavior

### Requirement 9: API Routes et Server Actions (Architecture Hybride)

**User Story:** As a developer, I want clean API routes and server actions with a hybrid architecture, so that backend logic is secure, efficient, and leverages the best of both Next.js and Supabase.

#### Acceptance Criteria

1. THE Application SHALL implement Next.js API routes for: gallery CRUD, image upload/delete, password verification, user profile management
2. THE Application SHALL keep Supabase Edge Functions for: Stripe webhooks, scheduled cron jobs (cleanup, notifications)
3. THE Application SHALL use Server Actions for form submissions where appropriate
4. THE API_Routes SHALL validate all input data using Zod schemas
5. THE API_Routes SHALL implement proper authentication middleware
6. THE API_Routes SHALL return consistent error response format
7. IF an API request fails validation, THEN THE API_Route SHALL return 400 with validation errors
8. THE Edge_Functions SHALL handle: stripe-webhook, cleanup-expired-galleries, cleanup-rate-limits, notify-expiring-galleries

### Requirement 10: Base de Données Supabase

**User Story:** As a developer, I want to use Supabase as the database, so that I can leverage existing schema and RLS policies.

#### Acceptance Criteria

1. THE Database_Layer SHALL connect to Supabase PostgreSQL using the official client
2. THE Database_Layer SHALL implement Row Level Security (RLS) policies for data protection
3. THE Database_Layer SHALL use the existing schema (profiles, galleries, images, subscription_plans, rate_limit_attempts)
4. THE Database_Layer SHALL implement database functions for storage management (increment_storage, decrement_storage)
5. THE Database_Layer SHALL implement the generate_unique_slug function for gallery URLs

### Requirement 11: Sécurité

**User Story:** As a user, I want my data to be secure, so that my photos and personal information are protected.

#### Acceptance Criteria

1. THE Application SHALL implement HTTPS-only communication
2. THE Application SHALL implement CORS protection for API routes
3. THE Application SHALL sanitize all user inputs to prevent XSS attacks
4. THE Application SHALL use parameterized queries to prevent SQL injection
5. THE Application SHALL implement secure session management with HTTP-only cookies
6. THE Application SHALL hash all passwords using bcrypt with appropriate cost factor
7. IF a security-sensitive operation fails, THEN THE Application SHALL log the event without exposing details to the client

### Requirement 12: Internationalisation et Localisation

**User Story:** As a French-speaking user, I want the application in French, so that I can use it comfortably.

#### Acceptance Criteria

1. THE Application SHALL display all UI text in French
2. THE Application SHALL format dates using French locale (dd MMMM yyyy)
3. THE Application SHALL use French currency formatting where applicable
4. THE Application SHALL support future i18n expansion through a translation system
