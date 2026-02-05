# Plan d'Implémentation: Plugin Adobe Lightroom pour PikSend

## Vue d'ensemble

Ce plan implémente un plugin Lightroom Classic en Lua qui permet aux photographes Pro d'exporter leurs photos directement vers PikSend. L'implémentation suit une approche incrémentale avec validation à chaque étape via des tests unitaires et property-based tests.

## Tâches

- [x] 1. Configuration initiale du projet et structure du plugin
  - Créer la structure de dossiers PikSend.lrplugin/
  - Créer le fichier Info.lua avec les métadonnées du plugin
  - Configurer les dépendances (LuaSocket, LuaFileSystem, json.lua)
  - Créer les fichiers de base pour chaque module
  - _Exigences: 1.1, 1.4, 1.5_

- [x] 2. Implémenter le module d'authentification (PikSendAuth.lua)
  - [x] 2.1 Créer les fonctions de stockage sécurisé du token
    - Implémenter saveToken(), getToken(), clearToken()
    - Stocker dans LrPrefs avec chiffrement basique
    - _Exigences: 2.6, 11.2_
  
  - [x] 2.2 Écrire les tests de propriété pour le stockage de token
    - **Propriété 4: Round-trip du stockage de token**
    - **Valide: Exigences 2.6**
  
  - [x] 2.3 Implémenter le dialog d'authentification
    - Créer showLoginDialog() avec LrView
    - Ajouter champs pour token API et bouton vers dashboard
    - _Exigences: 2.1, 2.2_
  
  - [x] 2.4 Écrire les tests unitaires pour le dialog d'authentification
    - Tester l'affichage du dialog
    - Tester la validation des champs
    - _Exigences: 2.1, 2.2_

- [x] 3. Implémenter le client API REST (PikSendAPI.lua)
  - [x] 3.1 Créer la fonction validateToken()
    - Implémenter l'appel GET /api/auth/validate-token
    - Parser la réponse JSON
    - Gérer les erreurs réseau
    - _Exigences: 2.3, 2.4, 2.7_
  
  - [x] 3.2 Écrire les tests de propriété pour la validation de token
    - **Propriété 2: Validation de token API**
    - **Propriété 3: Récupération des informations utilisateur**
    - **Propriété 5: Vérification du plan Pro**
    - **Valide: Exigences 2.3, 2.4, 2.7**
  
  - [x] 3.3 Créer les fonctions de gestion des galeries
    - Implémenter getGalleries() - GET /api/galleries
    - Implémenter createGallery() - POST /api/galleries
    - _Exigences: 3.1, 3.2, 3.5_
  
  - [x] 3.4 Écrire les tests de propriété pour les galeries
    - **Propriété 9: Création de galerie via API**
    - **Propriété 46: Utilisation exclusive de HTTPS**
    - **Valide: Exigences 3.5, 11.1**


  - [x] 3.5 Implémenter la fonction uploadImage()
    - Construire le body multipart/form-data
    - Implémenter POST /api/galleries/:id/images
    - Gérer le timeout et les erreurs
    - _Exigences: 5.6, 5.8_
  
  - [x] 3.6 Écrire les tests de propriété pour l'upload
    - **Propriété 18: Format multipart/form-data**
    - **Propriété 20: Gestion des erreurs d'upload**
    - **Valide: Exigences 5.6, 5.8**

- [x] 4. Checkpoint - Vérifier l'authentification et les appels API
  - S'assurer que tous les tests passent
  - Tester manuellement la connexion avec un vrai token
  - Demander à l'utilisateur si des questions se posent

- [x] 5. Implémenter le module de gestion des galeries (PikSendGallery.lua)
  - [x] 5.1 Créer la fonction validateTitle()
    - Vérifier la longueur (1-200 caractères)
    - Retourner true/false avec message d'erreur
    - _Exigences: 3.4_
  
  - [x] 5.2 Écrire les tests de propriété pour la validation de titre
    - **Propriété 8: Validation du titre de galerie**
    - **Valide: Exigences 3.4**
  
  - [x] 5.3 Implémenter showCreateGalleryDialog()
    - Créer le dialog avec champs titre, description, expiration
    - Valider les entrées
    - Appeler createGallery() de l'API
    - _Exigences: 3.2, 3.3_
  
  - [x] 5.4 Implémenter refreshGalleries() avec cache
    - Récupérer les galeries via l'API
    - Mettre en cache pendant 5 minutes
    - Trier par date décroissante
    - _Exigences: 3.9, 3.10, 3.8_
  
  - [x] 5.5 Écrire les tests de propriété pour le cache et le tri
    - **Propriété 12: Tri des galeries par date**
    - **Propriété 13: Cache des galeries**
    - **Valide: Exigences 3.8, 3.10**
  
  - [x] 5.6 Implémenter searchGalleries()
    - Filtrer les galeries par nom (insensible à la casse)
    - _Exigences: 3.6_
  
  - [x] 5.7 Écrire les tests de propriété pour la recherche
    - **Propriété 10: Recherche de galerie par nom**
    - **Valide: Exigences 3.6**

