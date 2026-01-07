# Implementation Plan: PikSend Next.js 15+ Migration

## Overview

Ce plan d'implémentation guide la migration de PikSend vers Next.js 15+ avec une architecture microservices hybride. Les tâches sont organisées de manière incrémentale, chaque étape construisant sur la précédente.

## Tasks

- [x] 1. Configuration du projet Next.js 15+
  - [x] 1.1 Initialiser le projet Next.js 15+ avec TypeScript strict
    - Créer le projet avec `create-next-app@latest`
    - Configurer TypeScript strict mode dans tsconfig.json
    - _Requirements: 1.1, 1.4_
  - [x] 1.2 Configurer Tailwind CSS 4+ avec nouvelle syntaxe d'import
    - Installer Tailwind CSS 4+
    - Configurer globals.css avec `import 'tailwindcss'`
    - Migrer la configuration tailwind.config.ts
    - _Requirements: 1.2_
  - [x] 1.3 Installer et configurer les dépendances principales
    - shadcn/ui, lucide-react, date-fns, zod
    - @supabase/supabase-js, bcryptjs
    - next-auth, @auth/supabase-adapter
    - stripe, cloudinary
    - _Requirements: 1.3, 2.6_
  - [x] 1.4 Configurer la structure des dossiers microservices
    - Créer lib/services/, lib/repositories/, lib/validators/, lib/errors/
    - _Requirements: 2.1_

- [x] 2. Checkpoint - Vérifier la configuration de base
  - Ensure all dependencies are installed, ask the user if questions arise.

- [x] 3. Implémentation du système d'erreurs et utilitaires
  - [x] 3.1 Créer les classes d'erreurs personnalisées
    - AppError, AuthenticationError, AuthorizationError
    - ValidationError, NotFoundError, RateLimitError
    - StorageLimitError, GalleryLimitError
    - _Requirements: 2.5_
  - [x] 3.2 Write property test for error handling

    - **Property 29: Security Error Sanitization**
    - **Validates: Requirements 11.7**
  - [x] 3.3 Créer le handler d'erreurs API
    - Fonction handleApiError pour les API routes
    - Format de réponse cohérent
    - _Requirements: 9.6_
  - [x] 3.4 Write property test for API error format

    - **Property 24: Consistent API Error Format**
    - **Validates: Requirements 9.6**

- [x] 4. Configuration Supabase et Repository Layer
  - [x] 4.1 Configurer les clients Supabase (browser et server)
    - lib/supabase/client.ts pour le navigateur
    - lib/supabase/server.ts pour le serveur
    - Copier les types générés
    - _Requirements: 10.1, 10.3_
  - [x] 4.2 Implémenter ProfileRepository
    - findById, findByEmail, create, update
    - incrementStorage, decrementStorage
    - _Requirements: 10.4_
  - [x] 4.3 Implémenter GalleryRepository
    - create, findById, findBySlug, findByUserId
    - update, delete, countByUserId
    - _Requirements: 4.1, 4.2_
  - [x] 4.4 Write property test for unique slug generation

    - **Property 26: Unique Slug Generation**
    - **Validates: Requirements 10.5**
  - [x] 4.5 Implémenter ImageRepository
    - create, findById, findByGalleryId, delete
    - _Requirements: 5.1_

- [x] 5. Checkpoint - Vérifier le Repository Layer
  - Ensure all repositories work correctly, ask the user if questions arise.

