# Exemples d'extraction de nom de marque

## Comment fonctionne l'extraction avec sous-domaines

La fonction `getBrandName()` extrait intelligemment le nom de marque en **ignorant les sous-domaines** et en se concentrant sur le domaine racine.

### Processus d'extraction

```
Input: "photos.johndoe.com"
  ↓
1. Normalisation
  → "photos.johndoe.com"
  ↓
2. Extraction du domaine racine (getRootDomain)
  → "johndoe.com"
  ↓
3. Extraction du nom (avant le TLD)
  → "johndoe"
  ↓
4. Capitalisation
  → "Johndoe"
```

## Exemples détaillés

### Cas 1 : Domaine simple
```
Input:  "johndoe.com"
Root:   "johndoe.com"
Brand:  "Johndoe"

Footer: [Logo] Johndoe
```

### Cas 2 : Sous-domaine simple
```
Input:  "photos.johndoe.com"
Root:   "johndoe.com"        ← Ignore "photos"
Brand:  "Johndoe"

Footer: [Logo] Johndoe
```

### Cas 3 : Sous-domaines multiples
```
Input:  "gallery.photos.johndoe.com"
Root:   "johndoe.com"        ← Ignore "gallery.photos"
Brand:  "Johndoe"

Footer: [Logo] Johndoe
```

### Cas 4 : Domaine avec tirets
```
Input:  "photos.my-studio.com"
Root:   "my-studio.com"      ← Ignore "photos"
Brand:  "My Studio"          ← Remplace "-" par espace

Footer: [Logo] My Studio
```

### Cas 5 : Domaine avec underscores
```
Input:  "gallery.john_doe_photo.com"
Root:   "john_doe_photo.com" ← Ignore "gallery"
Brand:  "John Doe Photo"     ← Remplace "_" par espace

Footer: [Logo] John Doe Photo
```

### Cas 6 : URL complète avec sous-domaine
```
Input:  "https://photos.johndoe.com/path?param=value"
Norm:   "photos.johndoe.com" ← Nettoie l'URL
Root:   "johndoe.com"        ← Ignore "photos"
Brand:  "Johndoe"

Footer: [Logo] Johndoe
```

### Cas 7 : Majuscules avec sous-domaine
```
Input:  "PHOTOS.JOHNDOE.COM"
Norm:   "photos.johndoe.com" ← Convertit en minuscules
Root:   "johndoe.com"        ← Ignore "photos"
Brand:  "Johndoe"            ← Capitalise correctement

Footer: [Logo] Johndoe
```

## Tableau récapitulatif

| Input complet | Domaine racine | Nom de marque | Affichage footer |
|---------------|----------------|---------------|------------------|
| `johndoe.com` | `johndoe.com` | `Johndoe` | **Johndoe** |
| `photos.johndoe.com` | `johndoe.com` | `Johndoe` | **Johndoe** |
| `gallery.photos.johndoe.com` | `johndoe.com` | `Johndoe` | **Johndoe** |
| `my-studio.com` | `my-studio.com` | `My Studio` | **My Studio** |
| `photos.my-studio.com` | `my-studio.com` | `My Studio` | **My Studio** |
| `www.johndoe.com` | `johndoe.com` | `Johndoe` | **Johndoe** |
| `api.v2.johndoe.com` | `johndoe.com` | `Johndoe` | **Johndoe** |
| `jean-pierre.photography` | `jean-pierre.photography` | `Jean Pierre` | **Jean Pierre** |
| `photos.jean-pierre.photography` | `jean-pierre.photography` | `Jean Pierre` | **Jean Pierre** |

## Pourquoi ignorer les sous-domaines ?

### Raison 1 : Cohérence de marque
Le nom de marque est toujours le même, peu importe le sous-domaine utilisé :
- `photos.johndoe.com` → **JohnDoe**
- `gallery.johndoe.com` → **JohnDoe**
- `portfolio.johndoe.com` → **JohnDoe**

### Raison 2 : Simplicité
Les sous-domaines sont souvent techniques (www, api, cdn, photos, gallery) et ne représentent pas la marque.

### Raison 3 : Professionnalisme
Afficher "JohnDoe" est plus élégant que "Photos" ou "Gallery".

### Raison 4 : Alignement avec PikSend
PikSend affiche "PikSend" et non "www" ou "app", donc les photographes ont le même style.

## Code source

```typescript
export function getBrandName(domain: string | null | undefined): string | null {
  const normalized = normalizeDomain(domain);
  if (!normalized) return null;

  // 1. Extraire le domaine racine (ignore les sous-domaines)
  const root = getRootDomain(normalized);
  // "photos.johndoe.com" → "johndoe.com"
  
  if (!root) return null;

  // 2. Séparer domaine et TLD
  const parts = root.split('.');
  // "johndoe.com" → ["johndoe", "com"]
  
  if (parts.length < 2) return null;

  // 3. Prendre le nom du domaine (avant le TLD)
  const domainPart = parts[0];
  // ["johndoe", "com"] → "johndoe"
  
  if (!domainPart) return null;

  // 4. Remplacer tirets/underscores par espaces
  let brandName = domainPart.replace(/[-_]/g, ' ');
  // "my-studio" → "my studio"

  // 5. Capitaliser chaque mot
  brandName = brandName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  // "my studio" → "My Studio"

  return brandName;
}
```

## Tests unitaires

```typescript
// Sous-domaines simples
expect(getBrandName('photos.johndoe.com')).toBe('Johndoe');
expect(getBrandName('gallery.piksend.com')).toBe('Piksend');

// Sous-domaines multiples
expect(getBrandName('sub.photos.example.com')).toBe('Example');
expect(getBrandName('api.v2.johndoe.com')).toBe('Johndoe');

// Avec normalisation
expect(getBrandName('HTTPS://PHOTOS.JOHNDOE.COM/')).toBe('Johndoe');
expect(getBrandName('http://gallery.my-studio.com')).toBe('My Studio');
```

## Conclusion

Le système gère **automatiquement** tous les cas de sous-domaines en extrayant toujours le domaine racine avant d'extraire le nom de marque. Cela garantit une cohérence parfaite et un affichage professionnel, peu importe la structure du domaine utilisé.

✅ **Résultat** : Que le photographe utilise `johndoe.com`, `photos.johndoe.com`, ou `gallery.photos.johndoe.com`, le footer affichera toujours **"JohnDoe"** de manière élégante et cohérente.
