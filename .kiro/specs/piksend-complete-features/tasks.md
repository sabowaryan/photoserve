# Implementation Plan: PikSend Complete Features

## Overview

Ce plan d'implémentation couvre les 10 piliers de fonctionnalités de PikSend. Les tâches sont organisées pour construire progressivement sur les composants existants, en commençant par les fondations (types, services) puis les fonctionnalités utilisateur.

## Tasks

- [x] 1. Fondations: Types et Configuration des Plans
  - [x] 1.1 Étendre les types TypeScript avec les nouvelles interfaces
    - Ajouter `ImageWithMeta`, `Comment`, `GalleryStats`, `PlanFeatures` dans `src/types/index.ts`
    - Ajouter les types pour les settings de galerie et branding
    - _Requirements: Tous les piliers_
  - [x] 1.2 Créer le système de vérification des fonctionnalités par plan
    - Créer `src/config/plan-features.ts` avec la matrice des fonctionnalités
    - Implémenter `hasFeatureAccess(plan, feature)` et `getRequiredPlan(feature)`
    - _Requirements: 1.4.6, 3.1.5, 3.2.5, 4.2.5, 4.4.6, 5.1.5, etc._
  - [x] 1.3 Écrire les tests de propriété pour l'accès aux fonctionnalités par plan

    - **Property 1: Plan-Based Feature Access**
    - **Validates: Requirements 1.4.6, 3.1.5, 3.2.5, etc.**

- [-] 2. Migration Base de Données
  - [x] 2.1 Créer la migration pour les nouvelles tables
    - Créer `supabase/migrations/YYYYMMDD_piksend_features.sql`
    - Tables: favorites, comments, gallery_analytics, lead_captures, testimonials
    - Extensions: galleries.settings, profiles.branding, admin_settings
    - _Requirements: 3.1, 3.2, 3.3, 7.2, 8.3_
  - [ ] 2.2 Ajouter les politiques RLS pour les nouvelles tables
    - Politiques pour favorites, comments, analytics, leads, testimonials
    - _Requirements: Sécurité des données_

- [ ] 3. Checkpoint - Vérifier la migration
  - Exécuter `npx supabase db push` et vérifier que les tables sont créées
  - Demander à l'utilisateur si des questions surviennent

- [x] 4. Services Backend: Engagement & Feedback
  - [x] 4.1 Créer le service Favorites
    - Créer `src/lib/services/favorites.service.ts`
    - Implémenter `toggleFavorite`, `getFavorites`, `exportFavorites`
    - _Requirements: 3.1.1, 3.1.2, 3.1.3, 3.1.4_
  - [x]* 4.2 Écrire les tests de propriété pour Favorites
    - **Property 13: Favorites Toggle Idempotence**
    - **Validates: Requirements 3.1.2**
  - [x] 4.3 Créer le service Comments
    - Créer `src/lib/services/comments.service.ts`
    - Implémenter `addComment`, `getComments`, `deleteComment`
    - _Requirements: 3.2.1, 3.2.2, 3.2.3_
  - [x] 4.4 Créer le service Analytics
    - Créer `src/lib/services/analytics.service.ts`
    - Implémenter `trackView`, `getGalleryStats`, `trackCTAClick`
    - _Requirements: 3.3.1, 3.3.2, 3.3.3, 3.3.4_

- [x] 5. Services Backend: Monétisation
  - [x] 5.1 Étendre le service Payment pour le Paywall
    - Modifier `src/lib/services/payment.service.ts`
    - Ajouter vérification `isStripeEnabled()` depuis admin_settings
    - _Requirements: 4.4.1, 4.4.5_
  - [x] 5.2 Créer le service ZIP Download
    - Créer `src/lib/services/zip.service.ts`
    - Implémenter génération ZIP avec streaming
    - _Requirements: 4.2.1, 4.2.2, 4.2.3_
  - [x] 5.3 Écrire les tests de propriété pour ZIP integrity

    - **Property 15: ZIP Download Integrity**
    - **Validates: Requirements 4.2.3**