- [x] 6. Implémentation du Service d'Authentification ✅
  - [x] 6.1 Configurer NextAuth.js v5
    - config/auth.config.ts avec providers
    - Supabase adapter pour les sessions
    - _Requirements: 3.1_
  - [x] 6.2 Implémenter le provider Credentials (email/password)
    - Validation avec Zod
    - Vérification bcrypt du mot de passe
    - _Requirements: 3.2_
  - [x] 6.3 Write property test for password hashing

    - **Property 1: Password Hashing Consistency**
    - **Validates: Requirements 3.2, 4.3, 11.6**
  - [x] 6.4 Implémenter le provider Google OAuth
    - Configuration Google Cloud Console
    - Callback de création de profil
    - _Requirements: 3.3_
  - [x] 6.5 Implémenter la création de profil à l'inscription
    - Trigger sur signup pour créer le profil
    - Limites free plan par défaut
    - _Requirements: 3.4_
  - [x] 6.6 Write property test for profile creation

    - **Property 2: User Profile Creation on Signup**
    - **Validates: Requirements 3.4**
  - [x] 6.7 Implémenter le middleware d'authentification
    - Protection des routes /dashboard et /settings
    - Redirection vers /auth si non authentifié
    - _Requirements: 8.5_
  - [x] 6.8 Write property test for protected route redirect

    - **Property 21: Protected Route Redirect**
    - **Validates: Requirements 8.5**
  - [x] 6.9 Implémenter le flux de réinitialisation de mot de passe
    - Page forgot-password et reset-password
    - Envoi d'email avec token
    - _Requirements: 3.6_

- [x] 7. Checkpoint - Vérifier l'authentification ✅
  - Auth flow verified: all 23 tests pass
  - NextAuth.js v5 configured with Credentials and Google OAuth providers
  - Supabase tokens synchronized in JWT for RLS policies
  - Middleware protects /dashboard and /settings routes
  - Password reset flow implemented

- [x] 8. Implémentation du Gallery Service
  - [x] 8.1 Créer les schémas de validation Zod pour les galeries
    - createGallerySchema, updateGallerySchema
    - verifyPasswordSchema
    - _Requirements: 9.4_
  - [x] 8.2 Write property test for API input validation

    - **Property 22: API Input Validation**
    - **Validates: Requirements 9.4**
  - [x] 8.3 Implémenter GalleryService.create
    - Validation des limites de plan
    - Génération de slug unique
    - Hashage du mot de passe
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [x] 8.4 Write property test for gallery limits

    - **Property 7: Plan-Based Gallery Limits Enforcement**
    - **Validates: Requirements 4.5**
  - [x] 8.5 Implémenter GalleryService.verifyPassword
    - Vérification bcrypt côté serveur
    - Incrémentation du compteur de vues
    - _Requirements: 4.6, 4.7_
  - [x] 8.6 Write property test for view count increment

    - **Property 8: Gallery View Count Increment**
    - **Validates: Requirements 4.6**
  - [x] 8.7 Implémenter le Rate Limiter Service
    - checkRateLimit, resetRateLimit
    - 5 tentatives par 15 minutes
    - _Requirements: 4.8_
  - [x] 8.8 Write property test for rate limiting

    - **Property 10: Rate Limiting Enforcement**
    - **Validates: Requirements 4.8**
  - [x] 8.9 Implémenter les API routes pour les galeries
    - GET/POST /api/galleries
    - GET/PUT/DELETE /api/galleries/[id]
    - POST /api/verify-password
    - _Requirements: 9.1_
  - [x] 8.10 Write property test for API authentication middleware

    - **Property 23: API Authentication Middleware**
    - **Validates: Requirements 9.5**

- [x] 9. Checkpoint - Vérifier le Gallery Service
  - Ensure gallery CRUD and password verification work, ask the user if questions arise.

