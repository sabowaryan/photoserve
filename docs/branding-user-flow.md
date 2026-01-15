# Guide Utilisateur : Configuration du Branding Personnalisé

## Vue d'ensemble

Ce guide explique comment un photographe avec un **plan Pro** peut configurer son branding personnalisé (logo, couleurs, domaine) pour créer une expérience galerie entièrement white-label.

## Prérequis

✅ **Plan Pro actif** - Le branding personnalisé est réservé aux utilisateurs Pro  
✅ **Compte vérifié** - Email confirmé  
✅ **Accès au dashboard** - Connecté à `/dashboard`

## Étape 1 : Accéder aux paramètres de branding

### Navigation

```
Dashboard → Paramètres (⚙️) → Section "Branding"
```

**URL directe** : `/dashboard/settings#branding`

### Interface

```
┌─────────────────────────────────────────────┐
│  🎨 Branding                                │
│  Customize your brand identity              │
├─────────────────────────────────────────────┤
│                                             │
│  [Logo personnalisé]                        │
│  [Domaine personnalisé]                     │
│  [Couleurs de marque]                       │
│                                             │
│  [Enregistrer les paramètres]               │
└─────────────────────────────────────────────┘
```

## Étape 2 : Uploader votre logo

### Spécifications

- **Formats acceptés** : PNG, JPG, JPEG, GIF, WebP
- **Taille maximale** : 2 MB
- **Dimensions recommandées** : 200x200px à 500x500px
- **Fond transparent** : Recommandé (PNG)
- **Ratio** : Carré ou horizontal (max 3:1)

### Processus

1. **Cliquer sur la zone d'upload**
   ```
   ┌─────────────────────────────────┐
   │         📤                      │
   │  Click to upload logo           │
   │  PNG, JPG up to 2MB             │
   └─────────────────────────────────┘
   ```

2. **Sélectionner votre fichier**
   - Navigateur de fichiers s'ouvre
   - Choisir votre logo
   - Validation automatique

3. **Prévisualisation**
   ```
   ┌─────────────────────┐
   │  [Votre Logo]   ❌  │  ← Bouton supprimer
   └─────────────────────┘
   ```

4. **Modifier/Supprimer**
   - Cliquer sur ❌ pour supprimer
   - Re-uploader pour remplacer

### Où apparaît le logo ?

✅ **Header de la galerie** - En haut à gauche  
✅ **Lightbox** - Coin supérieur gauche  
✅ **Formulaire de mot de passe** - Centré en haut  
✅ **Diaporama** - Coin supérieur gauche  
✅ **Footer** - Avec le nom de marque  

### Exemple

**Avant** (sans logo personnalisé):
```
┌─────────────────────────────────┐
│ [PikSend Logo] Ma Galerie       │
└─────────────────────────────────┘
```

**Après** (avec logo personnalisé):
```
┌─────────────────────────────────┐
│ [Votre Logo] Ma Galerie         │
└─────────────────────────────────┘
```

## Étape 3 : Configurer votre domaine personnalisé

### Format accepté

```
✅ photos.johndoe.com
✅ gallery.johndoe.com
✅ johndoe.com
✅ www.johndoe.com

❌ https://photos.johndoe.com  (sera auto-corrigé)
❌ photos.johndoe.com/gallery  (sera auto-corrigé)
```

### Processus

1. **Entrer votre domaine**
   ```
   ┌─────────────────────────────────────┐
   │ Custom Domain                       │
   │ ┌─────────────────────────────────┐ │
   │ │ photos.johndoe.com              │ │
   │ └─────────────────────────────────┘ │
   └─────────────────────────────────────┘
   ```

2. **Auto-normalisation**
   - Le système enlève automatiquement `https://`, `www.`, chemins, etc.
   - Validation en temps réel

3. **Configuration DNS** (Important!)
   ```
   Type: CNAME
   Nom: photos (ou votre sous-domaine)
   Valeur: piksend.com
   TTL: 3600
   ```

4. **Vérification**
   - Contactez le support pour activer votre domaine
   - Délai de propagation DNS : 24-48h

### Utilisation du domaine

Une fois configuré, vos liens de galerie utiliseront votre domaine :

**Avant** :
```
https://piksend.com/g/abc123
```

**Après** :
```
https://photos.johndoe.com/g/abc123
```

### Extraction du nom de marque

Le système extrait automatiquement votre nom de marque du domaine :

| Domaine | Nom extrait | Utilisation |
|---------|-------------|-------------|
| `johndoe.com` | "Johndoe" | Footer, titre |
| `photos.johndoe.com` | "Johndoe" | Footer, titre |
| `studio-martin.com` | "Studio Martin" | Footer, titre |
| `www.example.fr` | "Example" | Footer, titre |