- [x] 6. Services Backend: Anti-Ghosting
  - [x] 6.1 Créer le service Lead Capture
    - Créer `src/lib/services/lead-capture.service.ts`
    - Implémenter `captureEmail`, `getLeads`, validation GDPR
    - _Requirements: 7.2.1, 7.2.2, 7.2.3, 7.2.4_
  - [x] 6.2 Créer le service QR Code
    - Créer `src/lib/services/qrcode.service.ts`
    - Implémenter génération QR avec logo optionnel
    - _Requirements: 7.3.1, 7.3.2, 7.3.3, 7.3.4_
  - [x]* 6.3 Écrire les tests de propriété pour QR Code round-trip
    - **Property 19: QR Code Round-Trip**
    - **Validates: Requirements 7.3.1, 7.3.2**

- [ ] 7. Checkpoint - Vérifier les services backend
  - Exécuter les tests unitaires des services
  - Demander à l'utilisateur si des questions surviennent

- [x] 8. APIs: Engagement & Feedback
  - [x] 8.1 Créer l'API Favorites
    - Créer `src/app/api/galleries/[id]/favorites/route.ts`
    - Endpoints: GET (liste), POST (toggle)
    - _Requirements: 3.1.1, 3.1.2_
  - [x] 8.2 Créer l'API Comments
    - Créer `src/app/api/images/[id]/comments/route.ts`
    - Endpoints: GET (liste), POST (ajouter), DELETE (supprimer)
    - _Requirements: 3.2.1, 3.2.2_
  - [x] 8.3 Créer l'API Analytics
    - Créer `src/app/api/galleries/[id]/analytics/route.ts`
    - Endpoints: POST (track view), GET (stats)
    - _Requirements: 3.3.1, 3.3.4_

- [x] 9. APIs: Monétisation & Anti-Ghosting
  - [x] 9.1 Créer l'API ZIP Download
    - Créer `src/app/api/galleries/[id]/download/route.ts`
    - Vérification plan Premium/Pro avant génération
    - _Requirements: 4.2.1, 4.2.5_
  - [x] 9.2 Créer l'API Lead Capture
    - Créer `src/app/api/galleries/[id]/leads/route.ts`
    - Endpoints: POST (capture email), GET (liste pour photographe)
    - _Requirements: 7.2.1, 7.2.2, 7.2.3_
  - [x] 9.3 Créer l'API QR Code
    - Créer `src/app/api/galleries/[id]/qrcode/route.ts`
    - Endpoint: GET (génère et retourne PNG/SVG)
    - _Requirements: 7.3.1, 7.3.3_

- [x] 10. Composants Frontend: Galerie Améliorée
  - [x] 10.1 Améliorer MasonryGrid avec favoris
    - Modifier `src/components/gallery-view/masonry-grid.tsx`
    - Ajouter bouton cœur sur chaque image
    - Afficher état favori
    - _Requirements: 3.1.1, 3.1.2_
  - [x] 10.2 Améliorer Lightbox avec commentaires
    - Modifier `src/components/gallery-view/lightbox.tsx`
    - Ajouter champ de commentaire
    - Afficher liste des commentaires
    - _Requirements: 3.2.1, 3.2.2_
  - [x] 10.3 Créer le composant Slideshow
    - Créer `src/components/gallery-view/slideshow.tsx`
    - Auto-advance avec intervalle configurable
    - Contrôles play/pause
    - _Requirements: 1.4.1, 1.4.2, 1.4.3, 1.4.4, 1.4.5_
  - [x] 10.4 Écrire les tests pour la navigation Lightbox

    - **Property 4: Lightbox Keyboard Navigation**
    - **Validates: Requirements 1.2.2**

- [x] 11. Composants Frontend: Anti-Ghosting
  - [x] 11.1 Créer le composant DeadlineTimer
    - Créer `src/components/gallery-view/deadline-timer.tsx`
    - Afficher countdown jours/heures/minutes
    - _Requirements: 7.1.1, 7.1.2_
  - [ ]* 11.2 Écrire les tests pour le calcul du countdown
    - **Property 20: Deadline Timer Calculation**
    - **Validates: Requirements 7.1.2**
  - [x] 11.3 Créer le composant LeadMagnetModal
    - Créer `src/components/gallery-view/lead-magnet-modal.tsx`
    - Formulaire email avec validation
    - Checkbox GDPR
    - _Requirements: 7.2.1, 7.2.4_
  - [x] 11.4 Créer le composant QRCodeGenerator
    - Créer `src/components/dashboard/qrcode-generator.tsx`
    - Affichage QR avec boutons download PNG/SVG
    - _Requirements: 7.3.1, 7.3.3_

