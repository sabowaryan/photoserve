# Guide de Configuration de la Page de Téléchargement

Ce document décrit le processus de configuration et de maintenance de la page de téléchargement du plugin PikSend pour Lightroom sur le dashboard PikSend.

**Exigences validées** : 12.8, 12.9

---

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Prérequis](#prérequis)
3. [Upload du Plugin sur le Dashboard](#upload-du-plugin-sur-le-dashboard)
4. [Structure de la Page de Téléchargement](#structure-de-la-page-de-téléchargement)
5. [Gestion des Versions](#gestion-des-versions)
6. [Maintenance du Changelog](#maintenance-du-changelog)
7. [Processus de Release](#processus-de-release)
8. [Vérification Post-Upload](#vérification-post-upload)
9. [Troubleshooting](#troubleshooting)

---

## Vue d'ensemble

La page de téléchargement du plugin Lightroom doit :
- **Maintenir toutes les versions du plugin** (Exigence 12.8)
- **Fournir un changelog détaillé pour chaque version** (Exigence 12.9)
- Permettre aux utilisateurs de télécharger la version appropriée
- Afficher les informations de compatibilité
- Fournir des liens vers la documentation

---

## Prérequis

Avant d'uploader le plugin sur le dashboard, assurez-vous que :

### 1. Le Package est Prêt
- [ ] Le fichier `PikSend.lrplugin.zip` est créé (voir [PACKAGING-GUIDE.md](PACKAGING-GUIDE.md))
- [ ] Tous les tests passent (voir [PACKAGING-CHECKLIST.md](PACKAGING-CHECKLIST.md))
- [ ] La validation du package est complète (exécuter `validate-package.ps1`)

### 2. La Documentation est à Jour
- [ ] `CHANGELOG.md` contient les notes de version complètes
- [ ] `README.md` est à jour avec les nouvelles fonctionnalités
- [ ] `GUIDE-INSTALLATION.md` reflète les changements éventuels
- [ ] `USER-GUIDE.md` documente les nouvelles fonctionnalités

### 3. Les Métadonnées de Version sont Correctes
- [ ] `Info.lua` contient le bon numéro de version
- [ ] La version suit le Versioning Sémantique (MAJOR.MINOR.PATCH)
- [ ] La date de release est définie dans `CHANGELOG.md`

---

## Upload du Plugin sur le Dashboard

### Étape 1 : Accéder à l'Interface d'Administration

1. Connectez-vous au dashboard PikSend avec un compte administrateur
2. Naviguez vers **Admin** → **Plugins** → **Lightroom Plugin**
3. Cliquez sur **"Gérer les Versions"**

### Étape 2 : Préparer les Informations de Version

Avant l'upload, préparez les informations suivantes :

```yaml
Version: 1.0.0
Date de Release: 2024-01-15
Compatibilité:
  - Lightroom Classic: 11.0+
  - Windows: 10/11 (64-bit)
  - macOS: 10.15+
Taille du Fichier: [calculée automatiquement]
Hash SHA-256: [calculé automatiquement]
```

### Étape 3 : Uploader le Fichier

1. Cliquez sur **"Ajouter une Nouvelle Version"**
2. Remplissez le formulaire :
   - **Numéro de Version** : `1.0.0` (format MAJOR.MINOR.PATCH)
   - **Date de Release** : Sélectionnez la date
   - **Statut** : 
     - `stable` - Version stable recommandée
     - `beta` - Version beta pour tests
     - `deprecated` - Version obsolète (non recommandée)
   - **Fichier** : Sélectionnez `PikSend.lrplugin.zip`

3. **Compatibilité** :
   - Cochez les versions de Lightroom compatibles
   - Cochez les systèmes d'exploitation compatibles
   - Spécifiez les versions minimales requises

4. **Notes de Version** :
   - Copiez le contenu de la section correspondante du `CHANGELOG.md`
   - Utilisez le format Markdown
   - Incluez les sections : Ajouté, Modifié, Corrigé, Sécurité

### Étape 4 : Valider et Publier

1. Cliquez sur **"Prévisualiser"** pour vérifier l'affichage
2. Vérifiez que :
   - Le fichier est uploadé correctement
   - Le hash SHA-256 est calculé
   - La taille du fichier est affichée
   - Les notes de version sont formatées correctement
3. Cliquez sur **"Publier"** pour rendre la version disponible

---

## Structure de la Page de Téléchargement

La page de téléchargement doit suivre cette structure :

### Section 1 : Version Actuelle (Recommandée)

```
┌─────────────────────────────────────────────────────────┐
│ Plugin PikSend pour Adobe Lightroom                     │
│                                                          │
│ Version Actuelle : 1.0.0                                │
│ Date de Release : 15 janvier 2024                       │
│                                                          │
│ [Télécharger v1.0.0] (bouton principal)                │
│                                                          │
│ Compatibilité :                                         │
│ • Lightroom Classic 11.0+                               │
│ • Windows 10/11 (64-bit)                                │
│ • macOS 10.15 Catalina+                                 │
│                                                          │
│ Taille : 2.5 MB                                         │
│ SHA-256 : abc123...                                     │
└─────────────────────────────────────────────────────────┘
```

### Section 2 : Notes de Version

```
┌─────────────────────────────────────────────────────────┐
│ Nouveautés de la Version 1.0.0                          │
│                                                          │
│ ✨ Ajouté                                               │
│ • Authentification via API Token                        │
│ • Gestion complète des galeries                         │
│ • Upload parallèle de photos                            │
│ • Publish Service avec synchronisation                  │
│ • [voir le changelog complet]                           │
│                                                          │
│ 🔧 Modifié                                              │
│ • [liste des modifications]                             │
│                                                          │
│ 🐛 Corrigé                                              │
│ • [liste des corrections]                               │
│                                                          │
│ 🔒 Sécurité                                             │
│ • [améliorations de sécurité]                           │
└─────────────────────────────────────────────────────────┘
```

### Section 3 : Versions Précédentes

```
┌─────────────────────────────────────────────────────────┐
│ Versions Précédentes                                     │
│                                                          │
│ Version 0.9.0 - Beta (15 décembre 2023)                 │
│ [Télécharger] [Notes de version]                        │
│                                                          │
│ Version 0.8.0 - Beta (1 décembre 2023)                  │
│ [Télécharger] [Notes de version]                        │
│                                                          │
│ [Voir toutes les versions]                              │
└─────────────────────────────────────────────────────────┘
```

### Section 4 : Liens Utiles

```
┌─────────────────────────────────────────────────────────┐
│ Documentation et Support                                 │
│                                                          │
│ 📖 Guide d'Installation                                 │
│ 📘 Guide d'Utilisation                                  │
│ ❓ FAQ                                                  │
│ 💬 Support                                              │
│ 🐛 Signaler un Bug                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Gestion des Versions

### Politique de Versioning

Le plugin suit le **Versioning Sémantique** (SemVer) :

```
MAJOR.MINOR.PATCH

Exemple : 1.2.3
  │   │   │
  │   │   └─ PATCH : Corrections de bugs, changements mineurs
  │   └───── MINOR : Nouvelles fonctionnalités (rétrocompatibles)
  └───────── MAJOR : Changements incompatibles avec les versions précédentes
```

### Quand Incrémenter Chaque Numéro

#### MAJOR (1.0.0 → 2.0.0)
- Changements incompatibles avec l'API
- Suppression de fonctionnalités
- Changements majeurs d'architecture
- Changements de format de données incompatibles

#### MINOR (1.0.0 → 1.1.0)
- Nouvelles fonctionnalités rétrocompatibles
- Améliorations significatives
- Nouvelles options de configuration
- Nouveaux modules

#### PATCH (1.0.0 → 1.0.1)
- Corrections de bugs
- Améliorations de performance
- Corrections de sécurité mineures
- Corrections de documentation

### Statuts de Version

| Statut | Description | Affichage |
|--------|-------------|-----------|
| `stable` | Version stable recommandée | Badge vert "Recommandé" |
| `beta` | Version en test | Badge orange "Beta" |
| `deprecated` | Version obsolète | Badge rouge "Obsolète" |
| `archived` | Version archivée (non téléchargeable) | Grisé |

### Cycle de Vie d'une Version

```
Développement → Beta → Stable → Deprecated → Archived
     ↓            ↓       ↓          ↓           ↓
  (privé)     (public)  (défaut)  (6 mois)   (12 mois)
```

---

## Maintenance du Changelog

### Format du Changelog

Le changelog suit le format [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) :

```markdown
# Changelog - Plugin PikSend pour Lightroom

## [1.0.0] - 2024-01-15

### Ajouté
- Nouvelles fonctionnalités

### Modifié
- Changements dans les fonctionnalités existantes

### Déprécié
- Fonctionnalités qui seront supprimées

### Supprimé
- Fonctionnalités supprimées

### Corrigé
- Corrections de bugs

### Sécurité
- Corrections de vulnérabilités
```

### Bonnes Pratiques pour le Changelog

#### 1. Écrire pour les Utilisateurs
❌ **Mauvais** : "Refactored PikSendAPI.lua to use async/await"
✅ **Bon** : "Amélioration de la vitesse d'upload des photos"

#### 2. Grouper par Catégorie
```markdown
### Ajouté
#### Authentification
- Authentification via API Token
- Validation du plan Pro

#### Galeries
- Création de galeries depuis Lightroom
- Recherche de galeries par nom
```

#### 3. Inclure les Références
```markdown
### Corrigé
- Correction du crash lors de l'upload de fichiers > 100 MB (#42)
- Correction de la synchronisation des métadonnées EXIF (#38)
```

#### 4. Mentionner les Breaking Changes
```markdown
### ⚠️ BREAKING CHANGES
- Le format de stockage des presets a changé. Les presets existants 
  devront être recréés après la mise à jour.
```

### Template de Changelog pour Nouvelle Version

```markdown
## [X.Y.Z] - AAAA-MM-JJ

### Ajouté
- [Nouvelle fonctionnalité 1]
- [Nouvelle fonctionnalité 2]

### Modifié
- [Changement 1]
- [Changement 2]

### Corrigé
- [Bug fix 1] (#issue)
- [Bug fix 2] (#issue)

### Sécurité
- [Security fix 1]

### Notes de Migration
- [Instructions si nécessaire]
```

---

## Processus de Release

### Checklist Complète de Release

#### Phase 1 : Préparation (J-7)
- [ ] Créer une branche `release/vX.Y.Z`
- [ ] Mettre à jour le numéro de version dans `Info.lua`
- [ ] Mettre à jour `CHANGELOG.md` avec la date de release
- [ ] Vérifier que tous les tests passent
- [ ] Exécuter la validation complète du package
- [ ] Mettre à jour la documentation si nécessaire

#### Phase 2 : Tests (J-3)
- [ ] Tests manuels sur Windows 10/11
- [ ] Tests manuels sur macOS 10.15+
- [ ] Tests avec Lightroom Classic 11.0, 12.0, 13.0
- [ ] Tests du flux d'authentification complet
- [ ] Tests du flux d'export complet
- [ ] Tests du Publish Service
- [ ] Tests de performance et mémoire

#### Phase 3 : Packaging (J-1)
- [ ] Créer le package final avec `validate-package.ps1`
- [ ] Vérifier l'intégrité du package
- [ ] Calculer le hash SHA-256
- [ ] Créer les notes de version formatées pour le dashboard
- [ ] Préparer les captures d'écran si nécessaire

#### Phase 4 : Publication (J-Day)
- [ ] Merger la branche `release/vX.Y.Z` dans `main`
- [ ] Créer un tag Git `vX.Y.Z`
- [ ] Uploader le plugin sur le dashboard PikSend
- [ ] Publier la version sur la page de téléchargement
- [ ] Mettre à jour la documentation en ligne
- [ ] Annoncer la release (email, blog, réseaux sociaux)

#### Phase 5 : Post-Release (J+1)
- [ ] Surveiller les rapports de bugs
- [ ] Répondre aux questions des utilisateurs
- [ ] Créer une branche `hotfix/vX.Y.Z+1` si nécessaire
- [ ] Mettre à jour le roadmap

---

## Vérification Post-Upload

### Checklist de Vérification

Après avoir uploadé une nouvelle version, vérifiez :

#### 1. Téléchargement
- [ ] Le fichier se télécharge correctement
- [ ] La taille du fichier est correcte
- [ ] Le hash SHA-256 correspond

#### 2. Affichage
- [ ] La version apparaît dans la liste
- [ ] Le statut est correct (stable/beta/deprecated)
- [ ] Les notes de version sont formatées correctement
- [ ] Les informations de compatibilité sont exactes

#### 3. Installation
- [ ] Le plugin s'installe correctement dans Lightroom
- [ ] La version affichée dans Lightroom correspond
- [ ] Le plugin apparaît dans le Gestionnaire de modules externes
- [ ] Aucune erreur au démarrage

#### 4. Fonctionnalité
- [ ] L'authentification fonctionne
- [ ] La création de galeries fonctionne
- [ ] L'upload de photos fonctionne
- [ ] Le Publish Service fonctionne

#### 5. Mise à Jour
- [ ] La notification de mise à jour s'affiche pour les anciennes versions
- [ ] Le lien de téléchargement dans la notification est correct
- [ ] Le changelog s'affiche correctement dans la notification

---

## Troubleshooting

### Problèmes Courants

#### 1. L'Upload Échoue

**Symptôme** : Le fichier ne s'uploade pas sur le dashboard

**Solutions** :
- Vérifier la taille du fichier (max 50 MB)
- Vérifier le format (doit être .zip)
- Vérifier les permissions du compte administrateur
- Vérifier la connexion internet
- Essayer avec un autre navigateur

#### 2. Le Hash SHA-256 ne Correspond Pas

**Symptôme** : Le hash calculé ne correspond pas au hash attendu

**Solutions** :
- Recréer le package avec `validate-package.ps1`
- Vérifier qu'aucun fichier n'a été modifié après la création du package
- Vérifier que le fichier n'a pas été corrompu pendant l'upload

#### 3. Les Notes de Version ne s'Affichent Pas Correctement

**Symptôme** : Le formatage Markdown est cassé

**Solutions** :
- Vérifier la syntaxe Markdown
- Éviter les caractères spéciaux non échappés
- Utiliser la prévisualisation avant de publier
- Vérifier que les listes utilisent le bon format

#### 4. La Version n'Apparaît Pas dans Lightroom

**Symptôme** : Après installation, Lightroom affiche une ancienne version

**Solutions** :
- Vérifier que `Info.lua` contient le bon numéro de version
- Redémarrer Lightroom complètement
- Supprimer le cache de Lightroom :
  - Windows : `%APPDATA%\Adobe\Lightroom\Preferences`
  - macOS : `~/Library/Preferences/com.adobe.Lightroom*.plist`
- Réinstaller le plugin

#### 5. Les Utilisateurs ne Reçoivent Pas la Notification de Mise à Jour

**Symptôme** : Le plugin ne détecte pas la nouvelle version

**Solutions** :
- Vérifier que l'API de vérification des mises à jour fonctionne
- Vérifier que le numéro de version est supérieur à l'ancienne version
- Vérifier que le statut de la version est `stable`
- Attendre jusqu'à 24h (cache de l'API)

---

## Commandes Utiles

### Calculer le Hash SHA-256

**Windows (PowerShell)** :
```powershell
Get-FileHash -Algorithm SHA256 PikSend.lrplugin.zip
```

**macOS/Linux** :
```bash
shasum -a 256 PikSend.lrplugin.zip
```

### Vérifier la Taille du Package

**Windows (PowerShell)** :
```powershell
(Get-Item PikSend.lrplugin.zip).Length / 1MB
```

**macOS/Linux** :
```bash
du -h PikSend.lrplugin.zip
```

### Extraire et Vérifier le Contenu

**Windows (PowerShell)** :
```powershell
Expand-Archive -Path PikSend.lrplugin.zip -DestinationPath temp_verify
Get-ChildItem -Path temp_verify -Recurse
```

**macOS/Linux** :
```bash
unzip -l PikSend.lrplugin.zip
```

---

## Ressources

### Documentation Connexe
- [PACKAGING-GUIDE.md](PACKAGING-GUIDE.md) - Guide de packaging complet
- [PACKAGING-CHECKLIST.md](PACKAGING-CHECKLIST.md) - Checklist de validation
- [CHANGELOG.md](CHANGELOG.md) - Changelog complet du plugin
- [README.md](README.md) - Documentation principale

### Liens Externes
- [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
- [Semantic Versioning](https://semver.org/lang/fr/)
- [Adobe Lightroom SDK Documentation](https://www.adobe.io/apis/creativecloud/lightroom.html)

### Support
- Email : support@piksend.com
- Dashboard : https://piksend.com/dashboard
- Documentation : https://piksend.com/docs/lightroom-plugin

---

**Dernière mise à jour** : 15 janvier 2024  
**Version du document** : 1.0.0
