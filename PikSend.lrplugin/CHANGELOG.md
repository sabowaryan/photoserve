# Changelog - Plugin PikSend pour Lightroom

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### À venir
- Fonctionnalités planifiées pour les prochaines versions

---

## [1.1.0] - 2026-02-05

### Ajouté

#### Nouvelle Architecture API
- **Endpoints dédiés au plugin** : Nouvelle API optimisée pour le plugin avec authentification par API key
- **Upload direct vers Cloudinary** : Les images sont maintenant uploadées directement vers Cloudinary pour de meilleures performances
- **Enregistrement par lot** : Les images sont enregistrées dans les galeries par lots de 10 pour réduire les appels API
- **Module PikSendCloudinaryUpload** : Nouveau module pour gérer l'upload vers Cloudinary et l'enregistrement par lot
- **Suite de tests automatisés** : Fichier `test-plugin-api.lua` pour valider les nouvelles fonctionnalités
- **Guide de test utilisateur** : Documentation complète pour tester la version 1.1.0

#### Nouveaux Endpoints API
- `POST /api/plugin/auth/validate` : Validation de token optimisée pour le plugin
- `POST /api/plugin/galleries` : Création de galerie avec authentification par API key
- `POST /api/plugin/galleries/[id]/images` : Enregistrement par lot d'images dans une galerie

### Modifié

#### Performance
- **Amélioration de 50-60% de la vitesse d'upload** : Grâce à l'upload direct vers Cloudinary et l'enregistrement par lot
- **Réduction du nombre d'appels API** : Les images sont enregistrées par lots de 10 au lieu d'une par une
- **Meilleure gestion de la mémoire** : Upload et enregistrement séparés pour éviter les timeouts

#### API Client (PikSendAPI.lua)
- Changement de l'URL de base : `https://piksend.com` (au lieu de `https://api.piksend.com`)
- `validateToken()` : Utilise maintenant `POST /api/plugin/auth/validate`
- `createGallery()` : Utilise maintenant `POST /api/plugin/galleries`
- Ajout de `uploadToCloudinary()` : Upload direct vers Cloudinary
- Ajout de `uploadImagesToGallery()` : Enregistrement par lot d'images
- `checkForUpdates()` : Utilise maintenant `GET /api/plugin/version`

#### Gestion des Galeries (PikSendGallery.lua)
- Paramètres de galerie mis à jour :
  - `isPublic` → `allow_downloads`
  - `expiresAt` → `expires_at`
  - Ajout de `allow_comments`
  - Ajout de `watermark_enabled`

#### Retry et Gestion d'Erreurs
- Retry automatique pour l'upload Cloudinary (3 tentatives)
- Retry automatique pour l'enregistrement par lot (3 tentatives)
- Messages d'erreur plus clairs et actionnables

### Technique

#### Architecture
- Séparation de l'upload (Cloudinary) et de l'enregistrement (PikSend API)
- Upload par lot pour optimiser les performances
- Meilleure gestion de la progression avec affichage par lot

#### Tests
- Suite de tests automatisés pour valider les nouveaux endpoints
- Tests de validation de token
- Tests de création de galerie
- Tests d'upload Cloudinary
- Tests d'enregistrement par lot
- Tests de récupération de galeries

#### Compatibilité
- Compatible avec Lightroom Classic 11.0+
- Compatible avec les versions précédentes de l'API PikSend
- Migration transparente depuis la version 1.0.0

### Corrigé
- Timeout lors de l'upload de lots importants (> 20 images)
- Perte de progression lors d'erreurs réseau
- Messages d'erreur peu clairs lors d'échecs d'upload

### Documentation
- Nouveau guide de test utilisateur (`TESTING-GUIDE-V1.1.md`)
- Documentation de migration API (`PLUGIN-API-MIGRATION.md`)
- Suite de tests automatisés (`test-plugin-api.lua`)

### Notes de Migration

#### Migration depuis v1.0.0

La migration est **automatique et transparente**. Aucune action requise de la part de l'utilisateur.