- [ ] 12. Checkpoint - Vérifier les composants frontend
  - Tester visuellement les nouveaux composants
  - Demander à l'utilisateur si des questions surviennent

- [x] 13. Composants Frontend: Branding
  - [x] 13.1 Créer le composant ColorPicker
    - Créer `src/components/settings/color-picker.tsx`
    - Support hex et presets
    - _Requirements: 5.3.4_
  - [x] 13.2 Créer la section BrandingSettings
    - Créer `src/components/settings/branding-section.tsx`
    - Upload logo, couleurs, domaine personnalisé
    - _Requirements: 5.1.1, 5.2.1, 5.3.1_
  - [x] 13.3 Appliquer les couleurs de marque dans la galerie
    - Modifier `src/app/g/[slug]/page.tsx`
    - Injecter CSS variables depuis gallery.settings
    - _Requirements: 5.3.3_

- [x] 14. Composants Frontend: Preuve Sociale
  - [x] 14.1 Créer le composant VideoCover
    - Créer `src/components/gallery-view/video-cover.tsx`
    - Lecture auto, muted, loop
    - _Requirements: 8.1.2, 8.1.3_
  - [x] 14.2 Créer le composant AudioPlayer
    - Créer `src/components/gallery-view/audio-player.tsx`
    - Contrôles volume, mute, avec consent
    - _Requirements: 8.2.2, 8.2.3_
  - [x] 14.3 Créer le composant TestimonialCollector
    - Créer `src/components/gallery-view/testimonial-modal.tsx`
    - Rating 1-5 étoiles + commentaire
    - _Requirements: 8.3.1, 8.3.2_

- [x] 15. Intégration Page Galerie Publique
  - [x] 15.1 Intégrer tous les composants dans la page galerie
    - Modifier `src/app/g/[slug]/page.tsx`
    - Ajouter DeadlineTimer, LeadMagnetModal, Slideshow button
    - Intégrer VideoCover, AudioPlayer si configurés
    - _Requirements: 1.4, 7.1, 7.2, 8.1, 8.2_
  - [x] 15.2 Implémenter le gating par plan
    - Vérifier plan avant d'afficher fonctionnalités premium
    - Afficher UpgradeModal si fonctionnalité non disponible
    - _Requirements: Tous les WHERE plan is..._
  - [ ]* 15.3 Écrire les tests pour le gating HD
    - **Property 16: HD Quality Gating**
    - **Validates: Requirements 4.3.2, 4.3.3**

- [x] 16. Dashboard Photographe: Settings Galerie
  - [x] 16.1 Étendre SettingsTab avec nouvelles options
    - Modifier `src/components/gallery-detail/settings-tab.tsx`
    - Ajouter toggles: favoris, commentaires, deadline, lead magnet
    - Ajouter CTA button config
    - _Requirements: 3.1.5, 3.2.5, 7.1.5, 7.2.5, 3.4.1, 3.4.2_
  - [x] 16.2 Ajouter section média (video cover, audio)
    - Upload video cover et audio
    - Preview et suppression
    - _Requirements: 8.1.1, 8.2.1_
  - [x] 16.3 Ajouter section SEO
    - Toggle noindex
    - _Requirements: 6.3.1, 6.3.2_
  - [ ]* 16.4 Écrire les tests pour la génération meta SEO
    - **Property 17: SEO Meta Tag Generation**
    - **Validates: Requirements 6.3.2, 6.3.3**

- [x] 17. Dashboard Photographe: Analytics
  - [x] 17.1 Créer la page Analytics
    - Créer `src/app/(dashboard)/dashboard/gallery/[id]/analytics/page.tsx`
    - Afficher stats: vues, visiteurs, pays, timeline
    - _Requirements: 3.3.4_
  - [x] 17.2 Créer les composants de visualisation
    - Graphiques avec recharts ou chart.js
    - Carte des pays
    - _Requirements: 3.3.3_