## Étape 4 : Choisir vos couleurs de marque

### Interface de sélection

```
┌─────────────────────────────────────────────┐
│ Primary Color                               │
│ ┌───┐ ┌─────────────────────────────────┐  │
│ │ ■ │ │ #6366f1                         │  │
│ └───┘ └─────────────────────────────────┘  │
│                                             │
│ [Palette de 16 couleurs prédéfinies]       │
│ ■ ■ ■ ■ ■ ■ ■ ■                            │
│ ■ ■ ■ ■ ■ ■ ■ ■                            │
└─────────────────────────────────────────────┘
```

### Méthodes de sélection

#### 1. Palette prédéfinie

Cliquer sur une des 16 couleurs proposées :

```
🔵 Indigo   🟣 Violet   🩷 Pink     🌹 Rose
🔴 Red      🟠 Orange   🟡 Amber    🟡 Yellow
🟢 Lime     🟢 Green    💚 Emerald  🩵 Teal
🩵 Cyan     🔵 Sky      🔵 Blue     🔵 Indigo
```

#### 2. Code hexadécimal manuel

Entrer directement le code couleur :

```
┌─────────────────────┐
│ #FF6B6B             │  ← Votre code hex
└─────────────────────┘
```

**Format** : `#RRGGBB` (6 caractères hexadécimaux)

### Trois couleurs à configurer

1. **Primary Color** (Couleur principale)
   - Utilisée pour les boutons principaux
   - Gradient de fond
   - Éléments interactifs

2. **Secondary Color** (Couleur secondaire)
   - Complète la couleur principale
   - Gradients
   - Accents secondaires

