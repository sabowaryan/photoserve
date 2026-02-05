# FAQ - Plugin PikSend pour Adobe Lightroom Classic

## Table des matières

1. [Installation et Configuration](#installation-et-configuration)
2. [Authentification](#authentification)
3. [Galeries](#galeries)
4. [Export et Upload](#export-et-upload)
5. [Métadonnées](#métadonnées)
6. [Synchronisation (Publish Service)](#synchronisation-publish-service)
7. [Erreurs et Dépannage](#erreurs-et-dépannage)
8. [Performance](#performance)
9. [Sécurité et Confidentialité](#sécurité-et-confidentialité)
10. [Mises à jour](#mises-à-jour)

---

## Installation et Configuration

### Q: Quelles versions de Lightroom sont compatibles avec le plugin ?
**R:** Le plugin PikSend est compatible avec Adobe Lightroom Classic version 11.0 et ultérieures. Si vous utilisez une version antérieure, vous devrez mettre à jour Lightroom pour utiliser le plugin.

### Q: Sur quels systèmes d'exploitation le plugin fonctionne-t-il ?
**R:** Le plugin est compatible avec :
- **Windows**: Windows 10 et Windows 11 (64-bit)
- **macOS**: macOS 10.15 Catalina et versions ultérieures

### Q: Comment installer le plugin ?
**R:** 
1. Téléchargez le fichier `.lrplugin` depuis votre dashboard PikSend
2. Dans Lightroom, allez dans **Fichier > Gestionnaire de modules externes**
3. Cliquez sur **Ajouter** et sélectionnez le fichier téléchargé
4. Le plugin apparaîtra dans la liste des modules externes installés

### Q: Le plugin n'apparaît pas dans Lightroom après l'installation. Que faire ?
**R:** 
- Vérifiez que vous avez bien redémarré Lightroom après l'installation
- Assurez-vous que le fichier `.lrplugin` n'a pas été décompressé (il doit rester un dossier avec l'extension .lrplugin)
- Vérifiez dans **Fichier > Gestionnaire de modules externes** que le plugin est bien activé
- Si le problème persiste, consultez les logs dans le dossier du plugin

### Q: Où puis-je trouver la version du plugin installée ?
**R:** Allez dans **Fichier > Gestionnaire de modules externes**, sélectionnez "PikSend" dans la liste, et la version sera affichée dans les informations du module.

---

## Authentification

### Q: Ai-je besoin d'un compte Pro pour utiliser le plugin ?
**R:** Oui, le plugin Lightroom est exclusivement réservé aux utilisateurs avec un abonnement PikSend Pro. Si vous avez un plan gratuit, vous devrez upgrader pour utiliser le plugin.

### Q: Comment obtenir mon token API ?
**R:** 
1. Connectez-vous à votre dashboard PikSend sur https://piksend.com/dashboard
2. Allez dans **Paramètres > API**
3. Cliquez sur **Générer un nouveau token**
4. Copiez le token généré (il ne sera affiché qu'une seule fois)
5. Collez-le dans le plugin Lightroom lors de la connexion

### Q: Mon token API ne fonctionne pas. Que faire ?
**R:** 
- Vérifiez que vous avez copié le token complet sans espaces supplémentaires
- Assurez-vous que votre compte PikSend a un plan Pro actif
- Le token peut avoir expiré - générez-en un nouveau depuis le dashboard
- Vérifiez votre connexion internet

### Q: Puis-je utiliser le même token sur plusieurs ordinateurs ?
**R:** Oui, vous pouvez utiliser le même token API sur plusieurs installations de Lightroom. Cependant, pour des raisons de sécurité, nous recommandons de générer un token différent pour chaque ordinateur.

### Q: Comment me déconnecter du plugin ?
**R:** Dans la section d'export ou de publication PikSend, cliquez sur le bouton **Déconnexion**. Cela supprimera le token stocké localement.

### Q: Le token est-il stocké de manière sécurisée ?
**R:** Oui, le token est chiffré avant d'être stocké dans les préférences de Lightroom et n'est jamais enregistré en clair dans les fichiers de log.

---

## Galeries

### Q: Comment créer une nouvelle galerie depuis Lightroom ?
**R:** 
1. Dans la section d'export PikSend, cliquez sur **Nouvelle galerie**
2. Entrez un titre (obligatoire, 1-200 caractères)
3. Ajoutez une description (optionnel)
4. Configurez la date d'expiration si nécessaire (optionnel)
5. Cliquez sur **Créer**

### Q: Puis-je voir mes galeries existantes dans le plugin ?
**R:** Oui, toutes vos galeries PikSend sont listées dans le menu déroulant de sélection de galerie. Cliquez sur **Rafraîchir** pour mettre à jour la liste.

### Q: Comment rechercher une galerie spécifique ?
**R:** Utilisez la fonction de recherche dans le menu de sélection de galerie. La recherche est insensible à la casse et recherche dans les titres de galeries.

### Q: Les galeries sont-elles triées d'une manière particulière ?
**R:** Oui, par défaut les galeries sont triées par date de création décroissante (les plus récentes en premier).

### Q: Puis-je modifier les paramètres d'une galerie depuis Lightroom ?
**R:** Oui, vous pouvez configurer :
- Protection par mot de passe
- Date d'expiration
- Watermark
- Visibilité (publique/privée)

### Q: Comment obtenir le lien de partage d'une galerie ?
**R:** Après avoir sélectionné une galerie, cliquez sur **Copier le lien** pour copier l'URL de partage dans le presse-papiers. Le lien aura le format : `https://piksend.com/g/{galleryId}`

### Q: Puis-je voir les statistiques de mes galeries ?
**R:** Oui, sélectionnez une galerie et cliquez sur **Voir les statistiques** pour afficher le nombre de vues et de téléchargements.

---

## Export et Upload

### Q: Quels formats d'image sont supportés ?
**R:** Le plugin supporte les formats suivants :
- **JPEG** (recommandé pour la plupart des usages)
- **PNG** (pour les images avec transparence)
- **TIFF** (pour la qualité maximale)

### Q: Quelle est la taille maximale par photo ?
**R:** La taille maximale par photo est de **500 MB** (limite du plan Pro). Si une photo dépasse cette limite, réduisez la qualité ou les dimensions.

### Q: Comment configurer la qualité d'export ?
**R:** Dans les paramètres d'export :
1. Sélectionnez le format (JPEG, PNG, TIFF)
2. Pour JPEG, ajustez le curseur de qualité (1-100)
3. Configurez le redimensionnement si nécessaire (largeur/hauteur max)

### Q: Puis-je sauvegarder mes paramètres d'export ?
**R:** Oui, vous pouvez créer des **presets** qui sauvegardent tous vos paramètres (format, qualité, watermark, métadonnées). Cliquez sur **Sauvegarder le preset** après avoir configuré vos paramètres.

### Q: Comment ajouter un watermark à mes photos ?
**R:** Dans les paramètres d'export :
1. Activez l'option **Watermark**
2. Sélectionnez votre image de watermark
3. Choisissez la position (coins ou centre)
4. Ajustez l'opacité (0-100%)

### Q: Combien de photos puis-je uploader en même temps ?
**R:** Par défaut, le plugin uploade **3 photos simultanément** pour optimiser la vitesse. Vous pouvez ajuster ce nombre entre 1 et 5 dans les paramètres avancés.

### Q: Puis-je mettre en pause un upload en cours ?
**R:** Oui, cliquez sur le bouton **Pause** dans la fenêtre de progression. Vous pourrez reprendre l'upload plus tard en cliquant sur **Reprendre**.

### Q: Que se passe-t-il si mon ordinateur se déconnecte pendant l'upload ?
**R:** Le plugin détectera la perte de connexion et mettra automatiquement l'upload en pause. Lorsque la connexion sera rétablie, vous pourrez reprendre l'upload sans perdre la progression.

### Q: Les photos sont-elles uploadées dans l'ordre de ma sélection ?
**R:** Oui, l'ordre des photos dans votre collection Lightroom est préservé lors de l'upload vers PikSend.

### Q: Où sont stockés les fichiers temporaires pendant l'export ?
**R:** Les fichiers temporaires sont créés dans le dossier temporaire de votre système et sont automatiquement supprimés après un upload réussi.

---

## Métadonnées

### Q: Quelles métadonnées sont transférées vers PikSend ?
**R:** Le plugin peut transférer :
- **IPTC** : Titre, description, mots-clés, copyright
- **EXIF** : Appareil photo, objectif, ISO, ouverture, vitesse d'obturation, focale
- **Géolocalisation** : Coordonnées GPS (si activé)

### Q: Comment contrôler quelles métadonnées sont transférées ?
**R:** Dans les paramètres d'export, section **Métadonnées**, cochez ou décochez les options :
- Inclure le titre
- Inclure la description
- Inclure les mots-clés
- Inclure le copyright
- Inclure les données EXIF
- Inclure la géolocalisation

### Q: Puis-je désactiver le transfert de la géolocalisation ?
**R:** Oui, pour protéger votre vie privée, vous pouvez désactiver l'option **Inclure la géolocalisation** dans les paramètres de métadonnées. Les coordonnées GPS ne seront alors pas transférées.

### Q: Qu'est-ce que l'alt-text et comment est-il généré ?
**R:** L'alt-text est une description textuelle de l'image pour l'accessibilité. Le plugin le génère automatiquement en combinant le titre et la description de votre photo.

### Q: Puis-je définir des métadonnées par défaut pour toutes mes photos ?
**R:** Oui, dans les paramètres d'export, vous pouvez définir des métadonnées par défaut (copyright, mots-clés) qui seront appliquées à toutes les photos qui n'ont pas déjà ces informations.

---

## Synchronisation (Publish Service)

### Q: Quelle est la différence entre Export Service et Publish Service ?
**R:** 
- **Export Service** : Upload ponctuel de photos vers une galerie
- **Publish Service** : Synchronisation continue entre une collection Lightroom et une galerie PikSend, avec détection automatique des modifications

### Q: Comment créer une Published Collection ?
**R:** 
1. Dans le panneau **Services de publication**, cliquez sur **PikSend**
2. Cliquez sur le **+** pour créer une nouvelle collection
3. Sélectionnez ou créez une galerie PikSend
4. Ajoutez des photos à la collection

### Q: Comment le plugin détecte-t-il les modifications ?
**R:** Le plugin calcule un hash MD5 de chaque photo et compare :
- Le contenu de l'image (pixels)
- Les métadonnées (titre, description, mots-clés)

Si l'un de ces éléments change, la photo est marquée comme "modifiée" et sera re-uploadée lors de la prochaine publication.

### Q: Que se passe-t-il si je supprime une photo de la Published Collection ?
**R:** La photo sera également supprimée de la galerie PikSend lors de la prochaine synchronisation.

### Q: Puis-je republier toutes les photos d'une collection ?
**R:** Oui, faites un clic droit sur la Published Collection et sélectionnez **Republier toutes les photos**.

### Q: Comment gérer les conflits de synchronisation ?
**R:** Si une photo a été supprimée sur PikSend mais existe toujours dans Lightroom, le plugin vous proposera :
- Re-uploader la photo
- Supprimer la photo de la collection Lightroom
- Ignorer le conflit

---

## Erreurs et Dépannage

### Q: J'obtiens l'erreur "Token API invalide". Que faire ?
**R:** 
1. Vérifiez que vous avez copié le token complet
2. Générez un nouveau token depuis le dashboard PikSend
3. Assurez-vous que votre plan Pro est actif
4. Vérifiez votre connexion internet

### Q: L'upload échoue avec "Network timeout". Comment résoudre ?
**R:** 
- Vérifiez votre connexion internet
- Le plugin réessaiera automatiquement jusqu'à 3 fois avec des délais croissants
- Si le problème persiste, essayez de réduire le nombre d'uploads simultanés dans les paramètres

### Q: J'obtiens "Quota de stockage atteint". Que faire ?
**R:** 
- Vérifiez votre utilisation de stockage dans le dashboard PikSend
- Supprimez des galeries ou photos anciennes pour libérer de l'espace
- Ou upgradez votre plan pour obtenir plus de stockage

### Q: Le message "Fichier trop volumineux" apparaît. Comment réduire la taille ?
**R:** 
- Réduisez la qualité JPEG (essayez 85-90 au lieu de 100)
- Activez le redimensionnement et définissez une largeur/hauteur maximale
- Convertissez les TIFF en JPEG si la qualité maximale n'est pas nécessaire

### Q: Où puis-je trouver les logs pour diagnostiquer un problème ?
**R:** 
1. Dans les paramètres du plugin, activez le **Mode debug**
2. Les logs sont stockés dans : `[Dossier du plugin]/logs/piksend.log`
3. Le chemin exact est affiché dans les paramètres du plugin

### Q: Comment exporter les logs pour le support technique ?
**R:** Dans les paramètres du plugin, cliquez sur **Exporter les logs**. Un fichier ZIP sera créé avec tous les logs (les tokens API sont automatiquement masqués pour la sécurité).

### Q: Le plugin ralentit Lightroom. Que faire ?
**R:** 
- Réduisez le nombre d'uploads simultanés (essayez 2 au lieu de 3)
- Désactivez le mode debug si vous l'avez activé
- Fermez d'autres applications gourmandes en ressources
- Vérifiez que vous avez au moins 4 GB de RAM disponible

### Q: J'obtiens "Erreur de certificat SSL". Comment résoudre ?
**R:** 
- Vérifiez que votre système d'exploitation est à jour
- Assurez-vous que votre antivirus ne bloque pas les connexions HTTPS
- Vérifiez que la date et l'heure de votre système sont correctes

---

## Performance

### Q: Quelle est la vitesse d'upload typique ?
**R:** La vitesse dépend de votre connexion internet. Avec une connexion fibre (100 Mbps upload), vous pouvez uploader environ 10-12 MB/s, soit environ 100 photos de 10 MB en 8-10 minutes.

### Q: Comment optimiser la vitesse d'upload ?
**R:** 
- Augmentez le nombre d'uploads simultanés à 5 (dans les paramètres avancés)
- Utilisez une connexion filaire plutôt que WiFi
- Fermez les autres applications utilisant la bande passante
- Réduisez légèrement la qualité JPEG (90 au lieu de 100) pour des fichiers plus petits

### Q: Le plugin utilise-t-il beaucoup de mémoire ?
**R:** Le plugin est optimisé pour utiliser au maximum 500 MB de RAM. La mémoire est libérée après chaque upload pour éviter les fuites mémoire.

### Q: Les photos sont-elles compressées avant l'upload ?
**R:** Oui, si vous configurez une qualité JPEG inférieure à 100, les photos sont compressées avant l'upload pour réduire la taille et accélérer le transfert.

### Q: Le plugin détecte-t-il les doublons ?
**R:** Oui, le plugin calcule un hash MD5 de chaque photo. Si une photo identique a déjà été uploadée, elle ne sera pas re-uploadée, économisant du temps et de la bande passante.

---

## Sécurité et Confidentialité

### Q: Mes photos sont-elles sécurisées pendant le transfert ?
**R:** Oui, toutes les communications entre le plugin et PikSend utilisent **HTTPS** (chiffrement SSL/TLS). Vos photos ne peuvent pas être interceptées pendant le transfert.

### Q: Où est stocké mon token API ?
**R:** Le token est stocké de manière chiffrée dans les préférences de Lightroom sur votre ordinateur. Il n'est jamais transmis à des serveurs tiers.

### Q: Le plugin envoie-t-il des données à des serveurs tiers ?
**R:** Non, le plugin communique uniquement avec les serveurs PikSend (api.piksend.com). Aucune donnée n'est envoyée à des tiers.

### Q: Puis-je désactiver le transfert de la géolocalisation ?
**R:** Oui, dans les paramètres de métadonnées, décochez **Inclure la géolocalisation** pour protéger votre vie privée.

### Q: Le plugin est-il conforme au RGPD ?
**R:** Oui, le plugin respecte le RGPD pour les utilisateurs européens :
- Aucune donnée n'est collectée sans votre consentement
- Vous contrôlez quelles métadonnées sont transférées
- Vous pouvez supprimer vos données à tout moment

### Q: Les fichiers temporaires sont-ils supprimés après l'upload ?
**R:** Oui, tous les fichiers temporaires créés pendant l'export sont automatiquement supprimés après un upload réussi.

---

## Mises à jour

### Q: Comment savoir si une mise à jour est disponible ?
**R:** Le plugin vérifie automatiquement les mises à jour au démarrage de Lightroom. Si une nouvelle version est disponible, une notification s'affichera.

### Q: Comment mettre à jour le plugin ?
**R:** 
1. Cliquez sur la notification de mise à jour ou allez dans les paramètres du plugin
2. Cliquez sur **Télécharger la mise à jour**
3. Fermez Lightroom
4. Installez la nouvelle version du plugin
5. Redémarrez Lightroom

### Q: Puis-je désactiver les notifications de mise à jour ?
**R:** Oui, dans les paramètres du plugin, décochez **Vérifier automatiquement les mises à jour**. Vous pourrez toujours vérifier manuellement en cliquant sur **Vérifier les mises à jour**.

### Q: Où puis-je voir le changelog des versions ?
**R:** Le changelog est affiché dans la notification de mise à jour. Vous pouvez également le consulter sur la page de téléchargement du plugin dans votre dashboard PikSend.

### Q: Les mises à jour sont-elles rétrocompatibles ?
**R:** Oui, les nouvelles versions du plugin sont conçues pour être compatibles avec les versions précédentes de l'API PikSend. Vos paramètres et presets seront préservés lors de la mise à jour.

---

## Support Supplémentaire

### Q: Je ne trouve pas la réponse à ma question. Où puis-je obtenir de l'aide ?
**R:** Vous pouvez :
- Consulter le **Guide d'utilisation** complet dans le dossier du plugin
- Visiter le **forum communautaire** PikSend : https://community.piksend.com
- Contacter le **support technique** : support@piksend.com
- Consulter les **tutoriels vidéo** : https://piksend.com/tutorials/lightroom

### Q: Comment signaler un bug ?
**R:** 
1. Activez le mode debug dans les paramètres
2. Reproduisez le problème
3. Exportez les logs
4. Envoyez un email à support@piksend.com avec :
   - Description du problème
   - Étapes pour le reproduire
   - Fichier de logs
   - Version de Lightroom et du plugin
   - Système d'exploitation

### Q: Puis-je suggérer de nouvelles fonctionnalités ?
**R:** Absolument ! Nous adorons recevoir des suggestions. Envoyez vos idées à feedback@piksend.com ou postez-les sur le forum communautaire.

---

**Dernière mise à jour** : Janvier 2024  
**Version du plugin** : 1.0.0

Pour plus d'informations, consultez la documentation complète sur https://piksend.com/docs/lightroom-plugin