- [x] 18. Checkpoint - Vérifier le dashboard
  - Tester le flow complet de configuration galerie
  - Demander à l'utilisateur si des questions surviennent

- [x] 19. Admin Panel: Contrôles
  - [x] 19.1 Créer la page Admin Settings
    - Créer `src/app/(admin)/admin/settings/page.tsx`
    - Toggle Stripe enabled/disabled
    - Toggle AI features enabled/disabled
    - _Requirements: A.1.1, A.1.2_
  - [x] 19.2 Implémenter l'API Admin Settings
    - Créer `src/app/api/admin/settings/route.ts`
    - GET/PUT pour admin_settings
    - _Requirements: A.1.4, A.1.5_
  - [ ]* 19.3 Écrire les tests pour le toggle Stripe
    - **Property 21: Stripe Toggle Effect**
    - **Validates: Requirements A.1.2, A.1.5**

- [x] 20. Thème Sombre/Clair
  - [x] 20.1 Implémenter la détection système
    - Créer `src/hooks/use-theme.ts`
    - Détecter prefers-color-scheme
    - _Requirements: 1.3.1, 1.3.2_
  - [x] 20.2 Ajouter le switch de thème
    - Modifier `src/components/gallery-view/gallery-header.tsx`
    - Ajouter bouton toggle
    - _Requirements: 1.3.3, 1.3.5_
  - [ ]* 20.3 Écrire les tests pour la persistance du thème
    - **Property 6: Theme Persistence Round-Trip**
    - **Validates: Requirements 1.3.4**

- [x] 21. PWA Support
  - [x] 21.1 Configurer le manifest PWA
    - Vérifier/améliorer `public/manifest.json`
    - Ajouter icons pour toutes les tailles
    - _Requirements: 9.2.1_
  - [x] 21.2 Implémenter le Service Worker
    - Créer `public/sw.js` ou utiliser next-pwa
    - Cache des galeries pour offline
    - _Requirements: 9.2.2_
  - [x] 21.3 Ajouter les notifications push
    - Intégrer web-push
    - Notifications pour nouveaux commentaires, favoris
    - _Requirements: 9.2.3_

- [ ] 22. Checkpoint - Tests d'intégration
  - Exécuter tous les tests
  - Vérifier le flow complet: création galerie → partage → favoris → download
  - Demander à l'utilisateur si des questions surviennent

- [x] 23. Services IA (Optionnel - Phase 2)
  - [x] 23.1 Créer le service AI
    - Créer `src/lib/services/ai.service.ts`
    - Intégrer provider IA (OpenAI Vision, Replicate, etc.)
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 23.2 Implémenter Face Recognition
    - Détection de visages dans les images
    - Matching avec selfie uploadé
    - _Requirements: 10.1.1, 10.1.2, 10.1.3_
  - [x] 23.3 Implémenter Auto-Caption
    - Génération de descriptions via IA
    - Stockage dans image.alt_text
    - _Requirements: 10.2.1, 10.2.2_
  - [x] 23.4 Implémenter Smart Culling
    - Détection flou, yeux fermés, doublons
    - Suggestions de masquage
    - _Requirements: 10.3.1, 10.3.2, 10.3.3, 10.3.4_

- [ ] 24. Notifications Email
  - [ ] 24.1 Créer le service Notifications
    - Créer `src/lib/services/notification.service.ts`
    - Templates email pour favoris, commentaires, expiration
    - _Requirements: 3.1.4, 3.2.3, 2.4.3_
  - [ ] 24.2 Intégrer avec Resend ou SendGrid
    - Configuration provider email
    - Envoi asynchrone
    - _Requirements: 3.1.4, 3.2.3_

- [ ] 25. Final Checkpoint
  - Exécuter tous les tests (unit + property)
  - Vérifier la couverture des requirements
  - Demander à l'utilisateur si des questions surviennent

## Notes

- Les tâches marquées avec `*` sont optionnelles (tests de propriété)
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- Les fonctionnalités IA (Pilier 10) sont en Phase 2 car elles nécessitent des services externes
- Le Lightroom Plugin (9.1) n'est pas inclus car c'est un projet séparé
