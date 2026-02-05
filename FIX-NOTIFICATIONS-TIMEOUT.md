# Correction des Timeouts de Notifications

## Problème
Les requêtes vers l'API de notifications prennent entre 4 et 22 secondes et finissent par échouer avec des erreurs de timeout :

```
ConnectTimeoutError: Connect Timeout Error 
(attempted addresses: 104.18.38.10:443, 172.64.149.246:443, timeout: 10000ms)
```

## Analyse

### Cause Probable
1. **Problème de connexion réseau** : Les adresses IP (104.18.38.10, 172.64.149.246) sont des serveurs Cloudflare utilisés par Supabase
2. **Latence élevée** : Les requêtes prennent trop de temps (4-22 secondes)
3. **Timeout par défaut trop long** : Le timeout de 10 secondes bloque l'UI pendant trop longtemps
4. **Erreurs non gérées** : Les erreurs causaient des crashs au lieu de retourner des résultats vides

### Impact
- L'interface utilisateur se bloque pendant plusieurs secondes
- Les erreurs empêchent l'affichage du dashboard
- Mauvaise expérience utilisateur

## Solutions Implémentées

### 1. Gestion Gracieuse des Erreurs dans le Service
**Fichier**: `src/lib/services/in-app-notification.service.ts`

**Changements** :
- Ajout de blocs `try-catch` autour des requêtes Supabase
- Retour de tableaux vides au lieu de lancer des exceptions
- Les erreurs sont loggées mais ne bloquent pas l'application

**Avant** :
```typescript
const { data, error } = await query;
if (error) {
  console.error('[InAppNotificationService] Failed to get notifications:', error);
  throw new Error('Failed to get notifications');
}
```

**Après** :
```typescript
try {
  const { data, error } = await query;
  if (error) {
    console.error('[InAppNotificationService] Failed to get notifications:', error);
    return []; // Return empty array instead of throwing
  }
  return (data || []).map((n: any) => this.mapToNotification(n));
} catch (error) {
  console.error('[InAppNotificationService] Exception in getNotifications:', error);
  return []; // Return empty array on exception
}
```

### 2. Timeout de 5 Secondes dans l'API
**Fichier**: `src/app/api/notifications/route.ts`

**Changements** :
- Ajout d'un timeout de 5 secondes avec `Promise.race()`
- Retour de résultats vides en cas de timeout
- L'UI n'est plus bloquée pendant 10+ secondes

**Implémentation** :
```typescript
const timeoutPromise = new Promise<never>((_, reject) => {
  setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
});

try {
  const [notifications, unreadCount] = await Promise.race([
    Promise.all([
      notificationService.getNotifications(userId, { ... }),
      notificationService.getUnreadCount(userId),
    ]),
    timeoutPromise,
  ]);
  // Return results
} catch (timeoutError) {
  // Return empty results instead of failing
  return NextResponse.json({
    notifications: [],
    unreadCount: 0,
    pagination: { limit, offset, hasMore: false },
  });
}
```

### 3. Fallback sur Erreur d'Authentification
**Fichier**: `src/app/api/notifications/route.ts`

**Changements** :
- Retour de résultats vides au lieu d'une erreur 500
- L'application continue de fonctionner même si les notifications échouent

## Diagnostic du Problème Réseau

### Causes Possibles

1. **Problème de DNS** : La résolution DNS vers Supabase peut être lente
2. **Firewall/Antivirus** : Peut bloquer ou ralentir les connexions HTTPS
3. **Proxy/VPN** : Peut ajouter de la latence
4. **Problème Supabase** : Le service Supabase peut avoir des problèmes temporaires
5. **Connexion Internet** : Latence élevée ou perte de paquets

### Tests Recommandés

1. **Tester la connexion Supabase** :
   ```bash
   curl -I https://cccykchoteodrvabxaqq.supabase.co
   ```

2. **Vérifier la latence** :
   ```bash
   ping cccykchoteodrvabxaqq.supabase.co
   ```

3. **Tester depuis un autre réseau** :
   - Essayer avec un autre réseau WiFi
   - Essayer avec un partage de connexion mobile
   - Essayer avec un VPN désactivé

4. **Vérifier les logs Supabase** :
   - Aller sur le dashboard Supabase
   - Vérifier les logs de la base de données
   - Vérifier s'il y a des alertes ou problèmes

### Solutions Temporaires

Si le problème persiste :

1. **Augmenter le timeout** (non recommandé) :
   ```typescript
   setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 seconds
   ```

2. **Désactiver les notifications temporairement** :
   - Commenter l'appel API dans le composant
   - Afficher un message "Notifications temporairement indisponibles"

3. **Utiliser un cache local** :
   - Stocker les notifications dans localStorage
   - Afficher les données en cache pendant le chargement

### Solutions Permanentes

1. **Optimiser les requêtes** :
   - Réduire le nombre de champs sélectionnés
   - Ajouter des index supplémentaires
   - Utiliser la pagination plus agressive

2. **Implémenter un système de retry** :
   ```typescript
   async function fetchWithRetry(fn, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await fn();
       } catch (error) {
         if (i === retries - 1) throw error;
         await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
       }
     }
   }
   ```

3. **Utiliser Supabase Realtime** :
   - Écouter les changements en temps réel
   - Éviter les polling fréquents

4. **Migrer vers une région plus proche** :
   - Vérifier la région du projet Supabase
   - Créer un nouveau projet dans une région plus proche si nécessaire

## Vérification de la Table

La table `in_app_notifications` existe bien dans la base de données :
- Migration : `20260117120000_create_in_app_notifications.sql`
- Index optimisés : `20260117120100_optimize_monetization_indexes.sql`
- RLS activé avec les bonnes politiques

## Comportement Actuel

Avec les corrections appliquées :

1. ✅ Les erreurs de timeout ne bloquent plus l'UI
2. ✅ L'application retourne des résultats vides en cas d'erreur
3. ✅ Le timeout est réduit à 5 secondes maximum
4. ✅ Les erreurs sont loggées pour le diagnostic
5. ✅ L'expérience utilisateur est préservée

## Monitoring

Pour surveiller le problème :

1. **Vérifier les logs de la console** :
   - Rechercher `[InAppNotificationService]`
   - Rechercher `[NotificationsAPI]`

2. **Mesurer les temps de réponse** :
   - Ouvrir les DevTools > Network
   - Filtrer par `/api/notifications`
   - Observer les temps de réponse

3. **Vérifier le dashboard Supabase** :
   - Aller sur https://supabase.com/dashboard
   - Vérifier les métriques de performance
   - Vérifier les logs d'erreur

## Date
5 février 2026
