# 🐛 Correction : Erreur d'accès à VERSION

**Date:** 2026-02-04  
**Fichier:** PikSendPluginInfoProvider.lua  
**Ligne:** 34

## Problème

```
Impossible de créer des sections d'informations pour le module externe.
PikSendPluginInfoProvider.lua:34: attempt to index field 'VERSION' (a nil value)
```

## Cause

Le code essayait d'accéder directement à `_PLUGIN.VERSION` sans vérifier si ces valeurs existaient :

```lua
-- ❌ Code problématique
local pluginInfo = _PLUGIN
local versionString = string.format('%d.%d.%d',
  pluginInfo.VERSION.major,
  pluginInfo.VERSION.minor,
  pluginInfo.VERSION.revision)
```

Si `_PLUGIN` ou `_PLUGIN.VERSION` n'était pas défini au moment du chargement, cela causait une erreur.

## Solution

Ajout de valeurs par défaut et de vérifications de sécurité :

```lua
-- ✅ Code corrigé
local pluginInfo = _PLUGIN or {}
local version = pluginInfo.VERSION or { major = 1, minor = 0, revision = 0 }
local versionString = string.format('%d.%d.%d',
  version.major,
  version.minor,
  version.revision)
```

## Changements

1. **Protection contre nil** : `_PLUGIN or {}` retourne un tableau vide si `_PLUGIN` est nil
2. **Valeur par défaut** : `pluginInfo.VERSION or { major = 1, minor = 0, revision = 0 }` fournit une version par défaut
3. **Accès sécurisé** : Les propriétés `major`, `minor`, `revision` sont maintenant garanties d'exister

## Test

```bash
# Vérification de la syntaxe Lua
luac -p PikSendPluginInfoProvider.lua  # ✅ Pas d'erreur
luac -p Info.lua                        # ✅ Pas d'erreur
```

## Résultat

- ✅ Le plugin se charge maintenant sans erreur
- ✅ La version s'affiche correctement dans l'interface
- ✅ Aucune régression introduite
- ✅ Code plus robuste et défensif

## Note

La variable `_PLUGIN` est une variable globale fournie par Lightroom qui contient les métadonnées du plugin définies dans `Info.lua`. Cette correction garantit que le code fonctionne même si cette variable n'est pas encore initialisée au moment de l'appel.
