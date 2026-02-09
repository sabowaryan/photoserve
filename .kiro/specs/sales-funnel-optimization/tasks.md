# Implementation Plan: Tunnel de Vente et Conversion Optimisé PikSend

## Overview

Ce plan d'implémentation détaille les tâches nécessaires pour créer un tunnel de vente et de conversion optimisé qui augmentera le taux de conversion de 2,4% à 8-10% en 90 jours. L'implémentation suit une approche incrémentale en 6 phases sur 8-10 semaines, avec des checkpoints réguliers pour validation.

**IMPORTANT**: Ce plan a été optimisé pour tirer parti de l'infrastructure existante. Environ 40% des composants nécessaires existent déjà et seront réutilisés ou améliorés plutôt que reconstruits.

**Stack Technique** : Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui, Supabase, Stripe, Cloudinary

**Langage d'Implémentation** : TypeScript (déjà utilisé dans le projet)

### Existing Infrastructure to Leverage

**✅ Already Available:**
- Complete landing page with hero, stats, benefits, pricing, CTA
- Pricing section with monthly/yearly toggle
- Guest upload form component
- Upgrade modal for plan limits
- Auth page with signin/signup tabs, Google OAuth, password strength
- Onboarding guide component with 4 steps
- Dashboard components (header, nav, gallery cards, stats cards)
- Full analytics service (`src/lib/services/analytics.service.ts`)
- Event tracking service (`src/lib/services/events.service.ts`)
- Lead capture service (`src/lib/services/lead-capture.service.ts`)
- Subscription hook (`src/hooks/use-subscription.ts`)
- Plan configuration (`src/config/plans.ts`)
- All shadcn/ui base components

**❌ To Be Built:**
- Persona quiz modal
- 4 persona-specific landing pages
- ROI calculator component
- Comparison table component
- Testimonial video component
- A/B testing infrastructure
- Enhanced conversion triggers
- Persona detection/routing

## Tasks

- [x] 1. Phase 1 : Fondations et Composants Core (Semaines 1-2)
  - Extend existing analytics and build new conversion components

- [x] 1.1 Extend existing Analytics et Tracking
  - Extend existing analytics service (`src/lib/services/analytics.service.ts`) with funnel events
  - Add new event types to event tracking service (`src/lib/services/events.service.ts`)
  - Define persona, quiz, and conversion event types
  - Leverage existing visitor fingerprinting (`src/hooks/use-visitor-fingerprint.ts`)
  - _Requirements: 16.1, 16.2, 16.3_

- [ ]* 1.2 Write property test for analytics tracking
  - **Property 20: Funnel Event Tracking Completeness**
  - **Validates: Requirements 16.1, 16.2, 16.3, 16.4**

- [x] 1.3 Créer types et interfaces Persona
  - Définir types TypeScript pour Persona, QuizAnswers, PersonaData
  - Créer service de storage (localStorage + cookies)
  - Implémenter logique de mapping persona
  - _Requirements: 1.3, 1.4_

- [x] 1.4 Développer PersonaQuiz Component
  - Créer composant modal avec 3 questions
  - Implémenter logique de trigger (3s ou scroll 20%)
  - Implémenter validation et soumission
  - Intégrer avec service de storage
  - Implémenter redirection vers landing page
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 1.5 Write property tests for PersonaQuiz
  - **Property 1: Quiz Modal Trigger Timing**
  - **Property 2: Quiz Structure Consistency**
  - **Property 3: Persona Routing Correctness**
  - **Property 4: Persona Storage and Persistence**
  - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

- [x] 1.6 Développer ROICalculator Component
  - Créer interface avec 3 inputs numériques
  - Implémenter calculs ROI (revenus, commission, payback, ROI%)
  - Implémenter calculs de comparaison vs concurrent
  - Ajouter validation des inputs
  - Rendre réactif (recalcul en temps réel)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ]* 1.7 Write property tests for ROICalculator
  - **Property 6: ROI Calculator Input Validation**
  - **Property 7: ROI Calculator Reactive Computation**
  - **Property 8: ROI Calculator Persona Defaults**
  - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6**

