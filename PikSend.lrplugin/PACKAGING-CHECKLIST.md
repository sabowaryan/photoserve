# Checklist de Packaging - Plugin PikSend pour Lightroom

## Vue d'ensemble

Cette checklist doit être complétée avant chaque release du plugin. Elle garantit que le package est complet, testé et prêt pour la distribution.

**Version du plugin** : ___________  
**Date de release** : ___________  
**Responsable** : ___________

---

## 1. Préparation Pré-Packaging

### 1.1 Tests et Validation

- [ ] **Tous les tests unitaires passent**
  - Commande : `.\run-busted.ps1`
  - Résultat : _____ tests passés, _____ échecs
  - Notes : _______________________________

- [ ] **Tous les tests de propriétés passent**
  - Minimum 100 itérations par test
  - Résultat : _____ propriétés validées
  - Notes : _______________________________

- [ ] **Tous les tests d'intégration passent**
  - Test du flux d'authentification
  - Test du flux d'export
  - Test du Publish Service
  - Notes : _______________________________

- [ ] **Tests manuels sur Windows 10/11**
  - Version Lightroom testée : _______
  - Fonctionnalités testées : _______
  - Problèmes identifiés : _______

- [ ] **Tests manuels sur macOS 10.15+**
  - Version Lightroom testée : _______
  - Fonctionnalités testées : _______
  - Problèmes identifiés : _______

### 1.2 Version et Documentation

- [ ] **Numéro de version mis à jour dans Info.lua**
  - Version actuelle : _______
  - Nouvelle version : _______
  - Format : major.minor.revision

- [ ] **CHANGELOG.md mis à jour**
  - Nouvelles fonctionnalités documentées
  - Corrections de bugs documentées
  - Changements incompatibles documentés (si applicable)

- [ ] **README.md à jour**
  - Description du plugin
  - Fonctionnalités principales
  - Liens vers la documentation

- [ ] **GUIDE-INSTALLATION.md à jour**
  - Instructions d'installation Windows
  - Instructions d'installation macOS
  - Captures d'écran à jour

- [ ] **USER-GUIDE.md à jour**
  - Guide d'utilisation complet
  - Exemples de workflows
  - Troubleshooting

- [ ] **FAQ.md à jour**
  - Questions fréquentes
  - Réponses claires et actionnables

---

## 2. Validation de la Structure du Package

### 2.1 Fichiers Requis - Modules Principaux

- [ ] **Info.lua** - Métadonnées du plugin
- [ ] **PikSendExportServiceProvider.lua** - Export Service
- [ ] **PikSendPublishServiceProvider.lua** - Publish Service
- [ ] **PikSendPluginInfoProvider.lua** - Plugin Info Provider
- [ ] **PikSendAPI.lua** - Client API REST
- [ ] **PikSendAuth.lua** - Gestion authentification
- [ ] **PikSendGallery.lua** - Gestion galeries
- [ ] **PikSendGallerySettings.lua** - Paramètres de galerie
- [ ] **PikSendUpload.lua** - Gestion uploads
- [ ] **PikSendMetadata.lua** - Gestion métadonnées
- [ ] **PikSendUI.lua** - Composants UI
- [ ] **PikSendUtils.lua** - Utilitaires
- [ ] **PikSendLogger.lua** - Système de logs
- [ ] **PikSendCache.lua** - Système de cache
- [ ] **PikSendPresets.lua** - Gestion des presets
- [ ] **PikSendRetry.lua** - Système de retry
- [ ] **PikSendErrorHandler.lua** - Gestion des erreurs
- [ ] **PikSendUpdater.lua** - Système de mises à jour
- [ ] **PikSendLocalization.lua** - Système de localisation

### 2.2 Fichiers Requis - Dépendances

- [ ] **json.lua** - Bibliothèque JSON
  - Vérifier la licence MIT
  - Vérifier la compatibilité Lua 5.1

### 2.3 Fichiers Requis - Ressources

- [ ] **resources/icon.png** - Icône du plugin
  - Dimensions : 256x256 pixels
  - Format : PNG avec transparence
  - Taille : < 100 KB

