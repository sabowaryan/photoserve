# Guide de Test - Plugin PikSend v1.1.0

Ce guide vous aidera à tester les nouvelles fonctionnalités de la version 1.1.0 du plugin PikSend pour Lightroom.

## Nouveautés de la Version 1.1.0

La version 1.1.0 introduit une nouvelle architecture d'API optimisée pour le plugin :

- **Nouvelle API d'authentification** : Validation de token plus rapide et sécurisée
- **Création de galerie optimisée** : Endpoint dédié pour le plugin avec meilleure performance
- **Upload direct vers Cloudinary** : Les images sont uploadées directement vers Cloudinary
- **Enregistrement par lot** : Les images sont enregistrées dans la galerie par lots de 10
- **Meilleure gestion des erreurs** : Messages d'erreur plus clairs et retry automatique

---

## Prérequis

Avant de commencer les tests, assurez-vous d'avoir :

1. **Lightroom Classic 11.0 ou supérieur** installé
2. **Un compte PikSend actif** avec un plan Pro
3. **Un API Token valide** généré depuis votre dashboard PikSend
4. **Le plugin PikSend v1.1.0** installé dans Lightroom

---

## Installation du Plugin v1.1.0

### Étape 1 : Désinstaller l'ancienne version (si applicable)

1. Ouvrez Lightroom Classic
2. Allez dans **Fichier > Gestionnaire de modules externes**
3. Sélectionnez "PikSend" dans la liste
4. Cliquez sur **Supprimer**
5. Redémarrez Lightroom

### Étape 2 : Installer la nouvelle version

1. Téléchargez le fichier `PikSend.lrplugin` (version 1.1.0)
2. Ouvrez Lightroom Classic
3. Allez dans **Fichier > Gestionnaire de modules externes**
4. Cliquez sur **Ajouter**
5. Naviguez vers le dossier `PikSend.lrplugin` et sélectionnez-le
6. Cliquez sur **Ajouter un module externe**
7. Vérifiez que la version affichée est **1.1.0**

---

## Tests Automatisés

Le plugin inclut une suite de tests automatisés pour valider les nouvelles fonctionnalités.

### Exécuter la Suite de Tests

1. Ouvrez Lightroom Classic
2. Allez dans **Fichier > Gestionnaire de modules externes**
3. Sélectionnez "PikSend" dans la liste
4. Cliquez sur **Afficher le dossier du module externe**
5. Ouvrez le fichier `test-plugin-api.lua` dans un éditeur de texte
6. Dans Lightroom, allez dans **Fichier > Utilitaires de module externe > Exécuter un script Lua**
7. Sélectionnez le fichier `test-plugin-api.lua`
8. Suivez les instructions à l'écran

### Tests Inclus

La suite de tests vérifie :

1. ✅ **Validation du Token** : Vérifie que votre API token est valide
2. ✅ **Création de Galerie** : Crée une galerie de test via la nouvelle API
3. ✅ **Upload Cloudinary** : Upload une image de test vers Cloudinary
4. ✅ **Enregistrement par Lot** : Enregistre l'image dans la galerie
5. ✅ **Récupération de Galeries** : Récupère la liste de vos galeries

### Résultats Attendus

Tous les tests devraient passer (PASS) :

```
Tests Passed: 5
Tests Failed: 0

Details:
[PASS] Token Validation
[PASS] Gallery Creation
[PASS] Cloudinary Upload
[PASS] Batch Image Registration
[PASS] Gallery Retrieval
```

---

## Tests Manuels

En plus des tests automatisés, effectuez ces tests manuels pour valider l'expérience utilisateur.

### Test 1 : Authentification

**Objectif** : Vérifier que l'authentification fonctionne correctement

**Étapes** :
1. Ouvrez le module **Bibliothèque** dans Lightroom
2. Dans le panneau **Services de publication**, trouvez "PikSend"
3. Cliquez sur **Configurer**
4. Entrez votre API Token
5. Cliquez sur **Valider**

**Résultat attendu** :
- ✅ Message de succès : "Token validé avec succès"
- ✅ Votre email s'affiche
- ✅ Votre plan (Pro) s'affiche

**En cas d'erreur** :
- ❌ "Token invalide" → Vérifiez que vous avez copié le token complet
- ❌ "Plan Pro requis" → Activez votre abonnement Pro sur piksend.com