- [x] 1.8 Développer ComparisonTable Component
  - Créer tableau comparatif responsive
  - Ajouter données PikSend + 3 concurrents
  - Implémenter 6+ critères de comparaison
  - Ajouter highlights pour PikSend
  - Optimiser pour mobile (scroll horizontal ou empilé)
  - _Requirements: 4.1, 4.2_

- [ ]* 1.9 Write property test for ComparisonTable
  - **Property 9: Comparison Table Structure**
  - **Validates: Requirements 4.1, 4.2**

- [x] 1.10 Checkpoint Phase 1
  - Vérifier que tous les tests passent
  - Valider les composants en staging
  - Demander feedback utilisateur si nécessaire


- [x] 2. Phase 2 : Landing Pages Personnalisées (Semaines 3-4)
  - Créer 4 landing pages persona avec contenu personnalisé

- [x] 2.1 Créer structure et routing des landing pages
  - Créer routes Next.js pour 4 personas
  - Setup layout commun pour landing pages
  - Implémenter détection de persona (URL ou storage)
  - _Requirements: 2.1_

- [x] 2.2 Développer HeroSection Component personnalisé
  - Créer composant hero avec props persona
  - Implémenter headlines/subheadlines par persona
  - Ajouter badges différenciateurs
  - Intégrer trust indicators
  - _Requirements: 2.2, 10.1, 10.2_

- [x] 2.3 Créer contenu pour Landing Page Mariage
  - Rédiger headline/subheadline spécifique
  - Configurer ROI calculator avec defaults mariage
  - Sélectionner testimonial vidéo photographe mariage
  - Créer FAQ spécifique mariage (5+ questions)
  - Optimiser SEO (meta tags, structured data)
  - _Requirements: 2.2, 2.3, 2.4, 2.7, 2.8_

- [x] 2.4 Créer contenu pour Landing Page Événementiel
  - Rédiger headline/subheadline spécifique
  - Configurer ROI calculator avec defaults événementiel
  - Sélectionner testimonial vidéo photographe événementiel
  - Créer FAQ spécifique événementiel (5+ questions)
  - Optimiser SEO
  - _Requirements: 2.2, 2.3, 2.4, 2.7, 2.8_

- [x] 2.5 Créer contenu pour Landing Page Portrait
  - Rédiger headline/subheadline spécifique
  - Configurer ROI calculator avec defaults portrait
  - Sélectionner testimonial vidéo photographe portrait
  - Créer FAQ spécifique portrait (5+ questions)
  - Optimiser SEO
  - _Requirements: 2.2, 2.3, 2.4, 2.7, 2.8_

- [x] 2.6 Créer contenu pour Landing Page Studios
  - Rédiger headline/subheadline spécifique
  - Configurer formulaire contact (pas ROI calculator)
  - Sélectionner testimonial vidéo studio
  - Créer FAQ spécifique studios (5+ questions)
  - Optimiser SEO
  - _Requirements: 2.2, 2.3, 2.4, 2.7, 2.8_

- [ ]* 2.7 Write property test for landing page completeness
  - **Property 5: Landing Page Component Completeness**
  - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

- [x] 2.8 Développer TestimonialVideo Component
  - Créer composant vidéo avec thumbnail
  - Ajouter métadonnées auteur (nom, rôle, photo, location)
  - Ajouter métriques (revenus, temps gagné, ROI)
  - Implémenter variants (card, inline, featured)
  - Optimiser chargement vidéo (lazy loading)
  - _Requirements: 4.3_

- [x] 2.9 Intégrer composants sur toutes les landing pages
  - Ajouter PersonaQuiz (si pas de persona stocké)
  - Ajouter ROICalculator
  - Ajouter ComparisonTable
  - Ajouter TestimonialVideo
  - Ajouter section pricing avec plan recommandé
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 2.10 Tests responsive et performance
  - Tester sur mobile (375px), tablet (768px), desktop (1280px)
  - Optimiser images (WebP, lazy loading)
  - Implémenter code splitting
  - Vérifier Core Web Vitals
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 20.1, 20.2, 20.3_

- [ ]* 2.11 Write property tests for responsive design
  - **Property 23: Responsive Design Adaptation**
  - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6**

