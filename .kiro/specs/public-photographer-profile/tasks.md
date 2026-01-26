# Plan d'Implémentation: Profil Public Photographe

## Vue d'ensemble

Ce plan implémente la fonctionnalité de profil public pour les photographes Pro en suivant une approche incrémentale. L'implémentation est divisée en 4 phases: MVP (fonctionnalités essentielles), Enrichissement (fonctionnalités importantes), Analytics (suivi et statistiques), et Avancé (optimisations et fonctionnalités optionnelles).

## Tâches

### Phase 1: MVP - Infrastructure et Fonctionnalités de Base

- [x] 1. Créer le schéma de base de données et les migrations
  - Créer la migration pour la table `public_profiles` avec toutes les colonnes, contraintes et index
  - Créer la migration pour la table `profile_views` pour le tracking analytics
  - Créer la fonction trigger `update_updated_at_column()` pour mise à jour automatique
  - Ajouter les index pour optimiser les requêtes fréquentes
  - _Exigences: 1.2, 9.1, 9.2_

- [x] 2. Implémenter les types TypeScript et interfaces
  - Créer `types/public-profile.ts` avec toutes les interfaces (PublicProfile, SocialLinks, CTAButton, Testimonial, PublicGallery, ProfileView, ProfileAnalytics)
  - Créer le schéma de validation Zod `PublicProfileSchema` avec toutes les règles
  - Définir les constantes (RESERVED_SLUGS, limites de longueur)
  - _Exigences: 1.4, 1.6, 1.7, 1.8, 14.5_

- [x] 2.1 Écrire les tests de propriété pour la validation Zod
  - **Propriété 6: Respect des limites de longueur des champs texte**
  - **Propriété 7: Respect des limites de cardinalité des tableaux**
  - **Valide: Exigences 1.6, 1.7, 1.8**

- [x] 3. Créer le repository pour les profils publics
  - Implémenter `lib/repositories/public-profile.repository.ts`
  - Méthodes: `findBySlug()`, `findByUserId()`, `create()`, `update()`, `delete()`, `incrementViewsCount()`
  - Utiliser le client Supabase pour les requêtes
  - Gérer les erreurs de base de données
  - _Exigences: 1.2, 1.3, 6.1_

- [x] 3.1 Écrire les tests unitaires pour le repository
  - Tester la création, mise à jour, suppression
  - Tester les contraintes d'unicité
  - Tester les cas d'erreur
  - _Exigences: 1.2, 1.3_

- [x] 4. Implémenter les utilitaires pour les slugs
  - Créer `lib/utils/slug.utils.ts` avec la classe `SlugUtils`
  - Méthodes: `normalize()`, `isValid()`, `generateUnique()`
  - Implémenter la normalisation (minuscules, remplacement espaces, suppression accents)
  - Implémenter la validation avec regex et vérification des slugs réservés
  - _Exigences: 1.4, 14.1, 14.6, 14.7, 14.8_

- [x] 4.1 Écrire les tests de propriété pour la normalisation des slugs
  - **Propriété 5: Normalisation des slugs**
  - **Valide: Exigences 14.7, 14.8**

- [x] 4.2 Écrire les tests de propriété pour la validation des slugs
  - **Propriété 4: Validation du format des slugs**
  - **Valide: Exigences 1.4, 14.1, 14.5, 14.6**

- [x] 5. Créer le service de profil public
  - Implémenter `lib/services/public-profile.service.ts` avec la classe `PublicProfileService`
  - Méthodes: `getProfileBySlug()`, `upsertProfile()`, `checkSlugAvailability()`, `generateSlugSuggestions()`, `sortGalleries()`
  - Implémenter la vérification du plan Pro
  - Implémenter la vérification d'unicité des slugs avec suggestions
  - Implémenter le tri des galeries (featured en premier, puis par date)
  - _Exigences: 1.1, 1.3, 1.5, 3.8, 3.9, 14.2, 14.3, 14.4_

- [x] 5.1 Écrire les tests de propriété pour le tri des galeries
  - **Propriété 12: Ordre de tri des galeries**
  - **Valide: Exigences 3.8, 3.9**

