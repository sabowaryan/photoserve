# Document des Exigences

## Introduction

Cette fonctionnalité permet aux photographes avec un plan Pro de disposer d'une page de profil publique accessible via une URL personnalisée. Cette page sert de vitrine professionnelle présentant leur portfolio, leurs galeries publiques, leurs informations de contact et leur branding personnalisé. L'objectif est de renforcer la présence en ligne des photographes, d'améliorer leur référencement SEO et de faciliter la conversion des visiteurs en clients.

## Glossaire

- **Système**: L'application PikSend dans son ensemble
- **Profil_Public**: La page publique d'un photographe Pro accessible via URL
- **Photographe_Pro**: Un utilisateur avec un abonnement au plan Pro
- **Slug**: Identifiant unique utilisé dans l'URL du profil (format: lettres minuscules, chiffres, tirets)
- **Galerie_Publique**: Une galerie active, non expirée et non masquée du profil
- **Branding**: Personnalisation visuelle (logo, couleurs, domaine personnalisé)
- **CTA**: Call-to-Action, bouton d'action principal pour inciter le visiteur à contacter le photographe
- **Dashboard**: Interface d'administration du photographe
- **SEO**: Search Engine Optimization, optimisation pour les moteurs de recherche
- **Analytics**: Système de suivi et d'analyse des visites du profil

## Exigences

### Exigence 1: Activation et Configuration du Profil Public

**User Story:** En tant que photographe Pro, je veux activer et configurer mon profil public, afin de disposer d'une vitrine professionnelle en ligne.

#### Critères d'Acceptation

1. THE Système SHALL permettre uniquement aux utilisateurs avec un plan Pro d'activer un profil public
2. WHEN un Photographe_Pro active son profil public, THE Système SHALL créer un enregistrement dans la table public_profiles
3. THE Système SHALL exiger un Slug unique lors de la création du profil
4. WHEN un Photographe_Pro saisit un Slug, THE Système SHALL valider qu'il contient uniquement des lettres minuscules, des chiffres et des tirets
5. WHEN un Slug est déjà utilisé, THE Système SHALL rejeter la création et suggérer des alternatives
6. THE Système SHALL limiter la longueur du Slug à 100 caractères maximum
7. THE Système SHALL limiter la longueur du tagline à 100 caractères maximum
8. THE Système SHALL limiter la longueur de la bio à 500 caractères maximum
9. THE Système SHALL permettre au Photographe_Pro de désactiver son profil public à tout moment
10. WHEN un profil public est désactivé, THE Système SHALL retourner une page 404 pour l'URL du profil

### Exigence 2: Affichage des Informations du Photographe

**User Story:** En tant que visiteur, je veux voir les informations du photographe, afin de connaître son identité et sa spécialité.

#### Critères d'Acceptation

1. WHEN un visiteur accède à un Profil_Public, THE Système SHALL afficher le nom du photographe
2. WHERE un tagline est configuré, THE Système SHALL l'afficher sous le nom du photographe
3. WHERE une bio est configurée, THE Système SHALL l'afficher avec support du format markdown
4. WHERE une localisation est configurée, THE Système SHALL l'afficher avec une icône de localisation
5. WHERE un avatar est configuré, THE Système SHALL l'afficher dans le header
6. WHERE une image de couverture est configurée, THE Système SHALL l'afficher en arrière-plan du hero section
7. WHERE des spécialités sont configurées, THE Système SHALL les afficher sous forme de tags (maximum 5)
8. WHERE des années d'expérience sont configurées, THE Système SHALL les afficher
9. WHERE des récompenses sont configurées, THE Système SHALL les afficher (maximum 3)

### Exigence 3: Gestion et Affichage des Galeries Publiques

**User Story:** En tant que visiteur, je veux voir les galeries du photographe, afin de découvrir son portfolio.

#### Critères d'Acceptation

