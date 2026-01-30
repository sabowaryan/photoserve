--[[----------------------------------------------------------------------------

PikSendPluginInfoProvider.lua
Plugin information provider for PikSend

Displays plugin information, settings, and about dialog

------------------------------------------------------------------------------]]

local LrView = import 'LrView'
local LrBinding = import 'LrBinding'
local LrDialogs = import 'LrDialogs'
local LrHttp = import 'LrHttp'
local LrPrefs = import 'LrPrefs'

local PikSendLogger = require 'PikSendLogger'
local PikSendUtils = require 'PikSendUtils'

--------------------------------------------------------------------------------
-- Plugin Info Provider
--------------------------------------------------------------------------------

local pluginInfoProvider = {}

-- Sections for top of dialog
function pluginInfoProvider.sectionsForTopOfDialog(f, propertyTable)
  local prefs = LrPrefs.prefsForPlugin()
  
  -- Get plugin version
  local pluginInfo = _PLUGIN
  local versionString = string.format('%d.%d.%d',
    pluginInfo.VERSION.major,
    pluginInfo.VERSION.minor,
    pluginInfo.VERSION.revision)
  
  return {
    {
      title = 'À propos de PikSend',
      
      f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = 'Plugin PikSend pour Adobe Lightroom Classic',
          font = '<system/bold>',
        },
        
        f:static_text {
          title = 'Version: ' .. versionString,
        },
        
        f:spacer { height = 10 },
        
        f:static_text {
          title = 'Exportez vos photos directement vers PikSend depuis Lightroom.',
          width_in_chars = 50,
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:push_button {
            title = 'Site Web',
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com')
            end,
          },
          
          f:push_button {
            title = 'Documentation',
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com/docs/lightroom')
            end,
          },
          
          f:push_button {
            title = 'Support',
            action = function()
              LrHttp.openUrlInBrowser('https://piksend.com/support')
            end,
          },
        },
      },
    },
    
    {
      title = 'Paramètres',
      
      f:column {
        spacing = f:control_spacing(),
        
        -- Debug mode
        f:row {
          f:checkbox {
            title = 'Mode debug (logs détaillés)',
            value = LrView.bind('debugMode'),
          },
        },
        
        f:spacer { height = 10 },
        
        -- Log management
        f:static_text {
          title = 'Gestion des logs',
          font = '<system/bold>',
        },
        
        f:row {
          f:static_text {
            title = 'Fichier de log:',
            width = LrView.share('label_width'),
          },
          f:static_text {
            title = PikSendLogger.getLogPath(),
            width_in_chars = 40,
          },
        },
        
        f:row {
          f:push_button {
            title = 'Voir les logs',
            action = function()
              local logContent = PikSendLogger.readLog(100)
              LrDialogs.message('Logs PikSend', logContent, 'info')
            end,
          },
          
          f:push_button {
            title = 'Effacer les logs',
            action = function()
              local result = LrDialogs.confirm(
                'Effacer les logs',
                'Êtes-vous sûr de vouloir effacer tous les logs?',
                'Effacer',
                'Annuler'
              )
              
              if result == 'ok' then
                PikSendLogger.clearLog()
                LrDialogs.message('Logs effacés', 'Les logs ont été effacés avec succès.', 'info')
              end
            end,
          },
        },
        
        f:spacer { height = 10 },
        
        -- Cache management
        f:static_text {
          title = 'Gestion du cache',
          font = '<system/bold>',
        },
        
        f:row {
          f:push_button {
            title = 'Effacer le cache',
            action = function()
              local result = LrDialogs.confirm(
                'Effacer le cache',
                'Êtes-vous sûr de vouloir effacer le cache? Cela supprimera les informations de galeries et de doublons.',
                'Effacer',
                'Annuler'
              )
              
              if result == 'ok' then
                local PikSendCache = require 'PikSendCache'
                local PikSendGallery = require 'PikSendGallery'
                
                PikSendCache.clearUploadCache()
                PikSendGallery.clearCache()
                
                LrDialogs.message('Cache effacé', 'Le cache a été effacé avec succès.', 'info')
              end
            end,
          },
          
          f:push_button {
            title = 'Statistiques du cache',
            action = function()
              local PikSendCache = require 'PikSendCache'
              local stats = PikSendCache.getCacheStats()
              
              local message = string.format(
                'Entrées dans le cache: %d\n\nLe cache permet d\'éviter de re-uploader des photos identiques.',
                stats.entryCount
              )
              
              LrDialogs.message('Statistiques du cache', message, 'info')
            end,
          },
        },
      },
    },
    
    {
      title = 'Mises à jour',
      
      f:column {
        spacing = f:control_spacing(),
        
        f:static_text {
          title = 'Version actuelle: ' .. versionString,
        },
        
        f:spacer { height = 10 },
        
        f:row {
          f:push_button {
            title = 'Vérifier les mises à jour',
            action = function()
              local PikSendAPI = require 'PikSendAPI'
              local updateInfo = PikSendAPI.checkForUpdates()
              
              if updateInfo and updateInfo.available then
                local message = string.format(
                  'Une nouvelle version est disponible: %s\n\n%s',
                  updateInfo.version,
                  updateInfo.changelog or ''
                )
                
                local result = LrDialogs.confirm(
                  'Mise à jour disponible',
                  message,
                  'Télécharger',
                  'Plus tard'
                )
                
                if result == 'ok' and updateInfo.downloadUrl then
                  LrHttp.openUrlInBrowser(updateInfo.downloadUrl)
                end
              else
                LrDialogs.message(
                  'Aucune mise à jour',
                  'Vous utilisez la dernière version du plugin.',
                  'info'
                )
              end
            end,
          },
        },
      },
    },
  }
end

-- Start dialog
function pluginInfoProvider.startDialog(propertyTable)
  local prefs = LrPrefs.prefsForPlugin()
  
  -- Initialize property table with preferences
  propertyTable.debugMode = PikSendLogger.isDebugMode()
  
  -- Observe changes to debug mode
  propertyTable:addObserver('debugMode', function()
    PikSendLogger.setDebugMode(propertyTable.debugMode)
  end)
end

-- End dialog
function pluginInfoProvider.endDialog(propertyTable)
  -- Nothing to do
end

--------------------------------------------------------------------------------

return pluginInfoProvider
