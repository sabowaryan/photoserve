# Implementation Plan: Performance Optimization

## Overview

Implémentation des optimisations de performance pour améliorer LCP, TTFB et INP via le streaming Next.js, le data fetching client-side, l'optimisation des images et le feedback visuel interactif.

## Tasks

- [x] 1. Créer les composants Skeleton
  - [x] 1.1 Créer `src/components/skeletons/dashboard-skeleton.tsx`
    - Skeleton pour les stats cards (4 cartes)
    - Skeleton pour la grille de galeries
    - Skeleton pour la sidebar
    - _Requirements: 1.1, 1.3_
  - [x] 1.2 Créer `src/components/skeletons/gallery-skeleton.tsx`
    - Skeleton pour le header de galerie
    - Skeleton pour la grille masonry d'images
    - _Requirements: 1.2, 1.3_

- [x] 2. Implémenter le Streaming avec loading.tsx
  - [x] 2.1 Créer `src/app/(dashboard)/dashboard/loading.tsx`
    - Utiliser DashboardSkeleton
    - _Requirements: 1.1_
  - [x] 2.2 Créer `src/app/g/[slug]/loading.tsx`
    - Utiliser GallerySkeleton
    - _Requirements: 1.2_

- [x] 3. Migrer vers le data fetching client-side
  - [x] 3.1 Créer le hook `src/hooks/use-dashboard-data.ts`
    - Utiliser SWR pour fetch profile et galleries
    - Gérer les états loading/error
    - Configurer le cache et revalidation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 3.2 Refactorer `src/app/(dashboard)/dashboard/page.tsx`
    - Supprimer les requêtes Supabase bloquantes
    - Passer uniquement le userId au client component
    - _Requirements: 2.1_
  - [x] 3.3 Mettre à jour `src/app/(dashboard)/dashboard/dashboard-client.tsx`
    - Utiliser useDashboardData hook
    - Afficher skeleton pendant le chargement
    - Afficher erreur avec bouton retry si échec
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ]* 3.4 Écrire le test property pour les états de data fetching
    - **Property 1: Data Fetching State Consistency**
    - **Validates: Requirements 2.3, 2.4**

- [x] 4. Optimiser les images avec Next/Image
  - [x] 4.1 Mettre à jour `src/components/gallery-view/masonry-grid.tsx`
    - Ajouter priority={true} aux 4 premières images
    - Ajouter l'attribut sizes pour le responsive
    - S'assurer que width/height ou fill sont présents
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  - [x] 4.2 Mettre à jour `src/components/dashboard/gallery-card.tsx`
    - Utiliser Next/Image pour les thumbnails
    - Ajouter priority pour les premières cartes visibles
    - _Requirements: 3.1, 3.2, 3.4_
  - [ ]* 4.3 Écrire le test property pour l'assignation de priority
    - **Property 2: Image Priority Assignment**
    - **Validates: Requirements 3.2**
  - [ ]* 4.4 Écrire le test property pour les attributs de sizing
    - **Property 3: Image Sizing Attributes**
    - **Validates: Requirements 3.4**

- [x] 5. Implémenter le feedback visuel interactif
  - [x] 5.1 Créer `src/components/ui/loading-button.tsx`
    - Étendre le Button existant avec isLoading prop
    - Afficher spinner quand isLoading=true
    - Désactiver le bouton pendant le chargement
    - _Requirements: 4.1, 4.2, 4.3, 4.5_
  - [x] 5.2 Mettre à jour les boutons critiques du dashboard
    - Bouton "Nouvelle galerie"
    - Boutons de la toolbar (tri, recherche)
    - _Requirements: 4.1, 4.2_
  - [x] 5.3 Mettre à jour les boutons de la vue galerie
    - Bouton "Télécharger tout"
    - Bouton de soumission du mot de passe
    - _Requirements: 4.1, 4.2_
  - [ ]* 5.4 Écrire le test property pour le comportement du LoadingButton
    - **Property 4: Button Loading State Behavior**
    - **Validates: Requirements 4.2, 4.4**

- [x] 6. Checkpoint - Validation finale
  - [x] Vérifier que tous les tests passent (tests de performance OK, échecs non liés à cette spec)
  - Tester manuellement le streaming sur /dashboard et /g/[slug]
  - Vérifier les Core Web Vitals avec Lighthouse

## Notes

- Les tâches marquées avec `*` sont optionnelles (tests property-based)
- SWR est recommandé car plus léger que react-query et suffisant pour ce use case
- Le threshold de 4 images pour priority est basé sur une viewport standard
- Les skeletons doivent matcher la structure exacte des pages pour éviter le layout shift
