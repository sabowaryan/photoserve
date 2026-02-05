# ⚡ Test Rapide - Plugin PikSend (5 minutes)

## 1️⃣ Vérifier le Chargement (30 secondes)

Dans Lightroom :
- **Fichier > Gestionnaire de modules externes**
- Cherchez **PikSend** dans la liste
- ✅ Statut : "En cours d'exécution"

---

## 2️⃣ Voir l'Interface (1 minute)

- Cliquez sur **PikSend** dans le gestionnaire
- Vérifiez que vous voyez :
  - ✅ Version 1.0.0
  - ✅ Section "À propos"
  - ✅ Section "Paramètres"
  - ✅ Section "Mises à jour"

---

## 3️⃣ Se Connecter (2 minutes)

### Obtenir le token :
1. Ouvrez **https://piksend.com/dashboard**
2. Allez dans **Paramètres > API**
3. Copiez votre token API

### Dans Lightroom :
1. Sélectionnez une photo
2. **Fichier > Exporter**
3. Destination : **PikSend**
4. Cliquez sur **"Connexion"**
5. Collez votre token
6. ✅ Devrait afficher : "Connecté en tant que : [Votre nom]"

---

## 4️⃣ Créer une Galerie (1 minute)

1. Dans la fenêtre d'export, section "Galerie"
2. Cliquez sur **"Nouvelle galerie"**
3. Titre : **"Test Plugin"**
4. Cliquez sur **"Créer"**
5. ✅ La galerie apparaît dans la liste

---

## 5️⃣ Exporter une Photo (1 minute)

1. Galerie sélectionnée : "Test Plugin"
2. Cliquez sur **"Exporter"**
3. ✅ Barre de progression
4. ✅ Message de succès

### Vérifier sur PikSend :
1. Ouvrez **https://piksend.com/dashboard**
2. Ouvrez la galerie "Test Plugin"
3. ✅ Votre photo est là !

---

## ✅ Test Réussi !

Si toutes les étapes fonctionnent, le plugin est opérationnel.

**Prochaines étapes :**
- Consultez `TESTING-GUIDE.md` pour des tests approfondis
- Testez avec plusieurs photos
- Explorez les paramètres avancés

---

## ❌ Problème ?

**Le plugin ne se charge pas :**
- Redémarrez Lightroom
- Vérifiez le log des plugins

**"Plan Pro requis" :**
- Vérifiez votre abonnement sur piksend.com

**Erreur de connexion :**
- Vérifiez que le token est correct
- Vérifiez votre connexion internet

**Consultez les logs :**
- Gestionnaire de modules externes > PikSend
- Cochez "Mode débogage"
- Cliquez "Voir les logs"
