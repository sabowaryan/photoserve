# Document des Exigences - Plugin Adobe Lightroom

## Introduction

Cette fonctionnalité permet aux photographes avec un plan Pro d'exporter leurs photos directement depuis Adobe Lightroom Classic vers PikSend sans quitter leur workflow de post-production. Le plugin s'intègre nativement dans Lightroom et offre une expérience fluide pour créer des galeries et uploader des photos sélectionnées.

## Glossaire

- **Plugin**: Extension Lightroom développée en Lua qui s'intègre dans l'interface Lightroom
- **Lightroom Classic**: Application de bureau Adobe pour la gestion et l'édition de photos
- **Publish Service**: Service d'export Lightroom permettant de publier des photos vers des plateformes tierces
- **Collection**: Groupe de photos dans Lightroom qui peut être synchronisé avec une galerie PikSend
- **Photographe_Pro**: Utilisateur avec un abonnement au plan Pro
- **API_Token**: Jeton d'authentification pour sécuriser les communications entre le plugin et PikSend
- **Preset**: Configuration d'export prédéfinie (qualité, format, watermark, etc.)

## Exigences

### Exigence 1: Installation et Configuration du Plugin

**User Story:** En tant que photographe Pro, je veux installer le plugin Lightroom, afin de pouvoir exporter mes photos vers PikSend.

#### Critères d'Acceptation

1. THE System SHALL fournir un fichier .lrplugin téléchargeable depuis le dashboard PikSend
2. THE Plugin SHALL être compatible avec Lightroom Classic 11.0 et versions ultérieures
3. THE Plugin SHALL être compatible avec Windows 10/11 et macOS 10.15+
4. WHEN un Photographe_Pro installe le plugin, THE Plugin SHALL apparaître dans le Gestionnaire de modules externes de Lightroom
5. THE Plugin SHALL afficher sa version et son statut dans les informations du module
6. THE System SHALL fournir une documentation d'installation détaillée
7. THE Plugin SHALL vérifier la compatibilité de la version Lightroom au démarrage
8. WHEN la version Lightroom est incompatible, THE Plugin SHALL afficher un message d'erreur explicite

### Exigence 2: Authentification et Connexion au Compte PikSend

**User Story:** En tant que photographe Pro, je veux me connecter à mon compte PikSend depuis Lightroom, afin d'accéder à mes galeries.

#### Critères d'Acceptation

1. THE Plugin SHALL permettre l'authentification via API Token
2. THE Plugin SHALL fournir un lien direct vers la page de génération de token dans le dashboard PikSend
3. WHEN un Photographe_Pro saisit un API Token, THE Plugin SHALL valider le token auprès de l'API PikSend
4. WHEN le token est valide, THE Plugin SHALL récupérer et afficher le nom de l'utilisateur
5. WHEN le token est invalide, THE Plugin SHALL afficher un message d'erreur clair
6. THE Plugin SHALL stocker le token de manière sécurisée dans les préférences Lightroom
7. THE Plugin SHALL vérifier que l'utilisateur a un plan Pro actif
8. WHEN l'utilisateur n'a pas de plan Pro, THE Plugin SHALL afficher un message invitant à upgrader
9. THE Plugin SHALL permettre de se déconnecter et de changer de compte
10. THE Plugin SHALL rafraîchir automatiquement le token expiré si un refresh token est disponible

### Exigence 3: Création et Sélection de Galeries

**User Story:** En tant que photographe Pro, je veux créer ou sélectionner une galerie PikSend, afin d'organiser mes exports.

#### Critères d'Acceptation

1. THE Plugin SHALL afficher la liste des galeries existantes de l'utilisateur
2. THE Plugin SHALL permettre de créer une nouvelle galerie depuis Lightroom
3. WHEN un Photographe_Pro crée une galerie, THE Plugin SHALL demander: titre, description (optionnel), expiration (optionnel)
4. THE Plugin SHALL valider que le titre de galerie respecte les contraintes (1-200 caractères)
5. THE Plugin SHALL créer la galerie via l'API PikSend et retourner l'ID de la galerie
6. THE Plugin SHALL permettre de rechercher une galerie par nom
7. THE Plugin SHALL afficher pour chaque galerie: titre, nombre d'images, date de création, statut (active/expirée)
8. THE Plugin SHALL trier les galeries par date de création décroissante par défaut
9. THE Plugin SHALL permettre de rafraîchir la liste des galeries manuellement
10. THE Plugin SHALL mettre en cache la liste des galeries pour améliorer les performances

### Exigence 4: Configuration des Paramètres d'Export

