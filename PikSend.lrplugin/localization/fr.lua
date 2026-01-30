--[[----------------------------------------------------------------------------

fr.lua
Traductions françaises pour le plugin PikSend Lightroom

------------------------------------------------------------------------------]]

return {
  -- Plugin info
  pluginName = 'PikSend',
  pluginDescription = 'Exportez vos photos directement vers PikSend depuis Lightroom',
  
  -- Authentication
  authTitle = 'Connexion PikSend',
  authConnected = 'Connecté en tant que: $$$/name',
  authNotConnected = 'Non connecté',
  authLogin = 'Connexion',
  authLogout = 'Déconnexion',
  authTokenLabel = 'Token API:',
  authTokenPlaceholder = 'Entrez votre token API',
  authOpenDashboard = 'Ouvrir le Dashboard',
  authInstructions = 'Générez un token API depuis votre dashboard PikSend:',
  authSuccess = 'Connexion réussie',
  authSuccessMessage = 'Bienvenue $$$/name! Vous êtes maintenant connecté à PikSend.',
  authError = 'Erreur d\'authentification',
  authErrorMessage = 'Token API invalide. Veuillez vérifier votre token et réessayer.',
  authProRequired = 'Plan Pro requis',
  authProRequiredMessage = 'Le plugin Lightroom est réservé aux utilisateurs Pro. Veuillez upgrader votre plan sur piksend.com.',
  authTokenRequired = 'Token requis',
  authTokenRequiredMessage = 'Veuillez saisir votre token API.',
  
  -- Gallery
  galleryTitle = 'Galerie',
  gallerySelect = 'Sélectionner une galerie',
  galleryCreate = 'Nouvelle galerie',
  galleryRefresh = 'Rafraîchir',
  galleryCreateTitle = 'Créer une nouvelle galerie',
  galleryTitleLabel = 'Titre:',
  galleryDescriptionLabel = 'Description:',
  galleryPublic = 'Galerie publique',
  galleryExpiration = 'Définir une date d\'expiration',
  galleryExpiresIn = 'Expire dans:',
  galleryDays = 'jours',
  galleryPassword = 'Protéger par mot de passe',
  galleryPasswordLabel = 'Mot de passe:',
  galleryCreated = 'Galerie créée',
  galleryCreatedMessage = 'La galerie "$$$/title" a été créée avec succès.',
  galleryError = 'Erreur',
  galleryErrorMessage = 'Impossible de créer la galerie. Veuillez réessayer.',
  galleryRequired = 'Galerie requise',
  galleryRequiredMessage = 'Veuillez sélectionner ou créer une galerie de destination.',
  galleryInvalidTitle = 'Titre invalide',
  
  -- Export
  exportTitle = 'Export vers PikSend',
  exportSettings = 'Paramètres d\'export',
  exportFormat = 'Format:',
  exportQuality = 'Qualité JPEG:',
  exportMetadata = 'Inclure les métadonnées',
  exportGPS = 'Inclure la géolocalisation (GPS)',
  exportProgress = 'Upload vers PikSend',
  exportComplete = 'Export terminé',
  exportCompleteMessage = '$$$/count photo(s) uploadée(s) avec succès vers la galerie "$$$/gallery".\n\nLien: $$$/url',
  exportCompleteWithErrors = 'Export terminé avec erreurs',
  exportCompleteWithErrorsMessage = '$$$/success photo(s) uploadée(s), $$$/failed échec(s).\n\nLien: $$$/url',
  exportFailed = 'Échec de l\'upload',
  
  -- Progress
  progressPreparing = 'Préparation...',
  progressUploading = 'Upload en cours... $$$/current/$$$/total photos',
  progressPaused = 'En pause',
  progressCancelled = 'Annulé',
  progressPhotos = 'Photos:',
  progressSize = 'Taille:',
  progressSpeed = 'Vitesse:',
  progressTimeRemaining = 'Temps restant:',
  progressPause = 'Pause',
  progressResume = 'Reprendre',
  progressCancel = 'Annuler',
  
  -- Settings
  settingsTitle = 'Paramètres',
  settingsDebugMode = 'Mode debug (logs détaillés)',
  settingsLogs = 'Gestion des logs',
  settingsLogFile = 'Fichier de log:',
  settingsViewLogs = 'Voir les logs',
  settingsClearLogs = 'Effacer les logs',
  settingsClearLogsConfirm = 'Êtes-vous sûr de vouloir effacer tous les logs?',
  settingsLogsCleared = 'Logs effacés',
  settingsLogsClearedMessage = 'Les logs ont été effacés avec succès.',
  settingsCache = 'Gestion du cache',
  settingsClearCache = 'Effacer le cache',
  settingsClearCacheConfirm = 'Êtes-vous sûr de vouloir effacer le cache? Cela supprimera les informations de galeries et de doublons.',
  settingsCacheCleared = 'Cache effacé',
  settingsCacheClearedMessage = 'Le cache a été effacé avec succès.',
  settingsCacheStats = 'Statistiques du cache',
  
  -- Updates
  updatesTitle = 'Mises à jour',
  updatesCurrentVersion = 'Version actuelle: $$$/version',
  updatesCheck = 'Vérifier les mises à jour',
  updatesAvailable = 'Mise à jour disponible',
  updatesAvailableMessage = 'Une nouvelle version est disponible: $$$/version\n\n$$$/changelog',
  updatesDownload = 'Télécharger',
  updatesLater = 'Plus tard',
  updatesNone = 'Aucune mise à jour',
  updatesNoneMessage = 'Vous utilisez la dernière version du plugin.',
  
  -- Common
  ok = 'OK',
  cancel = 'Annuler',
  yes = 'Oui',
  no = 'Non',
  close = 'Fermer',
  save = 'Enregistrer',
  delete = 'Supprimer',
  retry = 'Réessayer',
  error = 'Erreur',
  warning = 'Avertissement',
  info = 'Info',
}