- [x] 10. Implémentation du Image Service
  - [x] 10.1 Configurer le client Cloudinary
    - lib/cloudinary/client.ts
    - Fonctions upload, delete, generateUrls
    - _Requirements: 5.1_
  - [x] 10.2 Implémenter la validation des fichiers image
    - Vérification MIME type
    - Vérification magic numbers
    - _Requirements: 5.2_
  - [x] 10.3 Write property test for image validation

    - **Property 11: Image File Validation**
    - **Validates: Requirements 5.2**
  - [x] 10.4 Implémenter ImageService.upload
    - Validation taille selon plan
    - Upload Cloudinary
    - Génération URLs optimisées
    - Mise à jour storage usage
    - _Requirements: 5.3, 5.4, 5.5_
  - [ ]* 10.5 Write property test for storage tracking
    - **Property 13: Storage Usage Tracking**
    - **Validates: Requirements 5.4, 5.7**
  - [ ]* 10.6 Write property test for optimized URLs
    - **Property 14: Optimized URL Generation**
    - **Validates: Requirements 5.5**
  - [x] 10.7 Implémenter ImageService.delete
    - Suppression Cloudinary
    - Suppression DB
    - Mise à jour storage usage
    - _Requirements: 5.6_
  - [ ]* 10.8 Write property test for complete deletion
    - **Property 15: Complete Image Deletion**
    - **Validates: Requirements 5.6**
  - [x] 10.9 Implémenter les API routes pour les images
    - POST /api/images/upload
    - DELETE /api/images/[id]
    - _Requirements: 9.1_

- [ ] 11. Checkpoint - Vérifier le Image Service
  - Ensure image upload and delete work, ask the user if questions arise.

- [x] 12. Implémentation du Payment Service
  - [x] 12.1 Configurer le client Stripe
    - lib/stripe/client.ts
    - _Requirements: 6.1_
  - [x] 12.2 Implémenter PaymentService.createCheckoutSession
    - Création session Stripe Checkout
    - Support monthly/yearly
    - _Requirements: 6.1, 6.7_
  - [x] 12.3 Implémenter PaymentService.createPortalSession
    - Lien vers Customer Portal
    - _Requirements: 6.5_
  - [x] 12.4 Implémenter les API routes Stripe
    - POST /api/stripe/checkout
    - POST /api/stripe/portal
    - _Requirements: 9.1_
  - [x] 12.5 Vérifier les Edge Functions Supabase existantes
    - stripe-webhook fonctionne correctement
    - Mise à jour des limites de profil
    - _Requirements: 6.2, 6.3, 6.4, 9.2_
  - [ ]* 12.6 Write property test for subscription sync
    - **Property 16: Subscription Plan Synchronization**
    - **Validates: Requirements 6.3**

- [ ] 13. Checkpoint - Vérifier le Payment Service
  - Ensure Stripe integration works, ask the user if questions arise.

- [x] 14. Implémentation du SEO Service
  - [x] 14.1 Implémenter SeoService.generateMetadata
    - Métadonnées pour chaque type de page
    - Open Graph et Twitter Cards
    - _Requirements: 7.1, 7.2_
  - [ ]* 14.2 Write property test for metadata generation
    - **Property 18: Page Metadata Generation**
    - **Validates: Requirements 7.1, 7.2**
  - [x] 14.3 Implémenter SeoService.generateStructuredData
    - FAQ, Organization, ImageGallery schemas
    - _Requirements: 7.3_
  - [ ]* 14.4 Write property test for JSON-LD validity
    - **Property 19: JSON-LD Structured Data Validity**
    - **Validates: Requirements 7.3**
  - [x] 14.5 Créer le sitemap dynamique
    - app/sitemap.ts
    - _Requirements: 7.4_
  - [x] 14.6 Créer robots.txt
    - app/robots.ts
    - _Requirements: 7.4_
  - [ ]* 14.7 Write property test for gallery noindex
    - **Property 20: Gallery Page NoIndex**
    - **Validates: Requirements 7.8**

- [ ] 15. Checkpoint - Vérifier le SEO
  - Ensure SEO metadata and structured data work, ask the user if questions arise.

