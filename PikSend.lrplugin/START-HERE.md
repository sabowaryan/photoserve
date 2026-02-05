# 👋 Commencez Ici - Premier Test du Plugin

**Bienvenue !** Le plugin PikSend se charge maintenant correctement dans Lightroom.

---

## 🎯 Votre Mission (5 minutes)

Tester les fonctionnalités de base pour confirmer que tout fonctionne.

---

## 📍 Étape 1 : Vérifier le Chargement

**Dans Lightroom Classic :**

1. Menu **Fichier** → **Gestionnaire de modules externes**
2. Cherchez **"PikSend"** dans la liste à gauche
3. Cliquez dessus

**✅ Vous devriez voir :**
- Statut : **"En cours d'exécution"** (en vert)
- Version : **1.0.0**
- Trois sections : "À propos", "Paramètres", "Mises à jour"

**❌ Si vous voyez des erreurs :**
- Regardez le fichier `4.txt` (ou le dernier fichier .txt créé)
- Copiez l'erreur complète
- On corrigera ensemble

---

## 📍 Étape 2 : Préparer votre Token API

**Avant de continuer, vous avez besoin d'un token API.**

### Option A : Vous avez déjà un compte PikSend Pro

1. Ouvrez votre navigateur
2. Allez sur **https://piksend.com/dashboard**
3. Connectez-vous
4. Allez dans **Paramètres** → **API** (ou section Développeur)
5. Cliquez sur **"Générer un nouveau token"**
6. Copiez le token (commence par `pk_...`)
7. **Gardez cette fenêtre ouverte** (vous en aurez besoin)

### Option B : Vous n'avez pas de compte Pro

⚠️ Le plugin nécessite un compte PikSend avec plan Pro.

**Pour tester quand même :**
- Vous pouvez créer un compte de test
- Ou utiliser un token de développement si disponible

---

## 📍 Étape 3 : Se Connecter dans Lightroom

**Dans Lightroom :**

1. Sélectionnez **n'importe quelle photo** dans votre catalogue
2. Menu **Fichier** → **Exporter...**
3. Dans la fenêtre d'export :
   - En haut, "Exporter vers" : sélectionnez **PikSend**
   - Faites défiler vers le bas

4. Vous devriez voir une section **"Compte PikSend"**
   - Statut : "Non connecté"
   - Bouton **"Connexion"**

5. Cliquez sur **"Connexion"**

6. Dans la boîte de dialogue :
   - Collez votre token API
   - Cliquez **OK**

**✅ Résultat attendu :**
- Message : "Connexion réussie"
- Le statut change : "Connecté en tant que : [Votre nom]"

**❌ Si erreur "Plan Pro requis" :**
- Votre compte n'a pas le plan Pro
- Vous devez upgrader sur piksend.com

**❌ Si erreur "Token invalide" :**
- Vérifiez que vous avez copié le token complet
- Réessayez avec un nouveau token

---

## 📍 Étape 4 : Charger vos Galeries

**Toujours dans la fenêtre d'export :**

1. Section **"Galerie"** devrait maintenant être visible
2. Cliquez sur le bouton **"Actualiser"** (icône de rafraîchissement)
3. Attendez quelques secondes

**✅ Résultat attendu :**
- La liste déroulante se remplit avec vos galeries existantes
- Format : "Nom de la galerie (X photos)"

**❌ Si la liste reste vide :**
- Pas de problème ! Vous allez créer une nouvelle galerie

---

## 📍 Étape 5 : Créer une Galerie de Test

1. Cliquez sur le bouton **"Nouvelle galerie"**

2. Dans la boîte de dialogue :
   - **Titre :** `Test Plugin Lightroom`
   - **Description :** `Galerie de test pour valider le plugin`
   - Laissez les autres options par défaut
   - Cliquez **"Créer"**

**✅ Résultat attendu :**
- Message de succès
- La galerie "Test Plugin Lightroom" apparaît dans la liste
- Elle est automatiquement sélectionnée

---

## 📍 Étape 6 : Exporter votre Première Photo

**C'est le moment de vérité ! 🎉**

