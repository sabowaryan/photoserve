# Démarrage Rapide - Tests avec Busted

Guide ultra-rapide pour commencer à tester le plugin PikSend Lightroom.

## 🚀 Démarrage en 3 Étapes

### 1. Diagnostic

Vérifiez que tout est installé correctement :

```powershell
cd PikSend.lrplugin
.\diagnose-busted.ps1
```

Ce script vérifie :
- ✅ Lua installé
- ✅ LuaRocks installé
- ✅ Busted installé
- ✅ PATH configuré
- ✅ Structure du projet
- ✅ Fichiers de test présents

**Si tout est vert, passez à l'étape 2 !**

**Si des problèmes sont détectés**, le script vous donnera les commandes exactes à exécuter.

### 2. Exécuter les Tests

```powershell
cd PikSend.lrplugin
.\run-busted.ps1
```

**C'est tout !** Le script :
- Configure automatiquement les chemins Lua
- Vérifie que Busted est installé
- Exécute tous les tests
- Affiche un résumé coloré

### 3. Voir les Résultats

**Sortie attendue :**
```
=========================================
  PikSend Lightroom Plugin - Tests
=========================================

✓ Lua installé: Lua 5.4.6
✓ LuaRocks installé: luarocks 3.9.2
✓ Busted installé: version 2.3.0

Exécution des tests...

●●●●●●●●●●●●●●●●●●●
19 successes / 0 failures / 0 errors / 0 pending : 0.123 seconds

=========================================
✓ Tous les tests ont réussi!
=========================================
```

---

## 📋 Commandes Utiles

### Tous les tests
```powershell
.\run-busted.ps1
```

### Test spécifique
```powershell
.\run-busted.ps1 tests/test_auth_token_storage.lua
```

### Mode verbose (détails)
```powershell
.\run-busted.ps1 --verbose
```

### Sortie colorée
```powershell
.\run-busted.ps1 --output=utfTerminal
```

### Lister les tests sans les exécuter
```powershell
.\run-busted.ps1 --list
```

### Tests contenant "property"
```powershell
.\run-busted.ps1 --pattern=property
```

---

## 🔧 Résolution Rapide des Problèmes

### Problème : "busted: command not found"

**Solution :**
```powershell
luarocks install busted
```

### Problème : "module 'X' not found"

**Solution :**
```powershell
# Le script run-busted.ps1 configure automatiquement les chemins
# Mais vous pouvez aussi les configurer manuellement :
$env:LUA_PATH = "$env:APPDATA\luarocks\share\lua\5.4\?.lua;$env:APPDATA\luarocks\share\lua\5.4\?\init.lua"
$env:LUA_CPATH = "$env:APPDATA\luarocks\lib\lua\5.4\?.dll"
```

### Problème : Tests ne sont pas trouvés

**Solution :**
```powershell
# Assurez-vous d'être dans le bon dossier
cd PikSend.lrplugin
pwd  # Doit afficher: ...\PikSend.lrplugin
```

### Problème : Erreur dans un test spécifique

**Solution :**
```powershell
# Exécuter uniquement ce test en mode verbose
.\run-busted.ps1 --verbose tests/test_problematique.lua
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

- **[BUSTED-GUIDE.md](BUSTED-GUIDE.md)** - Guide complet avec tous les détails
- **[tests/README.md](tests/README.md)** - Documentation des tests existants
- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Configuration de l'environnement de développement

---

## 🎯 Workflow de Développement

1. **Écrire du code** dans un module (ex: `PikSendAuth.lua`)

2. **Écrire des tests** dans `tests/` (ex: `test_auth.lua`)

3. **Exécuter les tests**
   ```powershell
   .\run-busted.ps1
   ```

4. **Corriger** jusqu'à ce que tous les tests passent ✅

5. **Commit** avec confiance !

---

## 💡 Astuces

### Exécuter rapidement un test pendant le développement

```powershell
# Terminal 1 : Votre éditeur
# Terminal 2 : Exécution rapide
cd PikSend.lrplugin
.\run-busted.ps1 tests/test_mon_module.lua
```

### Voir uniquement les échecs

```powershell
.\run-busted.ps1 --output=utfTerminal | Select-String -Pattern "FAIL|ERROR" -Context 2
```

### Déboguer un test

Ajoutez des `print()` dans votre test :

```lua
it("should do something", function()
  print("DEBUG: value =", value)
  print("DEBUG: result =", result)
  assert.equals(expected, result)
end)
```

Puis exécutez en mode verbose :
```powershell
.\run-busted.ps1 --verbose tests/test_debug.lua
```

---

## ✅ Checklist Avant de Commencer

- [ ] Lua installé (`lua -v`)
- [ ] LuaRocks installé (`luarocks --version`)
- [ ] Busted installé (`busted --version` ou `luarocks install busted`)
- [ ] Dans le dossier `PikSend.lrplugin/`
- [ ] Fichier `.busted` présent
- [ ] Dossier `tests/` présent
- [ ] Exécuter `.\diagnose-busted.ps1` → tout vert ✅

**Si tout est coché, vous êtes prêt ! 🎉**

```powershell
.\run-busted.ps1
```

---

## 🆘 Besoin d'Aide ?

1. **Exécuter le diagnostic** : `.\diagnose-busted.ps1`
2. **Consulter le guide complet** : `BUSTED-GUIDE.md`
3. **Vérifier les tests existants** : `tests/README.md`
4. **Regarder les exemples** : `tests/test_*.lua`

---

**Happy Testing! 🧪✨**
