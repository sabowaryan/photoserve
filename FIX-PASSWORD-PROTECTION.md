# Correction du système de protection par mot de passe

## Problème identifié

Les galeries affichaient toujours le formulaire de mot de passe, même quand aucun mot de passe n'était défini.

### Cause racine

1. **Dans `gallery.service.ts`** : Le service hashait TOUJOURS le mot de passe avec bcrypt, même quand il était vide
   - Une chaîne vide `""` était hashée en un hash bcrypt valide de 60 caractères
   - Résultat : `password_hash` contenait toujours une valeur, même pour les galeries sans protection

2. **Dans `page.tsx`** : La vérification `has_password` ne détectait pas correctement les chaînes vides

3. **Erreur d'hydratation React** : Incohérence entre le rendu serveur et client

## Solutions appliquées

### 1. Service de galerie (`src/lib/services/gallery.service.ts`)

**Création de galerie (ligne ~127)** :
```typescript
// AVANT
const passwordHash = await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS);

// APRÈS
const passwordHash = sanitizedPassword && sanitizedPassword.length > 0
  ? await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS)
  : '';
```

**Mise à jour de galerie (ligne ~204)** :
```typescript
// AVANT
updateData.password_hash = await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS);

// APRÈS
updateData.password_hash = sanitizedPassword && sanitizedPassword.length > 0
  ? await bcrypt.hash(sanitizedPassword, BCRYPT_ROUNDS)
  : '';
```

**Vérification du mot de passe (ligne ~280)** :
```typescript
// Ajout de la vérification si la galerie a un mot de passe
const hasPassword = gallery.password_hash && gallery.password_hash.length > 0;

if (!hasPassword) {
  // Galerie sans protection - accès direct
  return { success: true, gallery, images };
}

// Sinon, vérifier le mot de passe avec bcrypt
```

### 2. Page de galerie (`src/app/g/[slug]/page.tsx`)

```typescript
// Normalisation cohérente de has_password
const hasPassword = Boolean(
  gallery.password_hash && 
  typeof gallery.password_hash === 'string' && 
  gallery.password_hash.trim().length > 0
);
```

### 3. Composant client (`src/app/g/[slug]/gallery-view-client.tsx`)

```typescript
// Évaluation booléenne explicite pour éviter l'hydratation mismatch
const [isAuthenticated, setIsAuthenticated] = useState(Boolean(!initialGallery.has_password));
```

## Migration des données existantes

Les galeries existantes dans votre base de données ont des hash bcrypt même pour les mots de passe vides.

### Pour corriger une galerie spécifique :

```sql
-- Remplacez 'GALLERY_ID' par l'ID de votre galerie
UPDATE galleries 
SET password_hash = ''
WHERE id = 'GALLERY_ID';
```

### Pour la galerie "Belle monde" :

```sql
UPDATE galleries 
SET password_hash = ''
WHERE id = '679af0dc-5494-4b57-b684-0eee8719ff91';
```

## Comportement attendu

### Galeries SANS mot de passe (`password_hash = ''`)
- ✅ Affichage direct du contenu
- ✅ Pas de formulaire de mot de passe
- ✅ Accès immédiat pour tous les visiteurs

### Galeries AVEC mot de passe (`password_hash = hash bcrypt`)
- ✅ Affichage du formulaire de mot de passe
- ✅ Vérification bcrypt du mot de passe
- ✅ Accès après authentification réussie

## Tests à effectuer

1. **Créer une nouvelle galerie SANS mot de passe** :
   - Laisser le champ mot de passe vide
   - Vérifier que `password_hash = ''` dans la DB
   - Vérifier que la galerie s'affiche directement sans formulaire

2. **Créer une nouvelle galerie AVEC mot de passe** :
   - Entrer un mot de passe
   - Vérifier que `password_hash` contient un hash bcrypt (60 caractères)
   - Vérifier que le formulaire s'affiche
   - Vérifier que le mot de passe fonctionne

3. **Mettre à jour une galerie existante** :
   - Supprimer le mot de passe (chaîne vide)
   - Vérifier que `password_hash = ''`
   - Vérifier que le formulaire disparaît

## Fichiers modifiés

- ✅ `src/lib/services/gallery.service.ts` - Ne hash plus les mots de passe vides
- ✅ `src/app/g/[slug]/page.tsx` - Vérification correcte de `has_password`
- ✅ `src/app/g/[slug]/gallery-view-client.tsx` - Évaluation booléenne cohérente
- ✅ `src/hooks/use-gallery-theme.ts` - Correction de l'hydratation du thème

## Correction de l'erreur d'hydratation du thème

### Problème
Le hook `useGalleryTheme` initialisait `resolvedTheme` avec une valeur côté client (basée sur `localStorage` ou préférences système), ce qui créait une différence entre le rendu serveur (toujours 'light') et le rendu client initial.

### Solution
- Initialiser avec 'light' pour le SSR
- Ajouter un état `mounted` pour détecter le montage côté client
- Charger le thème depuis `localStorage` uniquement après le montage
- Appliquer les changements de thème uniquement après le montage

Cela élimine le flash de contenu et l'erreur d'hydratation React.

## Scripts créés

- `debug-gallery.sql` - Pour inspecter les valeurs de password_hash
- `fix-empty-passwords.sql` - Pour corriger les galeries existantes
