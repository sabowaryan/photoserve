# Busted - Aide-Mémoire Rapide

## 🚀 Commandes Essentielles

```powershell
# Diagnostic complet
.\diagnose-busted.ps1

# Tous les tests
.\run-busted.ps1

# Test spécifique
.\run-busted.ps1 tests/test_auth.lua

# Mode verbose
.\run-busted.ps1 --verbose

# Lister les tests
.\run-busted.ps1 --list
```

## 📝 Structure de Test

```lua
describe("Module", function()
  before_each(function()
    -- Setup avant chaque test
  end)
  
  it("should do something", function()
    -- Arrange
    local input = "test"
    
    -- Act
    local result = myFunction(input)
    
    -- Assert
    assert.equals("expected", result)
  end)
end)
```

## ✅ Assertions

```lua
-- Égalité
assert.equals(expected, actual)
assert.same(table1, table2)  -- Comparaison profonde

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

-- Erreurs
assert.has_error(function() error("boom") end)
assert.has_no_error(function() return true end)
```

## 🎭 Mocking

```lua
-- Mock global import
_G.import = function(module)
  if module == 'LrView' then
    return require('tests/mocks/mock_LrView')
  end
  return {}
end

-- Mock package
package.loaded['MyModule'] = {
  myFunction = function(x) return x * 2 end,
}

-- Spy (enregistrer les appels)
local calls = {}
MyModule.myFunction = function(...)
  table.insert(calls, {...})
  return originalFunction(...)
end
```

## 🔄 Property-Based Testing

```lua
it("Property X: Description", function()
  for i = 1, 100 do
    local input = generateRandom()
    local result = functionUnderTest(input)
    assert.is_true(propertyHolds(result))
  end
end)
```

## 🎨 Options de Sortie

```powershell
# Sortie colorée (développement)
.\run-busted.ps1 --output=utfTerminal

# TAP (CI/CD)
.\run-busted.ps1 --output=TAP

# JSON
.\run-busted.ps1 --output=json

# Plain text
.\run-busted.ps1 --output=plainTerminal
```

## 🔍 Filtrage

```powershell
# Pattern
.\run-busted.ps1 --pattern=property

# Tag
.\run-busted.ps1 --tags=unit

# Exclure
.\run-busted.ps1 --exclude-tags=slow
```

## 🐛 Debugging

```lua
-- Ajouter des prints
it("test", function()
  print("DEBUG:", value)
  assert.equals(expected, value)
end)
```

```powershell
# Exécuter en verbose
.\run-busted.ps1 --verbose tests/test_debug.lua
```

## 📊 Hooks

```lua
describe("Tests", function()
  before_each(function()
    -- Avant chaque test
  end)
  
  after_each(function()
    -- Après chaque test
  end)
  
  setup(function()
    -- Une fois avant tous les tests
  end)
  
  teardown(function()
    -- Une fois après tous les tests
  end)
end)
```

## 🏷️ Tags

```lua
describe("Tests #unit", function()
  it("test 1 #fast", function()
    -- ...
  end)
  
  it("test 2 #slow", function()
    -- ...
  end)
end)
```

```powershell
# Exécuter uniquement les tests rapides
.\run-busted.ps1 --tags=fast

# Exclure les tests lents
.\run-busted.ps1 --exclude-tags=slow
```

## 🔧 Configuration .busted

```lua
return {
  _all = {
    coverage = false,
    verbose = true,
    output = "utfTerminal",
  },
  default = {
    ROOT = {"tests/"},
    pattern = "test_.+%.lua$",
    exclude = {"run_tests.lua"},
  },
}
```

## 📦 Installation Rapide

```powershell
# Installer Busted
luarocks install busted

# Vérifier l'installation
busted --version

# Ajouter au PATH (si nécessaire)
$env:Path += ";$env:APPDATA\luarocks\bin"
```

## 🆘 Problèmes Courants

### "busted: command not found"
```powershell
luarocks install busted
$env:Path += ";$env:APPDATA\luarocks\bin"
```

### "module 'X' not found"
```powershell
$env:LUA_PATH = "$env:APPDATA\luarocks\share\lua\5.4\?.lua"
$env:LUA_CPATH = "$env:APPDATA\luarocks\lib\lua\5.4\?.dll"
```

### Tests ne sont pas trouvés
```powershell
cd PikSend.lrplugin  # Être dans le bon dossier
.\run-busted.ps1 --list  # Vérifier les tests détectés
```

## 📚 Ressources

- [Documentation Busted](https://lunarmodules.github.io/busted/)
- [Guide Complet](BUSTED-GUIDE.md)
- [Démarrage Rapide](QUICK-START-TESTING.md)
- [Tests Existants](tests/README.md)

---

**Imprimez cette page et gardez-la à portée de main ! 📄**