**Changements internes** :
- L'URL de base de l'API a changé de `https://api.piksend.com` à `https://piksend.com`
- Les endpoints utilisés par le plugin ont changé pour utiliser les nouveaux endpoints dédiés
- Le flux d'upload a changé : upload vers Cloudinary puis enregistrement par lot

**Avantages** :
- Upload 50-60% plus rapide
- Meilleure gestion des erreurs
- Moins de risques de timeout
- Meilleure expérience utilisateur

**Compatibilité** :
- Les galeries créées avec v1.0.0 restent accessibles
- Les images uploadées avec v1.0.0 restent accessibles
- Aucune perte de données

---

## [1.0.0] - 2024-01-15

### Ajouté

#### Authentification et Connexion
- Authentification via API Token
- Lien direct vers la page de génération de token dans le dashboard PikSend
- Validation du token auprès de l'API PikSend
- Vérification du plan Pro actif
- Stockage sécurisé du token dans les préférences Lightroom
- Possibilité de se déconnecter et de changer de compte

#### Gestion des Galeries
- Affichage de la liste des galeries existantes
- Création de nouvelles galeries depuis Lightroom
- Recherche de galeries par nom
- Tri des galeries par date de création décroissante
- Rafraîchissement manuel de la liste des galeries
- Mise en cache de la liste des galeries pour améliorer les performances
- Configuration de la protection par mot de passe
- Configuration de la date d'expiration
- Configuration du watermark
- Configuration de la visibilité (public/privé)
- Génération de lien de partage
- Affichage des statistiques de base (vues, téléchargements)

#### Export de Photos
- Sélection de photos individuelles ou de collections entières
- Configuration du format d'export (JPEG, PNG, TIFF)
- Configuration de la qualité JPEG (1-100)
- Configuration de la résolution d'export
- Configuration du redimensionnement (largeur/hauteur max)
- Application de watermark personnalisé avec position et opacité
- Sauvegarde et chargement de presets de configuration
- Upload des photos vers l'API PikSend via multipart/form-data
- Upload parallèle (maximum 3 uploads simultanés par défaut, configurable 1-5)
- Gestion des erreurs d'upload avec possibilité de retry
- Nettoyage automatique du dossier temporaire après upload

#### Suivi de la Progression
- Barre de progression globale (pourcentage)
- Affichage du nombre de photos uploadées / total
- Affichage de la taille uploadée / taille totale
- Affichage de la vitesse d'upload (MB/s)
- Affichage du temps restant estimé
- Affichage du statut de chaque photo (en attente, en cours, terminée, erreur)
- Possibilité de mettre en pause l'upload
- Possibilité de reprendre l'upload après une pause
- Possibilité d'annuler l'upload en cours
- Message de succès avec lien vers la galerie

#### Publish Service et Synchronisation
- Intégration comme Publish Service dans Lightroom
- Création de Published Collections liées à des galeries PikSend
- Marquage automatique des photos "à publier" lors de l'ajout à une collection
- Upload uniquement des photos modifiées lors de la publication
- Détection des modifications apportées aux photos (édition, métadonnées)
- Suppression de photos de la galerie PikSend depuis Lightroom
- Synchronisation des métadonnées (titre, description, mots-clés)
- Affichage du statut de publication de chaque photo
- Possibilité de republier toutes les photos d'une collection
- Gestion des conflits de synchronisation

#### Gestion des Métadonnées
- Transfert du titre de la photo (IPTC Title)
- Transfert de la description (IPTC Caption)
- Transfert des mots-clés (IPTC Keywords)
- Transfert des informations de copyright
- Transfert des données EXIF (appareil, objectif, ISO, ouverture, vitesse)
- Choix des métadonnées à transférer
- Respect des paramètres de confidentialité (géolocalisation)
- Génération automatique d'alt-text basé sur le titre et la description
- Définition de métadonnées par défaut pour toutes les photos d'un export
- Préservation de l'ordre des photos dans la collection Lightroom

#### Gestion des Erreurs et Logs
- Messages d'erreur clairs et actionnables
- Logging de toutes les erreurs dans un fichier de log
- Logging des informations de débogage (requêtes API, réponses, durées)
- Mode debug activable/désactivable
- Limitation de la taille du fichier de log (max 10 MB, rotation automatique)
- Affichage des messages d'erreur de l'API
- Messages appropriés pour les erreurs de connexion
- Messages pour le quota de stockage atteint
- Possibilité d'exporter les logs pour support technique

