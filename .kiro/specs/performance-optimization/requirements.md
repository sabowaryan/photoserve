# Requirements Document

## Introduction

Cette fonctionnalité vise à améliorer drastiquement les performances de l'application (LCP, TTFB, INP) pour réduire le taux de rebond des visiteurs. L'objectif est d'offrir une expérience utilisateur fluide et réactive grâce au streaming, à l'optimisation des requêtes et au feedback visuel instantané.

## Glossary

- **LCP (Largest Contentful Paint)**: Métrique mesurant le temps de rendu du plus grand élément visible
- **TTFB (Time To First Byte)**: Temps entre la requête et le premier octet reçu
- **INP (Interaction to Next Paint)**: Métrique mesurant la réactivité aux interactions utilisateur
- **FCP (First Contentful Paint)**: Temps jusqu'au premier rendu de contenu
- **Skeleton**: Silhouette de chargement représentant la structure de la page
- **Streaming**: Technique Next.js permettant d'envoyer le HTML progressivement
- **Above the fold**: Contenu visible sans défilement

## Requirements

### Requirement 1: Streaming avec Loading States

**User Story:** En tant qu'utilisateur, je veux voir immédiatement une structure de page (skeleton) pendant le chargement, afin de percevoir l'application comme rapide et réactive.

#### Acceptance Criteria

1. WHEN a user navigates to /dashboard THEN the System SHALL display a skeleton UI within 100ms
2. WHEN a user navigates to /g/[slug] THEN the System SHALL display a skeleton UI within 100ms
3. WHILE the page data is loading THEN the System SHALL maintain the skeleton visible until content is ready
4. WHEN the data finishes loading THEN the System SHALL smoothly replace the skeleton with actual content

### Requirement 2: Optimisation des Requêtes Supabase

**User Story:** En tant qu'utilisateur, je veux que la page s'affiche immédiatement sans attendre les données, afin de ne pas percevoir de blocage.

#### Acceptance Criteria

1. THE Server_Components SHALL NOT make blocking database queries that delay initial render
2. WHEN the page shell renders THEN the System SHALL initiate data fetching client-side
3. WHEN data is being fetched THEN the System SHALL display appropriate loading indicators
4. WHEN data fetching fails THEN the System SHALL display an error state with retry option
5. WHEN data is cached THEN the System SHALL serve stale content while revalidating

### Requirement 3: Optimisation des Images

**User Story:** En tant qu'utilisateur, je veux que les images au-dessus de la ligne de flottaison se chargent en priorité, afin d'améliorer le LCP.

#### Acceptance Criteria

1. THE System SHALL use Next.js Image component for all thumbnail images
2. WHEN an image is above the fold THEN the System SHALL set priority={true} on the Image component
3. WHEN an image is below the fold THEN the System SHALL lazy-load the image
4. THE System SHALL provide appropriate width and height attributes to prevent layout shift
5. WHEN images are displayed in a grid THEN the System SHALL use responsive sizes attribute

### Requirement 4: Feedback Visuel Interactif

**User Story:** En tant qu'utilisateur, je veux voir un indicateur de chargement immédiat quand je clique sur un bouton, afin de savoir que mon action a été prise en compte.

#### Acceptance Criteria

1. WHEN a user clicks an interactive button THEN the System SHALL display a loading spinner within 50ms
2. WHILE an action is processing THEN the System SHALL disable the button to prevent double-clicks
3. WHEN the action completes successfully THEN the System SHALL remove the loading state
4. IF an action fails THEN the System SHALL display an error state and re-enable the button
5. THE Loading_Indicator SHALL be visually consistent across all interactive elements
