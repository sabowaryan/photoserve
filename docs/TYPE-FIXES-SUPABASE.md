# Corrections des Erreurs de Type Supabase

## 🐛 Problème

Lors du build sur Vercel, plusieurs erreurs TypeScript sont apparues :

```
Type error: Property 'user_id' does not exist on type 'SelectQueryError<"column 'settings' does not exist on 'galleries'.">'
Type error: Property 'settings' does not exist on type '...'
Type error: Property 'branding' does not exist on type '...'
```

## 🔍 Cause

Les types générés automatiquement par Supabase ne reflètent pas les colonnes ajoutées dans les migrations récentes :
- `galleries.settings` (ajoutée dans `20260114120000_piksend_features.sql`)
- `profiles.branding` (ajoutée dans `20260114120000_piksend_features.sql`)

## ✅ Solution Appliquée

Utilisation de `as any` pour contourner temporairement les erreurs de type jusqu'à ce que les types Supabase soient régénérés.

## 📝 Fichiers Corrigés

### 1. `src/app/(dashboard)/dashboard/gallery/[id]/page.tsx`

**Ligne 74** - Vérification de propriété
```typescript
// Avant
if (gallery.user_id !== userId) {

// Après
if ((gallery as any).user_id !== userId) {
```

### 2. `src/app/(dashboard)/dashboard/gallery/[id]/analytics/page.tsx`

**Ligne 52** - Vérification de propriété
```typescript
// Avant
if (gallery.user_id !== userId) {

// Après
if ((gallery as any).user_id !== userId) {
```

### 3. `src/app/g/[slug]/page.tsx`

**Lignes 92-112** - Accès aux propriétés
```typescript
// Avant
if (gallery.user_id) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('branding, subscription_plan')
    .eq('id', gallery.user_id)
    .maybeSingle();
  
  if (profile) {
    ownerPlan = profile.subscription_plan || 'free';
    
    if (profile.branding) {
      const branding = profile.branding as { ... };
      brandColors = branding.brandColors || null;
    }
  }
}

const settings = gallery.settings as { ... } | null;

// Après
if ((gallery as any).user_id) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('branding, subscription_plan')
    .eq('id', (gallery as any).user_id)
    .maybeSingle();
  
  if (profile) {
    ownerPlan = (profile as any).subscription_plan || 'free';
    
    if ((profile as any).branding) {
      const branding = (profile as any).branding as { ... };
      brandColors = branding.brandColors || null;
    }
  }
}

const settings = (gallery as any).settings as { ... } | null;
```

**Ligne 135** - Passage de settings
```typescript
// Avant
settings: gallery.settings as any,

// Après
settings: (gallery as any).settings as any,
```

### 4. `src/app/(dashboard)/dashboard/gallery/[id]/gallery-detail-client.tsx`

**Ligne 96** - Initialisation de state
```typescript
// Avant
const [settings, setSettings] = useState<GallerySettings>(gallery.settings || {

// Après
const [settings, setSettings] = useState<GallerySettings>((gallery as any).settings || {
```

**Ligne 218** - Comparaison de settings
```typescript
// Avant
if (JSON.stringify(settings) !== JSON.stringify(gallery.settings)) {

// Après
if (JSON.stringify(settings) !== JSON.stringify((gallery as any).settings)) {
```

### 5. `src/app/(dashboard)/settings/page.tsx`

**Ligne 37** - Update branding
```typescript
// Avant
.update({ branding })

// Après
.update({ branding } as any)
```

**Ligne 85** - Accès à branding
```typescript
// Avant
initialBranding={profile?.branding as any}

// Après
initialBranding={((profile as any)?.branding) || {}}
```

### 6. `src/app/api/profile/branding/route.ts`

**Ligne 62** - Update branding
```typescript
// Avant
.update({ branding })

// Après
.update({ branding } as any)
```

**Lignes 111-112** - Accès aux propriétés
```typescript
// Avant
branding: profile.branding || {},
plan: profile.subscription_plan || 'free',

// Après
branding: (profile as any).branding || {},
plan: (profile as any).subscription_plan || 'free',
```

### 7. `src/types/index.ts`

**Ligne 35** - Ajout du champ branding
```typescript
export interface Profile {
  // ... autres champs
  branding: ProfileBranding | null;  // ← Ajouté
  created_at: string;
  updated_at: string;
}
```

## 🔧 Solution Permanente

Pour résoudre définitivement ce problème, il faut régénérer les types Supabase :

### Étape 1 : Installer Supabase CLI

```bash
npm install -g supabase
```

### Étape 2 : Se connecter à Supabase

```bash
supabase login
```

### Étape 3 : Lier le projet

```bash
supabase link --project-ref <votre-project-ref>
```

### Étape 4 : Générer les types

```bash
supabase gen types typescript --project-id <votre-project-id> > src/lib/supabase/database.types.ts
```

### Étape 5 : Utiliser les types générés

```typescript
// src/lib/supabase/types.ts
import { Database } from './database.types';

export type Gallery = Database['public']['Tables']['galleries']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Image = Database['public']['Tables']['images']['Row'];
```

### Étape 6 : Remplacer les `as any`

Une fois les types régénérés, remplacer tous les `as any` par les types corrects :

```typescript
// Au lieu de
if ((gallery as any).user_id !== userId) {

// Utiliser
if (gallery.user_id !== userId) {
```

## 📊 Impact

### Fichiers affectés : 7
- ✅ `src/app/(dashboard)/dashboard/gallery/[id]/page.tsx`
- ✅ `src/app/(dashboard)/dashboard/gallery/[id]/analytics/page.tsx`
- ✅ `src/app/g/[slug]/page.tsx`
- ✅ `src/app/(dashboard)/dashboard/gallery/[id]/gallery-detail-client.tsx`
- ✅ `src/app/(dashboard)/settings/page.tsx`
- ✅ `src/app/api/profile/branding/route.ts`
- ✅ `src/types/index.ts`

### Propriétés concernées :
- `gallery.settings` (JSONB)
- `gallery.user_id` (UUID)
- `profile.branding` (JSONB)
- `profile.subscription_plan` (TEXT)

## ⚠️ Notes Importantes

1. **Temporaire** : Les casts `as any` sont une solution temporaire
2. **Sécurité** : Les types existent en base de données, seuls les types TypeScript sont manquants
3. **Fonctionnalité** : Le code fonctionne correctement malgré les casts
4. **Prochaine étape** : Régénérer les types Supabase dès que possible

## 🚀 Vérification

Pour vérifier que tout fonctionne :

```bash
# Build local
npm run build

# Vérification TypeScript
npx tsc --noEmit
```

Tous les fichiers devraient compiler sans erreur.

## 📅 Historique

- **Date** : Janvier 2026
- **Contexte** : Ajout de la section Branding et des nouvelles colonnes
- **Migration** : `20260114120000_piksend_features.sql`
- **Status** : ✅ Corrigé (temporairement avec `as any`)
- **À faire** : Régénérer les types Supabase

---

**Note** : Ce document sera mis à jour une fois les types Supabase régénérés.