- [x] 6. Implémenter le module de métadonnées (PikSendMetadata.lua)
  - [x] 6.1 Créer extractMetadata()
    - Extraire titre, description, mots-clés (IPTC)
    - Extraire copyright
    - Extraire données EXIF (appareil, ISO, ouverture, etc.)
    - Respecter les paramètres de confidentialité (GPS)
    - _Exigences: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_
  
  - [x] 6.2 Écrire les tests de propriété pour les métadonnées
    - **Propriété 34: Transfert complet des métadonnées**
    - **Propriété 35: Respect de la confidentialité de la géolocalisation**
    - **Valide: Exigences 8.1-8.5, 8.7**
  
  - [x] 6.3 Implémenter generateAltText()
    - Combiner titre et description pour créer un alt-text
    - _Exigences: 8.8_
  
  - [x] 6.4 Écrire les tests de propriété pour l'alt-text
    - **Propriété 36: Génération d'alt-text**
    - **Valide: Exigences 8.8**
  
  - [x] 6.5 Implémenter applyDefaultMetadata()
    - Appliquer les métadonnées par défaut aux photos qui n'en ont pas
    - _Exigences: 8.9_
  
  - [x] 6.6 Écrire les tests de propriété pour les métadonnées par défaut
    - **Propriété 37: Application des métadonnées par défaut**
    - **Valide: Exigences 8.9**

- [x] 7. Implémenter le module d'upload (PikSendUpload.lua)
  - [x] 7.1 Créer la structure UploadState
    - Définir les états: pending, uploading, completed, failed
    - Implémenter le suivi de progression
    - _Exigences: 6.6_
  
  - [x] 7.2 Implémenter uploadPhotosParallel()
    - Gérer max 3 uploads simultanés (configurable)
    - Utiliser LrTasks pour l'asynchrone
    - Mettre à jour l'état de progression
    - _Exigences: 5.7, 10.1, 10.2_
  
  - [x] 7.3 Écrire les tests de propriété pour les uploads parallèles
    - **Propriété 19: Limite d'uploads parallèles**
    - **Propriété 42: Configuration de la limite d'uploads simultanés**
    - **Valide: Exigences 5.7, 10.2**
  
  - [x] 7.4 Implémenter calculateProgress()
    - Calculer pourcentage, vitesse, temps restant
    - _Exigences: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 7.5 Écrire les tests de propriété pour le calcul de progression
    - **Propriété 23: Calcul de la progression globale**
    - **Propriété 24: Calcul de la vitesse d'upload**
    - **Propriété 25: Estimation du temps restant**
    - **Valide: Exigences 6.1-6.5**
  
  - [x] 7.6 Implémenter pause(), resume(), cancel()
    - Gérer la pause/reprise des uploads
    - Nettoyer les fichiers temporaires lors de l'annulation
    - _Exigences: 6.7, 6.8, 6.9_
  
  - [x] 7.7 Écrire les tests de propriété pour pause/resume/cancel
    - **Propriété 27: Pause de l'upload**
    - **Propriété 28: Reprise de l'upload**
    - **Propriété 29: Annulation de l'upload**
    - **Valide: Exigences 6.7, 6.8, 6.9**

- [x] 8. Checkpoint - Vérifier les uploads et la progression
  - S'assurer que tous les tests passent
  - Tester manuellement l'upload de plusieurs photos
  - Vérifier la gestion de la progression et des erreurs
  - Demander à l'utilisateur si des questions se posent

