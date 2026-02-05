# Correction de la Validation des Clés API

## Problème
Lors de la création d'une clé API, l'erreur suivante se produisait :
```
POST /api/settings/api-keys 400 in 323ms
api.errors.validationFailed
```

## Cause Racine
Plusieurs problèmes de validation ont été identifiés :

1. **Champ `scopes` manquant** : Le composant frontend n'envoyait pas le champ `scopes`, qui est attendu par le schéma de validation
2. **Format `expiresAt` incorrect** : Le composant envoyait `null` au lieu d'omettre le champ quand aucune date n'était sélectionnée
3. **Incohérence entre schémas** : Deux schémas différents existaient pour la création de clés API :
   - `src/lib/validators/plugin.schemas.ts` (utilisé par le route)
   - `src/lib/services/api-key.service.ts` (utilisé par le service)

## Solutions Appliquées

### 1. Correction du Composant Frontend
**Fichier**: `src/components/settings/create-api-key-dialog.tsx`

**Changements** :
- Ajout du champ `scopes` avec les valeurs par défaut `['plugin:read', 'plugin:write']`
- Conversion de `expiresAt` en format ISO 8601 avec `new Date(expiresAt).toISOString()`
- Omission du champ `expiresAt` s'il est vide (au lieu d'envoyer `null`)
- Amélioration de la gestion des erreurs de validation

**Avant** :
```typescript
body: JSON.stringify({
  name: name.trim(),
  expiresAt: expiresAt || null,
})
```

**Après** :
```typescript
const requestBody: {
  name: string;
  expiresAt?: string;
  scopes?: string[];
} = {
  name: name.trim(),
  scopes: ['plugin:read', 'plugin:write'],
};

if (expiresAt) {
  requestBody.expiresAt = new Date(expiresAt).toISOString();
}

body: JSON.stringify(requestBody)
```

### 2. Harmonisation du Schéma de Validation
**Fichier**: `src/lib/validators/plugin.schemas.ts`

**Changements** :
- Ajout d'une valeur par défaut pour `scopes` : `.default(['plugin:read', 'plugin:write'])`
- Le schéma est maintenant cohérent avec celui du service

**Avant** :
```typescript
scopes: z.array(z.string()).optional(),
```

**Après** :
```typescript
scopes: z.array(z.string()).optional().default(['plugin:read', 'plugin:write']),
```

### 3. Amélioration de la Gestion des Erreurs
**Fichier**: `src/components/settings/create-api-key-dialog.tsx`

Ajout d'un affichage détaillé des erreurs de validation :
```typescript
if (response.status === 400 && data.details) {
  const validationErrors = data.details.map((issue: any) => issue.message).join(', ');
  setError(`Validation error: ${validationErrors}`);
}
```

## Schéma de Validation Final

```typescript
createAPIKeySchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Name can only contain letters, numbers, spaces, hyphens, and underscores'),
  expiresAt: isoDateString.optional(),
  scopes: z.array(z.string()).optional().default(['plugin:read', 'plugin:write']),
}).refine(
  (data) => {
    if (data.expiresAt) {
      const expirationDate = new Date(data.expiresAt);
      const now = new Date();
      return expirationDate > now;
    }
    return true;
  },
  {
    message: 'Expiration date must be in the future',
    path: ['expiresAt'],
  }
);
```

## Format de Requête Attendu

### Avec date d'expiration
```json
{
  "name": "Lightroom Desktop",
  "expiresAt": "2027-12-31T23:59:59.000Z",
  "scopes": ["plugin:read", "plugin:write"]
}
```

### Sans date d'expiration
```json
{
  "name": "Lightroom Desktop",
  "scopes": ["plugin:read", "plugin:write"]
}
```

## Tests Recommandés

1. ✅ Créer une clé API sans date d'expiration
2. ✅ Créer une clé API avec une date d'expiration future
3. ✅ Vérifier que les erreurs de validation sont affichées clairement
4. ✅ Vérifier que les scopes par défaut sont appliqués
5. ✅ Tester avec un nom invalide (caractères spéciaux)
6. ✅ Tester avec une date d'expiration dans le passé

## Scopes Disponibles

Les scopes suivants sont utilisés pour les clés API du plugin Lightroom :

- `plugin:read` : Lecture des informations du plugin (versions, etc.)
- `plugin:write` : Création de galeries et upload d'images

Ces scopes sont appliqués par défaut à toutes les nouvelles clés API.

## Date
5 février 2026