**User Story:** En tant que photographe Pro, je veux configurer les paramètres d'export, afin de contrôler la qualité et le format des photos uploadées.

#### Critères d'Acceptation

1. THE Plugin SHALL permettre de configurer le format d'export (JPEG, PNG, TIFF)
2. THE Plugin SHALL permettre de configurer la qualité JPEG (1-100)
3. THE Plugin SHALL permettre de configurer la résolution d'export (originale, HD, web)
4. THE Plugin SHALL permettre de configurer le redimensionnement (largeur/hauteur max)
5. THE Plugin SHALL permettre d'appliquer un watermark personnalisé
6. THE Plugin SHALL permettre de configurer la position du watermark (coins, centre)
7. THE Plugin SHALL permettre de configurer l'opacité du watermark (0-100%)
8. THE Plugin SHALL permettre de sauvegarder des presets de configuration
9. THE Plugin SHALL permettre de charger des presets existants
10. THE Plugin SHALL valider que les paramètres respectent les limites du plan Pro (taille max 500 MB)

### Exigence 5: Sélection et Upload des Photos

**User Story:** En tant que photographe Pro, je veux sélectionner et uploader mes photos, afin de les publier sur PikSend.

#### Critères d'Acceptation

1. THE Plugin SHALL permettre de sélectionner des photos individuelles dans Lightroom
2. THE Plugin SHALL permettre de sélectionner des collections entières
3. THE Plugin SHALL afficher le nombre de photos sélectionnées et la taille totale estimée
4. WHEN un Photographe_Pro lance l'export, THE Plugin SHALL appliquer les paramètres configurés
5. THE Plugin SHALL exporter les photos dans un dossier temporaire
6. THE Plugin SHALL uploader les photos vers l'API PikSend via multipart/form-data
7. THE Plugin SHALL uploader les photos en parallèle (maximum 3 uploads simultanés)
8. THE Plugin SHALL gérer les erreurs d'upload (timeout, connexion perdue, erreur serveur)
9. WHEN une photo échoue, THE Plugin SHALL permettre de réessayer l'upload
10. THE Plugin SHALL nettoyer le dossier temporaire après upload réussi

### Exigence 6: Suivi de la Progression de l'Upload

**User Story:** En tant que photographe Pro, je veux voir la progression de l'upload, afin de savoir quand mes photos seront disponibles.

#### Critères d'Acceptation

1. THE Plugin SHALL afficher une barre de progression globale (pourcentage)
2. THE Plugin SHALL afficher le nombre de photos uploadées / total
3. THE Plugin SHALL afficher la taille uploadée / taille totale
4. THE Plugin SHALL afficher la vitesse d'upload (MB/s)
5. THE Plugin SHALL afficher le temps restant estimé
6. THE Plugin SHALL afficher le statut de chaque photo (en attente, en cours, terminée, erreur)
7. THE Plugin SHALL permettre de mettre en pause l'upload
8. THE Plugin SHALL permettre de reprendre l'upload après une pause
9. THE Plugin SHALL permettre d'annuler l'upload en cours
10. WHEN l'upload est terminé, THE Plugin SHALL afficher un message de succès avec le lien vers la galerie

### Exigence 7: Synchronisation et Publish Service

**User Story:** En tant que photographe Pro, je veux synchroniser automatiquement mes collections Lightroom avec PikSend, afin de maintenir mes galeries à jour.

#### Critères d'Acceptation

1. THE Plugin SHALL s'intégrer comme Publish Service dans Lightroom
2. THE Plugin SHALL permettre de créer des Published Collections liées à des galeries PikSend
3. WHEN un Photographe_Pro ajoute une photo à une Published Collection, THE Plugin SHALL marquer la photo comme "à publier"
4. WHEN un Photographe_Pro clique sur "Publier", THE Plugin SHALL uploader uniquement les photos modifiées
5. THE Plugin SHALL détecter les modifications apportées aux photos (édition, métadonnées)
6. THE Plugin SHALL permettre de supprimer des photos de la galerie PikSend depuis Lightroom
7. THE Plugin SHALL synchroniser les métadonnées (titre, description, mots-clés) avec PikSend
8. THE Plugin SHALL afficher le statut de publication de chaque photo (publié, modifié, à publier)
9. THE Plugin SHALL permettre de republier toutes les photos d'une collection
10. THE Plugin SHALL gérer les conflits de synchronisation (photo supprimée sur PikSend mais présente dans Lightroom)

### Exigence 8: Gestion des Métadonnées