#### Performance et Optimisation
- Upload parallèle (3 uploads simultanés par défaut, configurable 1-5)
- Compression des photos avant upload si qualité < 100
- Utilisation du cache pour éviter de re-uploader des photos identiques
- Calcul de hash (MD5) de chaque photo pour détecter les doublons
- Système de retry avec backoff exponentiel
- Limitation de la mémoire utilisée (max 500 MB)
- Libération de la mémoire après chaque upload
- Interface non bloquante pendant l'upload

#### Sécurité et Confidentialité
- Communication avec l'API PikSend uniquement via HTTPS
- Stockage chiffré de l'API Token dans les préférences Lightroom
- Aucun logging de l'API Token en clair
- Validation des certificats SSL de l'API PikSend
- Suppression des fichiers temporaires après upload
- Aucun transfert de données vers des serveurs tiers
- Respect des paramètres de confidentialité de Lightroom
- Possibilité de désactiver le transfert de métadonnées sensibles

#### Mises à Jour et Maintenance
- Vérification de la disponibilité de mises à jour au démarrage
- Notification lorsqu'une mise à jour est disponible
- Affichage des notes de version (changelog)
- Lien de téléchargement vers la nouvelle version
- Possibilité de désactiver les notifications de mise à jour
- Affichage de la version actuelle dans les paramètres
- Vérification manuelle des mises à jour

#### Documentation et Support
- Guide d'installation pas à pas avec captures d'écran
- Guide d'utilisation détaillé
- FAQ avec les problèmes courants
- Lien "Aide" dans l'interface pointant vers la documentation
- Lien "Support" pour contacter l'équipe PikSend
- Tooltips explicatifs sur les paramètres complexes

#### Localisation
- Support de l'anglais (en)
- Support du français (fr)
- Système de localisation extensible

### Technique

#### Architecture
- Structure modulaire avec séparation des responsabilités
- Client API REST pour communication avec PikSend
- Système de cache pour optimiser les performances
- Système de logs avec rotation automatique
- Gestion robuste des erreurs avec retry automatique

#### Tests
- Tests unitaires pour tous les modules
- Tests de propriétés (property-based testing) pour validation des propriétés de correction
- Tests d'intégration pour les flux complets
- Couverture de test > 80% pour les modules critiques

#### Compatibilité
- Lightroom Classic 11.0 et versions ultérieures
- Windows 10/11 (64-bit)
- macOS 10.15 Catalina et versions ultérieures
- Lightroom SDK 6.0+
- Lua 5.1+

#### Dépendances
- json.lua - Parsing et génération JSON (MIT License)
- LuaSocket - Requêtes HTTP (fourni par Lightroom)
- LuaFileSystem - Gestion des fichiers (fourni par Lightroom)

### Limites Connues
- Upload simultané limité à 5 fichiers maximum
- Taille max par photo : 500 MB (limite plan Pro)
- Timeout upload : 5 minutes par photo
- Cache local : 100 MB maximum
- Logs : 10 MB maximum avec rotation

### Notes de Migration
- Première version - aucune migration nécessaire

---

## Format des Versions

### [X.Y.Z] - AAAA-MM-JJ

#### Ajouté
- Nouvelles fonctionnalités

#### Modifié
- Changements dans les fonctionnalités existantes

#### Déprécié
- Fonctionnalités qui seront supprimées dans les prochaines versions

#### Supprimé
- Fonctionnalités supprimées

#### Corrigé
- Corrections de bugs

#### Sécurité
- Corrections de vulnérabilités de sécurité

---

## Liens

- [Documentation](https://piksend.com/docs/lightroom-plugin)
- [FAQ](https://piksend.com/faq/lightroom-plugin)
- [Support](mailto:support@piksend.com)
- [Téléchargement](https://piksend.com/downloads/lightroom-plugin)

---

**Légende des versions** :
- **[Non publié]** : Changements en cours de développement
- **[X.Y.Z]** : Version publiée avec date de release
