# Guide Complet : Faire Fonctionner Busted

Ce guide vous explique comment configurer et utiliser Busted pour tester le plugin PikSend Lightroom.

## Table des Matières

1. [Vérification de l'Installation](#vérification-de-linstallation)
2. [Configuration de Busted](#configuration-de-busted)
3. [Exécution des Tests](#exécution-des-tests)
4. [Résolution des Problèmes](#résolution-des-problèmes)
5. [Écriture de Tests](#écriture-de-tests)

---

## Vérification de l'Installation

### 1. Vérifier que Lua est installé

```powershell
lua -v
```

**Résultat attendu :**
```
Lua 5.4.6  Copyright (C) 1994-2023 Lua.org, PUC-Rio
```

### 2. Vérifier que LuaRocks est installé

```powershell
luarocks --version
```

**Résultat attendu :**
```
luarocks 3.9.2
```

### 3. Vérifier que Busted est installé

```powershell
busted --version
```

**Résultat attendu :**
```
2.3.0
```

**Si Busted n'est pas installé :**
```powershell
luarocks install busted
```

### 4. Vérifier les variables d'environnement

```powershell
# Afficher le PATH
$env:Path

# Vérifier que ces chemins sont présents :
# - C:\Users\HP\AppData\Roaming\luarocks\bin
# - C:\msys64\mingw64\bin (pour GCC)
```

**Si les chemins manquent, les ajouter :**
```powershell
# Temporaire (session actuelle)
$env:Path += ";C:\Users\HP\AppData\Roaming\luarocks\bin"

# Permanent (nécessite admin)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\HP\AppData\Roaming\luarocks\bin", "User")
```

---

## Configuration de Busted

### 1. Fichier de Configuration `.busted`

Le fichier `.busted` dans `PikSend.lrplugin/` configure Busted :

```lua
return {
  _all = {
    coverage = false,      -- Désactiver la couverture de code (optionnel)
    verbose = true,        -- Affichage détaillé
    output = "TAP",        -- Format de sortie (TAP, utfTerminal, json, etc.)
  },
  default = {
    ROOT = {"tests/"},     -- Dossier contenant les tests
    pattern = "test_.+%.lua$",  -- Pattern pour trouver les fichiers de test
    exclude = {
      "run_tests.lua",     -- Exclure le runner personnalisé
    },
  },
}
```

**Options de sortie disponibles :**
- `TAP` : Test Anything Protocol (bon pour CI/CD)
- `utfTerminal` : Sortie colorée dans le terminal (recommandé pour développement)
- `plainTerminal` : Sortie simple sans couleurs
- `json` : Format JSON
- `junit` : Format JUnit XML

**Pour changer le format de sortie :**
```lua
output = "utfTerminal",  -- Sortie colorée
```

### 2. Structure des Dossiers

```
PikSend.lrplugin/
├── .busted                    # Configuration Busted
├── tests/                     # Dossier des tests
│   ├── mocks/                 # Mocks des modules Lightroom
│   │   ├── mock_LrView.lua
│   │   ├── mock_LrPrefs.lua
│   │   └── ...
│   ├── test_*.lua             # Fichiers de test
│   └── run_tests.lua          # Runner alternatif
└── PikSend*.lua               # Modules du plugin
```

---

## Exécution des Tests

### Méthode 1 : Utiliser Busted Directement (Recommandé)

#### A. Depuis le dossier du plugin

```powershell
cd PikSend.lrplugin
busted
```

**Cela exécute tous les tests dans `tests/` qui correspondent au pattern `test_*.lua`**

#### B. Exécuter un test spécifique

```powershell
cd PikSend.lrplugin
busted tests/test_auth_token_storage.lua
```

#### C. Exécuter avec options

```powershell
# Mode verbose
busted --verbose

# Sortie colorée
busted --output=utfTerminal

# Afficher uniquement les échecs
busted --output=utfTerminal --verbose

# Exécuter avec pattern spécifique
busted --pattern=test_property

# Afficher la liste des tests sans les exécuter
busted --list
```

### Méthode 2 : Utiliser le Script Batch

#### A. Depuis la racine du projet

```powershell
.\busted.bat
```

**Ce script :**
1. Configure les variables d'environnement LUA_PATH et LUA_CPATH
2. Exécute Busted avec les arguments passés

#### B. Avec arguments

```powershell
.\busted.bat --verbose
.\busted.bat tests/test_auth_token_storage.lua
.\busted.bat --output=utfTerminal
```

### Méthode 3 : Depuis le Dossier du Plugin

```powershell
cd PikSend.lrplugin
..\busted.bat
```

### Méthode 4 : Runner Personnalisé (Sans Busted)

Si Busted ne fonctionne pas, utilisez le runner personnalisé :

```powershell
cd PikSend.lrplugin
lua tests/run_tests.lua
```

**Ou avec le script batch :**
```powershell
cd PikSend.lrplugin
.\run-tests.bat
```

---

## Résolution des Problèmes

### Problème 1 : "busted: command not found"

**Cause :** Busted n'est pas dans le PATH

**Solution 1 - Vérifier l'installation :**
```powershell
luarocks list busted
```

**Solution 2 - Réinstaller Busted :**
```powershell
luarocks install busted
```

**Solution 3 - Utiliser le chemin complet :**
```powershell
lua "%APPDATA%\luarocks\bin\busted" %*
```

**Solution 4 - Ajouter au PATH :**
```powershell
$env:Path += ";$env:APPDATA\luarocks\bin"
```

### Problème 2 : "module 'X' not found"

**Cause :** Les chemins Lua ne sont pas configurés

**Solution - Configurer LUA_PATH et LUA_CPATH :**
```powershell
$env:LUA_PATH = "$env:APPDATA\luarocks\share\lua\5.4\?.lua;$env:APPDATA\luarocks\share\lua\5.4\?\init.lua;$env:LUA_PATH"
$env:LUA_CPATH = "$env:APPDATA\luarocks\lib\lua\5.4\?.dll;$env:LUA_CPATH"
```

**Ou utiliser le script batch qui configure automatiquement :**
```powershell
.\busted.bat
```

### Problème 3 : Tests ne sont pas trouvés

**Cause :** Mauvais dossier de travail ou configuration

**Solution 1 - Vérifier le dossier :**
```powershell
# Vous devez être dans PikSend.lrplugin/
cd PikSend.lrplugin
pwd  # Vérifier le chemin
```

**Solution 2 - Vérifier la configuration `.busted` :**
```lua
ROOT = {"tests/"},  -- Doit pointer vers le bon dossier
```

**Solution 3 - Lister les tests détectés :**
```powershell
busted --list
```

### Problème 4 : Erreurs dans les mocks

**Cause :** Les mocks Lightroom ne sont pas correctement chargés

**Solution - Vérifier que les mocks existent :**
```powershell
ls tests/mocks/
```

**Fichiers requis :**
- `mock_LrView.lua`
- `mock_LrPrefs.lua`
- `mock_LrTasks.lua`
- `mock_LrPathUtils.lua`
- etc.

**Vérifier le chargement dans le test :**
```lua
_G.import = function(module)
  if module == 'LrView' then
    return require('tests/mocks/mock_LrView')
  end
  -- ...
end
```

### Problème 5 : "attempt to call a nil value"

**Cause :** Une fonction mockée n'est pas définie

**Solution - Ajouter la fonction manquante au mock :**
```lua
-- Dans mock_LrView.lua
return {
  osFactory = function()
    return {
      column = function(params) return params end,
      row = function(params) return params end,
      -- Ajouter les fonctions manquantes ici
    }
  end,
}
```

### Problème 6 : Tests passent individuellement mais échouent ensemble

**Cause :** État partagé entre les tests

**Solution - Utiliser before_each pour réinitialiser :**
```lua
describe("Tests", function()
  before_each(function()
    -- Réinitialiser l'état
    mockData = {}
    package.loaded['Module'] = nil
  end)
  
  it("test 1", function()
    -- ...
  end)
end)
```

---

## Écriture de Tests

### Structure de Base

```lua
describe("Nom du Module", function()
  
  before_each(function()
    -- Exécuté avant chaque test
    -- Réinitialiser les mocks, l'état, etc.
  end)
  
  after_each(function()
    -- Exécuté après chaque test
    -- Nettoyage si nécessaire
  end)
  
  describe("Fonctionnalité spécifique", function()
    
    it("devrait faire quelque chose", function()
      -- Arrange
      local input = "test"
      
      -- Act
      local result = maFonction(input)
      
      -- Assert
      assert.equals("expected", result)
    end)
    
  end)
end)
```

### Assertions Disponibles

```lua
-- Égalité
assert.equals(expected, actual)
assert.equals(expected, actual, "message d'erreur")

-- Booléens
assert.is_true(value)
assert.is_false(value)

-- Nil
assert.is_nil(value)
assert.is_not_nil(value)

-- Types
assert.is_string(value)
assert.is_number(value)
assert.is_table(value)
assert.is_function(value)

-- Tables
assert.same(expected_table, actual_table)  -- Comparaison profonde
assert.has_error(function() error("boom") end)

-- Personnalisées
assert.is_true(condition, "message si échec")
```

### Tests de Propriétés

```lua
describe("Property Tests", function()
  
  it("Property X: Description de la propriété", function()
    -- Feature: lightroom-plugin, Property X: Description
    -- Validates: Requirements Y.Z
    
    for iteration = 1, 100 do
      -- Générer des données aléatoires
      local input = generateRandomInput()
      
      -- Exécuter la fonction
      local result = functionUnderTest(input)
      
      -- Vérifier la propriété
      assert.is_true(propertyHolds(result),
        string.format("Iteration %d: Property failed for input %s",
          iteration, tostring(input)))
    end
  end)
  
end)
```

### Mocking

```lua
-- Mock global
_G.import = function(module)
  if module == 'LrView' then
    return require('tests/mocks/mock_LrView')
  end
  return {}
end

-- Mock package
package.loaded['MonModule'] = {
  maFonction = function(x)
    return x * 2
  end,
}

-- Spy (enregistrer les appels)
local calls = {}
local originalFunction = MonModule.maFonction
MonModule.maFonction = function(...)
  table.insert(calls, {...})
  return originalFunction(...)
end

-- Vérifier les appels
assert.equals(3, #calls, "Fonction devrait être appelée 3 fois")
```

---

## Commandes Utiles

### Exécution

```powershell
# Tous les tests
busted

# Test spécifique
busted tests/test_auth.lua

# Pattern
busted --pattern=property

# Verbose
busted --verbose

# Sortie colorée
busted --output=utfTerminal

# Liste des tests
busted --list

# Aide
busted --help
```

### Debugging

```powershell
# Afficher les traces complètes
busted --verbose

# Exécuter un seul test
busted tests/test_specific.lua

# Ajouter des prints dans le test
print("Debug: value =", value)
```

### Maintenance

```powershell
# Vérifier les modules installés
luarocks list

# Mettre à jour Busted
luarocks install busted

# Désinstaller et réinstaller
luarocks remove busted
luarocks install busted
```

---

## Exemples Complets

### Exemple 1 : Test Unitaire Simple

```lua
describe("PikSendAuth", function()
  
  before_each(function()
    -- Réinitialiser les préférences
    package.loaded['PikSendAuth'] = nil
  end)
  
  it("should save and retrieve token", function()
    local PikSendAuth = require('PikSendAuth')
    
    local token = "test_token_123"
    PikSendAuth.saveToken(token)
    
    local retrieved = PikSendAuth.getToken()
    
    assert.equals(token, retrieved)
  end)
  
end)
```

### Exemple 2 : Test de Propriété

```lua
describe("Property: Token Round-trip", function()
  
  it("Property 4: Any token can be saved and retrieved", function()
    local PikSendAuth = require('PikSendAuth')
    
    for i = 1, 100 do
      -- Générer token aléatoire
      local token = generateRandomToken()
      
      -- Sauvegarder
      PikSendAuth.saveToken(token)
      
      -- Récupérer
      local retrieved = PikSendAuth.getToken()
      
      -- Vérifier
      assert.equals(token, retrieved,
        string.format("Iteration %d failed", i))
    end
  end)
  
end)
```

### Exemple 3 : Test avec Mocks

```lua
describe("PikSendAPI", function()
  
  local mockHttp
  
  before_each(function()
    -- Mock LrHttp
    mockHttp = {
      get = function(url, headers)
        return '{"valid":true,"user":{"name":"Test"}}', {}
      end,
    }
    
    _G.import = function(module)
      if module == 'LrHttp' then
        return mockHttp
      end
      return {}
    end
  end)
  
  it("should validate token via API", function()
    local PikSendAPI = require('PikSendAPI')
    
    local valid, user = PikSendAPI.validateToken("test_token")
    
    assert.is_true(valid)
    assert.equals("Test", user.name)
  end)
  
end)
```

---

## Ressources

- [Documentation Busted](https://lunarmodules.github.io/busted/)
- [Lua 5.4 Manual](https://www.lua.org/manual/5.4/)
- [LuaRocks](https://luarocks.org/)
- Tests existants dans `PikSend.lrplugin/tests/`

---

## Checklist de Démarrage Rapide

- [ ] Lua installé et dans le PATH
- [ ] LuaRocks installé et dans le PATH
- [ ] Busted installé (`luarocks install busted`)
- [ ] Fichier `.busted` configuré
- [ ] Dossier `tests/` avec les fichiers de test
- [ ] Mocks créés dans `tests/mocks/`
- [ ] Exécuter `busted` depuis `PikSend.lrplugin/`
- [ ] Tous les tests passent ✅

---

**Bon testing ! 🧪**