**User Story:** En tant que photographe Pro, je veux que les métadonnées de mes photos soient transférées, afin de préserver les informations importantes.

#### Critères d'Acceptation

1. THE Plugin SHALL transférer le titre de la photo (IPTC Title) vers PikSend
2. THE Plugin SHALL transférer la description (IPTC Caption) vers PikSend
3. THE Plugin SHALL transférer les mots-clés (IPTC Keywords) vers PikSend
4. THE Plugin SHALL transférer les informations de copyright vers PikSend
5. THE Plugin SHALL transférer les données EXIF (appareil, objectif, ISO, ouverture, vitesse)
6. THE Plugin SHALL permettre de choisir quelles métadonnées transférer
7. THE Plugin SHALL respecter les paramètres de confidentialité (ne pas transférer la géolocalisation si désactivée)
8. THE Plugin SHALL générer automatiquement un alt-text basé sur le titre et la description
9. THE Plugin SHALL permettre de définir des métadonnées par défaut pour toutes les photos d'un export
10. THE Plugin SHALL préserver l'ordre des photos dans la collection Lightroom

### Exigence 9: Gestion des Erreurs et Logs

**User Story:** En tant que photographe Pro, je veux comprendre les erreurs qui se produisent, afin de les résoudre rapidement.

#### Critères d'Acceptation

1. WHEN une erreur se produit, THE Plugin SHALL afficher un message d'erreur clair et actionnable
2. THE Plugin SHALL logger toutes les erreurs dans un fichier de log
3. THE Plugin SHALL logger les informations de débogage (requêtes API, réponses, durées)
4. THE Plugin SHALL permettre d'activer/désactiver le mode debug
5. THE Plugin SHALL afficher le chemin du fichier de log dans les paramètres
6. THE Plugin SHALL limiter la taille du fichier de log (max 10 MB, rotation automatique)
7. WHEN l'API PikSend retourne une erreur, THE Plugin SHALL afficher le message d'erreur de l'API
8. WHEN la connexion internet est perdue, THE Plugin SHALL afficher un message approprié
9. WHEN le quota de stockage est atteint, THE Plugin SHALL afficher un message invitant à upgrader ou libérer de l'espace
10. THE Plugin SHALL permettre d'exporter les logs pour support technique

### Exigence 10: Performance et Optimisation

**User Story:** En tant que photographe Pro, je veux que le plugin soit rapide et efficace, afin de ne pas ralentir mon workflow.

#### Critères d'Acceptation

1. THE Plugin SHALL uploader les photos en parallèle (3 uploads simultanés par défaut)
2. THE Plugin SHALL permettre de configurer le nombre d'uploads simultanés (1-5)
3. THE Plugin SHALL compresser les photos avant upload si la qualité est < 100
4. THE Plugin SHALL utiliser le cache pour éviter de re-uploader des photos identiques
5. THE Plugin SHALL calculer un hash (MD5) de chaque photo pour détecter les doublons
6. THE Plugin SHALL réutiliser les connexions HTTP (keep-alive)
7. THE Plugin SHALL implémenter un système de retry avec backoff exponentiel
8. THE Plugin SHALL limiter la mémoire utilisée (max 500 MB)
9. THE Plugin SHALL libérer la mémoire après chaque upload
10. THE Plugin SHALL ne pas bloquer l'interface Lightroom pendant l'upload

### Exigence 11: Sécurité et Confidentialité

**User Story:** En tant que photographe Pro, je veux que mes photos et mes identifiants soient sécurisés, afin de protéger mon travail.

#### Critères d'Acceptation

1. THE Plugin SHALL communiquer avec l'API PikSend uniquement via HTTPS
2. THE Plugin SHALL stocker l'API Token de manière chiffrée dans les préférences Lightroom
3. THE Plugin SHALL ne jamais logger l'API Token en clair
4. THE Plugin SHALL valider les certificats SSL de l'API PikSend
5. THE Plugin SHALL supprimer les fichiers temporaires après upload
6. THE Plugin SHALL ne pas transférer de données vers des serveurs tiers
7. THE Plugin SHALL respecter les paramètres de confidentialité de Lightroom
8. THE Plugin SHALL permettre de désactiver le transfert de métadonnées sensibles (géolocalisation)
9. THE Plugin SHALL afficher une politique de confidentialité accessible depuis les paramètres
10. THE Plugin SHALL être conforme au RGPD pour les utilisateurs européens

### Exigence 12: Mises à Jour et Maintenance

**User Story:** En tant que photographe Pro, je veux être notifié des mises à jour, afin de bénéficier des nouvelles fonctionnalités.

