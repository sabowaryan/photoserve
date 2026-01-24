# Diagnostic: Custom Domain Error 1001

## Situation Actuelle

- **Domaine:** photo.joventy.cd
- **Erreur:** Cloudflare Error 1001 - DNS resolution error
- **DNS Status:** dnschecker.org montre que le domaine est propagé ✅
- **Problème:** L'application ne répond pas correctement

## Étapes de Diagnostic

### 1. Vérifier que le domaine est enregistré dans la base de données

Exécutez ce script SQL dans Supabase:

```sql
SELECT 
  id as user_id,
  email,
  branding->>'customDomain' as custom_domain,
  branding->>'domainVerified' as domain_verified,
  branding->>'sslProvider' as ssl_provider,
  subscription_plan
FROM profiles
WHERE branding->>'customDomain' = 'photo.joventy.cd';
```

**Résultats attendus:**
- Une ligne avec votre user_id
- `custom_domain`: `photo.joventy.cd`
- `domain_verified`: `true`
- `subscription_plan`: `pro`

**Si aucun résultat:**
→ Le domaine n'est pas enregistré dans la base de données
→ Retournez dans l'application et configurez le domaine

**Si `domain_verified` est `false`:**
→ Le domaine n'est pas vérifié
→ Cliquez sur "Vérifier le domaine" dans l'application

### 2. Vérifier la configuration DNS

```bash
# Vérifier le CNAME
nslookup -type=CNAME photo.joventy.cd

# Vérifier l'A record
nslookup photo.joventy.cd
```

**Résultats attendus:**
- CNAME devrait pointer vers `piksend.com` OU
- A record devrait montrer une adresse IP

### 3. Vérifier les logs du proxy

Le fichier `src/proxy.ts` log les erreurs. Vérifiez les logs de votre application:

```bash
# Si vous utilisez Vercel
vercel logs

# Si vous utilisez un autre hébergeur
# Consultez les logs de votre plateforme
```

**Cherchez ces messages:**
- `[Custom Domain] Domain not found or not verified`
- `[Custom Domain] Gallery not found`
- `[Custom Domain] Middleware error`

### 4. Vérifier le PRIMARY_DOMAIN

Dans votre fichier `.env` ou variables d'environnement:

```env
NEXT_PUBLIC_APP_DOMAIN=piksend.com
```

**Important:** Ce domaine doit correspondre à votre domaine principal de production.

### 5. Tester localement avec simulation

Ajoutez ceci à votre fichier `hosts` pour tester localement:

**Windows:** `C:\Windows\System32\drivers\etc\hosts`
**Mac/Linux:** `/etc/hosts`

```
127.0.0.1 photo.joventy.cd
```

Puis visitez `http://photo.joventy.cd:3000` (avec votre port local)

## Problèmes Possibles et Solutions

### Problème 1: Domaine non enregistré dans la base de données

**Symptôme:** La requête SQL ne retourne aucun résultat

**Solution:**
1. Allez dans Paramètres → Branding
2. Entrez `photo.joventy.cd` dans le champ "Domaine personnalisé"
3. Cliquez sur "Vérifier"
4. Attendez la vérification
5. Cliquez sur "Provisionner SSL"
6. Sauvegardez

### Problème 2: Domaine enregistré mais non vérifié

**Symptôme:** `domain_verified` est `false` dans la base de données

