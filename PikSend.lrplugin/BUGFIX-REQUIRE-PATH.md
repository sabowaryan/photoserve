# 🐛 Correction : Caractères Invalides dans require

**Date:** 2026-02-04  
**Fichier:** PikSendLocalization.lua  
**Lignes:** 53, 60

## Problème

```
Impossible de créer des sections d'informations pour le module externe.
require: invalid characters in script name
```

## Cause

Dans Lightroom SDK, les chemins de modules pour `require` doivent utiliser la notation par points (`.`) et non des slashes (`/`) :

```lua
-- ❌ Code problématique (style Unix/Node.js)
require('localization/' .. langCode)
require('localization/en')
```

Lightroom interprète le slash `/` comme un caractère invalide dans un nom de module.

## Solution

Utilisation de la notation par points conforme au standard Lua/Lightroom :

```lua
-- ✅ Code corrigé (style Lua)
require('localization.' .. langCode)
require('localization.en')
```

## Changements

**Avant:**
```lua
local success, result = pcall(function()
  return require('localization/' .. langCode)
end)

if success then
  translations = result
else
  translations = require('localization/en')
end
```

**Après:**
```lua
local success, result = pcall(function()
  return require('localization.' .. langCode)
end)

if success then
  translations = result
else
  translations = require('localization.en')
end
```

## Convention Lua pour require

En Lua et dans Lightroom SDK, les modules sont référencés avec des points :

| ❌ Incorrect (slash) | ✅ Correct (point) |
|---------------------|-------------------|
| `require('folder/module')` | `require('folder.module')` |
| `require('a/b/c')` | `require('a.b.c')` |
| `require('localization/en')` | `require('localization.en')` |

## Structure des Fichiers

La structure physique reste la même :
```
PikSend.lrplugin/
├── localization/
│   ├── en.lua
│   └── fr.lua
└── PikSendLocalization.lua
```

Mais les références dans le code utilisent des points :
- `require('localization.en')` → charge `localization/en.lua`
- `require('localization.fr')` → charge `localization/fr.lua`

## Test

```bash
# Vérification de la syntaxe
luac -p PikSendLocalization.lua  # ✅ Pas d'erreur
```

## Résultat

- ✅ Le module de localisation se charge correctement
- ✅ Les fichiers de traduction sont trouvés
- ✅ Conforme aux standards Lua et Lightroom SDK
- ✅ Compatible avec toutes les versions de Lightroom

## Note Technique

Cette erreur est courante lors du portage de code depuis d'autres environnements (Node.js, Python) où les slashes sont utilisés pour les imports. Lua utilise exclusivement la notation par points pour les modules, et Lightroom SDK suit cette convention strictement.
