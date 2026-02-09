# 🧪 Guide de Test - Plugin PikSend pour Lightroom

**Version:** 1.0.0  
**Date:** 2026-02-04

## Prérequis

Avant de commencer les tests :

- ✅ Lightroom Classic installé (version 11.0+)
- ✅ Plugin PikSend chargé dans Lightroom
- ✅ Compte PikSend avec plan Pro (requis pour le plugin)
- ✅ Token API généré depuis le dashboard PikSend
- ✅ Au moins quelques photos dans votre catalogue Lightroom

## Phase 1 : Vérification du Chargement ✅

### 1.1 Vérifier que le plugin est chargé

1. Dans Lightroom, allez dans **Fichier > Gestionnaire de modules externes**
2. Vérifiez que **PikSend** apparaît dans la liste
3. Le statut doit être **"En cours d'exécution"** (pas d'erreur)
4. Cliquez sur le plugin pour voir les détails

**✅ Résultat attendu :**
- Plugin visible et actif
- Version 1.0.0 affichée
- Aucune erreur dans le log

---

## Phase 2 : Interface "À propos"

### 2.1 Accéder aux informations du plugin

1. Dans le **Gestionnaire de modules externes**, sélectionnez **PikSend**
2. Vérifiez les sections suivantes :

**Section "À propos de PikSend" :**
- [ ] Titre : "PikSend Plugin for Adobe Lightroom Classic"
- [ ] Version : "Version : 1.0.0"
- [ ] Description affichée
- [ ] Boutons présents : "Site Web", "Documentation", "Support"

**Section "Paramètres" :**
- [ ] Case à cocher "Mode débogage"
- [ ] Chemin du fichier log affiché
- [ ] Boutons "Voir les logs" et "Effacer les logs"
- [ ] Boutons "Effacer le cache" et "Statistiques du cache"

**Section "Mises à jour" :**
- [ ] Version actuelle affichée
- [ ] Bouton "Vérifier les mises à jour"

**✅ Test réussi si :** Toutes les sections s'affichent sans erreur

---

## Phase 3 : Authentification

### 3.1 Obtenir un token API

1. Ouvrez votre navigateur et allez sur **https://piksend.com/dashboard**
2. Connectez-vous à votre compte
3. Allez dans **Paramètres > API** (ou section développeur)
4. Générez un nouveau token API
5. Copiez le token (format : `pk_...`)

### 3.2 Se connecter dans Lightroom

**Via Export :**
1. Sélectionnez une photo dans Lightroom
2. Allez dans **Fichier > Exporter**
3. Dans "Exporter vers", sélectionnez **PikSend**
4. Vous devriez voir une section "Compte PikSend"
5. Statut : "Non connecté"
6. Cliquez sur le bouton **"Connexion"**

**Dans la boîte de dialogue :**
- [ ] Champ "Token API" visible
- [ ] Instructions affichées
- [ ] Bouton "Ouvrir le Dashboard" fonctionne
- [ ] Collez votre token API
- [ ] Cliquez sur "OK"

**✅ Résultat attendu :**
- Message de succès : "Connexion réussie"
- Votre nom d'utilisateur s'affiche : "Connecté en tant que : [Votre nom]"
- Le token est sauvegardé (pas besoin de le re-saisir)

**❌ Si erreur "Plan Pro requis" :**
- Vérifiez que votre compte a bien un plan Pro
- Le plugin est réservé aux utilisateurs Pro

---

## Phase 4 : Gestion des Galeries

### 4.1 Charger la liste des galeries

1. Une fois connecté, dans la fenêtre d'export
2. Section "Galerie" devrait apparaître
3. Cliquez sur **"Actualiser"**

**✅ Résultat attendu :**
- Liste déroulante se remplit avec vos galeries existantes
- Format : "Nom de la galerie (X photos)"
- Bouton "Nouvelle galerie" visible

### 4.2 Créer une nouvelle galerie

1. Cliquez sur **"Nouvelle galerie"**
2. Dans la boîte de dialogue :
   - [ ] Champ "Titre" visible
   - [ ] Champ "Description" visible
   - [ ] Case "Galerie publique"
   - [ ] Option "Définir une date d'expiration"
   - [ ] Si expiration cochée : champ "Expire dans X jours"

3. Remplissez :
   - Titre : "Test Plugin Lightroom"
   - Description : "Galerie de test"
   - Laissez "Galerie publique" décoché
   - Ne définissez pas d'expiration

4. Cliquez sur **"Créer"**

**✅ Résultat attendu :**
- Message de succès
- La nouvelle galerie apparaît dans la liste déroulante
- Elle est automatiquement sélectionnée

---

## Phase 5 : Export de Photos

### 5.1 Export simple (1 photo)

1. Sélectionnez **1 photo** dans votre catalogue
2. **Fichier > Exporter**
3. Sélectionnez **PikSend** comme destination
4. Vérifiez la configuration :
   - [ ] Galerie sélectionnée
   - [ ] Compte connecté
   - [ ] Paramètres d'export (qualité, format, etc.)

5. Cliquez sur **"Exporter"**

**✅ Résultat attendu :**
- Barre de progression s'affiche
- Message de succès : "1 photo exportée vers PikSend"
- Aucune erreur dans les logs

### 5.2 Vérifier sur PikSend

1. Ouvrez votre navigateur
2. Allez sur **https://piksend.com/dashboard**
3. Ouvrez la galerie "Test Plugin Lightroom"

**✅ Vérifications :**
- [ ] La photo est présente
- [ ] Métadonnées préservées (titre, description si définies)
- [ ] Qualité de l'image correcte
- [ ] Date d'upload récente

### 5.3 Export multiple (5-10 photos)

1. Sélectionnez **5 à 10 photos** dans Lightroom
2. Répétez le processus d'export
3. Observez la progression

**✅ Résultat attendu :**
- Toutes les photos sont uploadées
- Progression affichée (1/5, 2/5, etc.)
- Temps d'upload raisonnable
- Aucune erreur

---

## Phase 6 : Service de Publication (Optionnel)

### 6.1 Configurer le service de publication

1. Dans Lightroom, allez dans le module **Bibliothèque**
2. Dans le panneau de gauche, section "Services de publication"
3. Cliquez sur le **+** et sélectionnez **"Accéder aux services de publication"**
4. Trouvez et ajoutez **PikSend**

### 6.2 Créer une collection publiée

1. Clic droit sur **PikSend** dans les services de publication
2. **"Créer une collection publiée"**
3. Nommez-la : "Photos Sélectionnées"
4. Sélectionnez ou créez une galerie PikSend

### 6.3 Publier des photos

1. Glissez-déposez des photos dans la collection
2. Clic droit sur la collection > **"Publier"**

**✅ Résultat attendu :**
- Photos publiées sur PikSend
- Statut "Publié" dans Lightroom
- Synchronisation maintenue

---

## Phase 7 : Fonctionnalités Avancées

### 7.1 Métadonnées

**Test :**
1. Sélectionnez une photo avec métadonnées (titre, mots-clés, description)
2. Exportez vers PikSend
3. Vérifiez sur le dashboard que les métadonnées sont préservées

**✅ Vérifications :**
- [ ] Titre préservé
- [ ] Description préservée
- [ ] Mots-clés/tags préservés
- [ ] Données EXIF disponibles

### 7.2 Paramètres d'export

**Testez différentes configurations :**

1. **Qualité JPEG :**
   - Exportez en qualité 100%
   - Exportez en qualité 80%
   - Vérifiez la taille des fichiers

2. **Dimensions :**
   - Exportez en taille originale
   - Exportez avec redimensionnement (ex: 2000px)
   - Vérifiez les dimensions sur PikSend

3. **Format :**
   - Exportez en JPEG
   - Exportez en PNG (si supporté)

### 7.3 Gestion du cache

1. Exportez la même photo deux fois
2. La deuxième fois devrait être plus rapide (cache)
3. Allez dans les paramètres du plugin
4. Cliquez sur **"Statistiques du cache"**
5. Vérifiez le nombre d'entrées
6. Cliquez sur **"Effacer le cache"**
7. Confirmez
8. Réexportez la même photo (devrait re-uploader)

---

## Phase 8 : Gestion des Erreurs

### 8.1 Test sans connexion

1. Déconnectez-vous (bouton "Déconnexion")
2. Essayez d'exporter une photo

**✅ Résultat attendu :**
- Message d'erreur clair : "Veuillez vous connecter"
- Pas de crash

### 8.2 Test avec token invalide

1. Déconnectez-vous
2. Essayez de vous connecter avec un token invalide : "pk_test_invalid"

**✅ Résultat attendu :**
- Message d'erreur : "Token API invalide"
- Possibilité de réessayer

### 8.3 Test avec galerie supprimée

1. Sélectionnez une galerie
2. Supprimez-la depuis le dashboard PikSend
3. Essayez d'exporter vers cette galerie dans Lightroom

**✅ Résultat attendu :**
- Erreur détectée
- Message clair
- Possibilité de sélectionner une autre galerie

---

## Phase 9 : Logs et Débogage

### 9.1 Activer le mode débogage

1. Gestionnaire de modules externes > PikSend
2. Cochez **"Mode débogage"**
3. Effectuez quelques exports
4. Cliquez sur **"Voir les logs"**

**✅ Vérifications :**
- [ ] Logs détaillés affichés
- [ ] Timestamps présents
- [ ] Informations de débogage visibles
- [ ] Aucune information sensible (tokens masqués)

### 9.2 Effacer les logs

1. Cliquez sur **"Effacer les logs"**
2. Confirmez
3. Vérifiez que les logs sont vides

---

## Phase 10 : Localisation

### 10.1 Test en français (si Lightroom est en français)

1. Changez la langue de Lightroom en français (si possible)
2. Redémarrez Lightroom
3. Vérifiez que l'interface du plugin est en français

**✅ Vérifications :**
- [ ] Boutons traduits
- [ ] Messages traduits
- [ ] Erreurs traduites

---

## Checklist Finale

### ✅ Fonctionnalités de Base
- [ ] Plugin se charge sans erreur
- [ ] Interface "À propos" s'affiche
- [ ] Authentification fonctionne
- [ ] Liste des galeries se charge
- [ ] Création de galerie fonctionne
- [ ] Export d'une photo fonctionne
- [ ] Export multiple fonctionne

### ✅ Fonctionnalités Avancées
- [ ] Métadonnées préservées
- [ ] Cache fonctionne
- [ ] Logs accessibles
- [ ] Mode débogage fonctionne
- [ ] Service de publication fonctionne (optionnel)

### ✅ Gestion des Erreurs
- [ ] Erreurs d'authentification gérées
- [ ] Erreurs réseau gérées
- [ ] Messages d'erreur clairs

### ✅ Performance
- [ ] Upload rapide (< 5s par photo en moyenne)
- [ ] Interface réactive
- [ ] Pas de freeze de Lightroom

---

## Problèmes Courants et Solutions

### Le plugin ne se charge pas
- Vérifiez le log des plugins dans Lightroom
- Assurez-vous que tous les fichiers .lua sont présents
- Redémarrez Lightroom

### "Plan Pro requis"
- Vérifiez votre abonnement sur piksend.com
- Le plugin nécessite un compte Pro

### Photos ne s'uploadent pas
- Vérifiez votre connexion internet
- Vérifiez que le token API est valide
- Consultez les logs (mode débogage)

### Galeries ne se chargent pas
- Cliquez sur "Actualiser"
- Vérifiez votre connexion
- Reconnectez-vous si nécessaire

---

## Rapport de Test

Après avoir effectué tous les tests, notez :

**Date du test :** _______________  
**Version Lightroom :** _______________  
**Système d'exploitation :** _______________

**Résultats :**
- Tests réussis : _____ / _____
- Tests échoués : _____
- Bugs trouvés : _____

**Notes :**
_________________________________
_________________________________
_________________________________

---

## Prochaines Étapes

Une fois tous les tests validés :

1. ✅ **Documentation utilisateur** - Créer le guide d'installation final
2. ✅ **Package de distribution** - Créer le fichier ZIP
3. ✅ **Page de téléchargement** - Mettre en ligne sur piksend.com
4. ✅ **Annonce** - Informer les utilisateurs Pro

**Le plugin est prêt pour la production ! 🎉**
