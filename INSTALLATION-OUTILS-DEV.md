# Guide d'installation des outils de développement PikSend

Ce guide vous aide à installer tous les outils nécessaires pour développer et tester le plugin PikSend pour Lightroom.

## Outils installés

✅ **Lua 5.4.6** - Langage de programmation
✅ **CMake** - Outil de build
✅ **MSYS2** - Environnement Unix pour Windows (inclut MinGW/GCC)

## Étapes suivantes

### 1. Installer le compilateur GCC via MSYS2

1. Ouvrez **MSYS2 MINGW64** depuis le menu Démarrer Windows
2. Dans la fenêtre MSYS2, exécutez :
   ```bash
   pacman -S mingw-w64-x86_64-gcc
   ```
3. Appuyez sur `Y` pour confirmer l'installation
4. Fermez la fenêtre MSYS2 une fois terminé

### 2. Ajouter MinGW au PATH système

1. Ouvrez les **Variables d'environnement** Windows :
   - Appuyez sur `Win + R`
   - Tapez `sysdm.cpl` et appuyez sur Entrée
   - Cliquez sur l'onglet **Avancé**
   - Cliquez sur **Variables d'environnement**

2. Dans la section **Variables utilisateur**, sélectionnez **Path** et cliquez sur **Modifier**

3. Cliquez sur **Nouveau** et ajoutez :
   ```
   C:\msys64\mingw64\bin
   ```

4. Cliquez sur **OK** pour fermer toutes les fenêtres

### 3. Installer LuaRocks (gestionnaire de paquets Lua)

Ouvrez un **nouveau** PowerShell (pour charger le nouveau PATH) et exécutez :

```powershell
# Télécharger LuaRocks
$url = "https://luarocks.github.io/luarocks/releases/luarocks-3.11.1-windows-64.zip"
$zip = "$env:TEMP\luarocks.zip"
$dir = "$env:TEMP\luarocks"

Invoke-WebRequest -Uri $url -OutFile $zip
Expand-Archive -Path $zip -DestinationPath $dir -Force

# Installer
cd $dir\luarocks-3.11.1-windows-64
.\install.bat /P C:\LuaRocks /LUA "C:\Program Files\Lua" /Q

# Ajouter au PATH
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
$path = "$path;C:\LuaRocks;$env:APPDATA\luarocks\bin"
[System.Environment]::SetEnvironmentVariable("Path", $path, "User")
```

### 4. Installer Busted et les dépendances

Fermez et rouvrez PowerShell, puis exécutez :

```powershell
luarocks install busted
luarocks install luafilesystem
luarocks install dkjson
luarocks install penlight
```

### 5. Vérifier l'installation

```powershell
# Rafraîchir le PATH dans la session actuelle
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Vérifier chaque outil
lua -v
gcc --version
luarocks --version
busted --version
```

Vous devriez voir les versions de chaque outil s'afficher.

### 6. Tester le plugin

```powershell
cd PikSend.lrplugin
busted
```

Si tout est correctement installé, les tests devraient s'exécuter !

## Résolution de problèmes

### "lua n'est pas reconnu"
- Redémarrez PowerShell
- Ou exécutez : `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")`

### "gcc n'est pas reconnu"
- Vérifiez que `C:\msys64\mingw64\bin` est dans votre PATH
- Redémarrez PowerShell après avoir modifié le PATH

### "luarocks n'est pas reconnu"
- Vérifiez que `C:\LuaRocks` est dans votre PATH
- Redémarrez PowerShell

### Erreurs de compilation lors de l'installation de modules
- Assurez-vous que GCC est installé et dans le PATH
- Essayez de réinstaller le module : `luarocks install <module> --force`

## Commandes utiles

```powershell
# Lancer tous les tests
cd PikSend.lrplugin
busted

# Lancer un test spécifique
busted tests/test_auth_token_storage.lua

# Tests en mode verbose
busted --verbose

# Voir la couverture de code
busted --coverage

# Lister les modules Lua installés
luarocks list
```

## Ressources

- [Documentation Lua](https://www.lua.org/manual/5.4/)
- [Documentation LuaRocks](https://luarocks.org/)
- [Documentation Busted](https://lunarmodules.github.io/busted/)
- [Lightroom SDK](https://www.adobe.com/devnet/photoshoplightroom.html)