- [x] 5.2 Écrire les tests unitaires pour le service
  - Tester la restriction au plan Pro
  - Tester la génération de suggestions de slugs
  - Tester les cas d'erreur (slug déjà pris, utilisateur non Pro)
  - _Exigences: 1.1, 1.5_

- [x] 6. Checkpoint - Vérifier l'infrastructure de base
  - S'assurer que toutes les migrations s'exécutent correctement
  - Vérifier que les types TypeScript sont corrects
  - Vérifier que les tests passent
  - Demander à l'utilisateur si des questions se posent


- [x] 7. Créer les API routes pour la gestion des profils
  - Créer `app/api/public-profile/route.ts` pour PUT (création/mise à jour)
  - Créer `app/api/public-profile/[slug]/route.ts` pour GET (récupération par slug)
  - Créer `app/api/public-profile/check-slug/route.ts` pour GET (vérification disponibilité)
  - Implémenter l'authentification avec le systeme existant(voir les implementations)`
  - Implémenter la validation des données avec Zod
  - Implémenter la gestion des erreurs (validation, autorisation, contraintes)
  - _Exigences: 1.1, 1.3, 6.1, 14.1_

- [x] 7.1 Écrire les tests d'intégration pour les API routes
  - Tester la création d'un profil pour un utilisateur Pro
  - Tester le rejet pour un utilisateur non-Pro
  - Tester le rejet pour un slug déjà pris
  - Tester la récupération d'un profil par slug
  - _Exigences: 1.1, 1.3, 6.1_

- [x] 8. Implémenter le filtrage des galeries publiques
  - Créer la fonction `filterPublicGalleries()` dans le service
  - Filtrer les galeries: is_active = true, non expirées, non masquées
  - Ajouter la propriété `isNew` (< 7 jours)
  - Intégrer avec `getProfileBySlug()` pour récupérer les galeries
  - _Exigences: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 8.1 Écrire les tests de propriété pour le filtrage des galeries
  - **Propriété 10: Filtrage des galeries publiques**
  - **Propriété 11: Badge "Nouveau" basé sur la date**
  - **Valide: Exigences 3.1, 3.2, 3.3, 3.4, 3.5**

- [x] 9. Créer la page de profil public
  - Créer `app/p/[slug]/page.tsx` avec génération statique (SSG)
  - Implémenter `generateStaticParams()` pour pré-générer les profils actifs
  - Récupérer le profil et les galeries via le service
  - Gérer les cas: profil non trouvé (404), profil désactivé (404)
  - Implémenter le layout responsive
  - _Exigences: 6.1, 6.3, 6.4, 1.10_

- [x] 9.1 Écrire les tests unitaires pour la page
  - Tester le rendu avec un profil valide
  - Tester le retour 404 pour profil inexistant
  - Tester le retour 404 pour profil désactivé
  - _Exigences: 6.3, 6.4, 1.10_

