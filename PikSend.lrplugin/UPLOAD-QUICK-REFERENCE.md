# Guide Rapide : Upload du Plugin sur le Dashboard

Guide de référence rapide pour uploader une nouvelle version du plugin PikSend pour Lightroom sur le dashboard.

---

## Prérequis Rapides

✅ Package créé : `PikSend.lrplugin.zip`  
✅ Tests passés : Tous les tests unitaires et d'intégration  
✅ Validation complète : `validate-package.ps1` exécuté  
✅ Changelog à jour : `CHANGELOG.md` avec la nouvelle version  
✅ Version correcte : `Info.lua` mis à jour  

---

## Processus d'Upload en 5 Étapes

### 1️⃣ Préparer les Informations

```yaml
Version: 1.0.0
Date: 2024-01-15
Statut: stable
Compatibilité:
  - Lightroom Classic 11.0+
  - Windows 10/11 (64-bit)
  - macOS 10.15+
```

### 2️⃣ Accéder au Dashboard

1. Connexion : https://piksend.com/dashboard
2. Navigation : **Admin** → **Plugins** → **Lightroom Plugin**
3. Action : Cliquer sur **"Gérer les Versions"**

### 3️⃣ Ajouter la Version

1. Cliquer sur **"Ajouter une Nouvelle Version"**
2. Remplir le formulaire :
   - Numéro de version : `1.0.0`
   - Date de release : Sélectionner la date
   - Statut : `stable` / `beta` / `deprecated`
   - Fichier : Sélectionner `PikSend.lrplugin.zip`

### 4️⃣ Configurer la Compatibilité

- ☑️ Lightroom Classic 11.0+
- ☑️ Lightroom Classic 12.0+
- ☑️ Lightroom Classic 13.0+
- ☑️ Windows 10/11 (64-bit)
- ☑️ macOS 10.15 Catalina+
- ☑️ macOS 11.0 Big Sur+
- ☑️ macOS 12.0 Monterey+

### 5️⃣ Ajouter les Notes de Version

Copier depuis `CHANGELOG.md` :

```markdown
### Ajouté
- Authentification via API Token
- Gestion complète des galeries
- Upload parallèle de photos
- Publish Service avec synchronisation
- [...]

### Modifié
- [...]

### Corrigé
- [...]

### Sécurité
- [...]
```

---

## Vérification Post-Upload

### Checklist Rapide

- [ ] Téléchargement fonctionne
- [ ] Hash SHA-256 correct
- [ ] Notes de version affichées correctement
- [ ] Version apparaît dans la liste
- [ ] Installation dans Lightroom réussie
- [ ] Plugin démarre sans erreur

---

## Commandes Utiles

### Calculer le Hash SHA-256

**Windows** :
```powershell
Get-FileHash -Algorithm SHA256 PikSend.lrplugin.zip
```

**macOS/Linux** :
```bash
shasum -a 256 PikSend.lrplugin.zip
```

### Vérifier la Taille

**Windows** :
```powershell
(Get-Item PikSend.lrplugin.zip).Length / 1MB
```

**macOS/Linux** :
```bash
du -h PikSend.lrplugin.zip
```

---

## Versioning Rapide

```
MAJOR.MINOR.PATCH

1.0.0 → 2.0.0  (MAJOR: Breaking changes)
1.0.0 → 1.1.0  (MINOR: Nouvelles fonctionnalités)
1.0.0 → 1.0.1  (PATCH: Corrections de bugs)
```

---

## Statuts de Version

| Statut | Quand l'utiliser |
|--------|------------------|
| `stable` | Version recommandée pour tous |
| `beta` | Version en test, pour early adopters |
| `deprecated` | Version obsolète, mise à jour recommandée |

---

## Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| Upload échoue | Vérifier taille < 50 MB, format .zip |
| Hash incorrect | Recréer le package avec `validate-package.ps1` |
| Version n'apparaît pas | Redémarrer Lightroom, vider le cache |
| Markdown cassé | Vérifier la syntaxe, utiliser la prévisualisation |

---

## Liens Rapides

- 📖 [Guide Complet](DOWNLOAD-PAGE-SETUP.md)
- 📦 [Guide de Packaging](PACKAGING-GUIDE.md)
- ✅ [Checklist de Validation](PACKAGING-CHECKLIST.md)
- 📝 [Changelog](CHANGELOG.md)

---

**Support** : support@piksend.com  
**Dashboard** : https://piksend.com/dashboard