- [x] 9. Implémenter le module de gestion des erreurs et logs (PikSendLogger.lua)
  - [x] 9.1 Créer le système de logging
    - Implémenter log() avec niveaux (ERROR, WARN, INFO, DEBUG)
    - Écrire dans un fichier avec timestamp
    - Implémenter la rotation automatique à 10 MB
    - _Exigences: 9.2, 9.3, 9.6_
  
  - [x] 9.2 Écrire les tests de propriété pour le logging
    - **Propriété 39: Logging complet des erreurs et debug**
    - **Propriété 40: Rotation automatique des logs**
    - **Propriété 47: Sanitisation des logs**
    - **Valide: Exigences 9.2, 9.3, 9.6, 11.3**
  
  - [x] 9.3 Implémenter la gestion des erreurs API
    - Parser les messages d'erreur de l'API
    - Afficher des messages clairs à l'utilisateur
    - _Exigences: 9.1, 9.7_
  
  - [x] 9.4 Écrire les tests de propriété pour les erreurs API
    - **Propriété 41: Affichage des messages d'erreur API**
    - **Valide: Exigences 9.7**
  
  - [x] 9.5 Implémenter le système de retry avec backoff exponentiel
    - Retry automatique avec délais: 1s, 2s, 4s, 8s
    - Max 3 tentatives
    - _Exigences: 10.7_
  
  - [x] 9.6 Écrire les tests de propriété pour le retry
    - **Propriété 45: Backoff exponentiel pour les retries**
    - **Valide: Exigences 10.7**

- [x] 10. Implémenter le module de cache et optimisation (PikSendCache.lua)
  - [x] 10.1 Créer calculateHash()
    - Calculer le hash MD5 de chaque photo
    - _Exigences: 10.5_
  
  - [x] 10.2 Implémenter checkDuplicate()
    - Vérifier si une photo avec le même hash existe déjà
    - Éviter le re-upload
    - _Exigences: 10.4_
  
  - [x] 10.3 Écrire les tests de propriété pour la détection de doublons
    - **Propriété 44: Détection de doublons par hash**
    - **Valide: Exigences 10.4, 10.5**
  
  - [x] 10.4 Implémenter compressIfNeeded()
    - Compresser les photos si qualité < 100
    - _Exigences: 10.3_
  
  - [x] 10.5 Écrire les tests de propriété pour la compression
    - **Propriété 43: Compression conditionnelle**
    - **Valide: Exigences 10.3**


- [x] 11. Implémenter le module de presets (PikSendPresets.lua)
  - [x] 11.1 Créer savePreset() et loadPreset()
    - Sauvegarder les configurations d'export dans LrPrefs
    - Charger les presets existants
    - _Exigences: 4.8, 4.9_
  
  - [x] 11.2 Écrire les tests de propriété pour les presets
    - **Propriété 14: Round-trip des presets d'export**
    - **Valide: Exigences 4.8**
  
  - [x] 11.3 Implémenter validateExportSettings()
    - Valider la taille max (500 MB)
    - Valider les paramètres de format et qualité
    - _Exigences: 4.10_
  
  - [x] 11.4 Écrire les tests de propriété pour la validation
    - **Propriété 15: Validation de la taille maximale**
    - **Valide: Exigences 4.10**

- [x] 12. Implémenter l'Export Service Provider (PikSendExportServiceProvider.lua)
  - [x] 12.1 Créer sectionsForTopOfDialog()
    - Section authentification avec bouton connexion/déconnexion
    - Section sélection de galerie avec boutons rafraîchir/créer
    - Section paramètres d'export (format, qualité, watermark)
    - _Exigences: 2.1, 3.1, 3.2, 4.1-4.7_
  
  - [x] 12.2 Implémenter processRenderedPhotos()
    - Boucle sur les photos sélectionnées
    - Extraire les métadonnées
    - Uploader via PikSendUpload
    - Afficher la progression
    - Nettoyer les fichiers temporaires
    - _Exigences: 5.1-5.10, 6.10_
  
  - [x] 12.3 Écrire les tests de propriété pour l'export
    - **Propriété 16: Calcul du nombre et de la taille totale**
    - **Propriété 17: Application des paramètres d'export**
    - **Propriété 22: Nettoyage des fichiers temporaires**
    - **Propriété 38: Préservation de l'ordre des photos**
    - **Valide: Exigences 5.3, 5.4, 5.10, 8.10**

- [x] 13. Checkpoint - Vérifier l'Export Service complet
  - S'assurer que tous les tests passent
  - Tester manuellement un export complet de bout en bout
  - Vérifier que les métadonnées sont correctement transférées
  - Demander à l'utilisateur si des questions se posent