---

### Test 2 : Création de Galerie

**Objectif** : Vérifier que la création de galerie utilise la nouvelle API

**Étapes** :
1. Dans le panneau **Services de publication**, cliquez sur "PikSend"
2. Cliquez sur **Créer une nouvelle galerie**
3. Remplissez les informations :
   - **Titre** : "Test v1.1.0 - [Date]"
   - **Description** : "Galerie de test pour la version 1.1.0"
   - **Autoriser les téléchargements** : Oui
   - **Autoriser les commentaires** : Oui
   - **Watermark** : Non
4. Cliquez sur **Créer**

**Résultat attendu** :
- ✅ Galerie créée en moins de 2 secondes
- ✅ Message de succès avec l'ID de la galerie
- ✅ La galerie apparaît dans la liste

**En cas d'erreur** :
- ❌ "Timeout" → Vérifiez votre connexion internet
- ❌ "Quota atteint" → Vérifiez votre plan sur piksend.com

---

### Test 3 : Upload d'Images (Petit Lot)

**Objectif** : Tester l'upload de 1-5 images

**Étapes** :
1. Sélectionnez 3 photos dans votre catalogue Lightroom
2. Faites un clic droit et choisissez **Exporter**
3. Sélectionnez **PikSend** comme service d'export
4. Choisissez la galerie créée au Test 2
5. Configurez les paramètres d'export :
   - **Format** : JPEG
   - **Qualité** : 90
   - **Résolution** : 2048px (largeur max)
6. Cliquez sur **Exporter**

**Résultat attendu** :
- ✅ Barre de progression s'affiche
- ✅ Chaque image est uploadée vers Cloudinary
- ✅ Les images sont enregistrées dans la galerie
- ✅ Message de succès : "3 image(s) uploaded successfully"
- ✅ Temps total < 30 secondes pour 3 images

**Vérifications** :
1. Ouvrez votre dashboard PikSend (piksend.com/dashboard)
2. Ouvrez la galerie de test
3. Vérifiez que les 3 images sont présentes
4. Vérifiez que les métadonnées (titre, description) sont correctes

---

### Test 4 : Upload d'Images (Lot Moyen)

**Objectif** : Tester l'upload par lots de 10-20 images

**Étapes** :
1. Sélectionnez 15 photos dans votre catalogue Lightroom
2. Faites un clic droit et choisissez **Exporter**
3. Sélectionnez **PikSend** comme service d'export
4. Choisissez la galerie créée au Test 2
5. Utilisez les mêmes paramètres qu'au Test 3
6. Cliquez sur **Exporter**

**Résultat attendu** :
- ✅ Upload se fait par lots de 10 images
- ✅ Progression affichée : "Processing image X of 15"
- ✅ Message de succès : "15 image(s) uploaded successfully"
- ✅ Temps total < 2 minutes pour 15 images

**Vérifications** :
1. Vérifiez dans le fichier de log (`PikSend.log`) :
   - Recherchez "Batch of 10 images registered successfully"
   - Recherchez "Batch of 5 images registered successfully"
2. Vérifiez dans le dashboard que toutes les images sont présentes

---

### Test 5 : Gestion des Erreurs

**Objectif** : Vérifier que les erreurs sont gérées correctement

**Test 5a : Image Trop Grande**

**Étapes** :
1. Sélectionnez une image > 500 MB (ou créez-en une)
2. Essayez de l'exporter vers PikSend

**Résultat attendu** :
- ✅ Message d'erreur clair : "File too large (max 500 MB)"
- ✅ L'upload ne bloque pas le plugin

**Test 5b : Connexion Interrompue**

**Étapes** :
1. Démarrez un export de 5 images
2. Désactivez votre connexion internet pendant l'upload
3. Réactivez la connexion après 10 secondes

**Résultat attendu** :
- ✅ Le plugin tente de réessayer automatiquement (3 tentatives)
- ✅ Message d'erreur si échec : "Upload timeout or connection lost"
- ✅ Les images uploadées avant la coupure sont sauvegardées

**Test 5c : Token Expiré**

**Étapes** :
1. Dans les paramètres du plugin, entrez un token invalide
2. Essayez de créer une galerie

**Résultat attendu** :
- ✅ Message d'erreur : "Token invalide"
- ✅ Lien vers la page de génération de token

