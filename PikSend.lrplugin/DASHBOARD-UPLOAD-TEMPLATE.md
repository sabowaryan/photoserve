# Template : Formulaire d'Upload sur le Dashboard PikSend

Ce document fournit un template pour le formulaire d'upload du plugin Lightroom sur le dashboard PikSend, ainsi que les spécifications techniques pour l'implémentation.

**Exigences validées** : 12.8, 12.9

---

## Spécifications du Formulaire

### Interface Utilisateur

```
┌─────────────────────────────────────────────────────────────────┐
│ Ajouter une Nouvelle Version du Plugin Lightroom                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Informations de Version                                         │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Numéro de Version *                                         │ │
│ │ [1.0.0                                    ]                 │ │
│ │ Format: MAJOR.MINOR.PATCH (ex: 1.0.0)                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Date de Release *                                           │ │
│ │ [📅 15/01/2024                           ]                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Statut *                                                    │ │
│ │ ○ Stable (Recommandé)                                       │ │
│ │ ○ Beta (En test)                                            │ │
│ │ ○ Deprecated (Obsolète)                                     │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Fichier du Plugin                                               │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Fichier .zip *                                              │ │
│ │ [Choisir un fichier] PikSend.lrplugin.zip                  │ │
│ │                                                              │ │
│ │ ℹ️ Taille max: 50 MB                                        │ │
│ │ ℹ️ Format: .zip uniquement                                  │ │
│ │ ℹ️ Le hash SHA-256 sera calculé automatiquement            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Compatibilité                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Versions Lightroom Classic *                                │ │
│ │ ☑️ 11.0 (2021)                                              │ │
│ │ ☑️ 12.0 (2022)                                              │ │
│ │ ☑️ 13.0 (2023)                                              │ │
│ │ ☑️ 14.0 (2024)                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Systèmes d'Exploitation *                                   │ │
│ │ ☑️ Windows 10 (64-bit)                                      │ │
│ │ ☑️ Windows 11 (64-bit)                                      │ │
│ │ ☑️ macOS 10.15 Catalina                                     │ │
│ │ ☑️ macOS 11.0 Big Sur             