- [x] 14. Implémenter le Publish Service Provider (PikSendPublishServiceProvider.lua)
  - [x] 14.1 Créer la structure Published Collection
    - Lier chaque collection à une galerie PikSend
    - Stocker l'ID de galerie dans les métadonnées de la collection
    - _Exigences: 7.1, 7.2_
  
  - [x] 14.2 Implémenter la détection des modifications
    - Détecter les changements de contenu (hash MD5)
    - Détecter les changements de métadonnées
    - Marquer les photos comme "à publier" ou "modifié"
    - _Exigences: 7.3, 7.4, 7.5_
  
  - [x] 14.3 Écrire les tests de propriété pour la détection de modifications
    - **Propriété 30: Marquage des photos à publier**
    - **Propriété 31: Upload sélectif des photos modifiées**
    - **Propriété 32: Détection des modifications**
    - **Valide: Exigences 7.3, 7.4, 7.5**
  
  - [x] 14.4 Implémenter processRenderedPhotos() pour Publish Service
    - Uploader uniquement les photos modifiées
    - Synchroniser les métadonnées
    - Mettre à jour le statut de publication
    - _Exigences: 7.4, 7.7, 7.8_
  
  - [x] 14.5 Implémenter deletePhotosFromPublishedCollection()
    - Appeler l'API DELETE pour supprimer les photos
    - Mettre à jour l'état local
    - _Exigences: 7.6_
  
  - [x] 14.6 Écrire les tests de propriété pour la synchronisation
    - **Propriété 33: Suppression synchronisée**
    - **Valide: Exigences 7.6**
  
  - [x] 14.7 Implémenter la gestion des conflits
    - Détecter les photos supprimées sur PikSend mais présentes dans Lightroom
    - Proposer des options de résolution
    - _Exigences: 7.10_
  
  - [x] 14.8 Écrire les tests de propriété pour les conflits
    - **Propriété 54: Synchronisation bidirectionnelle**
    - **Valide: Exigences 14.10**

- [x] 15. Implémenter les fonctionnalités avancées de galerie (PikSendGallerySettings.lua)
  - [x] 15.1 Créer configureGallerySettings()
    - Configurer protection par mot de passe
    - Configurer date d'expiration
    - Configurer watermark
    - Configurer visibilité (public/privé)
    - _Exigences: 14.1, 14.2, 14.3, 14.4_
  
  - [x] 15.2 Écrire les tests de propriété pour les paramètres de galerie
    - **Propriété 51: Configuration complète de galerie**
    - **Valide: Exigences 14.1-14.4**
  
  - [x] 15.3 Implémenter generateShareLink()
    - Générer le lien au format https://piksend.com/g/{galleryId}
    - _Exigences: 14.5_
  
  - [x] 15.4 Écrire les tests de propriété pour le lien de partage
    - **Propriété 52: Génération de lien de partage**
    - **Valide: Exigences 14.5**
  
  - [x] 15.5 Implémenter fetchGalleryStats()
    - Récupérer les statistiques (vues, téléchargements)
    - Afficher dans l'interface
    - _Exigences: 14.7_
  
  - [x] 15.6 Écrire les tests de propriété pour les statistiques
    - **Propriété 53: Récupération des statistiques de galerie**
    - **Valide: Exigences 14.7**

- [x] 16. Implémenter le système de mises à jour (PikSendUpdater.lua)
  - [x] 16.1 Créer checkForUpdates()
    - Appeler l'API pour vérifier la version disponible
    - Comparer avec la version actuelle
    - _Exigences: 12.1_
  
  - [x] 16.2 Écrire les tests de propriété pour les mises à jour
    - **Propriété 49: Vérification des mises à jour**
    - **Propriété 50: Notification de mise à jour disponible**
    - **Valide: Exigences 12.1, 12.2**
  
  - [x] 16.3 Implémenter showUpdateNotification()
    - Afficher une notification avec changelog
    - Fournir un lien de téléchargement
    - _Exigences: 12.2, 12.3, 12.4_

- [x] 17. Checkpoint - Vérifier toutes les fonctionnalités
  - S'assurer que tous les tests passent
  - Tester manuellement le Publish Service
  - Tester les paramètres avancés de galerie
  - Tester le système de mises à jour
  - Demander à l'utilisateur si des questions se posent

