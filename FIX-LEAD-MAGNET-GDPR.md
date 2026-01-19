# Correction du Lead Magnet - Consentement GDPR

## Problème identifié

L'API de capture d'email retournait une erreur 400 :
```
Error [ZodError]: [{"expected": "boolean","code": "invalid_type","path": ["gdprConsent"],"message": "Invalid input: expected boolean, received undefined"}]
```

### Cause racine

Le composant `LeadMagnetModal` collectait le consentement GDPR de l'utilisateur via une checkbox, mais ne le transmettait pas à l'API lors de la soumission du formulaire.

**Flux problématique** :
1. Utilisateur coche la case GDPR ✅
2. Composant valide que la case est cochée ✅
3. Composant appelle `onSubmit(email)` ❌ (sans gdprConsent)
4. Parent envoie `{ email }` à l'API ❌ (sans gdprConsent)
5. API rejette la requête car `gdprConsent` est `undefined` ❌

## Solution appliquée

### 1. Interface du composant (`src/components/gallery-view/lead-magnet-modal.tsx`)

**AVANT** :
```typescript
interface LeadMagnetModalProps {
  onSubmit: (email: string) => Promise<void>;
}
```

**APRÈS** :
```typescript
interface LeadMagnetModalProps {
  onSubmit: (email: string, gdprConsent: boolean) => Promise<void>;
}
```

### 2. Soumission du formulaire (`src/components/gallery-view/lead-magnet-modal.tsx`)

**AVANT** :
```typescript
await onSubmit(email);
```

**APRÈS** :
```typescript
await onSubmit(email, gdprConsent);
```

### 3. Handler dans le parent (`src/app/g/[slug]/gallery-view-client.tsx`)

**AVANT** :
```typescript
const handleLeadMagnetSubmit = async (email: string) => {
  const response = await fetch(`/api/galleries/${initialGallery.id}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  // ...
};
```

**APRÈS** :
```typescript
const handleLeadMagnetSubmit = async (email: string, gdprConsent: boolean) => {
  const response = await fetch(`/api/galleries/${initialGallery.id}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, gdprConsent }),
  });
  // ...
};
```

## Validation RGPD

L'API valide maintenant correctement le consentement GDPR à plusieurs niveaux :

### Niveau 1 : Validation Zod (API)
```typescript
const captureEmailSchema = z.object({
  email: z.string().email('Invalid email format'),
  gdprConsent: z.boolean().refine((val) => val === true, {
    message: 'GDPR consent is required',
  }),
});
```

### Niveau 2 : Validation métier (Service)
```typescript
if (!gdprConsent) {
  throw new ValidationError('GDPR consent is required');
}
```

### Niveau 3 : Validation UI (Composant)
```typescript
if (!gdprConsent) {
  setError("Veuillez accepter la politique de confidentialité");
  return;
}
```

## Flux corrigé

1. Utilisateur coche la case GDPR ✅
2. Composant valide que la case est cochée ✅
3. Composant appelle `onSubmit(email, gdprConsent)` ✅
4. Parent envoie `{ email, gdprConsent: true }` à l'API ✅
5. API valide et enregistre le lead avec consentement ✅

## Conformité RGPD

Cette correction garantit :
- ✅ Le consentement explicite est collecté avant la capture d'email
- ✅ Le consentement est validé côté client ET serveur
- ✅ Le consentement est stocké en base de données avec l'email
- ✅ Impossible de soumettre sans consentement (validation triple)

## Fichiers modifiés

- ✅ `src/components/gallery-view/lead-magnet-modal.tsx` - Interface et soumission
- ✅ `src/app/g/[slug]/gallery-view-client.tsx` - Handler parent

## Tests à effectuer

1. **Test nominal** :
   - Ouvrir une galerie avec lead magnet activé
   - Entrer un email valide
   - Cocher la case GDPR
   - Soumettre
   - ✅ Devrait réussir avec code 201

2. **Test sans consentement** :
   - Entrer un email valide
   - NE PAS cocher la case GDPR
   - Tenter de soumettre
   - ✅ Devrait afficher une erreur côté client (pas d'appel API)

3. **Test email invalide** :
   - Entrer un email invalide
   - Cocher la case GDPR
   - Soumettre
   - ✅ Devrait afficher une erreur de validation email