- [x] 2.12 Checkpoint Phase 2
  - Vérifier que tous les tests passent
  - Valider les 4 landing pages en staging
  - Tester le flow complet : Homepage → Quiz → Landing Page
  - Demander feedback utilisateur si nécessaire


- [x] 3. Phase 3 : Conversion Flow Optimisé (Semaines 5-6)
  - Enhance existing components and add conversion optimizations

- [x] 3.1 Enhance existing Guest Upload component
  - Locate existing guest upload component (`src/components/guest/`)
  - Verify limite 3-5 photos sans auth is enforced
  - Optimize génération galerie to be <30s
  - Add banner "Créé avec PikSend" avec CTA
  - Show locked features (ZIP, branding) with upgrade prompts
  - Integrate with existing analytics service for tracking
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.2 Write property tests for guest upload
  - **Property 10: Guest Upload Limits**
  - **Property 11: Guest Gallery Generation**
  - **Property 12: Guest Gallery UI Elements**
  - **Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6**

- [x] 3.3 Enhance existing Auth page for progressive signup
  - Locate existing auth page (`src/app/(auth)/auth/page.tsx`)
  - Refactor signup tab to be progressive (email → password → profile)
  - Leverage existing Google OAuth integration
  - Leverage existing password strength indicator
  - Add step progression UI (1/3, 2/3, 3/3)
  - Allow skip of profile step (step 3)
  - Keep "Pas de CB requise" messaging
  - Ensure "Continuer avec Google" remains prominent
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 3.4 Write property tests for progressive signup
  - **Property 13: Soft Signup Flow Structure**
  - **Property 14: Email Validation and Uniqueness**
  - **Property 15: Signup Step Progression**
  - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 3.5 Integrate progressive signup triggers in funnel
  - Trigger after guest upload (2 min de visualisation)
  - Trigger sur feature lockée
  - Trigger sur limite atteinte
  - Use existing analytics service to track events (started, step_completed, completed)
  - _Requirements: 5.6, 6.8_

- [x] 3.6 Enhance existing OnboardingGuide component
  - Locate existing component (`src/components/dashboard/onboarding-guide.tsx`)
  - Verify it has 4 tasks (create gallery, customize profile, add logo, invite client)
  - Add progress bar calculation (0-100%)
  - Add celebration animations (confetti) on completion
  - Add dismiss functionality with option to re-show
  - Implement database persistence for completion state
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ]* 3.7 Write property tests for onboarding
  - **Property 16: Onboarding Checklist Structure**
  - **Property 17: Onboarding Task Completion Updates**
  - **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**

- [x] 3.8 Créer database schema pour onboarding
  - Créer table onboarding_states (if not exists)
  - Ajouter indexes appropriés
  - Créer API routes pour CRUD
  - _Requirements: 7.7_

- [x] 3.9 Verify OnboardingGuide integration in Dashboard
  - Verify existing dashboard integration (`src/app/(dashboard)/dashboard/page.tsx`)
  - Ensure checklist displays for new users
  - Add contextual tooltips if missing
  - Implement celebration for first gallery creation
  - Use existing analytics service to track task completion
  - _Requirements: 7.1, 7.3, 7.4, 7.7, 13.1, 13.2, 13.3_

- [x] 3.10 Setup Email Triggers automatiques
  - Configurer Resend if not config
  - Créer templates email (bienvenue, activation, upgrade)
  - Implémenter triggers temporels (J+1, J+3, J+7, J+14)
  - Implémenter triggers événementiels (signup, première galerie, upgrade)
  - Ajouter unsubscribe pour emails marketing
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8_

- [ ]* 3.11 Write property test for email triggers
  - **Property 21: Email Trigger Timing**
  - **Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7**

- [x] 3.12 Checkpoint Phase 3
  - Vérifier que tous les tests passent
  - Tester flow complet : Guest Upload → Signup → Onboarding → Première Galerie
  - Vérifier réception des emails
  - Valider en staging
  - Demander feedback utilisateur si nécessaire


- [x] 4. Phase 4 : Pages Secondaires et Comparaison (Semaines 7-8)
  - Créer pages de comparaison, success stories, testimonials, demo