- [x] 10. Créer les composants de base du profil
  - Créer `components/public-profile/profile-header.tsx` (hero section avec avatar, cover, nom, tagline, localisation)
  - Créer `components/public-profile/profile-bio.tsx` (bio avec support markdown, spécialités, années d'expérience, récompenses)
  - Créer `components/public-profile/profile-galleries.tsx` (grille responsive de galeries)
  - Créer `components/public-profile/gallery-card.tsx` (carte de galerie avec image, titre, date, nombre d'images, badge "Nouveau")
  - Implémenter l'affichage conditionnel des champs optionnels
  - _Exigences: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 3.6_

- [x] 10.1 Écrire les tests de propriété pour l'affichage conditionnel
  - **Propriété 9: Affichage conditionnel des informations du photographe**
  - **Valide: Exigences 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9**

- [x] 11. Créer le composant de contact
  - Créer `components/public-profile/profile-contact.tsx`
  - Afficher email avec protection anti-spam (remplacer @ par [at] et . par [dot])
  - Afficher téléphone, site web, adresse si configurés
  - Afficher les icônes de réseaux sociaux avec liens
  - Afficher le bouton CTA personnalisable
  - _Exigences: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 11.1 Écrire les tests de propriété pour la protection anti-spam
  - **Propriété 13: Protection anti-spam des emails**
  - **Valide: Exigences 4.1, 13.1**

- [x] 11.2 Écrire les tests unitaires pour le composant contact
  - Tester le formatage de l'email
  - Tester l'affichage conditionnel des champs
  - Tester le rendu des réseaux sociaux
  - _Exigences: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 12. Créer le footer du profil
  - Créer `components/public-profile/profile-footer.tsx`
  - Afficher le copyright avec nom du photographe
  - Afficher les liens légaux (CGU, Politique de confidentialité)
  - Afficher "Propulsé par PikSend" si pas de domaine custom
  - Afficher footer white-label si domaine custom configuré
  - _Exigences: 7.3, 7.4, 7.5_

- [x] 13. Checkpoint - Vérifier le MVP
  - Tester la création d'un profil via le dashboard
  - Tester l'affichage du profil public
  - Vérifier que seuls les utilisateurs Pro peuvent activer
  - Vérifier que les galeries sont correctement filtrées
  - S'assurer que tous les tests passent
  - Demander à l'utilisateur si des questions se posent

### Phase 2: Enrichissement - Configuration et Personnalisation

- [x] 14. Créer l'interface de configuration dans le dashboard
  - Créer `app/(dashboard)/settings/public-profile/page.tsx`
  - Implémenter le layout avec onglets (Général, Médias, Contact, Galeries, Témoignages, SEO)
  - Créer le toggle d'activation du profil
  - Afficher le lien du profil public une fois activé
  - Ajouter le bouton "Prévisualiser"
  - _Exigences: 10.1, 10.2, 10.6, 10.7_

- [x] 15. Créer l'onglet Général
  - Créer `app/(dashboard)/settings/profile/components/general-tab.tsx`
  - Champs: slug (avec vérification en temps réel), displayName, tagline, bio (textarea avec compteur)
  - Implémenter la validation en temps réel avec Zod
  - Afficher les messages d'erreur clairs
  - Afficher les suggestions de slugs si déjà pris
  - _Exigences: 10.3, 10.8, 14.2, 14.3_

- [x] 15.1 Écrire les tests de propriété pour la vérification des slugs
  - **Propriété 22: Vérification en temps réel de la disponibilité des slugs**
  - **Propriété 21: Suggestions de slugs alternatifs**
  - **Valide: Exigences 1.5, 14.1, 14.2, 14.3, 14.4**

- [x] 16. Créer l'onglet Médias
  - Créer `app/(dashboard)/settings/profile/components/media-tab.tsx`
  - Upload d'avatar avec drag & drop et preview
  - Upload d'image de couverture avec drag & drop et preview
  - Intégration avec Cloudinary pour l'upload et l'optimisation
  - Afficher les dimensions recommandées
  - _Exigences: 10.9, 10.10_

- [x] 17. Créer l'onglet Contact
  - Créer `app/(dashboard)/settings/profile/components/contact-tab.tsx`
  - Champs: publicEmail, phone, website, address
  - Champs pour les réseaux sociaux (Instagram, Facebook, Pinterest, LinkedIn, TikTok, YouTube, autre)
  - Configuration du bouton CTA (texte, URL, style)
  - Validation des URLs et emails
  - _Exigences: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 17.1 Écrire les tests de propriété pour la validation des URLs
  - **Propriété 20: Validation des URLs**
  - **Valide: Exigences 4.3, validation générale**

- [x] 18. Créer l'onglet Galeries
  - Créer `app/(dashboard)/settings/profile/components/galleries-tab.tsx`
  - Afficher la liste des galeries de l'utilisateur
  - Permettre de marquer des galeries comme "mises en avant" (featured)
  - Permettre de masquer des galeries du profil public
  - Afficher un aperçu de l'ordre d'affichage
  - _Exigences: 3.8, 3.4_

- [x] 19. Créer l'onglet Témoignages
  - Créer `app/(dashboard)/settings/profile/components/testimonials-tab.tsx`
  - Formulaire d'ajout de témoignage (nom client, photo, note, texte, date)
  - Liste des témoignages avec édition et suppression
  - Limite de 5 témoignages maximum
  - Validation de la longueur du texte (200 caractères max)
  - _Exigences: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 20. Créer l'onglet SEO
  - Créer `app/(dashboard)/settings/profile/components/seo-tab.tsx`
  - Champs: metaTitle (60 caractères max), metaDescription (160 caractères max), metaKeywords
  - Afficher des compteurs de caractères
  - Afficher un aperçu de l'apparence dans les résultats de recherche Google
  - _Exigences: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 21. Implémenter la génération des meta tags SEO
  - Créer `lib/utils/seo.utils.ts` avec la classe `SEOGenerator`
  - Méthodes: `generateMetaTags()`, `generateStructuredData()`, `generateSitemapEntry()`
  - Générer les meta tags (title, description, keywords, Open Graph, Twitter Card)
  - Générer les données structurées JSON-LD de type Person
  - Intégrer dans la page du profil public
  - _Exigences: 8.1, 8.2, 8.3, 8.6, 8.7, 8.8_

- [x] 21.1 Écrire les tests de propriété pour la génération SEO
  - **Propriété 17: Génération des meta tags SEO**
  - **Propriété 18: Génération des données structurées JSON-LD**
  - **Valide: Exigences 8.1, 8.2, 8.3, 8.6, 8.7, 8.8**

- [x] 21.2 Écrire les tests unitaires pour la génération SEO
  - Tester l'utilisation du meta title custom vs généré
  - Tester la troncature de la bio pour la description
  - Tester la génération des données structurées
  - _Exigences: 8.1, 8.2, 8.3_

- [x] 22. Créer le composant de témoignages
  - Créer `components/public-profile/profile-testimonials.tsx` (carrousel)
  - Créer `components/public-profile/testimonial-card.tsx` (carte individuelle)
  - Implémenter le carrousel avec navigation (précédent/suivant)
  - Afficher la photo du client, nom, note (étoiles), texte, date
  - Limiter l'affichage à 5 témoignages maximum
  - _Exigences: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 23. Implémenter l'application du branding personnalisé
  - Récupérer les paramètres de branding de l'utilisateur (logo, couleurs, domaine)
  - Appliquer le logo personnalisé dans le header si configuré
  - Appliquer les couleurs de marque (primary, secondary, accent) aux boutons et liens
  - Afficher le footer white-label si domaine custom, sinon afficher "Propulsé par PikSend"
  - _Exigences: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 23.1 Écrire les tests de propriété pour l'application du branding
  - **Propriété 19: Application conditionnelle du branding**
  - **Valide: Exigences 7.1, 7.2, 7.3**

- [x] 24. Créer la page de prévisualisation
  - Créer `app/(dashboard)/settings/profile/preview/page.tsx`
  - Afficher le profil tel qu'il apparaîtra publiquement
  - Utiliser les mêmes composants que la page publique
  - Ajouter un bandeau "Mode Prévisualisation"
  - _Exigences: 10.5_

- [x] 25. Checkpoint - Vérifier l'enrichissement
  - Tester la configuration complète d'un profil via le dashboard
  - Vérifier que tous les onglets fonctionnent correctement
  - Vérifier l'upload d'images
  - Vérifier la prévisualisation
  - Vérifier l'application du branding
  - S'assurer que tous les tests passent
  - Demander à l'utilisateur si des questions se posent


### Phase 3: Analytics - Suivi et Statistiques

- [x] 26. Créer le repository pour les vues de profil
  - Implémenter `lib/repositories/profile-views.repository.ts`
  - Méthodes: `create()`, `updateCTAClick()`, `addSocialClick()`, `findByProfileAndDateRange()`, `getAnalytics()`
  - Implémenter les requêtes d'agrégation pour les statistiques
  - _Exigences: 9.1, 9.2, 9.4, 9.5, 9.6_

- [x] 27. Implémenter le service analytics
  - Créer `lib/services/analytics.service.ts` avec la classe `AnalyticsService`
  - Méthodes: `calculateStats()`, `groupViewsByDate()`, `calculateTopGalleries()`, `calculateTopReferrers()`
  - Implémenter le calcul des métriques (total views, CTA click rate, average session duration)
  - Implémenter le groupement des vues par date
  - Implémenter le calcul des top galeries et top referrers
  - _Exigences: 9.7, 9.8_

- [x] 27.1 Écrire les tests de propriété pour le calcul des statistiques
  - **Propriété 23: Calcul correct des statistiques analytics**
  - **Valide: Exigences 9.7, 9.8**

- [x] 28. Ajouter le tracking dans PublicProfileService
  - Implémenter `trackView()` avec hashage de l'IP (SHA-256)
  - Implémenter `trackCTAClick()` pour enregistrer les clics sur le CTA
  - Implémenter `trackSocialClick()` pour enregistrer les clics sur les réseaux sociaux
  - Implémenter `getAnalytics()` pour récupérer les statistiques
  - _Exigences: 9.1, 9.2, 9.3, 9.5, 9.6, 13.4_

- [x] 28.1 Écrire les tests de propriété pour l'anonymisation des IPs
  - **Propriété 16: Anonymisation des adresses IP**
  - **Valide: Exigences 9.9, 13.4**

- [x] 29. Créer l'API route pour le tracking
  - Créer `app/api/public-profile/track-view/route.ts` pour POST
  - Enregistrer les visites avec IP hashée, user agent, referrer
  - Enregistrer les clics CTA et réseaux sociaux
  - Implémenter la détection du pays et de la ville (optionnel, via IP)
  - _Exigences: 9.1, 9.2, 9.5, 9.6_

- [x] 30. Intégrer le tracking dans la page publique
  - Ajouter l'appel à `trackView()` lors du chargement de la page (useEffect)
  - Ajouter le tracking des clics sur le CTA
  - Ajouter le tracking des clics sur les réseaux sociaux
  - Ajouter le tracking des clics sur les galeries
  - Implémenter le respect du Do Not Track
  - _Exigences: 9.1, 9.4, 9.5, 9.6, 13.7_

- [x] 30.1 Écrire les tests de propriété pour l'enregistrement des événements
  - **Propriété 14: Enregistrement des événements analytics**
  - **Propriété 15: Incrémentation du compteur de vues**
  - **Valide: Exigences 9.1, 9.2, 9.3, 9.5, 9.6**

- [x] 31. Créer le dashboard analytics
  - Créer `app/(dashboard)/settings/profile/analytics/page.tsx`
  - Afficher les métriques principales (total views, CTA click rate, avg session duration)
  - Afficher le graphique des visites par jour/semaine/mois
  - Afficher le top 10 des galeries les plus vues
  - Afficher le top 10 des referrers
  - Permettre de filtrer par période (7 jours, 30 jours, 90 jours, tout)
  - _Exigences: 9.7, 9.8_

- [x] 32. Implémenter le bandeau de consentement cookies
  - Créer un composant de bandeau RGPD pour le consentement
  - Permettre d'accepter ou refuser le tracking
  - Stocker le choix dans localStorage
  - Ne pas tracker si le consentement est refusé
  - _Exigences: 9.10_

- [x] 33. Implémenter l'export des données analytics
  - Ajouter un bouton "Exporter" dans le dashboard analytics
  - Générer un fichier CSV avec toutes les données de visites
  - Respecter le RGPD (données anonymisées)
  - _Exigences: 13.6_

- [x] 34. Checkpoint - Vérifier les analytics
  - Tester l'enregistrement des visites
  - Vérifier que les IPs sont bien hashées
  - Vérifier le calcul des statistiques
  - Tester le dashboard analytics
  - Vérifier le bandeau de consentement
  - S'assurer que tous les tests passent
  - Demander à l'utilisateur si des questions se posent

### Phase 4: Avancé - Optimisations et Fonctionnalités Supplémentaires

- [x] 35. Implémenter le responsive design
  - Adapter la grille de galeries (1 colonne mobile, 2-3 tablette, 3-4 desktop)
  - Adapter le hero section pour mobile
  - Adapter la navigation et les menus
  - Tester sur différentes tailles d'écran (320px, 768px, 1024px, 1440px)
  - _Exigences: 11.1, 11.2_

- [x] 36. Implémenter l'accessibilité
  - Ajouter les attributs ARIA sur tous les éléments interactifs
  - Ajouter les alt text descriptifs sur toutes les images
  - Implémenter la navigation au clavier complète
  - Rendre les focus visibles
  - Vérifier le contraste des couleurs (WCAG AA minimum)
  - _Exigences: 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 36.1 Écrire les tests unitaires pour l'accessibilité
  - Tester la présence des attributs ARIA
  - Tester la présence des alt text
  - Tester la navigation au clavier
  - _Exigences: 11.4, 11.5, 11.6_

- [ ] 37. Implémenter le mode sombre
  - utiliser le composant existant  pour basculer entre clair/sombre
  - Détecter automatiquement la préférence système (prefers-color-scheme)
  - Persister le choix dans localStorage
  - Appliquer les styles appropriés pour chaque mode
  - _Exigences: 11.8, 11.9, 11.10_

- [~] 38. Optimiser les images
  - Configurer Cloudinary pour la compression et le format WebP
  - Implémenter le lazy loading pour les images des galeries
  - Utiliser next/image pour l'optimisation automatique
  - Définir les tailles d'images appropriées (srcset)
  - _Exigences: 12.1, 12.2_

- [~] 39. Optimiser les performances
  - Implémenter le code splitting par route
  - Implémenter le prefetch des galeries au hover
  - Configurer le cache CDN pour les profils publics
  - Optimiser les requêtes de base de données (index, requêtes N+1)
  - _Exigences: 12.3, 12.4, 12.5_

- [~] 40. Implémenter la génération statique (SSG)
  - Configurer `generateStaticParams()` pour pré-générer les profils actifs
  - Implémenter l'invalidation du cache lors de la mise à jour d'un profil
  - Configurer la revalidation incrémentale (ISR) avec un délai approprié
  - _Exigences: 12.6_

- [~] 41. Ajouter les profils au sitemap
  - Créer ou modifier `app/sitemap.ts`
  - Ajouter tous les profils publics actifs au sitemap
  - Définir la priorité à 0.8 et la fréquence à "weekly"
  - Utiliser la date de mise à jour pour lastmod
  - _Exigences: 8.9, 8.10_

- [~] 42. Implémenter le support du markdown dans la bio
  - Installer et configurer une bibliothèque de rendu markdown (react-markdown)
  - Configurer les options de sécurité (sanitization)
  - Limiter les éléments HTML autorisés (pas de scripts)
  - Tester avec différents formats markdown
  - _Exigences: 2.3_

- [~] 42.1 Écrire les tests de propriété pour le support markdown
  - **Propriété 25: Support du markdown dans la bio**
  - **Valide: Exigences 2.3**

- [~] 43. Implémenter la gestion des domaines personnalisés
  - Vérifier si l'utilisateur a configuré un domaine personnalisé
  - Rendre le profil accessible via le domaine personnalisé
  - Appliquer le footer white-label pour les domaines personnalisés
  - Gérer les redirections appropriées
  - _Exigences: 6.2, 7.3_

- [~] 43.1 Écrire les tests unitaires pour les domaines personnalisés
  - Tester l'accessibilité via domaine custom
  - Tester l'application du footer white-label
  - _Exigences: 6.2, 7.3_

- [~] 44. Implémenter la suppression du profil
  - Ajouter un bouton "Supprimer le profil" dans les paramètres
  - Implémenter la confirmation de suppression
  - Supprimer le profil et toutes les données analytics associées (CASCADE)
  - Respecter le droit à l'oubli (RGPD)
  - _Exigences: 13.5_

- [~] 45. Checkpoint final - Vérification complète
  - Tester l'ensemble du parcours utilisateur (création, configuration, consultation, analytics)
  - Vérifier les performances (Lighthouse: LCP < 2.5s, FID < 100ms, CLS < 0.1)
  - Vérifier l'accessibilité (WCAG AA)
  - Vérifier le responsive sur tous les appareils
  - Vérifier le SEO (meta tags, données structurées, sitemap)
  - S'assurer que tous les tests passent (unitaires et propriétés)
  - Demander à l'utilisateur si des questions se posent

## Notes

- Toutes les tâches sont obligatoires pour garantir une couverture de tests complète
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests de propriétés valident les propriétés universelles de correction (minimum 100 itérations par test)
- Les tests unitaires valident les exemples spécifiques et les cas limites
- Les deux types de tests sont complémentaires et nécessaires pour une couverture complète