1. Vérifiez que :
   - ✅ Vous êtes connecté
   - ✅ Une galerie est sélectionnée ("Test Plugin Lightroom")
   - ✅ Une photo est sélectionnée

2. En bas de la fenêtre, cliquez sur **"Exporter"**

3. Observez :
   - Une barre de progression devrait apparaître
   - Message : "Upload en cours..."
   - Puis : "Export terminé avec succès"

**✅ Résultat attendu :**
- Export réussi sans erreur
- Fenêtre se ferme automatiquement

**❌ Si erreur :**
- Notez le message d'erreur exact
- Vérifiez votre connexion internet
- Consultez les logs (voir ci-dessous)

---

## 📍 Étape 7 : Vérifier sur PikSend

**Dans votre navigateur :**

1. Retournez sur **https://piksend.com/dashboard**
2. Cliquez sur la galerie **"Test Plugin Lightroom"**
3. Vous devriez voir votre photo !

**✅ Vérifications :**
- [ ] La photo est présente
- [ ] Elle s'affiche correctement
- [ ] La date d'upload est récente
- [ ] Les métadonnées sont préservées (si vous en aviez)

---

## 🎊 Félicitations !

Si vous êtes arrivé jusqu'ici, **le plugin fonctionne parfaitement** ! 🚀

---

## 🔍 Et Maintenant ?

### Test Rapide Complet (5 min de plus)
📄 Ouvrez : `QUICK-TEST.md`
- Testez avec plusieurs photos
- Explorez les paramètres

### Tests Approfondis (30-60 min)
📄 Ouvrez : `TESTING-GUIDE.md`
- Toutes les fonctionnalités
- Gestion des erreurs
- Performance
- Métadonnées

### Consulter les Logs

**Si vous voulez voir ce qui se passe en coulisses :**

1. **Fichier** → **Gestionnaire de modules externes**
2. Sélectionnez **PikSend**
3. Cochez **"Mode débogage"**
4. Faites quelques exports
5. Cliquez sur **"Voir les logs"**

---

## ❌ Problèmes Courants

### Le plugin ne se charge pas
```
Solution : Redémarrez Lightroom
```

### "Plan Pro requis"
```
Solution : Vérifiez votre abonnement sur piksend.com
Le plugin est réservé aux utilisateurs Pro
```

### Token invalide
```
Solution : 
1. Générez un nouveau token sur piksend.com
2. Copiez-le entièrement (commence par pk_)
3. Réessayez
```

### Photos ne s'uploadent pas
```
Solution :
1. Vérifiez votre connexion internet
2. Consultez les logs (mode débogage)
3. Vérifiez que la galerie existe toujours
```

### Erreur "Could not load script"
```
Solution : Cette erreur a normalement été corrigée
Si elle persiste, notez l'erreur exacte
```

---

## 📞 Besoin d'Aide ?

### Consulter la Documentation
- `README.md` - Vue d'ensemble
- `USER-GUIDE.md` - Guide complet
- `TESTING-GUIDE.md` - Tests détaillés

### Activer les Logs
1. Gestionnaire de modules externes
2. Cochez "Mode débogage"
3. Cliquez "Voir les logs"

### Fichiers Utiles
- `PLUGIN-READY.md` - État actuel du plugin
- `BUGFIXES-SUMMARY.md` - Corrections appliquées
- `VALIDATION-SUCCESS.md` - Validation technique

---

## ✅ Checklist de Premier Test

- [ ] Plugin chargé sans erreur
- [ ] Interface "À propos" visible
- [ ] Connexion avec token API réussie
- [ ] Liste des galeries chargée
- [ ] Nouvelle galerie créée
- [ ] Photo exportée avec succès
- [ ] Photo visible sur piksend.com

**Si toutes les cases sont cochées : Le plugin est opérationnel ! 🎉**

---

## 🚀 Prochaine Étape

**Testez avec plusieurs photos :**
1. Sélectionnez 5-10 photos
2. Exportez-les vers la même galerie
3. Vérifiez qu'elles apparaissent toutes sur PikSend

**Puis explorez :**
- Différents paramètres d'export (qualité, taille)
- Métadonnées (titre, description, mots-clés)
- Service de publication (collections publiées)

---

**Bon test ! 🎯**
