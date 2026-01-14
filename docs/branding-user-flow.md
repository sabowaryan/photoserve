# Parcours Utilisateur : Configuration du Branding

## 🗺️ Vue d'ensemble du parcours

```
┌─────────────────┐
│   Dashboard     │
│   /dashboard    │
└────────┬────────┘
         │
         │ Clic sur Settings
         ▼
┌─────────────────┐
│   Settings      │
│   /settings     │
└────────┬────────┘
         │
         │ Scroll vers Branding
         ▼
┌─────────────────┐
│  Branding       │
│  Section        │
└────────┬────────┘
         │
         ├─► Upload Logo
         ├─► Choisir Couleurs
         ├─► Configurer Domaine
         │
         │ Clic sur Save
         ▼
┌─────────────────┐
│  Confirmation   │
│  "Saved!"       │
└────────┬────────┘
         │
         │ Retour Dashboard
         ▼
┌─────────────────┐
│  Galeries avec  │
│  Branding       │
└─────────────────┘
```

## 📍 Étape par étape avec captures d'écran

### Étape 1 : Dashboard

**URL** : `/dashboard`

**Ce que voit le photographe** :
```
┌──────────────────────────────────────────────────────┐
│  PikSend                    [Settings] [Profile] [⚙️] │
├──────────────────────────────────────────────────────┤
│                                                       │
│  📊 Dashboard                                         │
│                                                       │
│  Mes Galeries                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │ Mariage │ │ Famille │ │ Event   │                │
│  │ 45 imgs │ │ 32 imgs │ │ 67 imgs │                │
│  └─────────┘ └─────────┘ └─────────┘                │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Actions disponibles** :
- Cliquer sur **Settings** dans le header
- Cliquer sur l'icône **⚙️**
- Cliquer sur le **profil** puis Settings

---

### Étape 2 : Page Settings

**URL** : `/settings`

**Ce que voit le photographe** :
```
┌──────────────────────────────────────────────────────┐
│  ⚙️ Settings                                          │
├──────────────────────────────────────────────────────┤
│                                                       │
│  👤 Profile                                           │
│  ┌─────────────────────────────────────────────┐    │
│  │ Name: John Doe                               │    │
│  │ Email: john@example.com                      │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  💳 Subscription                                      │
│  ┌─────────────────────────────────────────────┐    │
│  │ Current Plan: Pro                            │    │
│  │ [Manage Subscription]                        │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  🎨 Branding                    ← NOUVELLE SECTION   │
│  ┌─────────────────────────────────────────────┐    │
│  │ Custom Logo                                  │    │
│  │ ┌─────────────────────────────────────┐     │    │
│  │ │  [📤 Click to upload logo]          │     │    │
│  │ │  PNG, JPG up to 2MB                 │     │    │
│  │ └─────────────────────────────────────┘     │    │
│  │                                              │    │
│  │ Custom Domain                                │    │
│  │ ┌─────────────────────────────────────┐     │    │
│  │ │ photos.yourdomain.com               │     │    │
│  │ └─────────────────────────────────────┘     │    │
│  │ Configure DNS: CNAME → piksend.com          │    │
│  │                                              │    │
│  │ Brand Colors                                 │    │
│  │ Primary:   [🎨 #6366f1] ████████            │    │
│  │ Secondary: [🎨 #8b5cf6] ████████            │    │
│  │ Accent:    [🎨 #ec4899] ████████            │    │
│  │                                              │    │
│  │ [Save Branding Settings]                     │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  🔔 Push Notifications                                │
│  🔒 Security                                          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

### Étape 3 : Upload du Logo

**Action** : Clic sur la zone d'upload

**Ce qui se passe** :
```
┌──────────────────────────────────────────────────────┐
│  Custom Logo                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │  [Sélecteur de fichier s'ouvre]             │    │
│  │                                              │    │
│  │  📁 Mes Documents                            │    │
│  │     logo.png                                 │    │
│  │     logo-hd.jpg                              │    │
│  │     brand.png                                │    │
│  │                                              │    │
│  │  [Ouvrir] [Annuler]                          │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Après sélection** :
```
┌──────────────────────────────────────────────────────┐
│  Custom Logo                                          │
│  ┌─────────────────────────────────────────────┐    │
│  │  ┌──────────────────┐                       │    │
│  │  │                  │  ❌                    │    │
│  │  │   [VOTRE LOGO]   │                       │    │
│  │  │                  │                       │    │
│  │  └──────────────────┘                       │    │
│  │  Aperçu du logo                             │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

### Étape 4 : Sélection des Couleurs

**Action** : Clic sur un sélecteur de couleur

**Ce qui se passe** :
```
┌──────────────────────────────────────────────────────┐
│  Brand Colors                                         │
│                                                       │
│  Primary Color                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  [🎨 Sélecteur ouvert]                       │    │
│  │                                              │    │
│  │  ┌────────────────────────────┐             │    │
│  │  │ 🌈 Palette de couleurs     │             │    │
│  │  │                            │             │    │
│  │  │  [Gradient coloré]         │             │    │
│  │  │                            │             │    │
│  │  │  Hex: #6366f1              │             │    │
│  │  │  RGB: 99, 102, 241         │             │    │
│  │  │                            │             │    │
│  │  │  Presets:                  │             │    │
│  │  │  🔵 🟣 🔴 🟢 🟡 🟠         │             │    │
│  │  │                            │             │    │
│  │  │  [Appliquer]               │             │    │
│  │  └────────────────────────────┘             │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**Aperçu en temps réel** :
```
┌──────────────────────────────────────────────────────┐
│  Aperçu                                               │
│  ┌─────────────────────────────────────────────┐    │
│  │  Bouton avec votre couleur primaire         │    │
│  │  ┌──────────────────────────────────┐       │    │
│  │  │  [Télécharger la galerie]        │       │    │
│  │  └──────────────────────────────────┘       │    │
│  │                                              │    │
│  │  Lien avec votre couleur                    │    │
│  │  Voir plus de photos →                      │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

---

### Étape 5 : Configuration du Domaine

**Action** : Saisie du domaine

**Ce qui se passe** :
```
┌──────────────────────────────────────────────────────┐
│  Custom Domain                                        │
│  ┌─────────────────────────────────────────────┐    │
│  │  photos.monsite.com                          │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  📋 Instructions DNS :                                │
│  ┌─────────────────────────────────────────────┐    │
│  │  1. Connectez-vous à votre hébergeur        │    │
│  │  2. Accédez à la gestion DNS                │    │
│  │  3. Ajoutez un enregistrement CNAME :       │    │
│  │                                              │    │
│  │     Type:  CNAME                             │    │
│  │     Host:  photos                            │    │
│  │     Value: piksend.com                       │    │
│  │     TTL:   3600                              │    │
│  │                                              │    │
│  │  4. Sauvegardez et attendez 24-48h          │    │
│  │                                              │    │
│  │  [Copier la configuration]                   │    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ⚠️ La vérification automatique arrive bientôt       │
│  Contactez le support pour activer votre domaine     │
└──────────────────────────────────────────────────────┘
```

---

### Étape 6 : Sauvegarde

**Action** : Clic sur "Save Branding Settings"

**Ce qui se passe** :
```
┌──────────────────────────────────────────────────────┐
│  [Save Branding Settings]                             │
│         ↓                                             │
│  [Saving...]  ⏳                                      │
│         ↓                                             │
│  ✅ Branding settings saved successfully!            │
└──────────────────────────────────────────────────────┘
```

---

### Étape 7 : Résultat dans les Galeries

**URL** : `/g/abc123` (galerie publique)

**Ce que voient les visiteurs** :
```
┌──────────────────────────────────────────────────────┐
│  [VOTRE LOGO]                          [Télécharger] │
│                                                       │
│  Mariage de Sophie & Thomas                          │
│  45 photos • Expire dans 30 jours                    │
│                                                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │  Photo  │ │  Photo  │ │  Photo  │                │
│  │    1    │ │    2    │ │    3    │                │
│  └─────────┘ └─────────┘ └─────────┘                │
│                                                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                │
│  │  Photo  │ │  Photo  │ │  Photo  │                │
│  │    4    │ │    5    │ │    6    │                │
│  └─────────┘ └─────────┘ └─────────┘                │
│                                                       │
│  [Bouton avec VOS couleurs]                          │
│  ┌──────────────────────────────────────────┐       │
│  │  Réserver votre séance photo →           │       │
│  └──────────────────────────────────────────┘       │
│                                                       │
│  Liens avec VOS couleurs                             │
│                                                       │
└──────────────────────────────────────────────────────┘
```

**Avec domaine personnalisé** :
```
URL : https://photos.monsite.com/g/abc123
      ↑
      Votre domaine !
```

## 🎯 Points clés du parcours

### ✅ Ce qui fonctionne maintenant

1. **Accès facile** : Settings accessible depuis le header
2. **Section Branding** : Visible dans la page Settings
3. **Upload de logo** : Fonctionnel avec aperçu
4. **Sélection de couleurs** : 3 couleurs personnalisables
5. **Champ domaine** : Peut être saisi
6. **Sauvegarde** : Modifications enregistrées en base de données
7. **Application automatique** : Couleurs appliquées dans toutes les galeries

### ⚠️ Ce qui nécessite une action manuelle

1. **Vérification du domaine** : Pas encore automatique
2. **Provisionnement SSL** : Nécessite intervention support
3. **Activation du domaine** : Doit être fait manuellement

### 🚀 Prochaines améliorations

1. **Vérification DNS automatique** : Bouton "Verify Domain"
2. **SSL automatique** : Via Cloudflare API
3. **Aperçu en temps réel** : Voir le branding avant de sauvegarder
4. **Templates** : Palettes de couleurs prédéfinies
5. **Logo dans header** : Affichage automatique du logo uploadé

## 📊 Statistiques d'utilisation

### Temps estimé pour configurer le branding complet :

- **Logo** : 2 minutes
- **Couleurs** : 5 minutes
- **Domaine** : 10 minutes (+ 24-48h pour DNS)
- **Total** : ~15 minutes + attente DNS

### Taux de complétion attendu :

- **Logo** : 80% des utilisateurs Pro
- **Couleurs** : 95% des utilisateurs Pro
- **Domaine** : 40% des utilisateurs Pro (plus technique)

## 🔄 Flux alternatifs

### Si l'utilisateur n'a pas le Plan Pro :

```
Settings → Branding
    ↓
[Upgrade to Pro required]
    ↓
Clic sur "Upgrade"
    ↓
Page Pricing
    ↓
Sélection Plan Pro
    ↓
Paiement Stripe
    ↓
Retour Settings
    ↓
Branding débloqué ✅
```

### Si l'utilisateur veut tester avant d'acheter :

```
Settings → Branding
    ↓
[Pro Plan Required]
    ↓
Voir les exemples
    ↓
Décision d'upgrade
```

---

**Note** : Ce document sera mis à jour au fur et à mesure de l'implémentation des fonctionnalités manquantes.
