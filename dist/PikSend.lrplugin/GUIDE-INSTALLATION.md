# Guide d'Installation - Plugin PikSend pour Adobe Lightroom Classic

## Table des Matières

1. [Prérequis](#prérequis)
2. [Téléchargement du Plugin](#téléchargement-du-plugin)
3. [Installation sur Windows](#installation-sur-windows)
4. [Installation sur macOS](#installation-sur-macos)
5. [Configuration Initiale](#configuration-initiale)
6. [Vérification de l'Installation](#vérification-de-linstallation)
7. [Dépannage](#dépannage)
8. [Désinstallation](#désinstallation)

---

## Prérequis

Avant d'installer le plugin PikSend, assurez-vous que votre système répond aux exigences suivantes :

### Logiciels Requis

- **Adobe Lightroom Classic** version 11.0 ou ultérieure
  - Pour vérifier votre version : `Aide > Informations système` dans Lightroom
  - Versions testées : 11.0, 12.0, 13.0

### Systèmes d'Exploitation Supportés

- **Windows** : Windows 10 (64-bit) ou Windows 11
- **macOS** : macOS 10.15 (Catalina) ou ultérieur

### Compte PikSend

- Un compte **PikSend Pro** actif est requis
- Si vous n'avez pas de compte Pro, visitez [piksend.com/pricing](https://piksend.com/pricing)

### Connexion Internet

- Une connexion internet stable est nécessaire pour :
  - L'authentification
  - L'upload des photos
  - La synchronisation des galeries

---

## Téléchargement du Plugin

### Étape 1 : Accéder au Dashboard PikSend

1. Connectez-vous à votre compte PikSend sur [piksend.com](https://piksend.com)
2. Accédez à votre **Dashboard**
3. Naviguez vers **Paramètres > Intégrations**

### Étape 2 : Télécharger le Fichier .lrplugin

1. Dans la section **Adobe Lightroom**, cliquez sur **Télécharger le Plugin**
2. Le fichier `PikSend.lrplugin` sera téléchargé (environ 2-5 MB)
3. Notez l'emplacement du fichier téléchargé (généralement dans votre dossier **Téléchargements**)

> **Note** : Le fichier `.lrplugin` est en réalité un dossier contenant tous les fichiers du plugin. Ne le décompressez pas !

---

## Installation sur Windows

### Méthode 1 : Installation via le Gestionnaire de Modules Externes (Recommandée)

#### Étape 1 : Ouvrir le Gestionnaire de Modules Externes

1. Lancez **Adobe Lightroom Classic**
2. Dans le menu principal, cliquez sur **Fichier > Gestionnaire de modules externes**

![Gestionnaire de modules externes Windows](resources/screenshots/windows-plugin-manager.png)

#### Étape 2 : Ajouter le Plugin

1. Dans le Gestionnaire de modules externes, cliquez sur le bouton **Ajouter** en bas à gauche
2. Une fenêtre de sélection de fichier s'ouvre
3. Naviguez vers le dossier où vous avez téléchargé `PikSend.lrplugin`
4. Sélectionnez le dossier `PikSend.lrplugin` (pas un fichier à l'intérieur)
5. Cliquez sur **Sélectionner le dossier**

#### Étape 3 : Vérifier l'Installation

1. Le plugin **PikSend** devrait maintenant apparaître dans la liste des modules externes
2. Vérifiez que le statut indique **"Activé"** (case cochée)
3. Vous devriez voir :
   - **Nom** : PikSend
   - **Version** : 1.0.0 (ou version actuelle)
   - **Statut** : Activé

![Plugin installé Windows](resources/screenshots/windows-plugin-installed.png)

4. Cliquez sur **Terminé** pour fermer le Gestionnaire de modules externes

### Méthode 2 : Installation Manuelle

Si la méthode 1 ne fonctionne pas, vous pouvez installer manuellement :

1. Copiez le dossier `PikSend.lrplugin` dans :
   ```
   C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\Modules
   ```
2. Si le dossier `Modules` n'existe pas, créez-le
3. Redémarrez Lightroom Classic
4. Suivez les étapes de vérification ci-dessus

---

## Installation sur macOS

### Méthode 1 : Installation via le Gestionnaire de Modules Externes (Recommandée)

#### Étape 1 : Ouvrir le Gestionnaire de Modules Externes

1. Lancez **Adobe Lightroom Classic**
2. Dans le menu principal, cliquez sur **Fichier > Gestionnaire de modules externes**

![Gestionnaire de modules externes macOS](resources/screenshots/macos-plugin-manager.png)

#### Étape 2 : Ajouter le Plugin

1. Dans le Gestionnaire de modules externes, cliquez sur le bouton **Ajouter** en bas à gauche
2. Une fenêtre Finder s'ouvre
3. Naviguez vers le dossier où vous avez téléchargé `PikSend.lrplugin`
4. Sélectionnez le dossier `PikSend.lrplugin` (il apparaît comme un dossier, pas comme un fichier)
5. Cliquez sur **Choisir**

#### Étape 3 : Autoriser le Plugin (macOS 10.15+)

Sur macOS Catalina et versions ultérieures, vous devrez peut-être autoriser le plugin :

1. Si une alerte de sécurité apparaît, cliquez sur **OK**
2. Ouvrez **Préférences Système > Sécurité et confidentialité**
3. Dans l'onglet **Général**, cliquez sur **Autoriser quand même** à côté du message concernant PikSend
4. Redémarrez Lightroom Classic

![Autorisation macOS](resources/screenshots/macos-security-allow.png)

#### Étape 4 : Vérifier l'Installation

1. Le plugin **PikSend** devrait maintenant apparaître dans la liste des modules externes
2. Vérifiez que le statut indique **"Activé"** (case cochée)
3. Vous devriez voir :
   - **Nom** : PikSend
   - **Version** : 1.0.0 (ou version actuelle)
   - **Statut** : Activé

![Plugin installé macOS](resources/screenshots/macos-plugin-installed.png)

4. Cliquez sur **Terminé** pour fermer le Gestionnaire de modules externes

### Méthode 2 : Installation Manuelle

Si la méthode 1 ne fonctionne pas :

1. Copiez le dossier `PikSend.lrplugin` dans :
   ```
   ~/Library/Application Support/Adobe/Lightroom/Modules
   ```
2. Pour accéder au dossier Library (caché par défaut) :
   - Dans Finder, appuyez sur **Cmd + Shift + G**
   - Collez le chemin ci-dessus
   - Cliquez sur **Aller**
3. Si le dossier `Modules` n'existe pas, créez-le
4. Redémarrez Lightroom Classic
5. Suivez les étapes de vérification ci-dessus

---

## Configuration Initiale

Une fois le plugin installé, vous devez le configurer pour l'utiliser.

### Étape 1 : Générer un Token API

1. Ouvrez votre navigateur et connectez-vous à [piksend.com](https://piksend.com)
2. Accédez à **Dashboard > Paramètres > API**
3. Cliquez sur **Générer un nouveau token**
4. Donnez un nom au token (ex: "Lightroom Plugin")
5. Cliquez sur **Créer**
6. **Copiez le token** (il ne sera affiché qu'une seule fois !)

![Génération token API](resources/screenshots/api-token-generation.png)

> **Important** : Conservez ce token en sécurité. Ne le partagez jamais avec personne.

### Étape 2 : Authentification dans Lightroom

#### Option A : Via l'Export Service

1. Dans Lightroom, sélectionnez une ou plusieurs photos
2. Cliquez sur **Fichier > Exporter** (ou appuyez sur **Ctrl+Shift+E** / **Cmd+Shift+E**)
3. Dans la fenêtre d'export, en haut, sélectionnez **PikSend** dans la liste déroulante
4. Dans la section **Compte PikSend**, cliquez sur **Connexion**

![Export vers PikSend](resources/screenshots/export-dialog.png)

5. Une fenêtre de connexion s'ouvre
6. Collez votre **Token API** dans le champ prévu
7. Cliquez sur **OK**

![Dialog de connexion](resources/screenshots/login-dialog.png)

#### Option B : Via le Publish Service

1. Dans le panneau de gauche de Lightroom, trouvez la section **Services de publication**
2. Cliquez sur le bouton **+** à côté de **Services de publication**
3. Sélectionnez **PikSend** dans la liste
4. Suivez les étapes 5-7 de l'Option A ci-dessus

### Étape 3 : Vérification de l'Authentification

Après avoir entré votre token :

1. Le plugin valide automatiquement votre token
2. Si le token est valide, vous verrez un message : **"Connexion réussie ! Bienvenue [Votre Nom]"**
3. Votre nom d'utilisateur apparaîtra dans la section **Compte PikSend**

![Authentification réussie](resources/screenshots/auth-success.png)

Si le token est invalide :
- Vérifiez que vous avez copié le token complet
- Assurez-vous que le token n'a pas expiré
- Générez un nouveau token si nécessaire

---

## Vérification de l'Installation

Pour confirmer que le plugin fonctionne correctement :

### Test 1 : Vérifier la Présence du Plugin

1. Ouvrez **Fichier > Gestionnaire de modules externes**
2. Vérifiez que **PikSend** est dans la liste et **Activé**
3. Cliquez sur **Informations sur le module externe** pour voir :
   - Version du plugin
   - Compatibilité Lightroom
   - Statut de connexion

### Test 2 : Vérifier l'Export Service

1. Sélectionnez une photo
2. Cliquez sur **Fichier > Exporter**
3. Vérifiez que **PikSend** apparaît dans la liste des destinations d'export

### Test 3 : Vérifier le Publish Service

1. Dans le panneau **Services de publication**, vérifiez que **PikSend** est présent
2. Développez la section PikSend
3. Vous devriez voir l'option pour créer une nouvelle collection publiée

### Test 4 : Récupérer les Galeries

1. Dans la fenêtre d'export PikSend, cliquez sur **Rafraîchir** dans la section Galerie
2. Vos galeries existantes devraient apparaître dans la liste déroulante
3. Si vous n'avez pas encore de galeries, cliquez sur **Nouvelle galerie** pour en créer une

![Liste des galeries](resources/screenshots/gallery-list.png)

---

## Dépannage

### Problème 1 : Le Plugin n'Apparaît Pas dans le Gestionnaire

**Symptômes** :
- Le plugin PikSend n'est pas visible dans le Gestionnaire de modules externes
- Lightroom ne détecte pas le plugin

**Solutions** :

1. **Vérifier l'emplacement du fichier**
   - Assurez-vous que le dossier `PikSend.lrplugin` est intact (ne l'avez pas décompressé)
   - Le dossier doit contenir tous les fichiers `.lua` et le fichier `Info.lua`

2. **Redémarrer Lightroom**
   - Fermez complètement Lightroom Classic
   - Attendez quelques secondes
   - Relancez Lightroom

3. **Réinstaller le plugin**
   - Supprimez le plugin du Gestionnaire de modules externes
   - Téléchargez à nouveau le fichier depuis le dashboard PikSend
   - Réinstallez en suivant les étapes d'installation

4. **Vérifier les permissions (macOS)**
   - Ouvrez **Préférences Système > Sécurité et confidentialité**
   - Vérifiez que Lightroom a les permissions nécessaires
   - Autorisez le plugin si demandé

5. **Vérifier les permissions (Windows)**
   - Clic droit sur le dossier `PikSend.lrplugin` > **Propriétés**
   - Onglet **Sécurité**, vérifiez que vous avez les droits de lecture
   - Décochez **Lecture seule** si nécessaire

### Problème 2 : Erreur "Version Lightroom Incompatible"

**Symptômes** :
- Message d'erreur : "Ce plugin nécessite Lightroom Classic 11.0 ou ultérieur"
- Le plugin refuse de se charger

**Solutions** :

1. **Vérifier votre version de Lightroom**
   - Ouvrez **Aide > Informations système**
   - Cherchez la ligne **Version de l'application**
   - La version doit être 11.0 ou supérieure

2. **Mettre à jour Lightroom**
   - Ouvrez **Aide > Mises à jour**
   - Installez les mises à jour disponibles
   - Redémarrez Lightroom après la mise à jour

3. **Vérifier que vous utilisez Lightroom Classic**
   - Le plugin fonctionne uniquement avec **Lightroom Classic**
   - Il ne fonctionne PAS avec Lightroom CC (version cloud)

### Problème 3 : Erreur d'Authentification "Token Invalide"

**Symptômes** :
- Message : "Token API invalide. Veuillez vérifier et réessayer."
- Impossible de se connecter

**Solutions** :

1. **Vérifier le token**
   - Assurez-vous d'avoir copié le token complet (sans espaces au début/fin)
   - Le token doit commencer par un préfixe spécifique (ex: `pks_`)

2. **Générer un nouveau token**
   - Retournez sur [piksend.com/dashboard/settings/api](https://piksend.com/dashboard/settings/api)
   - Supprimez l'ancien token
   - Générez un nouveau token
   - Copiez-le et réessayez

3. **Vérifier votre plan**
   - Le plugin nécessite un compte **Pro**
   - Vérifiez votre plan sur [piksend.com/dashboard/settings/subscription](https://piksend.com/dashboard/settings/subscription)
   - Si nécessaire, passez au plan Pro

4. **Vérifier la connexion internet**
   - Testez votre connexion en ouvrant [piksend.com](https://piksend.com)
   - Vérifiez que votre pare-feu n'bloque pas Lightroom

### Problème 4 : Erreur "Plan Pro Requis"

**Symptômes** :
- Message : "Le plugin Lightroom est réservé aux utilisateurs Pro"
- Authentification réussie mais fonctionnalités bloquées

**Solutions** :

1. **Vérifier votre abonnement**
   - Connectez-vous à [piksend.com/dashboard](https://piksend.com/dashboard)
   - Vérifiez votre plan actuel dans **Paramètres > Abonnement**

2. **Passer au plan Pro**
   - Visitez [piksend.com/pricing](https://piksend.com/pricing)
   - Sélectionnez le plan Pro
   - Complétez le processus de mise à niveau

3. **Vérifier le renouvellement**
   - Si vous aviez un plan Pro, vérifiez qu'il n'a pas expiré
   - Vérifiez vos informations de paiement

### Problème 5 : Les Galeries ne se Chargent Pas

**Symptômes** :
- La liste des galeries est vide
- Message d'erreur lors du rafraîchissement
- Timeout lors du chargement

**Solutions** :

1. **Vérifier la connexion internet**
   - Testez votre connexion
   - Essayez d'ouvrir [piksend.com](https://piksend.com) dans un navigateur

2. **Rafraîchir manuellement**
   - Cliquez sur le bouton **Rafraîchir** dans la section Galerie
   - Attendez quelques secondes

3. **Vider le cache**
   - Fermez Lightroom
   - Supprimez le fichier de cache :
     - **Windows** : `C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\PikSend.cache`
     - **macOS** : `~/Library/Application Support/Adobe/Lightroom/PikSend.cache`
   - Relancez Lightroom

4. **Vérifier les logs**
   - Ouvrez le fichier de log : `PikSend.lrplugin/PikSend.log`
   - Cherchez les erreurs récentes
   - Contactez le support avec les logs si nécessaire

### Problème 6 : Échec d'Upload des Photos

**Symptômes** :
- Les photos ne s'uploadent pas
- Erreur "Network timeout" ou "Upload failed"
- Upload bloqué à 0%

**Solutions** :

1. **Vérifier la taille des fichiers**
   - La limite est de **500 MB par photo** pour le plan Pro
   - Réduisez la qualité ou la résolution si nécessaire

2. **Vérifier la connexion**
   - Testez votre vitesse d'upload sur [speedtest.net](https://speedtest.net)
   - Une connexion lente peut causer des timeouts

3. **Réduire les uploads simultanés**
   - Dans les paramètres d'export, réduisez le nombre d'uploads parallèles
   - Essayez avec 1 ou 2 au lieu de 3

4. **Réessayer l'upload**
   - Le plugin permet de réessayer les photos échouées
   - Cliquez sur **Réessayer** pour les photos en erreur

5. **Vérifier l'espace de stockage**
   - Vérifiez votre quota sur [piksend.com/dashboard](https://piksend.com/dashboard)
   - Libérez de l'espace si nécessaire

### Problème 7 : Erreur "Permission Denied" (macOS)

**Symptômes** :
- Message d'erreur de permission
- Le plugin ne peut pas écrire les fichiers temporaires
- Erreur lors de l'export

**Solutions** :

1. **Autoriser l'accès complet au disque**
   - Ouvrez **Préférences Système > Sécurité et confidentialité**
   - Onglet **Confidentialité**
   - Sélectionnez **Accès complet au disque**
   - Ajoutez **Adobe Lightroom Classic** à la liste
   - Cochez la case pour l'activer
   - Redémarrez Lightroom

2. **Vérifier les permissions du dossier temporaire**
   - Ouvrez Terminal
   - Exécutez : `chmod -R 755 ~/Library/Application\ Support/Adobe/Lightroom/`

### Problème 8 : Le Plugin est Lent ou Bloque Lightroom

**Symptômes** :
- Lightroom devient lent lors de l'utilisation du plugin
- L'interface se fige
- Roue de chargement infinie

**Solutions** :

1. **Réduire les uploads simultanés**
   - Paramètres d'export > Uploads simultanés : réduire à 1 ou 2

2. **Fermer d'autres applications**
   - Libérez de la mémoire RAM
   - Fermez les applications non nécessaires

3. **Vérifier l'utilisation mémoire**
   - Le plugin est limité à 500 MB de RAM
   - Si vous uploadez de très grandes photos, réduisez la qualité

4. **Désactiver le mode debug**
   - Si activé, le mode debug peut ralentir le plugin
   - Désactivez-le dans les paramètres

5. **Mettre à jour le plugin**
   - Vérifiez si une nouvelle version est disponible
   - Les mises à jour incluent souvent des optimisations de performance

### Problème 9 : Erreur SSL/HTTPS

**Symptômes** :
- Message : "SSL certificate verification failed"
- Erreur de connexion sécurisée
- Impossible de se connecter à l'API

**Solutions** :

1. **Vérifier la date et l'heure système**
   - Une date/heure incorrecte peut causer des erreurs SSL
   - Synchronisez avec un serveur de temps

2. **Mettre à jour le système**
   - **Windows** : Windows Update
   - **macOS** : Mise à jour logicielle

3. **Vérifier le pare-feu/antivirus**
   - Certains antivirus bloquent les connexions HTTPS
   - Ajoutez une exception pour Lightroom et piksend.com

4. **Contacter le support**
   - Si le problème persiste, contactez support@piksend.com
   - Incluez les logs du plugin

### Obtenir de l'Aide Supplémentaire

Si aucune de ces solutions ne résout votre problème :

1. **Consulter la documentation complète**
   - [Guide d'utilisation](GUIDE-UTILISATION.md)
   - [FAQ](FAQ.md)

2. **Activer le mode debug**
   - Dans les paramètres du plugin, activez **Mode Debug**
   - Reproduisez le problème
   - Consultez le fichier `PikSend.log`

3. **Contacter le support**
   - Email : support@piksend.com
   - Incluez :
     - Version de Lightroom
     - Système d'exploitation
     - Description détaillée du problème
     - Fichier de log (si possible)

4. **Forum communautaire**
   - Visitez [community.piksend.com](https://community.piksend.com)
   - Recherchez des solutions ou posez votre question

---

## Désinstallation

Si vous souhaitez désinstaller le plugin :

### Sur Windows

1. Ouvrez **Fichier > Gestionnaire de modules externes**
2. Sélectionnez **PikSend** dans la liste
3. Cliquez sur **Supprimer** en bas à gauche
4. Confirmez la suppression
5. Redémarrez Lightroom

**Nettoyage manuel (optionnel)** :
```
Supprimez les fichiers suivants :
- C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\Modules\PikSend.lrplugin
- C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\PikSend.cache
- C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\PikSend.log
```

### Sur macOS

1. Ouvrez **Fichier > Gestionnaire de modules externes**
2. Sélectionnez **PikSend** dans la liste
3. Cliquez sur **Supprimer** en bas à gauche
4. Confirmez la suppression
5. Redémarrez Lightroom

**Nettoyage manuel (optionnel)** :
```
Supprimez les fichiers suivants :
- ~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin
- ~/Library/Application Support/Adobe/Lightroom/PikSend.cache
- ~/Library/Application Support/Adobe/Lightroom/PikSend.log
```

### Révoquer le Token API

Pour une sécurité maximale, révoquez le token API :

1. Connectez-vous à [piksend.com/dashboard](https://piksend.com/dashboard)
2. Accédez à **Paramètres > API**
3. Trouvez le token utilisé pour Lightroom
4. Cliquez sur **Révoquer**
5. Confirmez la révocation

---

## Prochaines Étapes

Maintenant que le plugin est installé et configuré :

1. **Consultez le [Guide d'Utilisation](GUIDE-UTILISATION.md)** pour apprendre à :
   - Créer et gérer des galeries
   - Exporter des photos vers PikSend
   - Utiliser le Publish Service pour la synchronisation
   - Configurer les paramètres d'export

2. **Explorez les fonctionnalités avancées** :
   - Presets d'export personnalisés
   - Watermarks automatiques
   - Synchronisation bidirectionnelle
   - Gestion des métadonnées

3. **Rejoignez la communauté** :
   - Forum : [community.piksend.com](https://community.piksend.com)
   - Tutoriels vidéo : [piksend.com/tutorials](https://piksend.com/tutorials)

---

## Informations de Version

- **Version du guide** : 1.0.0
- **Dernière mise à jour** : Janvier 2024
- **Compatible avec** : Plugin PikSend 1.0.0+

Pour les notes de version et le changelog complet, visitez [piksend.com/changelog](https://piksend.com/changelog)

---

**Besoin d'aide ?** Contactez-nous à support@piksend.com ou visitez [piksend.com/support](https://piksend.com/support)
