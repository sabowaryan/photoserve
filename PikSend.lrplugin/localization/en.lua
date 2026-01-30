--[[----------------------------------------------------------------------------

en.lua
English translations for PikSend Lightroom plugin

------------------------------------------------------------------------------]]

return {
  -- Plugin info
  pluginName = 'PikSend',
  pluginDescription = 'Export your photos directly to PikSend from Lightroom',
  
  -- Authentication
  authTitle = 'PikSend Login',
  authConnected = 'Connected as: $$$/name',
  authNotConnected = 'Not connected',
  authLogin = 'Login',
  authLogout = 'Logout',
  authTokenLabel = 'API Token:',
  authTokenPlaceholder = 'Enter your API token',
  authOpenDashboard = 'Open Dashboard',
  authInstructions = 'Generate an API token from your PikSend dashboard:',
  authSuccess = 'Login successful',
  authSuccessMessage = 'Welcome $$$/name! You are now connected to PikSend.',
  authError = 'Authentication error',
  authErrorMessage = 'Invalid API token. Please check your token and try again.',
  authProRequired = 'Pro plan required',
  authProRequiredMessage = 'The Lightroom plugin is reserved for Pro users. Please upgrade your plan at piksend.com.',
  authTokenRequired = 'Token required',
  authTokenRequiredMessage = 'Please enter your API token.',
  
  -- Gallery
  galleryTitle = 'Gallery',
  gallerySelect = 'Select gallery',
  galleryCreate = 'New gallery',
  galleryRefresh = 'Refresh',
  galleryCreateTitle = 'Create new gallery',
  galleryTitleLabel = 'Title:',
  galleryDescriptionLabel = 'Description:',
  galleryPublic = 'Public gallery',
  galleryExpiration = 'Set expiration date',
  galleryExpiresIn = 'Expires in:',
  galleryDays = 'days',
  galleryPassword = 'Password protect',
  galleryPasswordLabel = 'Password:',
  galleryCreated = 'Gallery created',
  galleryCreatedMessage = 'Gallery "$$$/title" has been created successfully.',
  galleryError = 'Error',
  galleryErrorMessage = 'Unable to create gallery. Please try again.',
  galleryRequired = 'Gallery required',
  galleryRequiredMessage = 'Please select or create a destination gallery.',
  galleryInvalidTitle = 'Invalid title',
  
  -- Export
  exportTitle = 'Export to PikSend',
  exportSettings = 'Export settings',
  exportFormat = 'Format:',
  exportQuality = 'JPEG Quality:',
  exportMetadata = 'Include metadata',
  exportGPS = 'Include GPS location',
  exportProgress = 'Uploading to PikSend',
  exportComplete = 'Export complete',
  exportCompleteMessage = '$$$/count photo(s) uploaded successfully to gallery "$$$/gallery".\n\nLink: $$$/url',
  exportCompleteWithErrors = 'Export complete with errors',
  exportCompleteWithErrorsMessage = '$$$/success photo(s) uploaded, $$$/failed failed.\n\nLink: $$$/url',
  exportFailed = 'Upload failed',
  
  -- Progress
  progressPreparing = 'Preparing...',
  progressUploading = 'Uploading... $$$/current/$$$/total photos',
  progressPaused = 'Paused',
  progressCancelled = 'Cancelled',
  progressPhotos = 'Photos:',
  progressSize = 'Size:',
  progressSpeed = 'Speed:',
  progressTimeRemaining = 'Time remaining:',
  progressPause = 'Pause',
  progressResume = 'Resume',
  progressCancel = 'Cancel',
  
  -- Settings
  settingsTitle = 'Settings',
  settingsDebugMode = 'Debug mode (detailed logs)',
  settingsLogs = 'Log management',
  settingsLogFile = 'Log file:',
  settingsViewLogs = 'View logs',
  settingsClearLogs = 'Clear logs',
  settingsClearLogsConfirm = 'Are you sure you want to clear all logs?',
  settingsLogsCleared = 'Logs cleared',
  settingsLogsClearedMessage = 'Logs have been cleared successfully.',
  settingsCache = 'Cache management',
  settingsClearCache = 'Clear cache',
  settingsClearCacheConfirm = 'Are you sure you want to clear the cache? This will remove gallery information and duplicate detection data.',
  settingsCacheCleared = 'Cache cleared',
  settingsCacheCleared Message = 'Cache has been cleared successfully.',
  settingsCacheStats = 'Cache statistics',
  
  -- Updates
  updatesTitle = 'Updates',
  updatesCurrentVersion = 'Current version: $$$/version',
  updatesCheck = 'Check for updates',
  updatesAvailable = 'Update available',
  updatesAvailableMessage = 'A new version is available: $$$/version\n\n$$$/changelog',
  updatesDownload = 'Download',
  updatesLater = 'Later',
  updatesNone = 'No updates',
  updatesNoneMessage = 'You are using the latest version of the plugin.',
  
  -- Common
  ok = 'OK',
  cancel = 'Cancel',
  yes = 'Yes',
  no = 'No',
  close = 'Close',
  save = 'Save',
  delete = 'Delete',
  retry = 'Retry',
  error = 'Error',
  warning = 'Warning',
  info = 'Info',
}