1. WHEN un visiteur accède à un Profil_Public, THE Système SHALL afficher uniquement les Galeries_Publiques
2. THE Système SHALL exclure les galeries inactives de l'affichage public
3. THE Système SHALL exclure les galeries expirées de l'affichage public
4. THE Système SHALL exclure les galeries marquées comme masquées par le photographe
5. WHEN une galerie a moins de 7 jours, THE Système SHALL afficher un badge "Nouveau"
6. THE Système SHALL afficher pour chaque galerie: l'image de couverture, le titre, la date de création et le nombre d'images
7. WHEN un visiteur clique sur une galerie, THE Système SHALL rediriger vers la page de la galerie
8. WHERE des galeries sont marquées comme mises en avant, THE Système SHALL les afficher en premier
9. THE Système SHALL trier les galeries par date de création décroissante par défaut
10. THE Système SHALL afficher les galeries dans une grille responsive (2-4 colonnes selon la taille d'écran)

### Exigence 4: Informations de Contact et Réseaux Sociaux

**User Story:** En tant que visiteur, je veux contacter le photographe, afin de demander un devis ou réserver une séance.

#### Critères d'Acceptation

1. WHERE un email public est configuré, THE Système SHALL l'afficher avec protection anti-spam
2. WHERE un numéro de téléphone est configuré, THE Système SHALL l'afficher au format international
3. WHERE un site web est configuré, THE Système SHALL l'afficher comme lien cliquable
4. WHERE une adresse est configurée, THE Système SHALL l'afficher
5. WHERE des liens de réseaux sociaux sont configurés, THE Système SHALL les afficher avec leurs icônes respectives
6. THE Système SHALL supporter les réseaux sociaux suivants: Instagram, Facebook, Pinterest, LinkedIn, TikTok, YouTube
7. WHERE un bouton CTA est configuré, THE Système SHALL l'afficher avec le texte et le lien personnalisés
8. WHEN un visiteur clique sur le bouton CTA, THE Système SHALL enregistrer l'événement dans les analytics
9. WHEN un visiteur clique sur un lien de réseau social, THE Système SHALL enregistrer l'événement dans les analytics

### Exigence 5: Témoignages Clients

**User Story:** En tant que visiteur, je veux lire les témoignages clients, afin d'évaluer la qualité du travail du photographe.

#### Critères d'Acceptation

1. WHERE des témoignages sont configurés, THE Système SHALL les afficher dans un carrousel
2. THE Système SHALL limiter l'affichage à 5 témoignages maximum
3. THE Système SHALL afficher pour chaque témoignage: le nom du client, la note (étoiles), le texte et la date
4. WHERE une photo du client est disponible, THE Système SHALL l'afficher
5. THE Système SHALL limiter la longueur du texte de témoignage à 200 caractères maximum
6. THE Système SHALL afficher les notes sous forme d'étoiles (1 à 5)

### Exigence 6: Routing et Accessibilité des URLs

**User Story:** En tant que photographe Pro, je veux que mon profil soit accessible via une URL personnalisée, afin de faciliter le partage et le référencement.

#### Critères d'Acceptation

1. THE Système SHALL rendre chaque Profil_Public accessible via l'URL /p/[slug]
2. WHERE un domaine personnalisé est configuré, THE Système SHALL rendre le profil accessible via ce domaine
3. WHEN un visiteur accède à un Slug inexistant, THE Système SHALL retourner une page 404
4. WHEN un visiteur accède à un profil désactivé, THE Système SHALL retourner une page 404
5. THE Système SHALL générer des URLs canoniques pour éviter le contenu dupliqué
6. THE Système SHALL supporter les redirections depuis l'ancien format d'URL vers le nouveau si applicable

### Exigence 7: Application du Branding Personnalisé

**User Story:** En tant que photographe Pro, je veux que mon branding soit appliqué à mon profil public, afin de maintenir une identité visuelle cohérente.

#### Critères d'Acceptation

1. WHERE un logo personnalisé est configuré, THE Système SHALL l'afficher dans le header du profil
2. WHERE des couleurs de marque sont configurées, THE Système SHALL les appliquer aux éléments du profil (boutons, liens, accents)
3. WHERE un domaine personnalisé est configuré, THE Système SHALL afficher un footer white-label sans mention PikSend
4. WHEN aucun branding personnalisé n'est configuré, THE Système SHALL afficher le logo PikSend et les couleurs par défaut
5. WHEN aucun domaine personnalisé n'est configuré, THE Système SHALL afficher "Propulsé par PikSend" dans le footer

### Exigence 8: Optimisation SEO

**User Story:** En tant que photographe Pro, je veux que mon profil soit optimisé pour les moteurs de recherche, afin d'améliorer ma visibilité en ligne.

#### Critères d'Acceptation

1. THE Système SHALL générer des meta tags title, description et keywords pour chaque profil
2. WHERE un meta title personnalisé est configuré, THE Système SHALL l'utiliser, sinon THE Système SHALL générer un titre par défaut avec le nom du photographe
3. WHERE une meta description personnalisée est configurée, THE Système SHALL l'utiliser, sinon THE Système SHALL utiliser la bio
4. THE Système SHALL limiter le meta title à 60 caractères maximum
5. THE Système SHALL limiter la meta description à 160 caractères maximum
6. THE Système SHALL générer des Open Graph tags pour le partage sur les réseaux sociaux
7. THE Système SHALL générer des Twitter Card tags pour le partage sur Twitter
8. THE Système SHALL générer des données structurées JSON-LD de type Person pour chaque profil
9. THE Système SHALL inclure les profils publics actifs dans le sitemap.xml
10. THE Système SHALL définir la priorité des profils publics à 0.8 dans le sitemap

### Exigence 9: Analytics et Suivi des Visites

**User Story:** En tant que photographe Pro, je veux suivre les visites de mon profil, afin de mesurer mon audience et l'efficacité de ma vitrine.

#### Critères d'Acceptation

1. WHEN un visiteur accède à un Profil_Public, THE Système SHALL enregistrer la visite dans la table profile_views
2. THE Système SHALL enregistrer pour chaque visite: l'adresse IP hashée, le user agent, le referrer et l'horodatage
3. THE Système SHALL incrémenter le compteur views_count du profil à chaque visite
4. WHEN un visiteur clique sur une galerie, THE Système SHALL enregistrer l'ID de la galerie dans galleries_viewed
5. WHEN un visiteur clique sur le CTA, THE Système SHALL marquer cta_clicked à true
6. WHEN un visiteur clique sur un lien de réseau social, THE Système SHALL enregistrer le nom du réseau dans social_links_clicked
7. THE Système SHALL permettre au Photographe_Pro de consulter les statistiques de son profil dans le Dashboard
8. THE Système SHALL afficher les métriques suivantes: nombre total de visites, visites par période, galeries les plus vues, taux de clic CTA
9. THE Système SHALL anonymiser les données de visite conformément au RGPD
10. THE Système SHALL permettre au visiteur de refuser le tracking via un bandeau de consentement cookies

### Exigence 10: Interface de Configuration dans le Dashboard

**User Story:** En tant que photographe Pro, je veux configurer mon profil public depuis mon dashboard, afin de personnaliser ma vitrine facilement.

#### Critères d'Acceptation

1. THE Système SHALL fournir une section "Profil Public" dans les paramètres du Dashboard
2. THE Système SHALL organiser la configuration en onglets: Général, Médias, Contact, Galeries, Témoignages, SEO
3. THE Système SHALL valider tous les champs en temps réel lors de la saisie
4. WHEN un Photographe_Pro modifie son profil, THE Système SHALL enregistrer les modifications immédiatement
5. THE Système SHALL fournir un bouton "Prévisualiser" pour voir le profil avant publication
6. THE Système SHALL afficher le lien direct vers le profil public une fois activé
7. THE Système SHALL permettre de copier le lien du profil en un clic
8. THE Système SHALL afficher des messages d'erreur clairs en cas de validation échouée
9. THE Système SHALL permettre l'upload d'images pour l'avatar et la cover image via drag & drop
10. THE Système SHALL optimiser automatiquement les images uploadées (compression, redimensionnement)

### Exigence 11: Responsive Design et Accessibilité

**User Story:** En tant que visiteur, je veux accéder au profil depuis n'importe quel appareil, afin de consulter le portfolio du photographe confortablement.

#### Critères d'Acceptation

1. THE Système SHALL afficher le profil de manière responsive sur mobile, tablette et desktop
2. THE Système SHALL adapter la grille de galeries selon la taille d'écran (1 colonne sur mobile, 2-4 sur desktop)
3. THE Système SHALL assurer un contraste de couleurs conforme aux normes WCAG AA minimum
4. THE Système SHALL permettre la navigation complète au clavier
5. THE Système SHALL fournir des attributs ARIA appropriés sur tous les éléments interactifs
6. THE Système SHALL afficher des alt text descriptifs sur toutes les images
7. THE Système SHALL rendre les focus visibles sur tous les éléments interactifs
8. THE Système SHALL supporter le mode sombre avec détection automatique de la préférence système
9. THE Système SHALL permettre au visiteur de basculer manuellement entre mode clair et sombre
10. THE Système SHALL persister la préférence de thème dans le localStorage

### Exigence 12: Performance et Optimisation

**User Story:** En tant que visiteur, je veux que le profil se charge rapidement, afin d'avoir une expérience fluide.

#### Critères d'Acceptation

1. THE Système SHALL optimiser toutes les images via Cloudinary avec format WebP
2. THE Système SHALL implémenter le lazy loading pour les images des galeries
3. THE Système SHALL utiliser le code splitting par route pour réduire le bundle initial
4. THE Système SHALL implémenter le prefetch des galeries au survol
5. THE Système SHALL utiliser le cache CDN pour les profils publics
6. THE Système SHALL générer les profils publics en Static Site Generation (SSG) quand possible
7. THE Système SHALL atteindre un LCP (Largest Contentful Paint) inférieur à 2.5 secondes
8. THE Système SHALL atteindre un FID (First Input Delay) inférieur à 100 millisecondes
9. THE Système SHALL atteindre un CLS (Cumulative Layout Shift) inférieur à 0.1

### Exigence 13: Sécurité et Protection des Données

**User Story:** En tant que photographe Pro, je veux que mes données personnelles soient protégées, afin de préserver ma vie privée.

#### Critères d'Acceptation

1. WHEN un email est affiché publiquement, THE Système SHALL le formater avec protection anti-spam (ex: john[at]example[dot]com)
2. THE Système SHALL permettre au Photographe_Pro de choisir d'afficher ou non son numéro de téléphone
3. THE Système SHALL permettre au Photographe_Pro de choisir d'afficher ou non son adresse complète
4. THE Système SHALL hasher les adresses IP des visiteurs avant stockage pour conformité RGPD
5. WHEN un Photographe_Pro supprime son profil public, THE Système SHALL supprimer toutes les données analytics associées
6. THE Système SHALL permettre au Photographe_Pro d'exporter ses données analytics
7. THE Système SHALL respecter les en-têtes Do Not Track des navigateurs

### Exigence 14: Validation des Slugs

**User Story:** En tant que photographe Pro, je veux vérifier la disponibilité d'un slug, afin de choisir une URL unique pour mon profil.

#### Critères d'Acceptation

1. WHEN un Photographe_Pro saisit un Slug, THE Système SHALL vérifier sa disponibilité en temps réel
2. WHEN un Slug est disponible, THE Système SHALL afficher un indicateur visuel de succès
3. WHEN un Slug est déjà pris, THE Système SHALL afficher un message d'erreur et suggérer 3 alternatives
4. THE Système SHALL générer des suggestions basées sur le nom du photographe et des suffixes numériques
5. THE Système SHALL interdire les slugs réservés (admin, api, dashboard, settings, etc.)
6. THE Système SHALL interdire les caractères spéciaux autres que le tiret dans les slugs
7. THE Système SHALL convertir automatiquement les majuscules en minuscules dans les slugs
8. THE Système SHALL remplacer automatiquement les espaces par des tirets dans les slugs