- [x] 4.1 Créer pages de comparaison vs concurrents
  - Créer route /vs/pixieset avec tableau comparatif détaillé
  - Créer route /vs/pic-time avec tableau comparatif détaillé
  - Créer route /vs/shootproof avec tableau comparatif détaillé
  - Créer route /alternatives avec comparateur général
  - Ajouter calculateur d'économie sur chaque page
  - Ajouter testimonial "j'ai switché de X"
  - Optimiser SEO pour chaque page
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 4.2 Créer page Success Stories
  - Créer route /success-stories
  - Ajouter 10+ success stories détaillées
  - Implémenter filtres par persona
  - Afficher métriques (revenus, temps gagné, ROI)
  - Optimiser SEO avec schema markup reviews
  - _Requirements: 14.1, 14.2, 14.3, 14.8_

- [x] 4.3 Créer page Testimonials
  - Créer route /testimonials
  - Ajouter 50+ témoignages courts
  - Implémenter filtres par persona et plan
  - Afficher ratings 5 étoiles
  - Intégrer reviews Trustpilot/G2 si disponibles
  - Optimiser SEO avec schema markup
  - _Requirements: 14.4, 14.5, 14.6, 14.7, 14.8_

- [x] 4.4 Créer page Demo Interactive
  - Créer route /demo
  - Implémenter démo interactive du produit
  - Utiliser données exemple réalistes
  - Ajouter walkthrough guidé avec tooltips
  - Permettre simulation création galerie
  - Ajouter CTA "Essayer avec vos photos"
  - Tracker conversion Demo → Signup
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [x] 4.5 Enhance existing Homepage
  - Locate existing landing page (`src/components/landing/landing-page-client.tsx`)
  - Update hero headline according to design
  - Add badges under hero (Plugin Lightroom, Commission 10%, Support 2h)
  - Update primary CTA to point to Guest Upload
  - Add "Pourquoi PikSend vs Concurrents" section
  - Enhance testimonials section (ensure 3+ testimonials)
  - Highlight plugin Lightroom in 2+ sections
  - Add urgency badge "Prix fondateur" if applicable
  - Ensure trust indicators are visible
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 4.6 Enhance existing Pricing Page
  - Locate existing pricing section (`src/components/pricing/pricing-section.tsx`)
  - Add ROI Calculator above plans
  - Add "Recommandé pour vous" badge based on persona
  - Reframe features as emotional benefits
  - Add testimonial under each paid plan
  - Add "14 jours satisfait ou remboursé" guarantee
  - Add competitor comparison section
  - Expand FAQ to 10+ questions
  - Add "Prix fondateur" badge if applicable
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 4.7 Enhance existing Auth Page
  - Locate existing auth page (`src/app/(auth)/auth/page.tsx`)
  - Add sidebar with value proposition
  - Add trust indicators in sidebar
  - Ensure progressive signup is integrated (from task 3.3)
  - Display "Pas de CB requise" prominently
  - Ensure "Continuer avec Google" is first option
  - Add progress indicator (3 steps)
  - Optimize for mobile responsiveness
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 4.8 Enhance existing Dashboard
  - Locate existing dashboard (`src/app/(dashboard)/dashboard/page.tsx`)
  - Verify OnboardingGuide integration (from task 3.9)
  - Add "X/2 galeries utilisées" indicator for Free users
  - Add non-intrusive upgrade trigger visuals
  - Add accessible support widget
  - Use existing subscription hook (`src/hooks/use-subscription.ts`) for plan limits
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7_

- [x] 4.9 Tests accessibilité WCAG 2.1 AA
  - Vérifier navigation clavier complète
  - Ajouter labels ARIA appropriés
  - Vérifier ratio de contraste 4.5:1 minimum
  - Ajouter alternatives textuelles images/vidéos
  - Permettre zoom 200% sans perte de fonctionnalité
  - Tester avec screen readers (NVDA, JAWS, VoiceOver)
  - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7_

- [ ]* 4.10 Write property test for accessibility
  - **Property 24: Accessibility Standards Compliance**
  - **Validates: Requirements 22.1, 22.2, 22.3, 22.4, 22.5**