- [x] 18. Implémenter les composants UI (PikSendUI.lua)
  - [x] 18.1 Créer les composants réutilisables
    - Barre de progression avec détails
    - Dialog de confirmation
    - Dialog d'erreur avec options de retry
    - _Exigences: 6.1-6.6, 9.1_
  
  - [x] 18.2 Implémenter showProgressDialog()
    - Afficher la progression globale
    - Afficher le statut de chaque photo
    - Boutons pause/resume/cancel
    - _Exigences: 6.1-6.9_

- [ ] 19. Implémenter les utilitaires (PikSendUtils.lua)
  - [x] 19.1 Créer les fonctions utilitaires
    - formatFileSize() - Convertir bytes en KB/MB/GB
    - formatDuration() - Convertir secondes en format lisible
    - sanitizeFilename() - Nettoyer les noms de fichiers
    - validateUrl() - Vérifier que les URLs sont HTTPS
    - _Exigences: 11.1_
  
  - [x] 19.2 Écrire les tests de propriété pour les URLs
    - **Propriété 46: Utilisation exclusive de HTTPS**
    - **Propriété 48: Restriction des requêtes réseau**
    - **Valide: Exigences 11.1, 11.6**

- [ ] 20. Implémenter la localisation (localization/)
  - [x] 20.1 Créer les fichiers de traduction
    - en.lua - Traductions anglaises
    - fr.lua - Traductions françaises
    - _Exigences: 13.1-13.10_
  
  - [x] 20.2 Intégrer les traductions dans tous les modules
    - Remplacer les chaînes en dur par des clés de traduction
    - Utiliser LOC() pour récupérer les traductions

- [ ] 21. Tests d'intégration complets
  - [x] 21.1 Écrire les tests d'intégration pour le flux d'authentification
    - Tester le flux complet: saisie token → validation → récupération galeries
    - _Exigences: 2.1-2.10_
  
  - [x] 21.2 Écrire les tests d'intégration pour le flux d'export
    - Tester le flux complet: sélection photos → configuration → upload → succès
    - _Exigences: 5.1-5.10_
  
  - [x] 21.3 Écrire les tests d'intégration pour le Publish Service
    - Tester la synchronisation complète avec détection de modifications
    - _Exigences: 7.1-7.10_

- [ ] 22. Documentation et ressources
  - [x] 22.1 Créer le guide d'installation
    - Instructions pas à pas avec captures d'écran
    - Troubleshooting des problèmes courants
    - _Exigences: 13.1_
  
  - [-] 22.2 Créer le guide d'utilisation
    - Documentation de toutes les fonctionnalités
    - Exemples de workflows
    - _Exigences: 13.2_
  
  - [x] 22.3 Créer la FAQ
    - Questions fréquentes et réponses
    - _Exigences: 13.3_
  
  - [x] 22.4 Ajouter les ressources visuelles
    - Icône du plugin (resources/icon.png)
    - Logo PikSend (resources/logo.png)
    - Watermark par défaut (resources/watermark-default.png)

- [x] 23. Checkpoint final - Validation complète
  - S'assurer que tous les tests passent (unitaires, propriétés, intégration)
  - Tester manuellement sur Windows et macOS
  - Tester avec différentes versions de Lightroom (11.0, 12.0, 13.0)
  - Vérifier la performance et l'utilisation mémoire
  - Valider la sécurité (HTTPS, chiffrement token, sanitisation logs)
  - Demander à l'utilisateur si des questions se posent

- [ ] 24. Packaging et distribution
  - [x] 24.1 Créer le package .lrplugin
    - Compresser tous les fichiers
    - Vérifier que toutes les dépendances sont incluses
    - _Exigences: 1.1_
  
  - [-] 24.2 Créer la page de téléchargement
    - Uploader le plugin sur le dashboard PikSend
    - Créer le changelog
    - _Exigences: 12.8, 12.9_
  
  - [ ] 24.3 Tester l'installation depuis le dashboard
    - Télécharger et installer le plugin
    - Vérifier qu'il apparaît dans Lightroom
    - _Exigences: 1.1, 1.4_

## Notes

- Toutes les tâches sont obligatoires pour une implémentation complète et robuste
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles (minimum 100 itérations par test)
- Les tests unitaires valident les exemples spécifiques et les cas limites
- L'implémentation suit une approche bottom-up: modules de base → services → UI → intégration
- Framework de test: Busted pour les tests unitaires et property-based tests en Lua


