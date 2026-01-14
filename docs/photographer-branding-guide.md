# Guide du Photographe : Personnalisation du Branding

## 🎨 Comment accéder aux paramètres de branding

### Étape 1 : Accéder au Dashboard

1. Connectez-vous à votre compte PikSend
2. Vous arrivez automatiquement sur le **Dashboard** (`/dashboard`)

### Étape 2 : Ouvrir les Settings

Il y a **3 façons** d'accéder aux Settings :

#### Option A : Via le Header (Desktop)
- Cliquez sur votre **photo de profil** en haut à droite
- Ou cliquez sur l'icône **⚙️ Settings** dans le menu

#### Option B : Via le Menu Mobile
- Cliquez sur l'icône **☰ Menu** (hamburger) en haut à gauche
- Sélectionnez **Settings** dans le menu

#### Option C : Via l'URL directe
- Allez directement sur : `https://piksend.com/settings`

### Étape 3 : Naviguer vers la section Branding

Une fois dans Settings, vous verrez plusieurs sections :

1. **Profile** - Informations personnelles
2. **Subscription** - Gestion de l'abonnement
3. **🎨 Branding** ← C'est ici !
4. **Push Notifications** - Notifications
5. **Security** - Sécurité du compte

La section **Branding** se trouve entre Subscription et Push Notifications.

## 🎯 Fonctionnalités disponibles

### 1. Logo Personnalisé (Plan Pro uniquement)

#### Comment ajouter votre logo :

1. Dans la section **Branding**, trouvez **"Custom Logo"**
2. Si vous avez le **Plan Pro**, vous verrez une zone de téléchargement
3. Cliquez sur la zone ou glissez-déposez votre logo
4. **Formats acceptés** : PNG, JPG, JPEG
5. **Taille maximale** : 2 MB
6. **Dimensions recommandées** : 200px de largeur maximum

#### Aperçu et suppression :

- Une fois uploadé, vous verrez un **aperçu** de votre logo
- Pour le supprimer, cliquez sur le **❌** en haut à droite de l'aperçu
- Le logo sera affiché dans toutes vos galeries à la place du logo PikSend

#### Si vous n'avez pas le Plan Pro :

Vous verrez un message :
```
Upgrade to Pro to upload your custom logo and remove PikSend branding.
```

### 2. Couleurs de Marque (Plan Pro uniquement)

#### Comment personnaliser vos couleurs :