- [x] 4.11 Checkpoint Phase 4
  - Vérifier que tous les tests passent
  - Valider toutes les pages en staging
  - Tester accessibilité avec outils automatisés
  - Demander feedback utilisateur si nécessaire


- [x] 5. Phase 5 : Monetization et Upgrade Triggers (Semaines 7-8)
  - Enhance existing upgrade modal and implement smart triggers

- [x] 5.1 Enhance existing UpgradeModal component
  - Locate existing upgrade modal (`src/components/shared/upgrade-modal.tsx`)
  - Add variant support for different trigger types
  - Display upgrade reason clearly
  - Show recommended plan vs current plan comparison
  - Integrate ROI Calculator component
  - Add relevant testimonial
  - List benefits to be unlocked
  - Add "Essayer 14 jours gratuits" CTA
  - Ensure dismiss functionality works
  - _Requirements: 8.6, 8.7_

- [ ]* 5.2 Write property tests for upgrade modal
  - **Property 18: Upgrade Trigger Condition Matching**
  - **Property 19: Upgrade Modal Content Completeness**
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7**

- [x] 5.3 Implémenter Smart Upgrade Triggers
  - Créer service de détection de triggers
  - Implement trigger "limite atteinte" using existing subscription hook
  - Implement trigger "feature lockée" (clic sur ZIP, branding)
  - Implement trigger "temps écoulé" (J+7, J+14, J+21)
  - Implement trigger "comportement" (5+ galeries, power user)
  - Add cooldown between triggers (avoid spam)
  - Use existing analytics service to track trigger effectiveness
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.8_

- [x] 5.4 Créer database schema pour upgrade triggers
  - Créer table upgrade_trigger_logs
  - Ajouter indexes appropriés
  - Créer API routes pour tracking
  - _Requirements: 8.8_

- [x] 5.5 Verify and optimize Stripe Checkout integration
  - Verify existing Stripe integration in payment service
  - Optimize checkout flow (minimize steps)
  - Ensure 14-day trial is configured for Premium/Pro
  - Implement immediate confirmation feedback
  - Verify email confirmation is sent
  - Test webhook handlers for subscription events
  - _Requirements: 24.1_

- [x] 5.6 Implémenter mesures de sécurité
  - Vérifier HTTPS/TLS 1.3
  - Vérifier hashing passwords (bcrypt/Argon2)
  - Implémenter protection CSRF sur formulaires
  - Vérifier conformité RGPD (consentement cookies)
  - Implémenter export données utilisateur
  - Implémenter suppression compte et données
  - Afficher politique de confidentialité
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8_

- [ ]* 5.7 Write property test for security measures
  - **Property 25: Security Measures Implementation**
  - **Validates: Requirements 23.1, 23.2, 23.3**

- [x] 5.8 Checkpoint Phase 5
  - Vérifier que tous les tests passent
  - Tester flow complet upgrade : Trigger → Modal → Stripe → Confirmation
  - Vérifier sécurité avec audit
  - Valider en staging
  - Demander feedback utilisateur si nécessaire

- [x] 6. Phase 6 : A/B Testing et Optimisation (Semaines 9-10)
  - Setup A/B testing and continuous optimization

- [x] 6.1 Setup infrastructure A/B Testing
  - Intégrer Vercel Analytics ou Optimizely
  - Créer service d'assignment de variantes
  - Implémenter persistence d'assignment (cookies)
  - Créer dashboard de résultats
  - _Requirements: 17.1, 17.2, 17.3_

- [x] 6.2 Configurer A/B Tests prioritaires
  - Test 1: Hero headline (2 variantes)
  - Test 2: CTA primaire (3 variantes)
  - Test 3: Pricing display (avec/sans ROI calculator)
  - Test 4: Social proof placement (hero vs bas de page)
  - Test 5: Signup flow (progressif vs formulaire complet)
  - Test 6: Urgence messaging (3 variantes)
  - _Requirements: 17.4, 17.5, 17.6, 17.7_

- [x] 6.3 Créer Analytics Dashboard
  - Créer page /admin/analytics
  - Use existing analytics service to fetch metrics
  - Display real-time metrics
  - Display global conversion rate (target 8-10%)
  - Display conversion rate by persona
  - Display trigger effectiveness
  - Display onboarding completion rate
  - Create automated weekly reports
  - Allow segmentation by source, persona, plan
  - _Requirements: 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 16.8, 16.9_