**Solution:**
1. Vérifiez que le CNAME est correctement configuré
2. Attendez la propagation DNS (jusqu'à 48h)
3. Cliquez sur "Vérifier le domaine" dans l'application
4. Si ça échoue, activez le mode simulation (voir docs)

### Problème 3: Le proxy ne trouve pas le profil public

**Symptôme:** Erreur 404 même si le domaine est vérifié

**Cause possible:** Le proxy redirige vers `/portfolio/${photographerId}` mais cette route n'existe pas

**Solution:** Vérifier que vous avez un profil public configuré:

```sql
SELECT 
  id,
  user_id,
  slug,
  display_name,
  is_enabled
FROM public_profiles
WHERE user_id = 'votre-user-id';
```

Si aucun résultat, créez votre profil public:
1. Allez dans Paramètres → Profil Public
2. Remplissez les informations
3. Activez le profil
4. Sauvegardez

### Problème 4: PRIMARY_DOMAIN incorrect

**Symptôme:** Le proxy traite votre domaine comme le domaine principal

**Solution:**
Vérifiez dans `src/proxy.ts` ligne 30-34:

```typescript
const isPrimaryDomain = cleanHostname === PRIMARY_DOMAIN || 
                        cleanHostname === `www.${PRIMARY_DOMAIN}` ||
                        cleanHostname === 'localhost' ||
                        cleanHostname.startsWith('localhost:');
```

Assurez-vous que `PRIMARY_DOMAIN` est bien `piksend.com` et non `photo.joventy.cd`

### Problème 5: Route de redirection incorrecte

**Symptôme:** Le domaine est trouvé mais la page ne charge pas

**Cause:** Le proxy redirige vers `/portfolio/${photographerId}` qui n'existe pas

**Solution temporaire:** Modifier `src/proxy.ts` ligne 88-91:

```typescript
// AVANT (incorrect)
if (pathname === '/' || pathname === '') {
  const portfolioUrl = url.clone();
  portfolioUrl.pathname = `/portfolio/${photographerId}`;
  portfolioUrl.searchParams.set('customDomain', cleanHostname);
  return NextResponse.rewrite(portfolioUrl);
}

// APRÈS (correct)
if (pathname === '/' || pathname === '') {
  // Récupérer le slug du profil public
  const { data: publicProfile } = await supabase
    .from('public_profiles')
    .select('slug')
    .eq('user_id', photographerId)
    .eq('is_enabled', true)
    .single();
  
  if (!publicProfile) {
    return new NextResponse('Profile not found', { status: 404 });
  }
  
  const profileUrl = url.clone();
  profileUrl.pathname = `/p/${publicProfile.slug}`;
  return NextResponse.rewrite(profileUrl);
}
```

## Checklist de Vérification

- [ ] DNS propagé (vérifié sur dnschecker.org)
- [ ] Domaine enregistré dans `profiles.branding->>'customDomain'`
- [ ] `domain_verified` = `true` dans la base de données
- [ ] Profil public créé et activé dans `public_profiles`
- [ ] `PRIMARY_DOMAIN` = `piksend.com` dans les variables d'environnement
- [ ] SSL provisionné (`sslProvider` et `sslCertificateId` présents)
- [ ] Logs du proxy vérifiés (pas d'erreurs)
- [ ] Test local avec fichier hosts (optionnel)

## Commandes Utiles

### Vérifier la configuration complète

```sql
-- Vérifier tout pour un utilisateur
SELECT 
  p.id,
  p.email,
  p.subscription_plan,
  p.branding->>'customDomain' as custom_domain,
  p.branding->>'domainVerified' as domain_verified,
  p.branding->>'sslProvider' as ssl_provider,
  pp.slug as public_profile_slug,
  pp.is_enabled as profile_enabled
FROM profiles p
LEFT JOIN public_profiles pp ON pp.user_id = p.id
WHERE p.branding->>'customDomain' = 'photo.joventy.cd';
```

### Forcer la vérification du domaine

```sql
-- ATTENTION: À utiliser uniquement en développement
UPDATE profiles
SET branding = jsonb_set(
  branding,
  '{domainVerified}',
  'true'::jsonb
)
WHERE branding->>'customDomain' = 'photo.joventy.cd';
```

### Vider le cache du domaine

Si vous utilisez le cache de domaine, videz-le après avoir fait des modifications:

```typescript
// Dans votre code ou console
import * as domainCache from '@/lib/cache/domain-cache';
domainCache.clear();
```

## Prochaines Étapes

1. Exécutez le script SQL de vérification
2. Partagez les résultats
3. Vérifiez les logs du proxy
4. Identifiez le problème spécifique
5. Appliquez la solution correspondante

## Fichiers à Vérifier

- `src/proxy.ts` - Logique de routage des domaines personnalisés
- `src/lib/cache/domain-cache.ts` - Cache des domaines
- `src/app/api/domain/verify/route.ts` - API de vérification
- `src/app/api/domain/provision-ssl/route.ts` - API SSL
- `supabase/migrations/*` - Schéma de la base de données