- [x] 16. Implémentation des Pages Publiques
  - [x] 16.1 Créer la page Landing (/)
    - Server Component avec métadonnées SEO
    - Conserver le design existant
    - _Requirements: 8.1, 1.3_
  - [x] 16.2 Créer la page Auth (/auth)
    - Formulaires login/signup
    - Bouton Google OAuth
    - _Requirements: 8.1_
  - [x] 16.3 Créer les pages de mot de passe oublié
    - /forgot-password et /reset-password
    - _Requirements: 8.1_
  - [x] 16.4 Créer la page Pricing (/pricing)
    - Affichage des plans
    - Liens vers checkout
    - _Requirements: 8.1_
  - [x] 16.5 Créer les pages Legal (/legal/[page])
    - terms, privacy, cookies, mentions
    - _Requirements: 8.1_

- [x] 17. Implémentation des Pages Protégées
  - [x] 17.1 Créer la page Dashboard (/dashboard)
    - Liste des galeries
    - Stats utilisateur
    - _Requirements: 8.2_
  - [x] 17.2 Créer la page Settings (/settings)
    - Gestion du profil
    - Gestion de l'abonnement
    - _Requirements: 8.2_
  - [x] 17.3 Créer la page Gallery Create (/dashboard/gallery/new)
    - Formulaire de création
    - Upload d'images
    - _Requirements: 8.2_
  - [x] 17.4 Créer la page Gallery Detail (/dashboard/gallery/[id])
    - Détails et édition
    - Gestion des images
    - _Requirements: 8.2_

- [x] 18. Implémentation de la Page Gallery View
  - [x] 18.1 Créer la page Gallery View (/g/[slug])
    - Formulaire de mot de passe
    - Affichage des images
    - Lightbox et téléchargement
    - _Requirements: 8.3_
  - [x] 18.2 Implémenter le noindex pour les galeries
    - Métadonnées robots noindex
    - _Requirements: 7.8_

- [x] 19. Implémentation des Pages d'Erreur
  - [x] 19.1 Créer les pages d'erreur
    - 401, 403, 404, 500, 503
    - error.tsx et not-found.tsx
    - _Requirements: 8.4_

- [x] 20. Checkpoint - Vérifier toutes les pages
  - Ensure all pages render correctly, ask the user if questions arise.

- [x] 21. Implémentation de la Sécurité
  - [x] 21.1 Configurer CORS pour les API routes
    - Validation des origines autorisées
    - _Requirements: 11.2_
  - [ ]* 21.2 Write property test for CORS validation
    - **Property 27: CORS Header Validation**
    - **Validates: Requirements 11.2**
  - [x] 21.3 Configurer les cookies de session HTTP-only
    - NextAuth session configuration
    - _Requirements: 11.5_
  - [ ]* 21.4 Write property test for HTTP-only cookies
    - **Property 28: HTTP-Only Session Cookies**
    - **Validates: Requirements 11.5**
  - [x] 21.5 Implémenter la sanitization des entrées
    - Protection XSS
    - _Requirements: 11.3_

- [x] 22. Implémentation de la Localisation
  - [x] 22.1 Configurer le formatage des dates en français
    - Utiliser date-fns avec locale fr
    - _Requirements: 12.2_
  - [ ]* 22.2 Write property test for French locale formatting
    - **Property 30: French Locale Formatting**
    - **Validates: Requirements 12.2, 12.3**
  - [x] 22.3 Vérifier tous les textes UI en français
    - Révision de toutes les pages
    - _Requirements: 12.1_

- [ ] 23. Checkpoint Final - Tests et Validation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Migration des Edge Functions Supabase
  - [x] 24.1 Mettre à jour stripe-webhook si nécessaire
    - Vérifier la compatibilité
    - _Requirements: 9.8_
  - [x] 24.2 Vérifier les cron jobs
    - cleanup-expired-galleries
    - cleanup-rate-limits
    - notify-expiring-galleries
    - _Requirements: 9.8_

- [x] 25. Documentation et Finalisation
  - [x] 25.1 Mettre à jour le README
    - Instructions d'installation
    - Variables d'environnement
  - [x] 25.2 Créer le fichier .env.example
    - Toutes les variables requises

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Les Edge Functions Supabase existantes sont conservées pour les webhooks et crons