1. Dans la section **Branding**, trouvez **"Brand Colors"**
2. Vous avez **3 couleurs** à configurer :

   **a) Primary Color (Couleur Primaire)**
   - Utilisée pour les boutons principaux
   - Liens et éléments interactifs
   - Valeur par défaut : `#6366f1` (Indigo)

   **b) Secondary Color (Couleur Secondaire)**
   - Utilisée pour les accents
   - Dégradés de fond
   - Valeur par défaut : `#8b5cf6` (Violet)

   **c) Accent Color (Couleur d'Accentuation)**
   - Utilisée pour les highlights
   - Éléments spéciaux
   - Valeur par défaut : `#ec4899` (Rose)

#### Comment choisir une couleur :

1. Cliquez sur le **sélecteur de couleur**
2. Choisissez une couleur dans la palette
3. Ou entrez un **code hexadécimal** (ex: `#FF6B6B`)
4. Vous verrez un **aperçu en temps réel**

#### Où les couleurs sont appliquées :

- ✅ Boutons de la galerie
- ✅ Liens et textes interactifs
- ✅ Dégradés de fond
- ✅ Bouton CTA personnalisé
- ✅ Éléments de navigation
- ✅ Indicateurs et badges

### 3. Domaine Personnalisé (Plan Pro uniquement)

#### Comment configurer votre domaine :

1. Dans la section **Branding**, trouvez **"Custom Domain"**
2. Entrez votre domaine (ex: `photos.votresite.com`)
3. Suivez les **instructions DNS** affichées

#### Configuration DNS requise :

```
Type: CNAME
Host: photos (ou votre sous-domaine)
Value: piksend.com
TTL: 3600 (ou automatique)
```

#### Étapes détaillées :

1. **Connectez-vous à votre hébergeur** (OVH, Gandi, Cloudflare, etc.)
2. **Accédez à la gestion DNS** de votre domaine
3. **Ajoutez un enregistrement CNAME** :
   - Nom/Host : `photos`
   - Valeur/Target : `piksend.com`
4. **Sauvegardez** les modifications
5. **Attendez la propagation** (peut prendre jusqu'à 48h)
6. **Revenez sur PikSend** et cliquez sur "Verify Domain"

#### Vérification du domaine :

⚠️ **Note** : La vérification automatique n'est pas encore implémentée.
Pour l'instant, contactez le support pour activer votre domaine personnalisé.

### 4. Sauvegarder vos modifications

Une fois vos modifications effectuées :

1. Cliquez sur le bouton **"Save Branding Settings"** en bas de la section
2. Attendez la confirmation : **"Branding settings saved successfully!"**
3. Vos modifications sont **immédiatement appliquées** à toutes vos galeries

## 📱 Où voir le résultat

### Vos galeries personnalisées

Une fois le branding configuré, toutes vos galeries afficheront :

1. **Votre logo** (si configuré) à la place du logo PikSend
2. **Vos couleurs** sur tous les éléments interactifs
3. **Votre domaine** (si configuré) dans l'URL

### Tester votre branding :

1. Allez sur votre **Dashboard**
2. Ouvrez une de vos **galeries**
3. Cliquez sur **"Share"** pour obtenir le lien public
4. Ouvrez le lien dans un **nouvel onglet privé**
5. Vous verrez votre branding appliqué !

## 🎓 Exemples de branding

### Exemple 1 : Photographe de mariage

```
Logo : Logo avec initiales dorées
Couleur primaire : #D4AF37 (Or)
Couleur secondaire : #F5E6D3 (Beige)
Couleur accent : #8B7355 (Bronze)
Domaine : mariages.votresite.com
```

### Exemple 2 : Photographe corporate

```
Logo : Logo minimaliste noir
Couleur primaire : #1E293B (Bleu foncé)
Couleur secondaire : #475569 (Gris)
Couleur accent : #3B82F6 (Bleu)
Domaine : corporate.votresite.com
```

### Exemple 3 : Photographe lifestyle

```
Logo : Logo coloré et moderne
Couleur primaire : #FF6B6B (Rouge corail)
Couleur secondaire : #4ECDC4 (Turquoise)
Couleur accent : #FFE66D (Jaune)
Domaine : lifestyle.votresite.com
```

## ❓ Questions fréquentes

### Q : Puis-je avoir plusieurs logos pour différentes galeries ?
**R :** Non, actuellement un seul logo par compte. Il sera appliqué à toutes vos galeries.

### Q : Les couleurs s'appliquent-elles automatiquement ?
**R :** Oui ! Dès que vous sauvegardez, toutes vos galeries (nouvelles et existantes) utilisent vos couleurs.

### Q : Puis-je prévisualiser avant de sauvegarder ?
**R :** Pas encore, mais c'est prévu ! Pour l'instant, sauvegardez et testez sur une galerie.

### Q : Mon domaine ne fonctionne pas, que faire ?
**R :** Vérifiez :
1. La configuration DNS est correcte
2. La propagation est terminée (48h max)
3. Contactez le support si le problème persiste

### Q : Puis-je utiliser un domaine racine (sans sous-domaine) ?
**R :** Oui, mais c'est plus complexe. Utilisez un enregistrement A au lieu de CNAME. Contactez le support.

### Q : Le branding est-il inclus dans le plan Premium ?
**R :** Non, le branding complet (logo, domaine, couleurs) nécessite le **Plan Pro**.

### Q : Puis-je changer mon branding plus tard ?
**R :** Oui, autant de fois que vous voulez ! Les modifications sont instantanées.

## 🚀 Prochaines fonctionnalités

### En développement :

- ✅ Logo personnalisé dans le header des galeries
- ⏳ Vérification automatique du domaine DNS
- ⏳ Provisionnement SSL automatique
- ⏳ Aperçu en temps réel du branding
- ⏳ Templates de couleurs prédéfinis
- ⏳ Import/Export de configurations de branding

## 📞 Support

Besoin d'aide ? Contactez-nous :

- **Email** : support@piksend.com
- **Chat** : Disponible dans le dashboard
- **Documentation** : https://docs.piksend.com

---

**Dernière mise à jour** : Janvier 2026
**Version** : 1.0