- [x] 6.4 Optimiser Performance globale
  - Vérifier page load <2s sur 4G
  - Optimiser toutes images (WebP/AVIF, lazy loading)
  - Implémenter code splitting agressif
  - Configurer CDN Cloudinary pour assets
  - Implémenter prefetching pages critiques
  - Atteindre Lighthouse 90+ sur tous critères
  - Monitorer Core Web Vitals (LCP, FID, CLS)
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ]* 6.5 Write property test for performance optimizations
  - **Property 22: Performance Optimizations Presence**
  - **Validates: Requirements 19.3, 19.4, 19.5, 19.7**

- [x] 6.6 Documenter intégrations tierces
  - Documenter intégration Stripe
  - Documenter intégration Google Analytics 4
  - Documenter intégration Mixpanel
  - Documenter intégration email (Resend/SendGrid)
  - Documenter intégration Cloudinary
  - Documenter intégration support (Intercom/Crisp)
  - Documenter intégration Trustpilot/G2
  - Créer guide de configuration avec clés API
  - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.6, 24.7, 24.8_

- [x] 6.7 Checkpoint Final
  - Vérifier que TOUS les tests passent (unit + property)
  - Vérifier que les 25 correctness properties sont validées
  - Valider métriques de succès en staging
  - Préparer plan de déploiement production
  - Préparer plan de monitoring et alertes
  - Préparer plan de rollback si nécessaire

- [ ] 7. Déploiement Production et Monitoring
  - Déploiement progressif et monitoring

- [ ] 7.1 Déploiement progressif
  - Déployer en production avec 10% traffic
  - Monitorer métriques pendant 48h
  - Augmenter à 50% traffic si stable
  - Monitorer métriques pendant 48h
  - Augmenter à 100% traffic si stable
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6, 25.7, 25.8, 25.9, 25.10_

- [ ] 7.2 Setup monitoring et alertes
  - Configurer alertes conversion rate <8%
  - Configurer alertes error rate >1%
  - Configurer alertes page load >3s
  - Configurer alertes email delivery failures
  - Configurer alertes payment failures
  - Créer dashboard de monitoring temps réel
  - _Requirements: 16.8, 16.9_

- [ ] 7.3 Exécuter A/B Tests
  - Lancer Test 1 (hero headline) - 2 semaines
  - Analyser résultats et déployer variante gagnante
  - Lancer Test 2 (CTA primaire) - 2 semaines
  - Analyser résultats et déployer variante gagnante
  - Lancer Test 3 (pricing display) - 3 semaines
  - Analyser résultats et déployer variante gagnante
  - Documenter tous les résultats
  - _Requirements: 17.6, 17.7_

- [ ] 7.4 Optimisation continue
  - Analyser métriques hebdomadaires
  - Identifier points de friction dans le funnel
  - Implémenter améliorations basées sur données
  - Itérer sur copywriting et messaging
  - Tester nouvelles variantes de composants
  - Maintenir documentation à jour

## Notes

- Les tâches marquées avec `*` sont des tests property-based et peuvent être skippées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour traçabilité
- Les checkpoints assurent validation incrémentale
- Les property tests valident les propriétés de correction universelles
- Les unit tests valident les exemples spécifiques et cas limites
- L'implémentation suit le stack existant : Next.js 15, React 19, TypeScript, Tailwind CSS
- **IMPORTANT**: Ce plan réutilise ~40% de l'infrastructure existante, réduisant significativement le temps de développement
- Les composants existants sont améliorés plutôt que reconstruits (auth, onboarding, upgrade modal, analytics)
- Le déploiement est progressif (10% → 50% → 100%) pour minimiser les risques
- Le monitoring continu permet d'identifier et corriger rapidement les problèmes
- Les A/B tests permettent d'optimiser continuellement les conversions
- Objectif final : conversion rate 8-10%, 144 nouveaux clients payants/mois, MRR 2558$/mois à 90 jours
- Timeline réduite : 8-10 semaines au lieu de 12 grâce à l'infrastructure existante