---

### Test 6 : Performance

**Objectif** : Vérifier que la nouvelle API est plus rapide

**Étapes** :
1. Notez l'heure de début
2. Uploadez 10 images (environ 5 MB chacune)
3. Notez l'heure de fin

**Résultat attendu** :
- ✅ Temps total < 1 minute pour 10 images (5 MB chacune)
- ✅ Vitesse d'upload affichée (MB/s)
- ✅ Temps restant estimé affiché

**Comparaison avec v1.0.0** :
- v1.0.0 : ~2-3 minutes pour 10 images
- v1.1.0 : ~1 minute pour 10 images (amélioration de 50-60%)

---

## Vérification des Logs

Les logs sont essentiels pour diagnostiquer les problèmes.

### Localisation du Fichier de Log

- **Windows** : `C:\Users\[VotreNom]\AppData\Roaming\Adobe\Lightroom\Modules\PikSend.lrplugin\PikSend.log`
- **macOS** : `~/Library/Application Support/Adobe/Lightroom/Modules/PikSend.lrplugin/PikSend.log`

### Que Vérifier dans les Logs

Recherchez ces messages pour confirmer que la nouvelle API est utilisée :

```
[INFO] Validating token (PikSendAPI)
[INFO] Token validated successfully (PikSendAPI)
[INFO] Creating gallery: Test v1.1.0 (PikSendAPI)
[INFO] Gallery created: [gallery-id] (PikSendAPI)
[INFO] Uploading to Cloudinary: image.jpg (PikSendAPI)
[INFO] Uploaded to Cloudinary: [public-id] (PikSendAPI)
[INFO] Batch of 10 images registered successfully (PikSendCloudinaryUpload)
```

### Messages d'Erreur Courants

| Message | Cause | Solution |
|---------|-------|----------|
| `Token invalide` | Token expiré ou incorrect | Générez un nouveau token |
| `Plan Pro requis` | Abonnement expiré | Renouvelez votre abonnement |
| `Upload timeout` | Connexion lente | Vérifiez votre connexion |
| `File too large` | Image > 500 MB | Réduisez la taille de l'image |
| `Cloudinary upload failed` | Problème Cloudinary | Réessayez plus tard |

---

## Rapport de Bug

Si vous rencontrez un problème, veuillez fournir :

1. **Version du plugin** : 1.1.0
2. **Version de Lightroom** : (ex: 11.5)
3. **Système d'exploitation** : (ex: Windows 11, macOS 13)
4. **Description du problème** : Soyez précis
5. **Étapes pour reproduire** : Comment reproduire le bug
6. **Logs** : Copiez les dernières lignes du fichier `PikSend.log`
7. **Captures d'écran** : Si applicable

Envoyez votre rapport à : **support@piksend.com**

---

## Checklist de Test Complète

Utilisez cette checklist pour valider tous les aspects de la v1.1.0 :

### Tests Automatisés
- [ ] Suite de tests exécutée avec succès (5/5 tests passés)

### Tests Manuels
- [ ] Authentification avec API token
- [ ] Création de galerie (< 2 secondes)
- [ ] Upload de 3 images (< 30 secondes)
- [ ] Upload de 15 images (< 2 minutes)
- [ ] Gestion d'erreur : Image trop grande
- [ ] Gestion d'erreur : Connexion interrompue
- [ ] Gestion d'erreur : Token invalide
- [ ] Performance : 10 images en < 1 minute

### Vérifications Dashboard
- [ ] Galeries créées apparaissent dans le dashboard
- [ ] Images uploadées sont visibles
- [ ] Métadonnées (titre, description) sont correctes
- [ ] Ordre des images est préservé

### Vérifications Logs
- [ ] Logs montrent l'utilisation de la nouvelle API
- [ ] Pas d'erreurs critiques dans les logs
- [ ] Messages de succès pour chaque upload

---

## Support

Pour toute question ou problème :

- **Documentation** : https://piksend.com/docs/lightroom-plugin
- **FAQ** : https://piksend.com/faq/lightroom-plugin
- **Email** : support@piksend.com
- **Discord** : https://discord.gg/piksend

---

**Merci de tester la version 1.1.0 du plugin PikSend !** 🎉

Vos retours sont précieux pour améliorer le plugin.
