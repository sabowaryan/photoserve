# Fix: Hydration Error in DeadlineTimer Component

## Problème

Erreur d'hydration React dans le composant DeadlineTimer :
```
Hydration failed because the server rendered text didn't match the client.
Server: "38"
Client: "40"
```

## Cause

Le composant `DeadlineTimer` calculait le temps restant à la fois sur le serveur (SSR) et sur le client. Comme le temps s'écoule entre le rendu serveur et l'hydration client, les valeurs différaient, causant une erreur d'hydration.

### Code problématique

```typescript
const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
  calculateTimeRemaining(deadline)  // ❌ Calculé au SSR ET au client
);
```

Le problème :
1. **Serveur** : Calcule le temps à T0 (ex: 38 secondes)
2. **Client** : Hydrate à T0+2s (ex: 40 secondes)
3. **React** : Détecte une différence → Erreur d'hydration

## Solution

Initialiser avec `null` et calculer uniquement après le montage côté client :

```typescript
const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  const initial = calculateTimeRemaining(deadline);
  setTimeRemaining(initial);
  // ... reste du code
}, [deadline, onExpired]);

// Afficher un état de chargement pendant le SSR
if (!mounted || !timeRemaining) {
  return <LoadingState />;
}
```

### Avantages de cette approche

1. **Pas d'hydration mismatch** : Le serveur et le client rendent le même contenu initial
2. **UX fluide** : État de chargement avec animation pulse
3. **Pas de flash** : Transition douce vers le vrai timer
4. **Performance** : Pas de recalcul inutile côté serveur

## Changements apportés

### Fichier modifié
- `src/components/gallery-view/deadline-timer.tsx`

### Modifications

1. **État initial** : `null` au lieu de calculer immédiatement
2. **État mounted** : Tracker si le composant est monté côté client
3. **Loading state** : Skeleton avec animation pulse pendant le SSR
4. **Calcul différé** : Uniquement dans `useEffect` (client-side)

### Code de l'état de chargement

```typescript
if (!mounted || !timeRemaining) {
  return (
    <div className="rounded-2xl border-2 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-200 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="h-4 bg-indigo-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-indigo-100 rounded w-1/2"></div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="bg-indigo-600 rounded-xl py-2 px-1 mb-1">
              <p className="text-2xl font-black leading-none text-white">00</p>
            </div>
            <div className="h-2 bg-indigo-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Tests

### Test 1 : Pas d'erreur d'hydration
1. Ouvrir une galerie avec deadline timer activé
2. ✅ Pas d'erreur dans la console
3. ✅ Le timer s'affiche correctement
4. ✅ Les secondes se mettent à jour chaque seconde

### Test 2 : État de chargement
1. Désactiver JavaScript dans le navigateur
2. Recharger la page
3. ✅ L'état de chargement s'affiche (skeleton)
4. Réactiver JavaScript
5. ✅ Le vrai timer apparaît après hydration

### Test 3 : Fonctionnalité inchangée
1. Le timer compte à rebours correctement
2. Les styles d'urgence s'appliquent (normal, warning, critical)
3. Le callback `onExpired` est appelé à 0
4. Le message "Délai expiré" s'affiche correctement

## Pattern réutilisable

Ce pattern peut être appliqué à tout composant qui :
- Utilise `Date.now()` ou `new Date()`
- Calcule des valeurs dynamiques basées sur le temps
- Utilise `Math.random()`
- Dépend de données qui changent entre SSR et client

### Template générique

```typescript
function TimeBasedComponent() {
  const [data, setData] = useState<DataType | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setData(calculateDynamicData());
  }, []);

  if (!mounted || !data) {
    return <LoadingSkeleton />;
  }

  return <ActualContent data={data} />;
}
```

## Références

- [React Hydration Mismatch](https://react.dev/link/hydration-mismatch)
- [Next.js SSR Best Practices](https://nextjs.org/docs/messages/react-hydration-error)
- [Client-only Components Pattern](https://nextjs.org/docs/app/building-your-application/rendering/client-components#client-only-patterns)

## Résumé

✅ **Problème résolu** : Hydration error dans DeadlineTimer
✅ **Cause identifiée** : Calcul de temps différent entre SSR et client
✅ **Solution appliquée** : Calcul différé après montage client
✅ **UX préservée** : Loading state avec animation pulse
✅ **Fonctionnalité intacte** : Timer fonctionne normalement
✅ **Pattern documenté** : Réutilisable pour d'autres composants