- [ ] **resources/logo.png** - Logo PikSend
  - Dimensions : 512x256 pixels minimum
  - Format : PNG avec transparence
  - Taille : < 200 KB

- [ ] **resources/watermark-default.png** - Watermark par défaut
  - Dimensions : 200x50 pixels minimum
  - Format : PNG avec transparence
  - Taille : < 50 KB

### 2.4 Fichiers Requis - Localisation

- [ ] **localization/en.lua** - Traductions anglaises
  - Toutes les clés présentes
  - Aucune chaîne vide
  - Syntaxe Lua valide

- [ ] **localization/fr.lua** - Traductions françaises
  - Toutes les clés présentes
  - Aucune chaîne vide
  - Syntaxe Lua valide

### 2.5 Fichiers Requis - Documentation

- [ ] **README.md** - Documentation principale
- [ ] **GUIDE-INSTALLATION.md** - Guide d'installation
- [ ] **USER-GUIDE.md** - Guide d'utilisation

---

## 3. Validation des Exclusions

### 3.1 Fichiers de Développement à EXCLURE

- [ ] **Dossier tests/** - Tous les tests
- [ ] **Fichiers .busted** - Configuration Busted
- [ ] **Scripts de test** - run-tests.bat, run-busted.ps1, etc.
- [ ] **Scripts de développement** - setup-dev-environment.ps1, diagnose-busted.ps1
- [ ] **Documentation de développement** - DEVELOPMENT.md, DEPENDENCIES.md, STRUCTURE.md
- [ ] **Fichiers de tâches** - TASK-*.md, CHECKPOINT-*.md
- [ ] **Fichiers de vérification** - *-VERIFICATION.md, *-SUMMARY.md

### 3.2 Fichiers Temporaires à EXCLURE

- [ ] **Logs** - PikSend.log, *.log
- [ ] **Résultats de tests** - test_*.txt, test_*.json
- [ ] **Fichiers temporaires** - *.tmp, *.bak, *.swp

### 3.3 Fichiers Système à EXCLURE

- [ ] **.DS_Store** (macOS)
- [ ] **Thumbs.db** (Windows)
- [ ] **.git/** - Dossier Git
- [ ] **.gitignore** - Configuration Git

---

## 4. Validation des Dépendances

### 4.1 Dépendances Intégrées

- [ ] **json.lua présent et fonctionnel**
  - Test : `require 'json'` ne génère pas d'erreur
  - Test : Parsing JSON basique fonctionne
  - Test : Génération JSON basique fonctionne

### 4.2 Dépendances Lightroom SDK

Vérifier que le code utilise correctement les modules Lightroom :

- [ ] **LrHttp** - Requêtes HTTP
- [ ] **LrTasks** - Tâches asynchrones
- [ ] **LrDialogs** - Dialogs et messages
- [ ] **LrView** - Composants UI
- [ ] **LrBinding** - Data binding
- [ ] **LrPrefs** - Préférences
- [ ] **LrFileUtils** - Gestion des fichiers
- [ ] **LrPathUtils** - Gestion des chemins
- [ ] **LrLogger** - Logging
- [ ] **LrFunctionContext** - Contextes de fonction
- [ ] **LrProgressScope** - Barres de progression

---

## 5. Validation du Code

### 5.1 Syntaxe et Qualité

- [ ] **Aucune erreur de syntaxe Lua**
  - Vérifier avec `luac -p *.lua`
  - Résultat : _______

- [ ] **Aucun warning de syntaxe**
  - Vérifier avec un linter Lua
  - Résultat : _______

- [ ] **Aucune référence à des chemins absolus**
  - Rechercher : `/Users/`, `C:\`, etc.
  - Résultat : _______

- [ ] **Aucune référence à des fichiers de test**
  - Rechercher : `require 'tests'`, etc.
  - Résultat : _______

### 5.2 Sécurité

- [ ] **Aucun token API en dur dans le code**
  - Rechercher : `Bearer `, `api_token`, etc.
  - Résultat : _______

- [ ] **Aucun mot de passe en dur dans le code**
  - Rechercher : `password`, `pwd`, etc.
  - Résultat : _______

- [ ] **Toutes les URLs utilisent HTTPS**
  - Rechercher : `http://` (doit être `https://`)
  - Résultat : _______

- [ ] **Les tokens sont sanitisés dans les logs**
  - Vérifier PikSendLogger.lua
  - Résultat : _______

---

## 6. Validation Fonctionnelle

### 6.1 Authentification

- [ ] **Dialog de connexion s'affiche correctement**
- [ ] **Validation du token fonctionne**
- [ ] **Vérification du plan Pro fonctionne**
- [ ] **Stockage sécurisé du token fonctionne**
- [ ] **Déconnexion fonctionne**

### 6.2 Gestion des Galeries

- [ ] **Liste des galeries se charge**
- [ ] **Création de galerie fonctionne**
- [ ] **Validation du titre de galerie fonctionne**
- [ ] **Recherche de galerie fonctionne**
- [ ] **Cache des galeries fonctionne**

### 6.3 Export de Photos

- [ ] **Sélection de photos fonctionne**
- [ ] **Configuration des paramètres d'export fonctionne**
- [ ] **Upload de photos fonctionne**
- [ ] **Barre de progression s'affiche correctement**
- [ ] **Gestion des erreurs d'upload fonctionne**
- [ ] **Nettoyage des fichiers temporaires fonctionne**

### 6.4 Publish Service

- [ ] **Création de Published Collection fonctionne**
- [ ] **Détection des modifications fonctionne**
- [ ] **Synchronisation fonctionne**
- [ ] **Suppression de photos fonctionne**
- [ ] **Gestion des conflits fonctionne**

### 6.5 Fonctionnalités Avancées

- [ ] **Presets d'export fonctionnent**
- [ ] **Watermark fonctionne**
- [ ] **Transfert de métadonnées fonctionne**
- [ ] **Détection de doublons fonctionne**
- [ ] **Système de retry fonctionne**
- [ ] **Vérification des mises à jour fonctionne**

---

## 7. Validation de la Performance

### 7.1 Temps de Réponse

- [ ] **Authentification < 3 secondes**
- [ ] **Chargement des galeries < 2 secondes**
- [ ] **Upload d'une photo < 10 secondes** (pour une photo de 5 MB)
- [ ] **Calcul de hash MD5 < 1 seconde** (pour une photo de 10 MB)

### 7.2 Utilisation des Ressources

- [ ] **Utilisation mémoire < 500 MB** pendant l'upload
- [ ] **Uploads parallèles limités à 3** par défaut
- [ ] **Fichiers temporaires nettoyés** après upload
- [ ] **Cache limité à 100 MB**
- [ ] **Logs limités à 10 MB** avec rotation

---

## 8. Validation de la Taille du Package

- [ ] **Taille totale du package < 5 MB**
  - Taille actuelle : _______ MB
  - Si > 5 MB, identifier les fichiers volumineux : _______

- [ ] **Taille des ressources visuelles raisonnable**
  - icon.png : _______ KB (< 100 KB)
  - logo.png : _______ KB (< 200 KB)
  - watermark-default.png : _______ KB (< 50 KB)

---

## 9. Validation du Script de Validation

- [ ] **Script validate-package.ps1 créé**
- [ ] **Script exécuté sans erreur**
  - Commande : `.\validate-package.ps1`
  - Résultat : _______
  - Erreurs : _______
  - Avertissements : _______

---

## 10. Tests d'Installation

### 10.1 Installation sur Windows

- [ ] **Package copié dans un dossier temporaire**
- [ ] **Lightroom Classic ouvert**
- [ ] **Plugin ajouté via Gestionnaire de modules externes**
- [ ] **Plugin apparaît dans la liste**
- [ ] **Version correcte affichée**
- [ ] **Aucune erreur dans les logs Lightroom**

### 10.2 Installation sur macOS

- [ ] **Package copié dans un dossier temporaire**
- [ ] **Lightroom Classic ouvert**
- [ ] **Plugin ajouté via Gestionnaire de modules externes**
- [ ] **Plugin apparaît dans la liste**
- [ ] **Version correcte affichée**
- [ ] **Aucune erreur dans les logs Lightroom**

### 10.3 Test de Compatibilité

- [ ] **Lightroom Classic 11.0** - Testé et fonctionnel
- [ ] **Lightroom Classic 12.0** - Testé et fonctionnel
- [ ] **Lightroom Classic 13.0** - Testé et fonctionnel

---

## 11. Préparation de la Distribution

### 11.1 Création de l'Archive

- [ ] **Archive ZIP créée**
  - Nom du fichier : PikSend-v_______.zip
  - Taille : _______ MB
  - Checksum MD5 : _______

- [ ] **Archive testée** (extraction et installation)

### 11.2 Métadonnées de Release

- [ ] **Numéro de version** : _______
- [ ] **Date de release** : _______
- [ ] **Changelog** : Copié depuis CHANGELOG.md
- [ ] **Compatibilité** : Lightroom Classic 11.0+, Windows 10/11, macOS 10.15+
- [ ] **Taille du téléchargement** : _______ MB

### 11.3 Upload sur le Dashboard PikSend

- [ ] **Connexion au dashboard en tant qu'admin**
- [ ] **Navigation vers Admin > Plugins > Lightroom**
- [ ] **Upload du fichier ZIP**
- [ ] **Métadonnées remplies**
- [ ] **Plugin publié**
- [ ] **Lien de téléchargement testé**

---

## 12. Validation Post-Release

### 12.1 Téléchargement Public

- [ ] **Plugin téléchargeable depuis https://piksend.com/downloads/lightroom-plugin**
- [ ] **Plugin téléchargeable depuis le dashboard utilisateur**
- [ ] **Taille du téléchargement correcte**
- [ ] **Checksum MD5 correct**

### 12.2 Documentation en Ligne

- [ ] **Documentation disponible sur https://piksend.com/docs/lightroom-plugin**
- [ ] **FAQ disponible sur https://piksend.com/faq/lightroom-plugin**
- [ ] **Changelog disponible**
- [ ] **Liens de support fonctionnels**

### 12.3 Notification des Utilisateurs

- [ ] **Email envoyé aux utilisateurs Pro**
- [ ] **Annonce sur le blog PikSend**
- [ ] **Annonce sur les réseaux sociaux**
- [ ] **Notification dans le plugin** (pour les mises à jour)

---

## 13. Validation Finale

### 13.1 Checklist Complète

- [ ] **Toutes les sections de cette checklist sont complétées**
- [ ] **Aucune erreur critique identifiée**
- [ ] **Tous les avertissements documentés et acceptés**

### 13.2 Approbation

- [ ] **Responsable technique** : _______ (Nom et signature)
- [ ] **Responsable produit** : _______ (Nom et signature)
- [ ] **Date d'approbation** : _______

### 13.3 Notes Finales

Notes et observations :
_____________________________________________
_____________________________________________
_____________________________________________
_____________________________________________

---

## Annexe : Commandes Utiles

### Validation du Package
```powershell
# Exécuter le script de validation
.\validate-package.ps1

# Vérifier la syntaxe Lua
luac -p PikSend.lrplugin/*.lua

# Calculer la taille du package
Get-ChildItem -Path PikSend.lrplugin -Recurse | Measure-Object -Property Length -Sum

# Créer l'archive ZIP
Compress-Archive -Path PikSend.lrplugin -DestinationPath PikSend-v1.0.0.zip

# Calculer le checksum MD5
Get-FileHash -Path PikSend-v1.0.0.zip -Algorithm MD5
```

### Tests
```powershell
# Exécuter tous les tests
.\run-busted.ps1

# Exécuter les tests d'intégration
.\run-busted.ps1 tests/test_integration_*.lua

# Exécuter les tests de propriétés
.\run-busted.ps1 tests/test_property_*.lua
```

---

**Version de la checklist** : 1.0.0  
**Dernière mise à jour** : 2024-01-15  
**Auteur** : Équipe PikSend
