# Test d'Upload d'Image - Guide de Débogage

## Erreur Actuelle
`api.errors.validationFailed` s'affiche lors de l'upload d'une image.

## Étapes de Débogage

### 1. Vérifier les Logs du Serveur

Ouvrez la console de développement (F12) et allez dans l'onglet **Network** :

1. Essayez d'uploader une image
2. Trouvez la requête `POST /api/images/upload`
3. Cliquez dessus et regardez :
   - **Request Headers** : Vérifiez que `Content-Type: multipart/form-data` est présent
   - **Request Payload** : Vérifiez que `file`, `galleryId`, et `orderIndex` sont envoyés
   - **Response** : Regardez le message d'erreur détaillé

### 2. Vérifier les Logs Côté Serveur

Dans votre terminal où Next.js tourne, vous devriez voir des logs d'erreur plus détaillés.

### 3. Causes Possibles

#### A. Problème de Validation Zod
Si l'erreur vient d'une validation Zod, le message devrait contenir `details` avec les champs invalides.

**Solution :** Vérifiez que tous les champs requis sont envoyés correctement.

#### B. Problème de Taille de Fichier
L'image dépasse la limite du plan.

**Vérification :**
```sql
-- Dans Supabase SQL Editor
SELECT 
  id,
  email,
  subscription_plan,
  storage_used_mb
FROM profiles
WHERE email = 'VOTRE_EMAIL';
```

Puis vérifiez dans `src/config/plans.ts` :
- Free: 25 MB max par image
- Premium: 100 MB max par image
- Pro: 500 MB max par image

#### C. Problème de Type MIME
Le fichier n'est pas reconnu comme une image.

**Solution :** Vérifiez que le fichier est bien un JPG, PNG, ou WebP.

#### D. Problème de Limite d'Images
La galerie a atteint le nombre maximum d'images.

**Vérification :**
```sql
SELECT 
  g.id,
  g.title,
  COUNT(i.id) as image_count,
  p.subscription_plan
FROM galleries g
LEFT JOIN images i ON i.gallery_id = g.id
LEFT JOIN profiles p ON p.id = g.user_id
WHERE g.id = 'VOTRE_GALLERY_ID'
GROUP BY g.id, g.title, p.subscription_plan;
```

Limites :
- Free: 50 images par galerie
- Premium: 500 images par galerie
- Pro: 2000 images par galerie

#### E. Problème de Stockage
L'utilisateur a atteint sa limite de stockage.

**Vérification :**
```sql
SELECT 
  email,
  subscription_plan,
  storage_used_mb,
  CASE subscription_plan
    WHEN 'free' THEN 500
    WHEN 'premium' THEN 102400
    WHEN 'pro' THEN 1024000
  END as storage_limit_mb
FROM profiles
WHERE email = 'VOTRE_EMAIL';
```

### 4. Test Manuel avec curl

```bash
# Remplacez les valeurs
curl -X POST http://localhost:3000/api/images/upload \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -F "file=@/path/to/image.jpg" \
  -F "galleryId=YOUR_GALLERY_ID" \
  -F "orderIndex=0"
```

### 5. Vérifier le Code Frontend

Ouvrez le fichier qui fait l'upload (probablement `gallery-detail-client.tsx` ou `gallery-create-form.tsx`) et vérifiez que :

1. Le FormData est correctement construit :
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('galleryId', galleryId);
formData.append('orderIndex', orderIndex.toString());
```

2. La requête est correctement envoyée :
```typescript
const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData,
  // PAS de Content-Type header (laissez le navigateur le gérer)
});
```

### 6. Erreurs Courantes et Solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `File is required` | Fichier non envoyé | Vérifier que `formData.append('file', file)` est appelé |
| `Gallery ID is required` | galleryId manquant | Vérifier que le galleryId est passé |
| `File must be an image` | Type MIME invalide | Vérifier que le fichier est JPG/PNG/WebP |
| `File size exceeds limit` | Fichier trop gros | Réduire la taille ou upgrader le plan |
| `Storage limit exceeded` | Stockage plein | Supprimer des images ou upgrader |
| `Image limit reached` | Trop d'images | Supprimer des images ou upgrader |

### 7. Activer les Logs Détaillés

Ajoutez temporairement des logs dans `src/app/api/images/upload/route.ts` :

```typescript
export async function POST(request: NextRequest) {
  try {
    console.log('=== IMAGE UPLOAD START ===');
    
    const { supabase, userId } = await requireSupabaseClient();
    console.log('User ID:', userId);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const galleryId = formData.get('galleryId') as string | null;
    
    console.log('File:', file?.name, file?.size, file?.type);
    console.log('Gallery ID:', galleryId);
    
    // ... rest of code
  } catch (error) {
    console.error('=== IMAGE UPLOAD ERROR ===', error);
    // ... error handling
  }
}
```

## Prochaines Étapes

1. Ouvrez la console du navigateur (F12)
2. Essayez d'uploader une image
3. Regardez l'onglet Network pour voir la requête et la réponse
4. Regardez la console du serveur pour voir les logs
5. Partagez les détails de l'erreur pour un diagnostic plus précis
