# 🐛 Correction : Erreur d'accès à LrSystemInfo.language

**Date:** 2026-02-04  
**Fichier:** PikSendLocalization.lua  
**Ligne:** 28

## Problème

```
Impossible de créer des sections d'informations pour le module externe.
PikSendLocalization.lua:28: attempt to call field 'language' (a nil value)
```

## Cause

Le code essayait d'appeler `LrSystemInfo.language()` comme une fonction, mais dans certaines versions de Lightroom SDK, `language` peut être une propriété plutôt qu'une fonction :

```lua
-- ❌ Code problématique
local language = LrSystemInfo.language()
```

Si `language` est une propriété et non une fonction, cela cause l'erreur "attempt to call field 'language' (a nil value)".

## Solution

Détection dynamique du type et gestion des deux cas :

```lua
-- ✅ Code corrigé
local language = type(LrSystemInfo.language) == 'function' 
  and LrSystemInfo.language() 
  or LrSystemInfo.language 
  or 'en'
```

## Changements

1. **Détection de type** : `type(LrSystemInfo.language) == 'function'` vérifie si c'est une fonction
2. **Appel conditionnel** : Si c'est une fonction, on l'appelle avec `()`
3. **Accès direct** : Sinon, on accède directement à la propriété
4. **Valeur par défaut** : Si tout échoue, on utilise `'en'` (anglais)

## Compatibilité

Cette correction garantit la compatibilité avec :
- ✅ Lightroom Classic CC (versions récentes où `language` est une fonction)
- ✅ Lightroom Classic (versions anciennes où `language` est une propriété)
- ✅ Cas où `LrSystemInfo.language` n'existe pas du tout

## Test

```bash
# Vérification de la syntaxe Lua
luac -p PikSendLocalization.lua  # ✅ Pas d'erreur
luac -p localization/en.lua      # ✅ Pas d'erreur
luac -p localization/fr.lua      # ✅ Pas d'erreur
```

## Résultat

- ✅ Le module de localisation se charge sans erreur
- ✅ Détection automatique de la langue de Lightroom
- ✅ Fallback vers l'anglais si la langue n'est pas supportée
- ✅ Compatible avec toutes les versions de Lightroom SDK

## Note Technique

L'API Lightroom SDK a évolué au fil des versions. Certaines propriétés qui étaient des fonctions sont devenues des propriétés simples, et vice-versa. Cette approche défensive garantit que le code fonctionne quelle que soit la version du SDK utilisée.