#### Critères d'Acceptation

1. THE Plugin SHALL vérifier la disponibilité de mises à jour au démarrage de Lightroom
2. WHEN une mise à jour est disponible, THE Plugin SHALL afficher une notification
3. THE Plugin SHALL afficher les notes de version (changelog) de la mise à jour
4. THE Plugin SHALL fournir un lien de téléchargement vers la nouvelle version
5. THE Plugin SHALL permettre de désactiver les notifications de mise à jour
6. THE Plugin SHALL afficher la version actuelle dans les paramètres
7. THE Plugin SHALL permettre de vérifier manuellement les mises à jour
8. THE System SHALL maintenir une page de téléchargement avec toutes les versions du plugin
9. THE System SHALL fournir un changelog détaillé pour chaque version
10. THE Plugin SHALL être rétrocompatible avec les versions précédentes de l'API PikSend

### Exigence 13: Documentation et Support

**User Story:** En tant que photographe Pro, je veux accéder à une documentation claire, afin d'utiliser le plugin efficacement.

#### Critères d'Acceptation

1. THE System SHALL fournir un guide d'installation pas à pas avec captures d'écran
2. THE System SHALL fournir un guide d'utilisation détaillé
3. THE System SHALL fournir une FAQ avec les problèmes courants
4. THE System SHALL fournir des tutoriels vidéo pour les fonctionnalités principales
5. THE Plugin SHALL inclure un lien "Aide" dans l'interface pointant vers la documentation
6. THE Plugin SHALL inclure un lien "Support" pour contacter l'équipe PikSend
7. THE System SHALL fournir un forum communautaire pour les utilisateurs du plugin
8. THE System SHALL fournir des exemples de presets d'export
9. THE Plugin SHALL afficher des tooltips explicatifs sur les paramètres complexes
10. THE System SHALL maintenir la documentation à jour avec chaque nouvelle version

### Exigence 14: Intégration avec les Fonctionnalités PikSend

**User Story:** En tant que photographe Pro, je veux accéder aux fonctionnalités PikSend depuis Lightroom, afin de gérer mes galeries complètement.

#### Critères d'Acceptation

1. THE Plugin SHALL permettre de configurer la protection par mot de passe d'une galerie
2. THE Plugin SHALL permettre de configurer la date d'expiration d'une galerie
3. THE Plugin SHALL permettre de configurer le watermark de la galerie
4. THE Plugin SHALL permettre de marquer une galerie comme publique ou privée
5. THE Plugin SHALL permettre de générer un lien de partage pour la galerie
6. THE Plugin SHALL permettre de copier le lien de la galerie dans le presse-papiers
7. THE Plugin SHALL afficher les statistiques de base de la galerie (vues, téléchargements)
8. THE Plugin SHALL permettre d'ouvrir la galerie dans le navigateur
9. THE Plugin SHALL permettre d'ouvrir le dashboard PikSend dans le navigateur
10. THE Plugin SHALL synchroniser les modifications de galerie faites sur PikSend vers Lightroom

## Contraintes Techniques

### Compatibilité
- Lightroom Classic 11.0 minimum (version 2021)
- Windows 10/11 (64-bit)
- macOS 10.15 Catalina minimum
- Connexion internet requise

### Limites
- Upload simultané: 3 fichiers par défaut (configurable 1-5)
- Taille max par photo: 500 MB (limite plan Pro)
- Timeout upload: 5 minutes par photo
- Cache local: 100 MB maximum
- Logs: 10 MB maximum avec rotation

### Dépendances
- Lightroom SDK 6.0+
- Lua 5.1+
- LuaSocket pour les requêtes HTTP
- LuaFileSystem pour la gestion des fichiers
- LuaCrypto pour le chiffrement du token

## Priorités

### Phase 1: MVP (Must Have)
- Installation et configuration
- Authentification par API Token
- Création et sélection de galeries
- Upload basique de photos
- Suivi de progression
- Gestion des erreurs basique

### Phase 2: Fonctionnalités Essentielles (Should Have)
- Configuration des paramètres d'export
- Presets d'export
- Upload parallèle
- Transfert de métadonnées
- Logs détaillés

### Phase 3: Fonctionnalités Avancées (Could Have)
- Publish Service et synchronisation
- Détection de doublons
- Gestion avancée des erreurs
- Statistiques de galerie
- Mises à jour automatiques

### Phase 4: Optimisations (Nice to Have)
- Cache intelligent
- Compression optimisée
- Interface améliorée
- Intégration complète avec PikSend
