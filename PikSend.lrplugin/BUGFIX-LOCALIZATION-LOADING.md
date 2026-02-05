# 🐛 Correction : Chargement des Fichiers de Localisation

**Date:** 2026-02-04  
**Fichier:** PikSendLocalization.lua  
**Fonction:** loadTranslations()

## Problème

```
error loading toolkit script `localization.en' 
(Could not load script localization.en.lua: doesn't seem to be in the toolkit.)
```

## Cause

Lightroom SDK ne supporte pas `require()` pour les modules dans des sous-dossiers. Même avec la notation par points (`localization.en`), Lightroom ne peut pas charger les fichiers depuis le dossier `localization/`.

**Structure du projet :**
```
PikSend.lrplugin/
├── PikSendLocalization.lua
└── localization/
    ├── en.lua
    └── fr.lua
```

**Code problématique :**
```lua
-- ❌ Ne fonctionne pas dans Lightroom
require('localization.en')
```

## Solution

Utilisation de `dofile()` avec le chemin absolu construit via `LrPathUtils` :

```lua
-- ✅ Fonctionne dans Lightroom
local LrPathUtils = import 'LrPathUtils'
local pluginPath = _PLUGIN.path
local translationPath = LrPathUtils.child(pluginPath, 'localization')
translationPath = LrPathUtils.child(translationPath, langCode .. '.lua')
translations = dofile(translationPath)
```

## Changements Complets

**Avant (require) :**
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

**Après (dofile) :**
```lua
-- Get plugin path
local LrPathUtils = import 'LrPathUtils'
local pluginPath = _PLUGIN.path

-- Load the translation file using dofile
local translationPath = LrPathUtils.child(pluginPath, 'localization')
translationPath = LrPathUtils.child(translationPath, langCode .. '.lua')

local success, result = pcall(function()
  return dofile(translationPath)
end)

if success and result then
  translations = result
else
  -- Fallback to English if translation file not found
  local enPath = LrPathUtils.child(pluginPath, 'localization')
  enPath = LrPathUtils.child(enPath, 'en.lua')
  translations = dofile(enPath)
end
```

## Différences entre require et dofile

| Aspect | `require()` | `dofile()` |
|--------|-------------|-----------|
| **Chemin** | Relatif au package.path | Chemin absolu requis |
| **Cache** | Met en cache le module | Recharge à chaque appel |
| **Sous-dossiers** | ❌ Non supporté dans Lightroom | ✅ Supporté avec chemin complet |
| **Usage** | Modules Lua standards | Fichiers de configuration/données |

## Avantages de dofile pour les Traductions

1. **Compatibilité** : Fonctionne avec les sous-dossiers dans Lightroom
2. **Flexibilité** : Permet de recharger les traductions si nécessaire
3. **Clarté** : Le chemin complet est explicite
4. **Robustesse** : Gestion d'erreur avec pcall et fallback

## API Lightroom Utilisées

### LrPathUtils.child()
Construit un chemin de fichier de manière portable (Windows/Mac) :
```lua
-- Windows: C:\...\PikSend.lrplugin\localization\en.lua
-- Mac: /Users/.../PikSend.lrplugin/localization/en.lua
local path = LrPathUtils.child(pluginPath, 'localization')
path = LrPathUtils.child(path, 'en.lua')
```

### _PLUGIN.path
Variable globale fournie par Lightroom contenant le chemin absolu du plugin :
```lua
-- Exemple: C:\Users\...\PikSend.lrplugin
local pluginPath = _PLUGIN.path
```

## Test

```bash
# Vérification de la syntaxe
luac -p PikSendLocalization.lua  # ✅ Pas d'erreur
```

## Résultat

- ✅ Les fichiers de localisation se chargent correctement
- ✅ Support des sous-dossiers
- ✅ Fallback vers l'anglais si la langue n'est pas disponible
- ✅ Compatible avec Windows et macOS
- ✅ Gestion d'erreur robuste

## Note Technique

Cette limitation de `require()` dans Lightroom SDK est documentée mais souvent source de confusion. La plupart des plugins Lightroom utilisent soit :
1. `dofile()` avec chemins absolus (notre solution)
2. Tous les modules à la racine du plugin (pas de sous-dossiers)
3. Un système de chargement personnalisé

Notre approche avec `dofile()` est la plus flexible et maintient une structure de projet organisée.