3. **Accent Color** (Couleur d'accent)
   - Highlights
   - Badges
   - Éléments de mise en évidence

### Prévisualisation en temps réel

#### Mode Clair

```
┌─────────────────────────────────────┐
│ Aperçu          [○────] Mode sombre │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [Télécharger tout]             │ │ ← Gradient avec vos couleurs
│ │                                 │ │
│ │  Vos couleurs de marque seront  │ │
│ │  appliquées aux boutons...      │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

#### Mode Sombre (Toggle activé)

```
┌─────────────────────────────────────┐
│ Aperçu          [────●] Mode sombre │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │  [Télécharger tout]             │ │ ← Couleurs éclaircies auto
│ │                                 │ │
│ │  En mode sombre, vos couleurs   │ │
│ │  sont automatiquement...        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Ajustement automatique en mode sombre

**Important** : Vous n'avez pas besoin de configurer des couleurs séparées pour le mode sombre !

Le système ajuste automatiquement vos couleurs :

```
Mode Clair          Mode Sombre (auto)
#FF6B6B (Rouge)  →  #FF9999 (Rouge clair)
#4ECDC4 (Turquoise) → #7EDDD6 (Turquoise clair)
#FFE66D (Jaune)  →  #FFEE99 (Jaune clair)
```

**Algorithme** :
1. Éclaircissement de 15% (mélange avec blanc)
2. Augmentation de luminosité de 10%
3. Augmentation de saturation de 10%

**Résultat** : Vos couleurs restent reconnaissables mais sont optimisées pour la lisibilité sur fond sombre.

## Étape 5 : Enregistrer vos paramètres

### Bouton d'enregistrement

```
┌─────────────────────────────────────┐
│  [Save Branding Settings]           │
└─────────────────────────────────────┘
```

### Validation

Le système vérifie :

✅ **Logo** : Format et taille valides  
✅ **Domaine** : Format correct (si fourni)  
✅ **Couleurs** : Codes hex valides  

### Confirmation

```
✅ Branding settings saved successfully!
```

### Propagation

- **Logo** : Immédiat (toutes les galeries)
- **Couleurs** : Immédiat (toutes les galeries)
- **Domaine** : 24-48h (propagation DNS)

## Étape 6 : Vérifier le résultat

### Ouvrir une galerie

1. Aller dans **Dashboard → Galeries**
2. Cliquer sur une galerie
3. Cliquer sur "Voir la galerie" ou copier le lien

### Vérifications

#### ✅ Logo personnalisé

- Header : Logo visible en haut à gauche
- Lightbox : Logo dans le coin
- Footer : Logo avec nom de marque

#### ✅ Couleurs de marque

- Bouton "Télécharger tout" : Gradient avec vos couleurs
- Bouton "Créer ma galerie" : Couleur primary
- Décorations de fond : Vos couleurs en transparence

#### ✅ Mode sombre

- Cliquer sur l'icône 🌙 dans le header
- Vérifier que les couleurs s'adaptent automatiquement
- Vérifier la lisibilité

#### ✅ Footer white-label

**Plan Pro avec logo + domaine** :
```
┌─────────────────────────────────────┐
│ [Votre Logo] Johndoe                │
│              [Créer ma galerie]     │
│ © 2026 johndoe.com - Tous droits... │
└─────────────────────────────────────┘
```

**Plan Pro sans domaine** :
```
┌─────────────────────────────────────┐
│ [Votre Logo] Galerie Professionnelle│
│              [Créer ma galerie]     │
│ © 2026 - Galerie sécurisée          │
└─────────────────────────────────────┘
```

## Cas d'usage typiques

### Photographe de mariage

```
Logo : Logo élégant avec initiales
Domaine : photos.mariagejohndoe.com
Primary : #D4AF37 (Or)
Secondary : #F5F5DC (Beige)
Accent : #8B7355 (Bronze)
```

### Studio photo commercial

```
Logo : Logo professionnel avec nom
Domaine : gallery.studiophoto.com
Primary : #2C3E50 (Bleu foncé)
Secondary : #3498DB (Bleu clair)
Accent : #E74C3C (Rouge)
```

### Photographe nature

```
Logo : Logo avec élément naturel
Domaine : photos.naturephotography.com
Primary : #27AE60 (Vert)
Secondary : #16A085 (Turquoise)
Accent : #F39C12 (Orange)
```

## Dépannage

### Le logo ne s'affiche pas

1. **Vérifier le format** : PNG, JPG uniquement
2. **Vérifier la taille** : Max 2MB
3. **Vider le cache** : Ctrl+F5 ou Cmd+Shift+R
4. **Réessayer l'upload** : Supprimer et re-uploader

### Le domaine ne fonctionne pas

1. **Vérifier la configuration DNS** : Utiliser un outil comme `nslookup`
2. **Attendre la propagation** : 24-48h nécessaires
3. **Contacter le support** : Vérification manuelle possible
4. **Vérifier le format** : Pas de https://, pas de chemin

### Les couleurs ne s'appliquent pas

1. **Vérifier le format hex** : Doit commencer par `#` et avoir 6 caractères
2. **Enregistrer les paramètres** : Cliquer sur "Save"
3. **Rafraîchir la galerie** : F5 ou recharger la page
4. **Vider le cache** : Ctrl+F5

### Le mode sombre ne fonctionne pas

1. **Vérifier le plan** : Fonctionnalité disponible pour tous
2. **Cliquer sur l'icône** : 🌙 dans le header de la galerie
3. **Vérifier localStorage** : Clé `gallery-theme`
4. **Essayer un autre navigateur** : Test de compatibilité

## Limites et restrictions

### Plan Free

❌ Logo personnalisé  
❌ Domaine personnalisé  
❌ Couleurs de marque  
✅ Logo PikSend  
✅ Branding PikSend dans le footer  

### Plan Premium

❌ Logo personnalisé  
❌ Domaine personnalisé  
❌ Couleurs de marque  
✅ Logo PikSend  
✅ Branding PikSend dans le footer  

### Plan Pro

✅ Logo personnalisé  
✅ Domaine personnalisé  
✅ Couleurs de marque  
✅ Footer white-label  
✅ Branding complet  

## Support

### Documentation

- 📄 [White-Label Branding](./white-label-branding.md) - Documentation technique
- 📄 [Branding et Mode Sombre](./branding-dark-mode-integration.md) - Ajustement des couleurs
- 📄 [Domaine Personnalisé](./custom-domain-implementation.md) - Configuration DNS

### Contact

- **Email** : support@piksend.com
- **Chat** : Disponible dans le dashboard
- **FAQ** : `/help/branding`

## Conclusion

Le branding personnalisé vous permet de créer une **expérience galerie entièrement white-label** qui reflète votre identité de marque. Avec le logo, le domaine et les couleurs personnalisés, vos clients ne verront que votre marque, pas PikSend.

L'ajustement automatique des couleurs en mode sombre garantit que votre branding reste **lisible et esthétique** dans tous les contextes, sans configuration supplémentaire.

---

**Prochaines étapes** :
1. ✅ Uploader votre logo
2. ✅ Configurer votre domaine
3. ✅ Choisir vos couleurs
4. ✅ Enregistrer
5. ✅ Vérifier le résultat
6. ✅ Partager vos galeries avec votre branding !
