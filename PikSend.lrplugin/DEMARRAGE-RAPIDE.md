# Démarrage rapide - Tests PikSend

## ✅ Installation terminée !

Tous les outils nécessaires sont maintenant installés :
- ✅ Lua 5.4.6
- ✅ GCC 15.2.0 (MinGW via MSYS2)
- ✅ LuaRocks 3.9.2
- ✅ Busted 2.3.0
- ✅ Modules Lua (luafilesystem, dkjson, penlight, etc.)

## Lancer les tests

### Option 1 : Script batch (recommandé)

```cmd
cd PikSend.lrplugin
run-tests.bat
```

Cela exécutera tous les tests automatiquement.

### Option 2 : Test spécifique

```cmd
cd PikSend.lrplugin
run-tests.bat tests\test_auth_token_storage.lua
```

### Option 3 : Avec Busted directement

```cmd
cd PikSend.lrplugin
busted tests/test_auth_token_storage.lua
```

## Résultats attendus

Vous devriez voir quelque chose comme :

```
=== Testing PikSendAuth Token Storage ===

Test 1: Token round-trip
✓ PASS: Token should be retrieved correctly after saving

Test 2: Token encryption
✓ PASS: Token should be stored
✓ PASS: Token should not be stored in plain text

...

=== Test Summary ===
Passed: 19
Failed: 0
Total: 19

✓ All tests passed!
```

## Tests disponibles

- `test_auth_token_storage.lua` - Authentification et stockage de tokens (19 tests)
- `test_api.lua` - Tests de l'API
- `test_cache.lua` - Tests du système de cache
- `test_logger.lua` - Tests du système de logs
- `test_presets.lua` - Tests des presets
- Et plus encore dans le dossier `tests/`

## Commandes utiles

### Rafraîchir le PATH dans PowerShell

Si les commandes ne sont pas trouvées, exécutez :

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### Vérifier les installations

```cmd
lua -v
gcc --version
luarocks --version
busted --version
```

### Lister les modules Lua installés

```cmd
luarocks list
```

## Développement

### Structure des tests

Les tests utilisent un format simple :

```lua
-- Test description
print("Test 1: Description")
local result = functionToTest()
if result == expected then
    print("✓ PASS: Test passed")
else
    print("✗ FAIL: Test failed")
end
```

### Ajouter un nouveau test

1. Créez un fichier `tests/test_nouveau.lua`
2. Suivez le format des tests existants
3. Lancez avec `run-tests.bat tests\test_nouveau.lua`

## Problèmes courants

### "lua n'est pas reconnu"

Redémarrez PowerShell ou exécutez :
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

### "module not found"

Les chemins Lua ne sont pas configurés. Utilisez `run-tests.bat` qui configure automatiquement les chemins.

### Tests qui échouent

Vérifiez que vous êtes dans le dossier `PikSend.lrplugin` avant de lancer les tests.

## Prochaines étapes

1. ✅ Exécuter les tests existants
2. 📝 Écrire de nouveaux tests pour les fonctionnalités
3. 🔧 Développer le plugin
4. 🧪 Tester dans Lightroom Classic

## Ressources

- [Documentation Lua](https://www.lua.org/manual/5.4/)
- [Documentation Busted](https://lunarmodules.github.io/busted/)
- [Lightroom SDK](https://www.adobe.com/devnet/photoshoplightroom.html)
- Voir `DEVELOPMENT.md` pour plus de détails
