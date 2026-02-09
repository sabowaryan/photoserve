# Test d'Authentification Simplifié

## Nouvelle Interface d'Authentification

J'ai ajouté une section d'authentification directement dans le Plug-in Manager pour faciliter les tests.

## Instructions Pas à Pas

### 1. Copier les Fichiers Modifiés
```powershell
Copy-Item -Path "PikSend.lrplugin\PikSendPluginInfoProvider.lua" -Destination "dist\PikSend.lrplugin\" -Force
```

### 2. Redémarrer Lightroom
- **Fermer complètement Lightroom Classic**
- **Rouvrir Lightroom Classic**

### 3. Ouvrir le Plug-in Manager
1. Dans Lightroom, aller dans **File** > **Plug-in Manager**
2. Dans la liste de gauche, sélectionner **PikSend**
3. Vous devriez voir une nouvelle section **"Authentification"** en haut

### 4. Tester l'Authentification
1. Dans la section "Authentification", cliquer sur **"Se connecter"**
2. Une fenêtre devrait s'ouvrir
3. Coller votre clé API (commence par `pk_live_`)
4. Cliquer sur le bouton de connexion

### 5. Vérifier les Logs
```powershell
# Voir les dernières lignes du log
Get-Content "dist\PikSend.lrplugin\PikSend.log" -Tail 20
```

## Ce Qui Devrait Se Passer

### Si Tout Fonctionne
1. ✅ Le bouton "Se connecter" ouvre une fenêtre
2. ✅ Vous pouvez coller votre clé API
3. ✅ Un message "Authentification réussie!" apparaît
4. ✅ Le statut change à "Connecté: Votre Nom"
5. ✅ Les logs montrent "Token validated successfully"

### Si Ça Ne Fonctionne Pas
1. ❌ Rien ne se passe au clic → Le fichier n'a pas été copié ou Lightroom n'a pas été redémarré
2. ❌ Erreur "Security violation" → Vérifier que PikSendUtils.lua a été copié
3. ❌ Erreur "No response" → Vérifier que `npm run dev` est lancé
4. ❌ Erreur "Token invalide" → Vérifier la clé API

## Logs Attendus

Après avoir cliqué sur "Se connecter", le fichier log devrait contenir :

```
[2026-02-05 XX:XX:XX] [DEBUG] Login button clicked
[2026-02-05 XX:XX:XX] [DEBUG] showLoginDialog called
[2026-02-05 XX:XX:XX] [DEBUG] PikSendAPI: Validating token
[2026-02-05 XX:XX:XX] [INFO] PikSendAPI: Token validated successfully
```

## Vérifications Avant de Tester

- [ ] Le serveur est lancé : `npm run dev`
- [ ] Une clé API a été créée sur `http://localhost:3000`
- [ ] Le fichier a été copié vers `dist/`
- [ ] Lightroom a été complètement redémarré
- [ ] Le Plug-in Manager est ouvert avec PikSend sélectionné

## Commandes Utiles

### Copier Tous les Fichiers Modifiés
```powershell
.\copy-plugin-to-dist.ps1
```

### Voir les Logs en Temps Réel
```powershell
Get-Content "dist\PikSend.lrplugin\PikSend.log" -Wait -Tail 10
```

### Nettoyer les Logs
```powershell
Clear-Content "dist\PikSend.lrplugin\PikSend.log"
```

### Vérifier que le Fichier a Été Copié
```powershell
Select-String -Path "dist\PikSend.lrplugin\PikSendPluginInfoProvider.lua" -Pattern "Authentification"
```

## Si Toujours Rien

Si après avoir suivi toutes ces étapes, il ne se passe toujours rien :

1. **Vérifier que Lightroom charge bien le plugin** :
   - Le plugin doit apparaître dans File > Plug-in Manager
   - Il doit afficher "PikSend" avec une version

2. **Vérifier les permissions** :
   - Lightroom doit avoir les droits d'écriture dans le dossier du plugin
   - Essayer de lancer Lightroom en tant qu'administrateur

3. **Vérifier les erreurs Lightroom** :
   - Regarder si Lightroom affiche des erreurs dans sa console
   - Vérifier les logs de Lightroom (si disponibles)

4. **Tester avec un plugin minimal** :
   - Créer un plugin de test très simple pour vérifier que Lightroom peut exécuter du code Lua

## Date
5 février 2026
